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
it('queries aggregate views only, applies min sample, lower average first, pagination, cache and server-owned patch scope', async () => {
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
  expect(
    urls.every(
      (u) =>
        (u.includes('/mv_tft_') || u.includes('/v_tft_meta_current_summary')) &&
        !u.includes('tft_matches'),
    ),
  ).toBe(true);
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
  expect(text).toContain('008');
  expect(text).not.toContain('private body');
});
it('renders meta controls, current-patch scope, cohort caveat and low-is-good guidance', async () => {
  const html = await renderToString(createSSRApp(MetaDashboard));
  for (const text of [
    '아이템',
    '챔피언',
    '특성',
    '현재 패치 확인 대기',
    '평균 등수는 낮을수록',
    'Challenger',
  ])
    expect(html).toContain(text);
});

it('defaults ranking minimum to 50 and derives common champion rate from distinct participant counts', async () => {
  const { default: cloudHandler } = await import('../server/handlers/tft-meta');
  const mock = vi.fn(async (input: string) =>
    Response.json(
      input.includes('summary')
        ? [
            {
              match_count: 200,
              participant_count: 1600,
              player_count: 800,
              latest_collected_at: null,
            },
          ]
        : [
            {
              item_name: 'test-item',
              sample_count: 1600,
              avg_placement: 4,
              top4_rate: 0.6,
              win_rate: 0.15,
              common_champions: [{ id: 'test-champion', sample_count: 339 }],
            },
          ],
    ),
  );
  vi.stubGlobal('fetch', mock);
  const response = await cloudHandler(new Request('https://test/api?kind=item'), {
    SUPABASE_URL: 'https://default-min-test.supabase.co',
    SUPABASE_SECRET_KEY: 'sb_secret_test',
  });
  const body = await response.json();
  expect(body.minSampleSize).toBe(50);
  expect(body.rows[0].common_champions[0]).toEqual({
    id: 'test-champion',
    sample_count: 339,
    rate: 339 / 1600,
  });
  expect(
    mock.mock.calls.some(([url]) => new URL(url).searchParams.get('sample_count') === 'gte.50'),
  ).toBe(true);
});

it('renders four compact portraits, overflow and localized count/rate tooltips', async () => {
  const { default: MetaCompanions } = await import('../src/components/MetaCompanions.vue');
  const entries = Array.from({ length: 5 }, (_, i) => ({
    id: `c${i}`,
    sample_count: 339 - i,
    rate: (339 - i) / 1600,
  }));
  const assets = Object.fromEntries(
    entries.map((e, i) => [
      `unit:${e.id}`,
      { name: i === 0 ? '말파이트' : `챔피언${i}`, image: `https://example.com/${i}.png` },
    ]),
  );
  // Use the catalog's canonical wildcard keys.
  const canonicalAssets = Object.fromEntries(
    Object.entries(assets).map(([k, v]) => [k.replace('unit:', 'unit:*:'), v]),
  );
  const html = await renderToString(
    createSSRApp(MetaCompanions, { entries, assets: canonicalAssets, kind: 'unit' }),
  );
  expect(html.match(/<img /g) ?? []).toHaveLength(4);
  expect(html).toContain('+1');
  expect(html).toContain('말파이트\n339회\n21.2%');
  expect(html).not.toContain('>말파이트<');
  const fallback = await renderToString(
    createSSRApp(MetaCompanions, { entries: entries.slice(0, 1), assets: {}, kind: 'unit' }),
  );
  expect(fallback).toContain('c0');
  expect(fallback).not.toContain('<img');
});
