import { describe, it, expect } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { demoPlayer } from '../src/data/demo';
import { preferenceAnalysis } from '../src/analytics/preferences';
import {
  playerProfile,
  extremeComparison,
  boardFlexibility,
} from '../src/analytics/profileAnalysis';
import { playerScores } from '../src/analytics/playerScores';
import { parseParticipant } from '../netlify/lib/matchParticipant';
import published from './fixtures/riot-match-v5.anonymized.json';
import set18 from './fixtures/riot-set18-participant.anonymized.json';
import PlayerCard from '../src/components/PlayerCard.vue';
import App from '../src/App.vue';
import MatchList from '../src/components/MatchList.vue';
import PreferencePanel from '../src/components/PreferencePanel.vue';
// Synthetic boundary fixtures. Never presented as fifty captured live matches.
const sample = () =>
  demoPlayer().games.map((g, i) => ({ ...g, player: { ...g.player, placement: i < 30 ? 1 : 8 } }));
const varied = () =>
  sample().map((g, i) => ({
    ...g,
    player: {
      ...g.player,
      units: [
        { character_id: `unit-${i}`, items: [], itemNames: ['item', 'item'], tier: 2, rarity: 1 },
      ],
      traits: [{ name: `trait-${i}`, num_units: 3, tier_current: 1, tier_total: 3, style: 1 }],
    },
  }));
