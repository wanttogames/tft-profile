import { describe, it, expect, vi } from 'vitest';
import fixture from './fixtures/riot-match-v5.anonymized.json';
import { normalizeMatch, patchFromVersion } from '../scripts/collector/saveMatch';
import { RiotClient, HttpError } from '../scripts/collector/riot';
import { Store } from '../scripts/collector/supabase';
import { collectMatches } from '../scripts/collector/collectMatches';
import { collectPlayers, type Player } from '../scripts/collector/collectPlayers';
import { config } from '../scripts/collector/config';
const player: Player = {
  puuid: 'test-player',
  current_tier: 'CHALLENGER',
  league_points: 1000,
  rank_observed_at: '2026-09-11T00:00:00Z',
};
// Historical real-response fixture; queue and match ID changed only for ranked collector tests.
function match(id = 'KR_1') {
  const raw = structuredClone(fixture);
  raw.metadata.match_id = id;
  raw.info.queue_id = 1100;
  return raw;
}
describe('collector normalization', () => {
  it('preserves all participants, unit itemNames and traits from response fixture', () => {
    const raw = match(),
      result = normalizeMatch(raw, 'KR_1');
    expect(result.participants).toHaveLength(8);
    expect(result.game_datetime).toBe(raw.info.game_datetime);
    expect(result.participants[0]!.units[0]!.itemNames).toEqual(
      raw.info.participants[0]!.units[0]!.itemNames,
    );
    expect(result.participants[0]!.traits[0]!.name).toBe(raw.info.participants[0]!.traits[0]!.name);
    expect(result.participants.every((p) => p.tier_at_collection === null)).toBe(true);
  });
  it('missing optional combat values remain null; measured zero stays zero', () => {
    const raw = match();
    Reflect.deleteProperty(raw.info.participants[0]!, 'players_eliminated');
    raw.info.participants[0]!.total_damage_to_players = 0;
    const p = normalizeMatch(raw, 'KR_1').participants[0]!;
    expect(p.players_eliminated).toBeNull();
    expect(p.total_damage_to_players).toBe(0);
  });
  it('rejects wrong IDs, incomplete trees, malformed equipment and unknown patch', () => {
    expect(() => normalizeMatch(match(), 'KR_2')).toThrow();
    const raw = match();
    raw.info.participants.pop();
    expect(() => normalizeMatch(raw, 'KR_1')).toThrow();
    expect(() => patchFromVersion('unknown')).toThrow();
    const bad = match();
    Reflect.deleteProperty(bad.info.participants[0]!.units[0]!, 'itemNames');
    expect(() => normalizeMatch(bad, 'KR_1')).toThrow();
  });
  it.each([
    ['15.18.12345', '15.18'],
    ['Version 13.11.512.6664 (May 30 2023)', '13.11'],
  ])('parses %s', (input, expected) => expect(patchFromVersion(input)).toBe(expected));
});
describe('collector networking and orchestration', () => {
  it('respects Retry-After and does not put API key in URL', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '12' } }))
      .mockResolvedValueOnce(Response.json([]));
    const wait = vi.fn().mockResolvedValue(undefined);
    await new RiotClient('private-key', 1400, fetcher, wait).get('/test');
    expect(wait.mock.calls.map((c) => c[0])).toEqual([1400, 12000]);
    expect(fetcher.mock.calls[0]![0]).not.toContain('private-key');
  });
  it('bounds retry attempts and rejects 403 without retry', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    await expect(
      new RiotClient('key', 1400, fetcher, async () => {}).get('/test'),
    ).rejects.toBeInstanceOf(HttpError);
    expect(fetcher).toHaveBeenCalledTimes(4);
    const denied = vi.fn().mockResolvedValue(new Response('', { status: 403 }));
    await expect(new RiotClient('key', 1400, denied, async () => {}).get('/test')).rejects.toThrow(
      '403',
    );
    expect(denied).toHaveBeenCalledTimes(1);
  });
  it('sends opaque Supabase secret only as apikey; chunks existing IDs', async () => {
    const fetcher = vi.fn().mockImplementation(async () => Response.json([]));
    await new Store('https://example.supabase.co', 'sb_secret_test', fetcher).existing(
      Array.from({ length: 51 }, (_, i) => `KR_${i}`),
    );
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]![1].headers.apikey).toBe('sb_secret_test');
    expect(fetcher.mock.calls[0]![1].headers.Authorization).toBeUndefined();
  });
  it('deduplicates IDs, skips stored details, and continues after one failed match', async () => {
    const riot = {
      get: vi.fn(async (path: string) => {
        if (path.includes('by-puuid')) return ['KR_1', 'KR_2', 'KR_2', 'KR_3', 'KR_4'];
        if (path.endsWith('KR_2')) throw new Error('bad match');
        return match(path.split('/').at(-1));
      }),
    };
    const store = {
      existing: vi.fn(async () => new Set(['KR_1'])),
      request: vi.fn(async (path: string) => (path.startsWith('rpc/') ? true : null)),
    };
    const result = await collectMatches(
      riot as unknown as RiotClient,
      store as unknown as Store,
      [player],
      new Map(),
      5,
    );
    expect(result).toMatchObject({
      'Candidate matches': 4,
      'Existing matches': 1,
      'New matches': 3,
      'Saved matches': 2,
      'Failed matches': 1,
    });
    expect(riot.get.mock.calls.filter((c) => c[0].endsWith('/KR_1'))).toHaveLength(0);
    expect(riot.get.mock.calls.filter((c) => c[0].endsWith('/KR_2'))).toHaveLength(1);
  });
  it('takes both ladders and preserves first collected timestamp on upsert', async () => {
    const riot = {
      get: vi.fn(async (path: string) => ({
        queue: 'RANKED_TFT',
        entries: [{ puuid: path.includes('challenger') ? 'c' : 'g', leaguePoints: 500 }],
      })),
    };
    const store = { request: vi.fn().mockResolvedValue(null) };
    const result = await collectPlayers(
      riot as unknown as RiotClient,
      store as unknown as Store,
      2,
    );
    expect(result.players.map((p) => p.current_tier)).toEqual(['CHALLENGER', 'GRANDMASTER']);
    expect(store.request.mock.calls[0]![2][0]).not.toHaveProperty('collected_at');
  });
  it('requires secrets and enforces conservative defaults', () => {
    expect(() => config({})).toThrow('Missing environment variable');
    const env = {
      RIOT_API_KEY: 'key',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SECRET_KEY: 'secret',
    };
    expect(config(env)).toMatchObject({ playersLimit: 10, matchesPerPlayer: 5, delayMs: 1400 });
    expect(() => config({ ...env, MATCHES_PER_PLAYER: '101' })).toThrow();
  });
});
