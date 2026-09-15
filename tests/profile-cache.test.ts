import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import raw from './fixtures/riot-match-v5.anonymized.json';
vi.setConfig({ testTimeout: 15000 });
vi.mock('../server/lib/staticData', () => ({
  loadGameAssets: async () => ({ assets: {}, warnings: [], source: 'fixture', fetchedAt: '' }),
}));
beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
const env = {
  RIOT_API_KEY: 'test',
  SUPABASE_URL: 'https://cache.supabase.co',
  SUPABASE_SECRET_KEY: 'secret',
};
function setup(hitCount = 0, expired = false, unavailable = false, rate = false) {
  const calls: string[] = [];
  const writes: any[] = [];
  const payload = (id: string) => ({
    ...raw,
    metadata: { ...raw.metadata, match_id: id },
    info: { ...raw.info, queue_id: 1100 },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(url);
      if (url.includes('/rest/')) {
        expect(url).toContain('/tft_profile_match_cache?');
        if (unavailable) return new Response('', { status: 503 });
        if (init?.method === 'POST') {
          writes.push(...JSON.parse(init.body as string));
          return new Response(null, { status: 204 });
        }
        expect(new URL(url).searchParams.get('match_id')).toContain('in.(');
        return Response.json(
          Array.from({ length: hitCount }, (_, i) => ({
            match_id: `KR_${i}`,
            payload: payload(`KR_${i}`),
            expires_at: new Date(Date.now() + (expired ? -1 : 60000)).toISOString(),
          })),
        );
      }
      if (url.includes('/accounts/'))
        return Response.json({ puuid: 'fixture-player-7', gameName: 'Test', tagLine: 'KR1' });
      if (url.includes('/league/')) return Response.json([]);
      if (url.includes('/ids?')) {
        expect(new URL(url).searchParams.get('count')).toBe('30');
        return Response.json(Array.from({ length: 30 }, (_, i) => `KR_${i}`));
      }
      if (rate) return new Response('', { status: 429, headers: { 'Retry-After': '41' } });
      return Response.json(payload(url.split('/').at(-1)!));
    }),
  );
  return { calls, writes, details: () => calls.filter((u) => u.includes('/matches/KR_')).length };
}
const req = () => new Request('https://test/api/tft/profile?riotId=Test%23KR1');
it.each([0, 28])('batch reads %i cached matches and fetches only misses', async (hit) => {
  const state = setup(hit);
  const handler = (await import('../server/handlers/tft-player')).default;
  const response = await handler(req(), env);
  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.games).toHaveLength(30);
  expect(state.details()).toBe(30 - hit);
  expect(state.writes).toHaveLength(30 - hit);
  expect(
    state.calls.filter((u) => u.includes('/rest/') && !u.includes('on_conflict')),
  ).toHaveLength(1);
  const before = state.calls.length;
  await handler(req(), env);
  expect(state.calls).toHaveLength(before);
  const { playerScores } = await import('../src/analytics/playerScores');
  expect(playerScores(data.games)).not.toBeNull();
});
it('expired match cache is not a hit', async () => {
  const s = setup(28, true);
  const h = (await import('../server/handlers/tft-player')).default;
  expect((await h(req(), env)).status).toBe(200);
  expect(s.details()).toBe(30);
});
it('Supabase failure falls back to Riot', async () => {
  const s = setup(0, false, true);
  const h = (await import('../server/handlers/tft-player')).default;
  expect((await h(req(), env)).status).toBe(200);
  expect(s.details()).toBe(30);
});
it('429 stops queued fanout and preserves Retry-After', async () => {
  const s = setup(0, false, false, true);
  const h = (await import('../server/handlers/tft-player')).default;
  const r = await h(req(), env);
  expect(r.status).toBe(429);
  expect(r.headers.get('retry-after')).toBe('41');
  expect(s.details()).toBeLessThanOrEqual(3);
  expect((await r.json()).message).toContain('41초');
});
it.each(['account', 'rank', 'matchIds', 'profile'] as const)(
  '%s cache expires at its configured TTL',
  async (kind) => {
    vi.useFakeTimers();
    const { cacheValue, TTL } = await import('../server/lib/profileCache');
    const fn = vi.fn(async () => 1);
    await cacheValue(kind, TTL[kind], fn);
    vi.setSystemTime(Date.now() + TTL[kind] - 1);
    await cacheValue(kind, TTL[kind], fn);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 2);
    await cacheValue(kind, TTL[kind], fn);
    expect(fn).toHaveBeenCalledTimes(2);
  },
);
it('Cloudflare cache survives a fresh module instance', async () => {
  const entries = new Map<string, Response>();
  const edge = {
    match: async (r: Request) => entries.get(r.url)?.clone(),
    put: async (r: Request, v: Response) => {
      entries.set(r.url, v.clone());
    },
  };
  const one = await import('../server/lib/profileCache');
  await one.cacheValue('account:test', one.TTL.account, async () => ({ puuid: 'hidden' }), edge);
  vi.resetModules();
  const two = await import('../server/lib/profileCache');
  const fn = vi.fn(async () => ({ puuid: 'new' }));
  expect(await two.cacheValue('account:test', two.TTL.account, fn, edge)).toEqual({
    puuid: 'hidden',
  });
  expect(fn).not.toHaveBeenCalled();
});

