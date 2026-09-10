import { describe, it, expect } from 'vitest';
import { demoPlayer } from '../src/data/demo';
import { statistics, mean, formAnalysis } from '../src/analytics/formAnalysis';
import { deckDiversity } from '../src/analytics/deckDiversity';
import { classifyStyle, playStyle } from '../src/analytics/playStyle';
import { playerScores } from '../src/analytics/playerScores';
import { strengthWeakness } from '../src/analytics/strengthWeakness';
const fixture = (placements: number[]) =>
  placements.map((placement, i) => {
    const g = structuredClone(demoPlayer().games[i % 20]!);
    g.player.placement = placement;
    return g;
  });
describe('descriptive statistics', () => {
  it('computes average, TOP4, first-place rate exactly', () => {
    const s = statistics(fixture([1, 2, 4, 5, 8]));
    expect(s.average).toBe(4);
    expect(s.top4).toBe(0.6);
    expect(s.win).toBe(0.2);
  });
  it('returns unavailable values for empty samples', () => {
    expect(mean([])).toBeNull();
    expect(statistics([])).toEqual({ count: 0, average: null, top4: null, win: null });
  });
  it('uses newest ten and previous ten, positive is improvement', () => {
    const f = formAnalysis(fixture([...Array(10).fill(2), ...Array(10).fill(5)]));
    expect(f.delta).toBe(3);
    expect(f.five).toBe(2);
    expect(f.previous).toBe(5);
  });
  it('never compares an incomplete previous window', () =>
    expect(formAnalysis(fixture(Array(19).fill(1))).delta).toBeNull());
  it('detects deterioration', () =>
    expect(formAnalysis(fixture([...Array(10).fill(6), ...Array(10).fill(2)])).delta).toBe(-4));
});
describe('deck diversity', () => {
  it('one signature repeated is zero', () => {
    const g = fixture(Array(20).fill(4));
    g.forEach((x) => (x.player.traits = g[0]!.player.traits));
    expect(deckDiversity(g).score).toBe(0);
  });
  it('all unique signatures is 100', () => {
    const g = fixture(Array(20).fill(4));
    g.forEach(
      (x, i) =>
        (x.player.traits = [
          { name: 'trait' + i, num_units: 5, tier_current: 1, tier_total: 3, style: 1 },
        ]),
    );
    expect(deckDiversity(g).score).toBe(100);
  });
  it('does not treat unavailable traits as a deck', () => {
    const g = fixture(Array(20).fill(4));
    g.forEach((x) => (x.player.traits = []));
    expect(deckDiversity(g).score).toBeNull();
    expect(deckDiversity(g).unique).toBe(0);
  });
});
describe('player card', () => {
  it('calculates high-end frequency and top4 stability', () => {
    const scores = playerScores(fixture([1, 2, 4, 5, 8]));
    expect(scores?.ceiling).toBe(40);
    expect(scores?.stability).toBe(60);
    expect(scores?.risk).toBe(60);
  });
  it('perfect placement is bounded and not random', () => {
    const g = fixture(Array(20).fill(1));
    expect(playerScores(g)?.ceiling).toBe(100);
    expect(playerScores(g)?.stability).toBe(100);
    expect(playerScores(g)?.form).toBe(50);
    expect(playerScores(g)).toEqual(playerScores(g));
  });
  it('suppresses card under five matches and form under twenty', () => {
    expect(playerScores(fixture([1, 2, 3, 4]))).toBeNull();
    expect(playerScores(fixture([1, 2, 3, 4, 5]))?.form).toBeNull();
  });
});
describe('style heuristics', () => {
  it('classifies three-star level8 before level8 proxy', () => {
    const g = fixture([1])[0]!;
    g.player.level = 8;
    g.player.units[0]!.tier = 3;
    expect(classifyStyle(g)).toBe('리롤형');
  });
  it('handles level8, level9 and other end boards', () => {
    const g = fixture([1])[0]!;
    g.player.units.forEach((u) => (u.tier = 2));
    g.player.level = 8;
    expect(classifyStyle(g)).toBe('Fast 8형');
    g.player.level = 9;
    expect(classifyStyle(g)).toBe('Fast 9형');
    g.player.level = 7;
    expect(classifyStyle(g)).toBe('기타');
  });
  it('percentages sum to 100 and suppresses small samples', () => {
    expect(playStyle(fixture([1, 2, 3]))).toEqual([]);
    expect(playStyle(demoPlayer().games).reduce((s, x) => s + x.percent, 0)).toBe(100);
  });
  it('does not generate weaknesses from tiny samples', () => {
    const x = strengthWeakness(fixture([8, 8]));
    expect(x.strengths).toEqual([]);
    expect(x.weaknesses).toEqual([]);
  });
});
