import { describe, it, expect } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { demoPlayer } from '../src/data/demo';
import { playDna, completion } from '../src/analytics/game/playDna';
import { playerScore } from '../src/analytics/game/playerScore';
import { playerClass } from '../src/analytics/game/playerClass';
import { playerComparison } from '../src/analytics/game/playerComparison';
import { achievements } from '../src/analytics/game/achievements';
import { streaks } from '../src/analytics/game/streaks';
import { challenge } from '../src/analytics/game/challenges';
import { matchFeedback } from '../src/analytics/game/matchFeedback';
import PlayerGameProfile from '../src/components/PlayerGameProfile.vue';
const fixture = (places: number[]) =>
  places.map((p, i) => {
    const g = structuredClone(demoPlayer().games[i % 50]!);
    g.id = 'fixture' + i;
    g.date = 100000 - i;
    g.player.placement = p;
    return g;
  });
describe('game profile calculations', () => {
  it('handles empty and short samples without fictional scores', () => {
    expect(playerScore([])).toBeNull();
    expect(playDna([]).stability.value).toBeNull();
    expect(playerComparison(fixture(Array(49).fill(1)))).toBeNull();
    expect(playerClass(fixture([1])).name).toBe('아직 쓰여지는 캐릭터');
  });
  it('does not penalize absent combat fields as zero', () => {
    const g = fixture(Array(50).fill(4));
    g.forEach((x) => {
      delete x.player.players_eliminated;
      delete x.player.total_damage_to_players;
    });
    expect(playDna(g).aggression.value).toBeNull();
    g.forEach((x) => (x.player.total_damage_to_players = 100));
    expect(playDna(g).aggression.value).toBe(50);
  });
  it('handles measured zero combat separately from absence', () => {
    const g = fixture(Array(50).fill(4));
    g.forEach((x) => {
      x.player.players_eliminated = 0;
      x.player.total_damage_to_players = 0;
    });
    expect(playDna(g).aggression.value).toBe(0);
  });
  it('keeps score independent of repeated versus diverse boards', () => {
    const a = fixture(Array(50).fill(3)),
      b = structuredClone(a);
    a.forEach((x) => (x.player.traits = a[0]!.player.traits));
    b.forEach((x, i) => (x.player.traits = [{ ...x.player.traits[0]!, name: 'unique' + i }]));
    expect(playerScore(a)).toBe(playerScore(b));
    expect(playDna(b).flexibility.value!).toBeGreaterThan(playDna(a).flexibility.value!);
  });
  it('bounds scores and treats uniformly good outcomes better than bad ones', () => {
    const good = fixture(Array(50).fill(1)),
      bad = fixture(Array(50).fill(8));
    expect(playerScore(good)).toBe(1000);
    expect(playerScore(bad)).toBe(0);
    expect(playDna(good).stability.value!).toBeGreaterThan(playDna(bad).stability.value!);
    for (const m of Object.values(playDna(good)))
      if (m.value !== null) {
        expect(m.value).toBeGreaterThanOrEqual(0);
        expect(m.value).toBeLessThanOrEqual(100);
      }
  });
  it('computes current and maximum streaks newest first', () => {
    expect(streaks(fixture([1, 1, 4, 8, 4, 3, 2, 1, 4, 8]))).toEqual({
      currentTop4: 3,
      currentWins: 2,
      bestTop4: 5,
    });
    expect(streaks(fixture(Array(50).fill(8))).bestTop4).toBe(0);
  });
  it('compares exact disjoint 25-game windows', () => {
    const c = playerComparison(fixture([...Array(25).fill(2), ...Array(25).fill(6)]))!;
    expect(c.improvement).toBe(4);
    expect(c.top4Change).toBe(100);
    expect(c.scoreDelta).toBeGreaterThan(0);
  });
  it('unlocks revenge in chronological direction only', () => {
    expect(achievements(fixture([1, 8])).find((x) => x.id === 'revenge')!.unlocked).toBe(true);
    const b = achievements(fixture([8, 1])).find((x) => x.id === 'revenge')!;
    expect(b.unlocked).toBe(false);
    expect(b.name).toBe('????');
    expect(b.description).toBe('조건을 만족하면 공개됩니다.');
  });
  it('requires full ten games for dominator and challenge completion', () => {
    expect(achievements(fixture([1])).find((x) => x.id === 'dominator')!.unlocked).toBe(false);
    expect(challenge(fixture(Array(5).fill(1))).complete).toBe(false);
    expect(challenge(fixture(Array(10).fill(1))).complete).toBe(true);
  });
  it('uses unique successful deck signatures rather than repeated wins for variety', () => {
    const g = fixture(Array(10).fill(1));
    g.forEach((x) => (x.player.traits = g[0]!.player.traits));
    expect(achievements(g).find((x) => x.id === 'variety')!.unlocked).toBe(false);
    expect(achievements(g).find((x) => x.id === 'master')!.unlocked).toBe(true);
  });
  it('completion is unavailable for empty boards and reweights missing item records', () => {
    const g = fixture([1])[0]!;
    g.player.units = [];
    expect(completion(g)).toBeNull();
    g.player.units = [{ character_id: 'a', tier: 3, rarity: 1, items: [] }];
    expect(completion(g)).toBe(100);
  });
  it('adds tags only for meaningful differences against other games', () => {
    const g = fixture(Array(20).fill(3));
    g.forEach((x) => {
      x.player.total_damage_to_players = 50;
      x.player.last_round = 30;
      x.player.units.forEach((u) => (u.tier = 2));
    });
    expect(matchFeedback(g[0]!, g)).toEqual([]);
    g[0]!.player.total_damage_to_players = 100;
    expect(matchFeedback(g[0]!, g).some((x) => x.label === 'HIGH DAMAGE')).toBe(true);
  });
  it('deduplicates match IDs and caps at 50', () => {
    const g = fixture(Array(51).fill(1));
    g[50]!.player.placement = 8;
    expect(playerScore([...g, g[0]!])).toBe(1000);
    expect(streaks([...g, g[0]!]).currentWins).toBe(50);
  });
  it('renders sections in requested order without exposing locked secrets', async () => {
    const data = demoPlayer();
    data.games = fixture([4]);
    const html = await renderToString(createSSRApp(PlayerGameProfile, { data }));
    const labels = [
      'PLAYER PROFILE',
      'PLAY DNA',
      'YOU VS PAST YOU',
      'PERSONAL CHALLENGE',
      'ACHIEVEMENTS',
    ];
    for (let i = 1; i < labels.length; i++)
      expect(html.indexOf(labels[i]!)).toBeGreaterThan(html.indexOf(labels[i - 1]!));
    expect(html).toContain('????');
    expect(html).not.toContain('복수는 다음 판에');
    expect(html).toContain('재계산');
  });
});
