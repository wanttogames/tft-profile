import type { Game } from '../src/types/riot';
import { describe, it, expect } from 'vitest';
import { demoPlayer } from '../src/data/demo';
import { statistics, formAnalysis } from '../src/analytics/formAnalysis';
import { playStyle } from '../src/analytics/playStyle';
import { playerScores } from '../src/analytics/playerScores';
import { deckDiversity } from '../src/analytics/deckDiversity';
import { patterns } from '../src/analytics/patterns';
import { preferenceAnalysis } from '../src/analytics/preferences';
const fifty = (): Game[] =>
  demoPlayer().games.map((g, i) => ({
    ...g,
    player: {
      ...g.player,
      placement: i < 20 ? 1 : 8,
      traits: [
        {
          name: i < 20 ? 'early-trait' : 'late-trait',
          num_units: 5,
          style: 1,
          tier_current: 1,
          tier_total: 3,
        },
      ],
    },
  }));
describe('all fifty games drive analytics', () => {
  it('uses all 50 for placement, TOP4 and first-place rate', () => {
    expect(statistics(fifty())).toEqual({ count: 50, average: 5.2, top4: 0.4, win: 0.4 });
  });
  it('uses the last 30 in player scores, diversity and end-placement patterns', () => {
    const g = fifty();
    expect(playerScores(g)?.ceiling).toBe(40);
    expect(playerScores(g)?.survival).toBe(40);
    expect(deckDiversity(g).valid).toBe(50);
    expect(deckDiversity(g).top[0]?.[1]).toBe(30);
    expect(patterns(g.filter((x) => x.player.placement >= 7)).count).toBe(30);
  });
  it('counts all 50 style observations', () => {
    const g = fifty();
    g.forEach((x, i) => {
      x.player.units = x.player.units.map((u) => ({ ...u, tier: 2 }));
      x.player.level = i < 20 ? 8 : 9;
    });
    const styles = playStyle(g);
    expect(styles.find((s) => s.label === 'Fast 9형')?.percent).toBe(60);
  });
  it('compares 25 with 25 so games 21-50 influence form', () => {
    const f = formAnalysis(fifty());
    expect(f.recent).toBe(2.4);
    expect(f.previous).toBe(8);
    expect(f.delta).toBe(5.6);
    expect(formAnalysis(fifty().slice(0, 49)).delta).toBeNull();
  });
  it('ranks trait preferences from all 50, not the displayed ten', () => {
    for (const kind of ['trait'] as const) {
      const p = preferenceAnalysis(fifty(), kind);
      expect(p.total).toBe(50);
      expect(p.top[0]?.count).toBe(30);
      expect(p.top[0]?.rate).toBe(0.6);
      expect(p.top[0]?.average).toBe(8);
      expect(p.top[0]?.top4).toBe(0);
    }
  });
});
