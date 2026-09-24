import { expect, it, vi } from 'vitest';
import fixture from './fixtures/riot-match-v5.anonymized.json';
import { collectMatches, collectorExitCode } from '../scripts/collector/collectMatches';
import { normalizeMatch, MatchSkipped } from '../scripts/collector/saveMatch';
import type { RiotClient } from '../scripts/collector/riot';
import type { Store } from '../scripts/collector/supabase';
function raw(id = 'KR_1') {
  const r = structuredClone(fixture);
  r.metadata.match_id = id;
  r.info.queue_id = 1100;
  r.info.game_datetime = Date.now() - 60000;
  r.info.game_version = 'TFT Unreal Version ?.?.?.?';
  return r;
}
it.each([
  [7, 7],
  [8, 7],
  [9, 8],
])('skips participant count %i, distinct count %i with queue diagnostics', (count, distinct) => {
  const r = raw();
  if (count === 7) r.info.participants.pop();
  if (count === 9) r.info.participants.push(structuredClone(r.info.participants[0]!));
  if (distinct === 7 && count === 8) r.info.participants[7]!.puuid = r.info.participants[0]!.puuid;
  try {
    normalizeMatch(r, 'KR_1');
    throw Error('Expected skip');
  } catch (e) {
    expect(e).toBeInstanceOf(MatchSkipped);
    expect(e).toHaveProperty('context', {
      matchId: 'KR_1',
      queueId: 1100,
      participantCount: count,
      distinctPuuidCount: distinct,
      reason: 'Expected eight distinct participants',
    });
  }
});
it('does not hide required field failures behind participant count exclusion', () => {
  for (const key of ['queue_id', 'game_datetime', 'game_version']) {
    const r = raw();
    r.info.participants.pop();
    Reflect.deleteProperty(r.info, key);
    try {
      normalizeMatch(r, 'KR_1');
      throw Error('Expected validation');
    } catch (e) {
      expect(e).not.toBeInstanceOf(MatchSkipped);
      expect(e).toHaveProperty('category', 'VALIDATION ERROR');
    }
  }
});
it('saves valid games, skips three count anomalies without DB calls, warns once and counts saved unresolved patches', async () => {
  const ids = ['KR_1', 'KR_2', 'KR_3', 'KR_4', 'KR_5'];
  const riot = {
    get: vi.fn(async (path: string) => {
      if (path.includes('by-puuid')) return ids;
      const id = path.split('/').at(-1)!,
        r = raw(id);
      if (['KR_1', 'KR_2', 'KR_3'].includes(id)) r.info.participants.pop();
      return r;
    }),
  };
  const request = vi.fn(async () => true);
  const store = { existing: vi.fn(async () => new Set<string>()), request };
  const log = vi.spyOn(console, 'log').mockImplementation(() => {}),
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const result = await collectMatches(
      riot as unknown as RiotClient,
      store as unknown as Store,
      [
        {
          puuid: 'test-player',
          current_tier: 'CHALLENGER',
          league_points: 1000,
          rank_observed_at: '2026-09-12T00:00:00Z',
        },
      ],
      new Map(),
      5,
    );
    expect(result).toMatchObject({
      'Saved matches': 2,
      'Failed matches': 0,
      'Skipped matches': 3,
      'Patch unresolved matches': 2,
    });
    expect(collectorExitCode(result)).toBe(0);
    expect(request.mock.calls).toHaveLength(3); // scan timestamp + two atomic saves
    expect(log.mock.calls.filter((c) => c[0] === '[MATCH SKIPPED]')).toHaveLength(3);
    expect(warn.mock.calls.filter((c) => c[0] === '[PATCH WARNING]')).toHaveLength(1);
  } finally {
    log.mockRestore();
    warn.mockRestore();
  }
});
it('keeps operational failures fatal and exclusions nonfatal', () => {
  expect(collectorExitCode({ Players: 50, 'Failed matches': 0, 'Failed player scans': 0 })).toBe(0);
  expect(collectorExitCode({ Players: 50, 'Failed matches': 1, 'Failed player scans': 0 })).toBe(1);
  expect(collectorExitCode({ Players: 50, 'Failed matches': 0, 'Failed player scans': 1 })).toBe(1);
});
