import { afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('../server/lib/staticData', () => ({ loadMetaAssets: vi.fn(async () => ({})) }));
import handler from '../server/handlers/tft-meta';
import { fetchMeta } from '../src/api/meta';
import { refreshMetaStats } from '../scripts/collector/refreshMeta';
import { Store } from '../scripts/collector/supabase';
const summary = {
  match_count: 0,
  participant_count: 0,
  player_count: 0,
  latest_collected_at: null,
};
let serial = 0;
const env = () => ({
  SUPABASE_URL: `https://perf-${++serial}.supabase.co`,
  SUPABASE_SECRET_KEY: 'sb_secret_sensitive',
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
it.each(['item', 'champion', 'trait'])(
  'reads only materialized %s aggregates with unchanged pagination contract',
  async (kind) => {
    const fetch = vi.fn(async (url: string) =>
      Response.json(url.includes('summary') ? [summary] : []),
    );
    vi.stubGlobal('fetch', fetch);
    const r = await handler(
      new Request(`https://test/api?kind=${kind}&sort=win_rate&page=2`),
      env(),
    );
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({
      rows: [],
      summary,
      minSampleSize: 50,
      hasMore: false,
      page: 2,
      assets: {},
    });
    const paths = fetch.mock.calls.map(([u]) => new URL(u));
    expect(
      paths.every(
        (u) =>
          u.pathname.includes('/mv_tft_') || u.pathname.endsWith('/v_tft_meta_current_summary'),
      ),
    ).toBe(true);
    expect(paths[0]!.searchParams.get('order')).toContain('win_rate.desc');
    expect(paths[0]!.searchParams.get('offset')).toBe('100');
    expect(paths[0]!.searchParams.get('limit')).toBe('51');
  },
);
it('summary endpoint reads only the precomputed singleton', async () => {
  const fetch = vi.fn(async () => Response.json([summary]));
  vi.stubGlobal('fetch', fetch);
  const r = await handler(new Request('https://test/api'), env(), true);
  expect(r.status).toBe(200);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect((await r.json()).summary).toEqual(summary);
});
it('logs Supabase code/body/path/time with secrets removed and safe browser message', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Response.json(
        {
          code: '57014',
          message: 'canceling statement due to statement timeout sb_secret_sensitive',
          details: 'db detail',
          Authorization: 'Bearer hidden-value',
        },
        { status: 500 },
      ),
    ),
  );
  const r = await handler(new Request('https://test/api?kind=item'), env());
  expect(r.status).toBe(503);
  const body = await r.text();
  expect(body).not.toContain('57014');
  expect(body).not.toContain('db detail');
  const log = JSON.stringify(error.mock.calls);
  expect(log).toContain('[meta][supabase-error]');
  expect(log).toContain('57014');
  expect(log).toContain('elapsed');
  expect(log).toContain('mv_tft_item_stats');
  expect(log).not.toContain('sb_secret_sensitive');
  expect(log).not.toContain('hidden-value');
});
it('logs a server fetch timeout separately', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new DOMException('operation timed out', 'TimeoutError');
    }),
  );
  expect((await handler(new Request('https://test/api'), env())).status).toBe(503);
  expect(JSON.stringify(log.mock.calls)).toContain('[meta][query-error]');
});
it('emits query, summary, asset and total durations', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => Response.json(url.includes('summary') ? [summary] : [])),
  );
  await handler(new Request('https://test/api?kind=champion'), env());
  const lines = JSON.stringify(log.mock.calls);
  for (const stage of ['db-query', 'summary-query', 'asset-load', 'total'])
    expect(lines).toContain(stage);
});
function hangingFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = init.signal!;
          const abort = () => reject(new DOMException('Aborted', 'AbortError'));
          if (signal.aborted) abort();
          else signal.addEventListener('abort', abort, { once: true });
        }),
    ),
  );
}
it('client timeout terminates after 15s with a meaningful message', async () => {
  vi.useFakeTimers();
  hangingFetch();
  const assertion = expect(fetchMeta('item', 'sample_count')).rejects.toThrow(
    '메타 서버 응답 시간이 초과',
  );
  await vi.advanceTimersByTimeAsync(15000);
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});
it('component unmount abort retains AbortError and clears timeout', async () => {
  vi.useFakeTimers();
  hangingFetch();
  const controller = new AbortController();
  const assertion = expect(
    fetchMeta('trait', 'top4_rate', 0, controller.signal),
  ).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort();
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});
it('successful and HTTP-error client calls clear timers', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ rows: [] })),
  );
  await fetchMeta('champion', 'avg_placement');
  expect(vi.getTimerCount()).toBe(0);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ message: 'safe error' }, { status: 503 })),
  );
  await expect(fetchMeta('item', 'win_rate')).rejects.toThrow('safe error');
  expect(vi.getTimerCount()).toBe(0);
});
it('refresh is one batch RPC with no retries, including failure', async () => {
  const request = vi.fn(async () => ({ status: 'refreshed' }));
  await refreshMetaStats({ request });
  expect(request).toHaveBeenCalledExactlyOnceWith('rpc/refresh_tft_meta_stats', 'POST', {}, 1);
  const fetch = vi.fn(async () =>
    Response.json({ code: '57014', message: 'timeout' }, { status: 500 }),
  );
  await expect(refreshMetaStats(new Store('https://test', 'secret', fetch))).rejects.toThrow();
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('RPC busy is explicit, malformed results fail', async () => {
  expect(
    await refreshMetaStats({ request: vi.fn(async () => ({ status: 'busy' })) }),
  ).toMatchObject({ status: 'busy' });
  await expect(refreshMetaStats({ request: vi.fn(async () => null) })).rejects.toThrow();
});
it('migration is additive with server-only refresh and unique concurrent indexes', () => {
  const sql = readFileSync('supabase/migrations/008_tft_meta_performance.sql', 'utf8');
  expect(sql).not.toMatch(/DROP\s+TABLE|TRUNCATE|DELETE\s+FROM/i);
  expect(sql.match(/CREATE MATERIALIZED VIEW/g)).toHaveLength(4);
  expect(sql.match(/CREATE UNIQUE INDEX/g)).toHaveLength(4);
  expect(sql.match(/REFRESH MATERIALIZED VIEW CONCURRENTLY/g)).toHaveLength(4);
  expect(sql).toContain('FROM PUBLIC, anon, authenticated');
  expect(sql).toContain(
    'GRANT EXECUTE ON FUNCTION public.refresh_tft_meta_stats() TO service_role',
  );
  expect(sql).toContain('SET search_path = pg_catalog, pg_temp');
  expect(sql).toContain('pg_try_advisory_xact_lock');
});

it('suppresses legacy aggregates before the first scoped refresh', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      Response.json(
        url.includes('summary')
          ? [{ ...summary, scope_ready: false, current_patch: null, retention_days: 7 }]
          : Array.from({ length: 51 }, () => ({ item_name: 'legacy', sample_count: 100 })),
      ),
    ),
  );
  const response = await handler(new Request('https://test/api'), env());
  expect(await response.json()).toMatchObject({
    rows: [],
    hasMore: false,
    assets: {},
    summary: { scope_ready: false },
  });
});
