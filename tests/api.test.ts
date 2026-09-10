import { afterEach, describe, it, expect, vi } from 'vitest';
import handler, { limitedMap, toGame } from '../netlify/functions/tft-player';
import { demoPlayer } from '../src/data/demo';
import type { Match } from '../src/types/riot';
const sample = (): Match => {
  const g = demoPlayer().games[0]!;
  return {
    metadata: { match_id: 'KR_test' },
    info: {
      game_datetime: g.date,
      game_length: g.duration,
      game_version: 'Version 16.18.1',
      queue_id: 1100,
      tft_set_number: 18,
      participants: [g.player],
    },
  };
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('Netlify function contract', () => {
  it('missing key has clear Korean error', async () => {
    vi.stubEnv('RIOT_API_KEY', '');
    const r = await handler(new Request('https://test/?gameName=test&tagLine=KR1'));
    expect(r.status).toBe(503);
    expect((await r.json()).message).toBe('Riot API Key가 설정되지 않았습니다.');
  });
  it('rejects invalid input before making a request', async () => {
    const r = await handler(new Request('https://test/?gameName=&tagLine=KR1'));
    expect(r.status).toBe(400);
  });
  it('rejects unsupported methods', async () => {
    expect((await handler(new Request('https://test/', { method: 'POST' }))).status).toBe(405);
  });
  it.each([403, 404, 500])('maps upstream %s without exposing API key', async (status) => {
    vi.stubEnv('RIOT_API_KEY', 'secret-fixture');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
    const r = await handler(new Request(`https://test/?gameName=error${status}&tagLine=KR1`));
    expect(r.status).toBe(status === 500 ? 502 : status);
    expect(await r.text()).not.toContain('secret-fixture');
  });
  it('filters non-ranked games and keeps selected participant only', () => {
    const m = sample();
    expect(toGame(m, 'demo')?.player.puuid).toBe('demo');
    m.info.queue_id = 1160;
    expect(toGame(m, 'demo')).toBeNull();
  });
  it('rejects incomplete DTOs instead of fabricating data', () => {
    const m = sample();
    m.info.participants[0]!.placement = NaN;
    expect(() => toGame(m, 'demo')).toThrow('데이터 형식');
  });
  it('honors bounded concurrency and input ordering', async () => {
    let active = 0,
      max = 0;
    const result = await limitedMap([1, 2, 3, 4, 5, 6], 3, async (n) => {
      active++;
      max = Math.max(max, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return n * 2;
    });
    expect(max).toBe(3);
    expect(result).toEqual([2, 4, 6, 8, 10, 12]);
  });
  it('does not start more work after an upstream failure', async () => {
    const seen: number[] = [];
    await expect(
      limitedMap([1, 2, 3, 4], 1, async (n) => {
        seen.push(n);
        throw new Error('429');
      }),
    ).rejects.toThrow('429');
    expect(seen).toEqual([1]);
  });
  it('loads account, rank and match DTO through documented URLs', async () => {
    vi.stubEnv('RIOT_API_KEY', 'secret-fixture');
    const m = sample();
    m.info.game_version = 'unknown';
    const urls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string, init: RequestInit) => {
        urls.push(input);
        expect((init.headers as Record<string, string>)['X-Riot-Token']).toBe('secret-fixture');
        if (input.includes('/accounts/by-riot-id/'))
          return Response.json({ puuid: 'demo', gameName: 'fixture', tagLine: 'KR1' });
        if (input.includes('/tft/league/v1/by-puuid/'))
          return Response.json([
            {
              queueType: 'RANKED_TFT',
              tier: 'GOLD',
              rank: 'I',
              leaguePoints: 30,
              wins: 10,
              losses: 8,
            },
          ]);
        if (input.endsWith('/ids?start=0&count=30')) return Response.json(['KR_test']);
        return Response.json(m);
      }),
    );
    const r = await handler(new Request('https://test/?gameName=fixture&tagLine=KR1'));
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(body.games).toHaveLength(1);
    expect(body.rank.leaguePoints).toBe(30);
    expect(urls).toHaveLength(4);
    expect(JSON.stringify(body)).not.toContain('secret-fixture');
  });
  it('returns Retry-After for 429', async () => {
    vi.stubEnv('RIOT_API_KEY', 'secret-fixture');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('{}', { status: 429, headers: { 'Retry-After': '5' } })),
    );
    const r = await handler(new Request('https://test/?gameName=ratelimit&tagLine=KR1'));
    expect(r.status).toBe(429);
    expect(r.headers.get('Retry-After')).toBe('5');
  });
});
