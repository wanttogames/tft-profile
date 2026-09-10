import type { Game } from '../types/riot';
export const mean = (values: number[]): number | null =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
export function statistics(games: Game[]) {
  const p = games.map((g) => g.player.placement);
  const n = p.length;
  return {
    count: n,
    average: mean(p),
    top4: n ? p.filter((x) => x <= 4).length / n : null,
    win: n ? p.filter((x) => x === 1).length / n : null,
  };
}
/** Input is newest first. Only compare two COMPLETE ten-game windows. Positive delta is improvement. */
export function formAnalysis(games: Game[]) {
  const recent = mean(games.slice(0, 10).map((g) => g.player.placement));
  const previous =
    games.length >= 20 ? mean(games.slice(10, 20).map((g) => g.player.placement)) : null;
  return {
    five: mean(games.slice(0, 5).map((g) => g.player.placement)),
    recent,
    previous,
    delta: previous !== null && recent !== null ? previous - recent : null,
  };
}
