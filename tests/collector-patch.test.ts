import { describe, expect, it, vi } from 'vitest';
import fixture from './fixtures/riot-match-v5.anonymized.json';
import { normalizeMatch, patchFromVersion } from '../scripts/collector/saveMatch';
import { collectMatches } from '../scripts/collector/collectMatches';
import type { RiotClient } from '../scripts/collector/riot';
import type { Store } from '../scripts/collector/supabase';
import type { Player } from '../scripts/collector/collectPlayers';
// Synthetic format variants, NOT claimed to be the failing live KR response.
describe('best-effort patch extraction', () => {
  it.each([
    ['Version 16.18.xxxx', '16.18'],
    ['Linux Version 16.18.xxxxx', '16.18'],
    ['16.18.xxxxx', '16.18'],
    ['Linux Version 16.18.123 (release)', '16.18'],
    ['16.18', '16.18'],
    ['Linux 6.8 Version 16.18.123', '16.18'],
    ['unknown release', null],
    ['build 20260912', null],
    ['6.8 and 16.18', null],
    ['Version 16.18 / Version 16.19', null],
    ['artifact116.18', null],
  ])('extracts %s without full version validation', (raw, patch) =>
    expect(patchFromVersion(raw)).toBe(patch),
  );
  it('retains unknown non-empty text exactly, including surrounding whitespace', () => {
    const raw = structuredClone(fixture);
    raw.info.game_version = '  opaque release label  ';
    expect(normalizeMatch(raw, raw.metadata.match_id)).toMatchObject({
      game_version: '  opaque release label  ',
      patch: null,
    });
    raw.info.game_version = '   ';
    expect(() => normalizeMatch(raw, raw.metadata.match_id)).toThrow('Expected non-empty string');
  });
  it('saves four new matches for two players, including unknown versions; logs version once', async () => {
    const versions = [
      'Linux Version 16.18.xxxxx',
      'Version 16.18.xxxx',
      'unknown release',
      '16.18.xxxxx',
    ];
    const players: Player[] = ['player-one', 'player-two'].map((puuid) => ({
      puuid,
      current_tier: 'CHALLENGER',
      league_points: 1000,
      rank_observed_at: '2026-09-12T00:00:00Z',
    }));
    const riot = {
      get: vi.fn(async (path: string) => {
        if (path.includes('by-puuid'))
          return path.includes('player-one') ? ['KR_1', 'KR_2'] : ['KR_3', 'KR_4'];
        const id = path.split('/').at(-1)!;
        const raw = structuredClone(fixture);
        raw.metadata.match_id = id;
        raw.info.queue_id = 1100;
        raw.info.game_datetime = Date.now() - 60000;
        raw.info.game_version = versions[Number(id.slice(3)) - 1]!;
        return raw;
      }),
    };
    const store = {
      existing: vi.fn(async () => new Set<string>()),
      request: vi.fn(async () => true),
    };
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = await collectMatches(
        riot as unknown as RiotClient,
        store as unknown as Store,
        players,
        new Map(),
        2,
      );
      expect(result).toMatchObject({
        Players: 2,
        'Candidate matches': 4,
        'New matches': 4,
        'Saved matches': 4,
        'Failed matches': 0,
      });
      expect(log.mock.calls.filter((c) => c[0] === '[GAME VERSION]')).toHaveLength(1);
      expect(warning.mock.calls.filter((c) => c[0] === '[PATCH WARNING]')).toHaveLength(1);
      const calls = store.request.mock.calls as unknown as [
        string,
        string,
        { payload?: { game_version: string; patch: string | null } },
      ][];
      expect(calls.filter((c) => c[0].startsWith('rpc/'))[2]![2].payload).toMatchObject({
        game_version: 'unknown release',
        patch: null,
      });
      expect(
        riot.get.mock.calls
          .filter((c) => c[0].includes('by-puuid'))
          .every((c) => c[0].endsWith('count=2')),
      ).toBe(true);
    } finally {
      log.mockRestore();
      warning.mockRestore();
    }
  });
  it('prefers actual itemNames even if fallback item_names also exists', () => {
    const raw = structuredClone(fixture),
      unit = raw.info.participants[0]!.units[0]!;
    unit.itemNames = ['official-item'];
    Reflect.set(unit, 'item_names', ['fallback-item']);
    expect(normalizeMatch(raw, raw.metadata.match_id).participants[0]!.units[0]!.itemNames).toEqual(
      ['official-item'],
    );
  });
});