it('compact cache preserves every participant and all supported analysis fields', async () => {
  const { compactMatch } = await import('../server/lib/profileMatchCache');
  const { toGame } = await import('../server/handlers/tft-player');
  const { playerScores } = await import('../src/analytics/playerScores');
  const ranked = { ...raw, info: { ...raw.info, queue_id: 1100 } };
  const compact = compactMatch(ranked);
  expect(compact.metadata.participants).toEqual(raw.metadata.participants);
  expect(compact.info.participants).toHaveLength(raw.info.participants.length);
  for (const participant of raw.info.participants) {
    const a = toGame(ranked, participant.puuid)!;
    const b = toGame(compact, participant.puuid)!;
    expect(b.player.units).toEqual(a.player.units);
    expect(b.player.traits).toEqual(a.player.traits);
    const repeat = (game: typeof a) =>
      Array.from({ length: 30 }, (_, i) => ({ ...game, id: `sample-${i}`, date: game.date - i }));
    expect(playerScores(repeat(b))).toEqual(playerScores(repeat(a)));
  }
  expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(ranked).length);
});
it('actual profile call filters non-ranked and older sets after cache reuse', async () => {
  const base = setup(30);
  const original = fetch;
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const response = await original(url, init);
    if (url.includes('/rest/') && !init?.body) {
      const rows = await response.json();
      rows[0].payload.info.queue_id = 1160;
      rows[1].payload.info.game_datetime = Date.now();
      rows[1].payload.info.tft_set_number = 18;
      return Response.json(rows);
    }
    return response;
  });
  const handler = (await import('../server/handlers/tft-player')).default;
  const result = await (await handler(req(), env)).json();
  expect(result.games).toHaveLength(1);
  expect(result.games[0].set).toBe(18);
  expect(result.scanned).toBe(30);
  expect(base.details()).toBe(0);
});

it('cold 30-match request budgets 33 Riot calls and 8 edge operations', async () => {
  const state = setup();
  let edgeCalls = 0;
  const edge = {
    match: async () => {
      edgeCalls++;
      return undefined;
    },
    put: async () => {
      edgeCalls++;
    },
  };
  const handler = (await import('../server/handlers/tft-player')).default;
  expect((await handler(req(), env, edge)).status).toBe(200);
  expect(state.calls.filter((url) => url.includes('.api.riotgames.com'))).toHaveLength(33);
  expect(edgeCalls).toBe(8);
  // Static-data mock costs zero here; real refresh + official fallback adds at most five.
  expect(state.calls.length + edgeCalls + 5).toBeLessThanOrEqual(50);
});

it('after profile expiry one new game requires only IDs and one detail', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const state = setup(29);
  const original = fetch;
  let advanced = false;
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const response = await original(url, init);
    if (advanced && url.includes('/ids?'))
      return Response.json(Array.from({ length: 30 }, (_, i) => `KR_${i + 1}`));
    return response;
  });
  const handler = (await import('../server/handlers/tft-player')).default;
  expect((await handler(req(), env)).status).toBe(200);
  const before = state.calls.filter((url) => url.includes('.api.riotgames.com')).length;
  const detailsBefore = state.details();
  advanced = true;
  vi.setSystemTime(Date.now() + 121000);
  expect((await handler(req(), env)).status).toBe(200);
  expect(state.calls.filter((url) => url.includes('.api.riotgames.com')).length - before).toBe(2);
  expect(state.details() - detailsBefore).toBe(1);
});