describe('real participant fields', () => {
  it('preserves observed combat counters and ignores historical augment fields', () => {
    for (const raw of published.info.participants) {
      const p = parseParticipant(published.info.participants, raw.puuid)!;
      expect(p.players_eliminated).toBe(raw.players_eliminated);
      expect(p.total_damage_to_players).toBe(raw.total_damage_to_players);
      expect(p).not.toHaveProperty('augments');
    }
    expect(parseParticipant([set18], set18.puuid)).toMatchObject({
      players_eliminated: 0,
      total_damage_to_players: 0,
    });
  });
  it.each([undefined, null, -1, '100', NaN])(
    'keeps invalid/missing counters unavailable: %s',
    (value) => {
      const p = parseParticipant(
        [{ ...set18, players_eliminated: value, total_damage_to_players: value }],
        set18.puuid,
      )!;
      expect(p.players_eliminated).toBeUndefined();
      expect(p.total_damage_to_players).toBeUndefined();
    },
  );
});
describe('50-game board preferences', () => {
  it.each(['unit', 'item', 'trait'] as const)(
    'counts distinct games and exact performance for %s',
    (kind) => {
      const games = sample();
      const p = preferenceAnalysis(games, kind);
      expect(p.total).toBe(50);
      expect(p.top.length).toBeLessThanOrEqual(10);
      const r = p.top[0]!;
      expect(r.count).toBeGreaterThan(0);
      if (kind !== 'trait')
        expect(r).toMatchObject({ count: 50, average: 3.8, top4: 0.6, rate: 1 });
    },
  );
  it('counts repeated items as copies but gives their match one statistical vote', () => {
    const p = preferenceAnalysis(varied(), 'item');
    expect(p.top[0]).toMatchObject({ count: 50, copies: 100, average: 3.8, top4: 0.6 });
  });
  it('deduplicates units and traits and excludes inactive traits', () => {
    const games = sample();
    games.forEach((g) => {
      g.player.units.push(g.player.units[0]!);
      g.player.traits = [
        ...g.player.traits,
        ...g.player.traits,
        { ...g.player.traits[0]!, name: 'off', tier_current: 0 },
      ];
    });
    expect(preferenceAnalysis(games, 'unit').top[0]!.count).toBe(50);
    expect(preferenceAnalysis(games, 'trait').rows.some((r) => r.id === 'off')).toBe(false);
    expect(preferenceAnalysis(games, 'trait').top[0]!.count).toBe(20);
  });
  it('caps input at newest fifty without mutating caller data', () => {
    const games = sample();
    const extra = {
      ...games[0]!,
      id: 'old',
      date: 0,
      player: { ...games[0]!.player, placement: 8 },
    };
    const input = [extra, ...games];
    expect(preferenceAnalysis(input, 'item').total).toBe(50);
    expect(playerProfile(input).stats.average).toBe(3.8);
    expect(input[0]).toBe(extra);
  });
  it('marks rare observations as insufficient and excludes missing boards', () => {
    const games = varied();
    games[0]!.player.units = [];
    expect(preferenceAnalysis(games, 'unit').available).toBe(49);
    expect(preferenceAnalysis(games, 'unit').top.every((r) => !r.enough)).toBe(true);
  });
});
describe('profile formulas and multi-signal names', () => {
  it('separates consistency from successful top4 results', () => {
    const games = sample();
    games.forEach((g) => (g.player.placement = 8));
    expect(playerScores(games)).toMatchObject({
      ceiling: 0,
      stability: 100,
      survival: 0,
      form: 50,
    });
  });
  it('normalizes maximum variance to zero and bounds every score', () => {
    const games = sample();
    games.forEach((g, i) => (g.player.placement = i < 25 ? 1 : 8));
    expect(playerScores(games)!.stability).toBe(0);
    for (const value of Object.values(playerScores(games)!))
      if (value !== null) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
  });
  it('suppresses small samples and absent board evidence', () => {
    expect(playerProfile(sample().slice(0, 19)).name).toBe('분석 표본 부족');
    const games = sample();
    games.forEach((g) => (g.player.traits = []));
    expect(playerProfile(games).name).toBe('분석 표본 부족');
    expect(playerScores(games)!.flexibility).toBeNull();
  });
  it('identifies concentration only across champion, trait and deck evidence', () => {
    const games = sample();
    games.forEach((g) => (g.player.traits = games[0]!.player.traits));
    expect(playerProfile(games).name).toBe('한 우물 장인');
    games.forEach((g, i) => (g.player.traits = [{ ...g.player.traits[0]!, name: 'unique' + i }]));
    expect(playerProfile(games).name).not.toBe('한 우물 장인');
  });
  it('uses variance, win and top2 together for high ceiling', () =>
    expect(playerProfile(varied()).name).toBe('고점 폭발형'));
  it('identifies stable top4 using average and variance too', () => {
    const games = varied();
    games.forEach((g, i) => (g.player.placement = i % 2 ? 3 : 4));
    expect(playerProfile(games).name).toBe('안정적 순방형');
  });
  it('uses champion and trait turnover together for flexibility', () => {
    const games = varied();
    games.forEach((g, i) => (g.player.placement = i % 2 ? 2 : 6));
    expect(boardFlexibility(games)).toBe(100);
    expect(playerProfile(games).name).toBe('유연한 운영가');
  });
  it('requires real damage AND elimination coverage for aggression', () => {
    const games = sample();
    games.forEach((g, i) => {
      g.player.placement = i % 2 ? 2 : 6;
      g.player.total_damage_to_players = 120;
      g.player.players_eliminated = 2;
      g.player.level = 8;
    });
    expect(playerProfile(games).name).toBe('공격적 운영가');
    games.forEach((g) => delete g.player.total_damage_to_players);
    expect(playerProfile(games).name).toBe('균형 탐색형');
    expect(playerProfile(games).damage).toBeNull();
  });
  it('requires late levels and decent outcomes for late-game preference', () => {
    const games = sample();
    games.forEach((g, i) => {
      g.player.placement = i % 2 ? 2 : 6;
      g.player.level = 9;
      delete g.player.total_damage_to_players;
    });
    expect(playerProfile(games).name).toBe('후반 지향형');
  });
  it('uses few bottom-two results, average and variance for low-end defense', () => {
    const games = sample();
    games.forEach((g, i) => {
      g.player.placement = i % 2 ? 4 : 5;
      g.player.level = 8;
      delete g.player.total_damage_to_players;
    });
    expect(playerProfile(games).name).toBe('저점 방어형');
  });
  it('compares extreme groups without causal claims; needs three per group', () => {
    const games = varied();
    games.forEach((g) => (g.player.level = g.player.placement <= 2 ? 9 : 7));
    const r = extremeComparison(games);
    expect(r).toMatchObject({ enough: true, levelDelta: 2 });
    expect(r.high.count).toBe(30);
    expect(r.low.count).toBe(20);
    expect(extremeComparison(games.slice(0, 2)).enough).toBe(false);
  });
  it('selects core units from item-equipped final boards', () =>
    expect(playerProfile(varied()).core).toHaveLength(3));
});
describe('profile rendering', () => {
  it('renders identity, all six scores and Korean favorite names', async () => {
    const data = demoPlayer();
    const html = await renderToString(createSSRApp(PlayerCard, { data }));
    for (const text of [
      'TFT PLAYER PROFILE',
      '나의 플레이어',
      'DIAMOND',
      '67 LP',
      '순방력',
      '유연성',
      '선호 특성 TOP 3',
      '핵심 유닛 TOP 3',
      '아리',
    ])
      expect(html).toContain(text);
    expect(html).not.toContain('증강');
    expect(html).not.toContain('DEMO_');
  });
  it('removes augment content from matches and preferences', async () => {
    const data = demoPlayer();
    for (const component of [MatchList, PreferencePanel]) {
      const html = await renderToString(createSSRApp(component as any, { data, kind: 'item' }));
      expect(html).not.toContain('증강');
    }
  });
});
