import { afterEach, expect, it, vi } from 'vitest';
import { onRequest as profile } from '../functions/api/tft/profile';
import { onRequest as items } from '../functions/api/meta/items';
import { onRequest as champions } from '../functions/api/meta/champions';
import { onRequest as traits } from '../functions/api/meta/traits';
import { onRequest as summary } from '../functions/api/meta/summary';
import { onRequest as missing } from '../functions/api/[[path]]';
import { fetchPlayer } from '../src/api/player';
import published from './fixtures/riot-match-v5.anonymized.json';
vi.mock('../server/lib/staticData', () => ({
  loadMetaAssets: vi.fn(async () => ({})),
  loadGameAssets: vi.fn(async () => ({
    assets: {},
    warnings: [],
    source: 'fixture',
    fetchedAt: '2026-09-12',
  })),
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('returns JSON for missing bindings, unknown paths and unsupported methods without process.env fallback', async () => {
  vi.stubEnv('RIOT_API_KEY', 'must-not-use-process-env');
  expect(
    (
      await profile({
        request: new Request('https://test/api/tft/profile?riotId=Test%23KR1'),
        env: {},
      })
    ).status,
  ).toBe(503);
  expect(
    (
      await profile({
        request: new Request('https://test/api/tft/profile', { method: 'POST' }),
        env: {},
      })
    ).status,
  ).toBe(405);
  const response = missing();
  expect(response.status).toBe(404);
  expect(response.headers.get('content-type')).toContain('application/json');
});
it('routes all meta kinds and reads secrets from request bindings; summary queries only summary view', async () => {
  const requests: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      requests.push(url);
      expect((init.headers as Record<string, string>).apikey).toBe('sb_secret_context');
      return Response.json(
        url.includes('summary')
          ? [
              {
                match_count: 301,
                participant_count: 2408,
                player_count: 500,
                latest_collected_at: null,
              },
            ]
          : [],
      );
    }),
  );
  const env = {
    SUPABASE_URL: 'https://cloudflare-meta-test.supabase.co',
    SUPABASE_SECRET_KEY: 'sb_secret_context',
  };
  for (const [name, route] of [
    ['items', items],
    ['champions', champions],
    ['traits', traits],
  ] as const)
    expect(
      (await route({ request: new Request(`https://test/api/meta/${name}`), env })).status,
    ).toBe(200);
  const before = requests.length;
  const r = await summary({ request: new Request('https://test/api/meta/summary'), env });
  expect(await r.json()).toMatchObject({ match_count: 301 });
  expect(requests.length - before).toBe(1);
  expect(requests.at(-1)).toContain('v_tft_meta_summary');
  expect(requests.some((x) => x.includes('v_tft_champion_stats'))).toBe(true);
  expect(requests.some((x) => x.includes('v_tft_trait_stats'))).toBe(true);
});
it('frontend uses relative /api and combines two 25-match Pages invocations into all 50 games', async () => {
  const browserPaths: string[] = [],
    counts: number[] = [],
    details = new Set<string>();
  let currentCount = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit): Promise<Response> => {
      if (url.startsWith('/api/')) {
        browserPaths.push(url);
        currentCount = 0;
        const r = await profile({
          request: new Request('https://test' + url),
          env: { RIOT_API_KEY: 'context-riot-key' },
        });
        counts.push(currentCount);
        return r;
      }
      currentCount++;
      expect((init?.headers as Record<string, string>)['X-Riot-Token']).toBe('context-riot-key');
      if (url.includes('/accounts/'))
        return Response.json({
          puuid: 'fixture-player-7',
          gameName: 'cloudflare-fifty',
          tagLine: 'KR1',
        });
      if (url.includes('/tft/league/')) return Response.json([]);
      if (url.includes('/ids?')) {
        const params = new URL(url).searchParams;
        expect(params.get('count')).toBe('25');
        return Response.json(
          Array.from({ length: 25 }, (_, i) => `CF_${Number(params.get('start')) + i}`),
        );
      }
      const id = url.split('/').at(-1)!;
      details.add(id);
      const raw = structuredClone(published);
      raw.metadata.match_id = id;
      raw.info.queue_id = 1100;
      raw.info.game_datetime += Number(id.slice(3)) * 1000;
      return Response.json(raw);
    }),
  );
  const result = await fetchPlayer('cloudflare-fifty', 'KR1');
  expect(browserPaths).toHaveLength(2);
  expect(browserPaths.every((x) => x.startsWith('/api/tft/profile?'))).toBe(true);
  expect(result.games).toHaveLength(50);
  expect(result.scanned).toBe(50);
  expect(details.size).toBe(50);
  expect(counts).toEqual([28, 28]);
}, 15000);
