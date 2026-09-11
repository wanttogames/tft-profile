import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import oldMatch from './fixtures/riot-match-v5.anonymized.json';
import set18 from './fixtures/riot-set18-participant.anonymized.json';
import snapshot from '../netlify/data/tft-ko-snapshot.json';
import { parseParticipant } from '../netlify/lib/matchParticipant';
import { augmentFields, debugAugments, parseAugments } from '../netlify/lib/augmentParser';
import { preferenceAnalysis } from '../src/analytics/preferences';
import { displayName } from '../src/static-data/catalog';
import { demoPlayer } from '../src/data/demo';
import PreferencePanel from '../src/components/PreferencePanel.vue';
import MatchList from '../src/components/MatchList.vue';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe('evidence-based augment parser', () => {
  it('extracts every selected slot from all eight real historical participants by PUUID', () => {
    for (const raw of oldMatch.info.participants) {
      const result = parseParticipant([...oldMatch.info.participants].reverse(), raw.puuid)!;
      expect(result.augments).toHaveLength(raw.augments.length);
      expect(result.augments).toEqual(raw.augments);
      expect(result.augmentStatus).toBe('available');
    }
  });
  it('extracts all three real slots for the selected participant', () => {
    const player = parseParticipant(oldMatch.info.participants, 'fixture-player-7')!;
    expect(player.augments).toHaveLength(3);
    expect(player.augments).toEqual(oldMatch.info.participants[6]!.augments);
  });
  it('records actual absence in the published Set 18 participant without inventing fields', () => {
    expect(augmentFields(set18)).toEqual({});
    const result = parseParticipant([set18], set18.puuid)!;
    expect(result.augmentStatus).toBe('missing');
    expect(result.augments).toBeUndefined();
    expect(result.placement).toBe(4);
  });
  it.each([{}, { augments: null }])('classifies absent/null as missing: %j', (raw) => {
    expect(parseAugments(raw)).toEqual({ augmentStatus: 'missing' });
  });
  it('distinguishes explicitly empty choices', () => {
    expect(parseAugments({ augments: [] })).toEqual({ augments: [], augmentStatus: 'empty' });
  });
  // Deliberately synthetic malformed/unknown schemas; these are NOT claimed as Riot fields.
  it.each([
    { augments: 'unexpected' },
    { augments: ['valid', null, 'valid2'] },
    { augments: [' '] },
    { unverifiedAugmentField: ['a'] },
    { nested: { unverifiedAugmentField: ['a'] } },
  ])('flags unsupported data instead of claiming no data: %j', (raw) => {
    expect(parseAugments(raw)).toEqual({ augmentStatus: 'parse-error' });
  });
  it('does not truncate or deduplicate selected slots', () => {
    expect(parseAugments({ augments: ['a', 'a', 'b', 'c'] }).augments).toEqual([
      'a',
      'a',
      'b',
      'c',
    ]);
  });
  it('logs only augment fields/status in explicitly enabled development mode', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TFT_DEBUG_AUGMENTS', '1');
    const log = vi.spyOn(console, 'debug').mockImplementation(() => {});
    debugAugments({ puuid: 'private', riotIdGameName: 'private', augments: ['a', 'b', 'c'] });
    expect(log).toHaveBeenCalledWith('[tft:augments]', {
      fields: { augments: ['a', 'b', 'c'] },
      status: 'available',
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('private');
  });
  it.each(['production', 'test'])('never logs in %s, even with the debug flag', (mode) => {
    vi.stubEnv('NODE_ENV', mode);
    vi.stubEnv('TFT_DEBUG_AUGMENTS', '1');
    const log = vi.spyOn(console, 'debug');
    debugAugments({ augments: ['a'] });
    expect(log).not.toHaveBeenCalled();
  });
  it('does not log development responses unless opted in', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TFT_DEBUG_AUGMENTS', '0');
    const log = vi.spyOn(console, 'debug');
    debugAugments({ augments: ['a'] });
    expect(log).not.toHaveBeenCalled();
  });
});

describe('parsed data reaches fifty-game Korean preferences', () => {
  it('maps real recorded augment IDs and computes metrics over all 50 derived fixture games', () => {
    // Fifty repetitions are an explicit derived statistics sample, not fifty captured matches.
    const player = parseParticipant(oldMatch.info.participants, 'fixture-player-7')!;
    const games = demoPlayer().games.map((g, i) => ({
      ...g,
      set: 8,
      player: { ...player, placement: i < 30 ? 1 : 8 },
    }));
    const result = preferenceAnalysis(games, 'augment');
    expect(result.available).toBe(50);
    expect(result.parseErrors).toBe(0);
    expect(result.top).toHaveLength(3);
    expect(displayName(snapshot.assets, 'augment', player.augments![0]!)).toBe('사이버네틱 외피 I');
    expect(displayName(snapshot.assets, 'augment', player.augments![2]!)).toBe('사냥의 전율 II');
    // Retired Set 8.5 hero augment is absent from current catalog: preserve ID as fallback.
    expect(displayName(snapshot.assets, 'augment', player.augments![1]!)).toBe(player.augments![1]);
    for (const row of result.top) {
      expect(row).toMatchObject({ count: 50, rate: 1, average: 3.8, top4: 0.6 });
    }
  });
  it('separates error/missing/empty counts, excludes errors and keeps valid statistics', async () => {
    const data = demoPlayer();
    data.games.forEach((g, i) => {
      g.player = {
        ...g.player,
        ...parseAugments(
          i < 10
            ? { augments: 123 }
            : i < 20
              ? {}
              : i < 25
                ? { augments: [] }
                : { augments: ['known'] },
        ),
      };
      if (i < 20) delete g.player.augments;
    });
    const result = preferenceAnalysis(data.games, 'augment');
    expect(result).toMatchObject({
      total: 50,
      available: 30,
      missing: 10,
      parseErrors: 10,
      empty: 5,
    });
    expect(result.top[0]).toMatchObject({ count: 25, rate: 25 / 30 });
    const html = await renderToString(createSSRApp(PreferencePanel, { data, kind: 'augment' }));
    expect(html).toContain('파싱 오류 10경기');
    expect(html).toContain('실제 데이터 없음(API 필드 누락·null) 10경기');
    const list = await renderToString(createSSRApp(MatchList, { data }));
    expect(list).toContain('증강 데이터 파싱 오류');
  });
});
