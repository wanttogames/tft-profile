import { beforeEach, afterEach, expect, it, vi } from 'vitest';
vi.mock('../server/lib/staticData', () => ({ loadMetaAssets: vi.fn(async () => ({})) }));
import handler from '../netlify/functions/tft-meta';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import MetaDashboard from '../src/components/MetaDashboard.vue';
beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://meta-test.supabase.co');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test');
  vi.stubEnv('MIN_SAMPLE_SIZE', '10');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it('requires configuration without exposing secrets', async () => {
  vi.stubEnv('SUPABASE_SECRET_KEY', '');
  const r = await handler(new Request('https://test/api'));
  expect(r.status).toBe(503);
  expect(await r.text()).toContain('설정');
});
it('rejects invalid views/sorts/pages and invalid minimum', async () => {
  for (const q of ['kind=tft_participants', 'sort=puuid', 'page=-1'])
    expect((await handler(new Request('https://test/api?' + q))).status).toBe(400);
  vi.stubEnv('MIN_SAMPLE_SIZE', '0');
  expect((await handler(new Request('https://test/api'))).status).toBe(503);
});
it('queries aggregate views only, applies min sample, lower average first, pagination, cache and no patch filter', async () => {
  const mock = vi.fn(async (input: string) =>
    Response.json(
      input.includes('summary')
        ? [
            {
              match_count: 301,
              participant_count: 2408,
              player_count: 300,
              latest_collected_at: null,
            },
          ]
        : Array.from({ length: 51 }, (_, i) => ({
            item_name: 'test-' + i,
            sample_count: 10,
            avg_placement: 4.5,
            top4_rate: 0.5,
            win_rate: 0.1,
            common_champions: [],
          })),
    ),
  );
  vi.stubGlobal('fetch', mock);
  const req = new Request('https://test/api?kind=item&sort=avg_placement&page=1');
  const r = await handler(req);
  const body = await r.json();
  expect(r.status).toBe(200);
  expect(body.rows).toHaveLength(50);
  expect(body.hasMore).toBe(true);
  expect(body.minSampleSize).toBe(10);
  const urls = mock.mock.calls.map((c) => decodeURIComponent(c[0]));
  expect(
    urls.some(
      (u) =>
        u.includes('sample_count=gte.10') &&
        u.includes('avg_placement.asc') &&
        u.includes('offset=50'),
    ),
  ).toBe(true);
  expect(urls.every((u) => u.includes('/v_tft_') && !u.includes('patch'))).toBe(true);
  expect(JSON.stringify(body)).not.toContain('sb_secret_test');
  await handler(req);
  expect(mock).toHaveBeenCalledTimes(2);
});
it('reports missing migration and prevents upstream body leaks', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ message: 'private body' }, { status: 404 })),
  );
  const r = await handler(new Request('https://test/api?kind=trait'));
  expect(r.status).toBe(503);
  const text = await r.text();
  expect(text).toContain('005');
  expect(text).not.toContain('private body');
});
it('renders meta controls, all-period scope, cohort caveat and low-is-good guidance', async () => {
  const html = await renderToString(createSSRApp(MetaDashboard));
  for (const text of [
    '아이템',
    '챔피언',
    '특성',
    '패치 구분 없음',
    '평균 등수는 낮을수록',
    'Challenger',
  ])
    expect(html).toContain(text);
});
