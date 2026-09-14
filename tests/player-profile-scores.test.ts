import { describe, expect, it } from 'vitest';
import { demoPlayer } from '../src/data/demo';
import { boardCompletion, playerScores, playerStyle } from '../src/analytics/playerScores';
import { preferenceAnalysis } from '../src/analytics/preferences';
import { parseParticipant } from '../netlify/lib/matchParticipant';
import type { Game } from '../src/types/riot';
import published from './fixtures/riot-match-v5.anonymized.json';

const games = (placements: number[]) =>
  placements.map((placement, index) => {
    const game = structuredClone(demoPlayer().games[index % 50]!);
    game.id = `score-${index}`;
    game.date = 2_000_000 - index;
    game.player.placement = placement;
    return game;
  });

describe('eight-metric TFT player profile', () => {
  it('calculates every metric from observable match and final-board data', () => {
    const result = playerScores(demoPlayer().games, demoPlayer().assets)!;
    expect(Object.keys(result)).toEqual([
      'ceiling',
      'stability',
      'survival',
      'lateGame',
      'diversity',
      'flexibility',
      'completion',
      'form',
    ]);
    Object.values(result).forEach((value) => {
      expect(value).not.toBeNull();
      expect(value!).toBeGreaterThanOrEqual(0);
      expect(value!).toBeLessThanOrEqual(100);
    });
  });

  it('raises peak, stability and survival for the matching placement patterns', () => {
    expect(playerScores(games(Array(50).fill(1)))!.ceiling).toBeGreaterThan(
      playerScores(games(Array(50).fill(5)))!.ceiling,
    );
    expect(playerScores(games(Array(50).fill(4)))!.stability).toBeGreaterThan(
      playerScores(games([...Array(25).fill(1), ...Array(25).fill(8)]))!.stability,
    );
    expect(playerScores(games(Array(50).fill(3)))!.survival).toBeGreaterThan(
      playerScores(games(Array(50).fill(6)))!.survival,
    );
  });

  it('calculates late-game operation from level, round and high/low level difference', () => {
    const high = games([...Array(25).fill(2), ...Array(25).fill(8)]);
    const low = structuredClone(high);
    high.forEach((game) => {
      game.player.level = game.player.placement <= 2 ? 10 : 8;
      game.player.last_round = 38;
    });
    low.forEach((game) => {
      game.player.level = 7;
      game.player.last_round = 22;
    });
    expect(playerScores(high)!.lateGame).toBeGreaterThan(playerScores(low)!.lateGame);
  });

  it('separates deck diversity and concentration-based flexibility', () => {
    const repeated = games(Array(50).fill(4));
    const varied = structuredClone(repeated);
    repeated.forEach((game) => {
      game.player.units = [{ character_id: 'same-unit', tier: 2, rarity: 1, items: [] }];
      game.player.traits = [
        { name: 'same-trait', num_units: 4, tier_current: 1, tier_total: 3, style: 1 },
      ];
    });
    varied.forEach((game, index) => {
      game.player.units = [{ character_id: `unit-${index}`, tier: 2, rarity: 1, items: [] }];
      game.player.traits = [
        {
          name: `trait-${index}`,
          num_units: 4,
          tier_current: 1,
          tier_total: 3,
          style: 1,
        },
      ];
    });
    expect(playerScores(varied)!.diversity!).toBeGreaterThan(playerScores(repeated)!.diversity!);
    expect(playerScores(varied)!.flexibility!).toBeGreaterThan(
      playerScores(repeated)!.flexibility!,
    );
  });

  it('uses completed items, stars and active trait tiers for board completion', () => {
    const low = games(Array(10).fill(4));
    const high = structuredClone(low);
    const assets = {
      component: { name: '재료', itemType: 'component' as const },
      completed: { name: '완성 아이템', itemType: 'completed' as const },
    };
    low.forEach((game) => {
      game.player.units = [
        { character_id: 'unit', tier: 1, rarity: 1, items: [], itemNames: ['component'] },
      ];
      game.player.traits = [
        { name: 'trait', num_units: 2, tier_current: 1, tier_total: 4, style: 1 },
      ];
    });
    high.forEach((game) => {
      game.player.units = [
        {
          character_id: 'unit',
          tier: 3,
          rarity: 1,
          items: [],
          itemNames: ['completed', 'completed', 'completed'],
        },
      ];
      game.player.traits = [
        { name: 'trait', num_units: 8, tier_current: 4, tier_total: 4, style: 4 },
      ];
    });
    expect(boardCompletion(high[0]!, assets)).toBeGreaterThan(boardCompletion(low[0]!, assets)!);
    expect(playerScores(high, assets)!.completion!).toBeGreaterThan(
      playerScores(low, assets)!.completion!,
    );
  });

  it('calculates recent form from recent ten versus the preceding twenty', () => {
    const improving = games([...Array(10).fill(1), ...Array(20).fill(8)]);
    const declining = games([...Array(10).fill(8), ...Array(20).fill(1)]);
    expect(playerScores(improving)!.form!).toBeGreaterThan(playerScores(declining)!.form!);
  });

  it('uses only active traits for preferences, diversity and style evidence', () => {
    const input = games(Array(20).fill(3));
    input.forEach((game, index) => {
      game.player.traits = [
        { name: 'active', num_units: 4, tier_current: 1, tier_total: 3, style: 1 },
        { name: `inactive-${index}`, num_units: 1, tier_current: 0, tier_total: 3, style: 0 },
      ];
    });
    expect(preferenceAnalysis(input, 'trait').rows.map((row) => row.id)).toEqual(['active']);
  });

  it('classifies titles from multiple metrics and usage concentration', () => {
    const stable = games(Array(50).fill(3));
    expect(playerStyle(stable).name).toBe('안정적 순방형');

    const peak = games([...Array(35).fill(1), ...Array(15).fill(8)]);
    peak.forEach((game, index) => {
      game.player.units = [{ character_id: `peak-unit-${index}`, tier: 2, rarity: 1, items: [] }];
      game.player.traits = [
        { name: `peak-trait-${index}`, num_units: 4, tier_current: 1, tier_total: 3, style: 1 },
      ];
    });
    expect(playerStyle(peak).name).toBe('고점 폭발형');
  });

  it('runs against the stored real Match-V1 response structure', () => {
    const actual = published.info.participants.map((raw, index) => ({
      id: `${published.metadata.match_id}-${index}`,
      date: published.info.game_datetime - index,
      duration: published.info.game_length,
      version: published.info.game_version,
      set: published.info.tft_set_number,
      player: parseParticipant(published.info.participants, raw.puuid)!,
    })) satisfies Game[];
    const baseline = playerScores(actual)!;
    const alteredCounters = structuredClone(actual);
    alteredCounters.forEach((game) => {
      game.player.players_eliminated = 999;
      game.player.total_damage_to_players = 999_999;
    });
    expect(playerScores(alteredCounters)).toEqual(baseline);
    expect(baseline.form).toBeNull();
    expect(baseline.completion).not.toBeNull();
  });
});
