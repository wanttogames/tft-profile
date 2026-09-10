import type { Game } from '../types/riot';
import { mean } from './formAnalysis';
export function patterns(games: Game[]) {
  const traits = new Map<string, number>();
  games.forEach((g) =>
    g.player.traits
      .filter((t) => t.tier_current > 0)
      .forEach((t) => traits.set(t.name, (traits.get(t.name) || 0) + 1)),
  );
  return {
    count: games.length,
    level: mean(games.map((g) => g.player.level)),
    stars: mean(
      games
        .map((g) => mean(g.player.units.map((u) => u.tier)))
        .filter((v): v is number => v !== null),
    ),
    items: mean(
      games.map((g) =>
        g.player.units.reduce((s, u) => s + (u.itemNames?.length || u.items.length), 0),
      ),
    ),
    trait: [...traits].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  };
}
