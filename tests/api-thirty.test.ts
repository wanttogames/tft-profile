import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
let handler: typeof import('../netlify/functions/tft-player').default;
import published from './fixtures/riot-match-v5.anonymized.json';
vi.mock('../server/lib/staticData', () => ({
  loadGameAssets: vi.fn(async () => ({
    assets: {},
    warnings: [],
    source: 'fixture',
    fetchedAt: '2026-09-11',
  })),
}));
beforeEach(async () => {
  vi.resetModules();
  handler = (await import('../netlify/functions/tft-player')).default;
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('30-match fetch and cache', () => {
  it('requests count=30, returns all 30, bounds parallelism and caches repeated searches', async () => {
    vi.stubEnv('RIOT_API_KEY', 'test-only-key');
    const ids = Array.from({ length: 30 }, (_, i) => `TEST_${i}`),
      details: string[] = [];
    let active = 0,
      max = 0,
      calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls++;
        if (url.includes('/accounts/by-riot-id/'))
          return Response.json({ puuid: 'fixture-player-7', gameName: 'thirty', tagLine: 'KR1' });
        if (url.includes('/tft/league/')) return Response.json([]);
        if (url.includes('/ids?')) {
          expect(url).toContain('count=30');
          return Response.json(ids);
        }
        const id = url.split('/').at(-1)!;
        details.push(id);
        active++;
        max = Math.max(max, active);
        await new Promise((r) => setTimeout(r, 100));
        active--;
        const m = structuredClone(published);
        m.metadata.match_id = id;
        m.info.queue_id = 1100;
        m.info.game_datetime += Number(id.split('_')[1]) * 1000;
        return Response.json(m);
      }),
    );
    const request = () => new Request('https://test/?gameName=thirty&tagLine=KR1');
    const response = await handler(request());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.games).toHaveLength(30);
    expect(data.scanned).toBe(30);
    expect(new Set(details).size).toBe(30);
    expect(details).toHaveLength(30);
    expect(max).toBeLessThanOrEqual(3);
    expect(data.games[0].id).toBe('TEST_29');
    const before = calls;
    expect((await handler(request())).status).toBe(200);
    expect(calls).toBe(before);
  }, 15000);
  it('deduplicates repeated IDs before calling match detail', async () => {
    vi.stubEnv('RIOT_API_KEY', 'test-only-key');
    let details = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/accounts/by-riot-id/'))
          return Response.json({
            puuid: 'fixture-player-7',
            gameName: 'duplicate',
            tagLine: 'KR1',
          });
        if (url.includes('/tft/league/')) return Response.json([]);
        if (url.includes('/ids?')) return Response.json(Array(30).fill('DUPLICATE'));
        details++;
        const m = structuredClone(published);
        m.metadata.match_id = 'DUPLICATE';
        m.info.queue_id = 1100;
        return Response.json(m);
      }),
    );
    const r = await handler(new Request('https://test/?gameName=duplicate&tagLine=KR1'));
    expect(r.status).toBe(200);
    expect((await r.json()).games).toHaveLength(1);
    expect(details).toBe(1);
  });
});
