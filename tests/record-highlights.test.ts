import { expect, it } from 'vitest';
import { recordHighlights } from '../src/analytics/recordHighlights';
import { demoPlayer } from '../src/data/demo';
it('does not invent observations for insufficient samples', () => {
  expect(recordHighlights([]).highlights).toEqual([]);
  expect(recordHighlights(demoPlayer().games.slice(0, 4)).highlights).toEqual([]);
});
it('compares complete windows in chronological order and prioritizes three observations', () => {
  const data = demoPlayer();
  data.games.forEach((g, i) => {
    g.player.placement = i < 15 ? 2 : 7;
    g.player.level = i < 15 ? 9 : 7;
  });
  const result = recordHighlights([...data.games].reverse(), data.assets);
  expect(result.highlights.map((h) => h.key)).toEqual(['form', 'unit', 'level']);
  expect(result.highlights[0]!.title).toContain('5.00 개선');
  expect(result.highlights[2]!.detail).toContain('15경기 평균 7.0레벨');
  expect(result.highlights[1]!.title).toContain('아리');
});
it('deduplicates champion copies and ignores inactive traits', () => {
  const data = demoPlayer();
  data.games.forEach((g) => {
    g.player.units = [g.player.units[0]!, g.player.units[0]!];
    g.player.traits.forEach((t) => (t.tier_current = 0));
  });
  const result = recordHighlights(data.games, data.assets);
  expect(result.highlights.find((h) => h.key === 'unit')!.detail).toContain('30경기 중 30경기');
  expect(result.highlights.some((h) => h.key === 'trait')).toBe(false);
});
it('uses at most 30 matches and does not compare incomplete windows', () => {
  const data = demoPlayer();
  expect(recordHighlights([...data.games, ...data.games]).count).toBe(30);
  expect(recordHighlights(data.games.slice(0, 20)).highlights.some((h) => h.key === 'form')).toBe(
    false,
  );
});
it('avoids level comparisons for small groups and missing levels', () => {
  const data = demoPlayer();
  data.games.forEach((g) => (g.player.level = 0));
  expect(recordHighlights(data.games).highlights.some((h) => h.key === 'level')).toBe(false);
});
it('shows fewer than three when only outcomes are available', () => {
  const data = demoPlayer();
  data.games.forEach((g) => {
    g.player.units = [];
    g.player.traits = [];
    g.player.level = 0;
    g.player.placement = 4;
  });
  expect(recordHighlights(data.games).highlights.map((h) => h.key)).toEqual(['results']);
});
