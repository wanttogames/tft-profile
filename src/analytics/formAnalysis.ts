import { ANALYSIS_MATCH_COUNT, FORM_WINDOW } from '../config/analysis';
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
/** Input is newest first: all 50 games contribute to the 25 vs 25 trend. */
export function formAnalysis(games: Game[]) {
  const recent = mean(games.slice(0, FORM_WINDOW).map((g) => g.player.placement));
  const previous =
    games.length >= ANALYSIS_MATCH_COUNT
      ? mean(games.slice(FORM_WINDOW, ANALYSIS_MATCH_COUNT).map((g) => g.player.placement))
      : null;
  return {
    five: mean(games.slice(0, 5).map((g) => g.player.placement)),
    ten: mean(games.slice(0, 10).map((g) => g.player.placement)),
    recent,
    previous,
    delta: previous !== null && recent !== null ? previous - recent : null,
  };
}
