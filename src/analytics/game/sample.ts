import type { Game } from '../../types/riot';
export function sample(input: Game[]) {
  const found = new Map<string, Game>();
  for (const game of [...input].sort((a, b) => b.date - a.date)) {
    if (!found.has(game.id)) found.set(game.id, game);
  }
  return [...found.values()].slice(0, 50);
}
export const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
export const avg = (a: number[]) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : null);
export const valid = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n >= 0;
