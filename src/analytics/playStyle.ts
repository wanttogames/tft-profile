import type { Game } from '../types/riot';
export const styleLabels = ['리롤형', 'Fast 8형', 'Fast 9형', '기타'] as const;
/** End-board heuristic ONLY. Timing/economy/streaks cannot be inferred from final level. */
export function classifyStyle(game: Game): (typeof styleLabels)[number] {
  const p = game.player;
  if (p.units.some((u) => u.tier === 3) && p.level <= 8) return '리롤형';
  if (p.level >= 9) return 'Fast 9형';
  if (p.level === 8) return 'Fast 8형';
  return '기타';
}
export function playStyle(games: Game[]) {
  if (games.length < 5) return [];
  return styleLabels.map((label) => ({
    label,
    count: games.filter((g) => classifyStyle(g) === label).length,
    percent: (games.filter((g) => classifyStyle(g) === label).length / games.length) * 100,
  }));
}
