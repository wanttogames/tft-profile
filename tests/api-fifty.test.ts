import { afterEach, describe, it, expect, vi } from 'vitest';
import handler from '../netlify/functions/tft-player';
import published from './fixtures/riot-match-v5.anonymized.json';
vi.mock('../server/lib/staticData', () => ({
  loadGameAssets: vi.fn(async () => ({
    assets: {},
    warnings: [],
    source: 'fixture',
    fetchedAt: '2026-09-11',
  })),
}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('50-match fetch and cache', () => {
  it('requests count=50, returns all 50, bounds parallelism and caches repeated searches', async () => {
    vi.stubEnv('RIOT_API_KEY', 'test-only-key');
    const ids = Array.from({ length: 50 }, (_, i) => `TEST_${i}`),
      details: string[] = [];
    let active = 0,
      max = 0,
      calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls++;
        if (url.includes('/accounts/by-riot-id/'))
          return Response.json({ puuid: 'fixture-player-7', gameName: 'fifty', tagLine: 'KR1' });
        if (url.includes('/tft/league/')) return Response.json([]);
        if (url.includes('/ids?')) {
          expect(url).toContain('count=50');
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
    const request = () => new Request('https://test/?gameName=fifty&tagLine=KR1');
    const response = await handler(request());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.games).toHaveLength(50);
    expect(data.scanned).toBe(50);
    expect(new Set(details).size).toBe(50);
    expect(details).toHaveLength(50);
    expect(max).toBeLessThanOrEqual(3);
    expect(data.games[0].id).toBe('TEST_49');
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
        if (url.includes('/ids?')) return Response.json(Array(50).fill('DUPLICATE'));
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
