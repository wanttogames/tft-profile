import type { Game } from '../types/riot';
/** Proxy for board composition: the two most represented active traits; never a named meta deck. */
export function deckKey(g: Game): string | null {
  const traits = g.player.traits
    .filter((t) => t.tier_current > 0)
    .sort((a, b) => b.num_units - a.num_units || a.name.localeCompare(b.name))
    .slice(0, 2)
    .map((t) => t.name)
    .sort();
  return traits.length ? `${g.set}:${traits.join('|')}` : null;
}
export function deckDiversity(games: Game[]) {
  const counts = new Map<string, number>();
  games.forEach((g) => {
    const k = deckKey(g);
    if (k) counts.set(k, (counts.get(k) || 0) + 1);
  });
  const n = [...counts.values()].reduce((a, b) => a + b, 0);
  // Shannon entropy / log(sample count). One repeated signature -> 0; every board unique -> 100.
  const score =
    n >= 5
      ? Math.max(
          0,
          Math.round(
            (-[...counts.values()].reduce((s, c) => s + (c / n) * Math.log(c / n), 0) /
              Math.log(n)) *
              100,
          ),
        )
      : null;
  return { score, valid: n, unique: counts.size, top: [...counts].sort((a, b) => b[1] - a[1]) };
}
