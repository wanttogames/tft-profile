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
// Synthetic boundary fixtures. Never presented as thirty captured live matches.
const sample = () =>
  demoPlayer().games.map((g, i) => ({ ...g, player: { ...g.player, placement: i < 18 ? 1 : 8 } }));
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
  it('preserves observed combat counters', () => {
    for (const raw of published.info.participants) {
      const p = parseParticipant(published.info.participants, raw.puuid)!;
      expect(p.players_eliminated).toBe(raw.players_eliminated);
      expect(p.total_damage_to_players).toBe(raw.total_damage_to_players);
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
describe('30-game board preferences', () => {
  it.each(['unit', 'item', 'trait'] as const)(
    'counts distinct games and exact performance for %s',
    (kind) => {
      const games = sample();
      const p = preferenceAnalysis(games, kind);
      expect(p.total).toBe(30);
      expect(p.top.length).toBeLessThanOrEqual(10);
      const r = p.top[0]!;
      expect(r.count).toBeGreaterThan(0);
      if (kind !== 'trait')
        expect(r).toMatchObject({ count: 30, average: 3.8, top4: 0.6, rate: 1 });
    },
  );
  it('counts repeated items as copies but gives their match one statistical vote', () => {
    const p = preferenceAnalysis(varied(), 'item');
    expect(p.top[0]).toMatchObject({ count: 30, copies: 60, average: 3.8, top4: 0.6 });
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
    expect(preferenceAnalysis(games, 'unit').top[0]!.count).toBe(30);
    expect(preferenceAnalysis(games, 'trait').rows.some((r) => r.id === 'off')).toBe(false);
    expect(preferenceAnalysis(games, 'trait').top[0]!.count).toBe(12);
  });
  it('caps input at newest thirty without mutating caller data', () => {
    const games = sample();
    const extra = {
      ...games[0]!,
      id: 'old',
      date: 0,
      player: { ...games[0]!.player, placement: 8 },
    };
    const input = [extra, ...games];
    expect(preferenceAnalysis(input, 'item').total).toBe(30);
    expect(playerProfile(input).stats.average).toBe(3.8);
    expect(input[0]).toBe(extra);
  });
  it('marks rare observations as insufficient and excludes missing boards', () => {
    const games = varied();
    games[0]!.player.units = [];
    expect(preferenceAnalysis(games, 'unit').available).toBe(29);
    expect(preferenceAnalysis(games, 'unit').top.every((r) => !r.enough)).toBe(true);
  });
});
describe('profile formulas and multi-signal names', () => {
  it('does not award stability merely for consistently finishing eighth', () => {
    const games = sample();
    games.forEach((g) => (g.player.placement = 8));
    expect(playerScores(games)).toMatchObject({
      ceiling: 0,
      stability: 25,
      survival: 0,
      form: 25,
    });
  });
  it('penalizes maximum variance and bounds every score', () => {
    const games = sample();
    games.forEach((g, i) => (g.player.placement = i < 15 ? 1 : 8));
    expect(playerScores(games)!.stability).toBe(38);
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
    expect(playerScores(games)!.flexibility).toBe(0);
  });
  it('identifies concentration only across champion, trait and deck evidence', () => {
    const games = sample();
    games.forEach((g) => (g.player.traits = games[0]!.player.traits));
    expect(playerProfile(games).name).toBe('한 우물 장인');
    games.forEach((g, i) => (g.player.traits = [{ ...g.player.traits[0]!, name: 'unique' + i }]));
    expect(playerProfile(games).name).not.toBe('한 우물 장인');
  });
  it('uses peak, stability and top-two rate together for high ceiling', () => {
    const games = varied();
    games.forEach((g, i) => (g.player.placement = i < 21 ? 1 : 8));
    expect(playerProfile(games).name).toBe('고점 폭발형');
  });
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
  it('requires late levels and decent outcomes for late-game preference', () => {
    const games = sample();
    games.forEach((g, i) => {
      g.player.placement = i % 2 ? 2 : 6;
      g.player.level = 9;
      g.player.last_round = 35;
    });
    expect(playerProfile(games).name).toBe('후반 운영형');
  });
  it('uses multiple outcome signals for stable top-four play', () => {
    const games = sample();
    games.forEach((g, i) => {
      g.player.placement = i % 2 ? 3 : 4;
      g.player.level = 8;
    });
    expect(playerProfile(games).name).toBe('안정적 순방형');
  });
  it('compares extreme groups without causal claims; needs three per group', () => {
    const games = varied();
    games.forEach((g) => (g.player.level = g.player.placement <= 2 ? 9 : 7));
    const r = extremeComparison(games);
    expect(r).toMatchObject({ enough: true, levelDelta: 2 });
    expect(r.high.count).toBe(18);
    expect(r.low.count).toBe(12);
    expect(extremeComparison(games.slice(0, 2)).enough).toBe(false);
  });
  it('selects core units from item-equipped final boards', () =>
    expect(playerProfile(varied()).core).toHaveLength(3));
});
describe('profile rendering', () => {
  it('renders identity, all eight scores and Korean favorite names', async () => {
    const data = demoPlayer();
    const html = await renderToString(createSSRApp(PlayerCard, { data }));
    for (const text of [
      'TFT / PLAYER ARCHIVE',
      '나의 플레이어',
      'DIAMOND',
      '67 LP',
      '순방력',
      '후반 운영력',
      '유연성',
      '보드 완성도',
      '최근 폼',
      '선호 활성 특성 TOP 3',
      '선호 챔피언 TOP 3',
      '아리',
    ])
      expect(html).toContain(text);
    expect(html).not.toContain('증강');
    expect(html).not.toContain('DEMO_');
  });
  it('renders only supported match and preference content', async () => {
    const data = demoPlayer();
    for (const component of [MatchList, PreferencePanel]) {
      const html = await renderToString(createSSRApp(component as any, { data, kind: 'item' }));
      expect(html).not.toContain('증강');
    }
  });
});
