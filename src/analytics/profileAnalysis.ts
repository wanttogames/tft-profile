import type { Game } from '../types/riot';
import { mean, statistics } from './formAnalysis';
import { boardIds, preferenceAnalysis, recentSample } from './preferences';
import { deckDiversity } from './deckDiversity';
import type { AssetMap } from '../static-data/catalog';
import { playerStyle } from './playerScores';
const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
export function signatureDiversity(games: Game[], kind: 'unit' | 'trait'): number | null {
  const signatures = games
    .map((g) => `${g.set}:${[...new Set(boardIds(g, kind))].sort().join('|')}`)
    .filter((s) => !s.endsWith(':'));
  if (signatures.length < 5) return null;
  const counts = new Map<string, number>();
  signatures.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  return clamp(
    (-[...counts.values()].reduce(
      (s, c) => s + (c / signatures.length) * Math.log(c / signatures.length),
      0,
    ) /
      Math.log(signatures.length)) *
      100,
  );
}
export function boardFlexibility(games: Game[]): number | null {
  const changes: number[] = [];
  for (let i = 1; i < games.length; i++) {
    const a = games[i - 1]!,
      b = games[i]!;
    if (a.set !== b.set) continue;
    const values: number[] = [];
    for (const kind of ['unit', 'trait'] as const) {
      const x = new Set(boardIds(a, kind)),
        y = new Set(boardIds(b, kind));
      if (!x.size || !y.size) continue;
      values.push(1 - [...x].filter((id) => y.has(id)).length / new Set([...x, ...y]).size);
    }
    if (values.length === 2) changes.push(mean(values)!);
  }
  return changes.length >= 4 ? clamp(mean(changes)! * 100) : null;
}
export function profileMetrics(input: Game[]) {
  const games = recentSample(input),
    stats = statistics(games);
  const units = preferenceAnalysis(games, 'unit'),
    traits = preferenceAnalysis(games, 'trait'),
    deck = deckDiversity(games);
  return {
    games,
    stats,
    units,
    traits,
    deck,
    variance:
      stats.average === null
        ? null
        : mean(games.map((g) => (g.player.placement - stats.average!) ** 2)),
    top2: games.length ? games.filter((g) => g.player.placement <= 2).length / games.length : null,
    bottom2: games.length
      ? games.filter((g) => g.player.placement >= 7).length / games.length
      : null,
    level: mean(games.map((g) => g.player.level)),
    round: mean(games.map((g) => g.player.last_round)),
    late: games.length ? games.filter((g) => g.player.level >= 9).length / games.length : 0,
    unitDiversity: signatureDiversity(games, 'unit'),
    traitDiversity: signatureDiversity(games, 'trait'),
    flexibility: boardFlexibility(games),
    unitConcentration: units.rows[0]?.rate ?? null,
    traitConcentration: traits.rows[0]?.rate ?? null,
    deckConcentration: deck.valid ? (deck.top[0]?.[1] ?? 0) / deck.valid : null,
  };
}
/** Ordered, multi-metric descriptive rules. Thresholds are product heuristics, not population percentiles. */
export function playerProfile(input: Game[], assets: AssetMap = {}) {
  const m = profileMetrics(input),
    n = m.games.length;
  const { name, reason } = playerStyle(m.games, assets);
  const comment =
    n < 20
      ? reason
      : `최근 ${n}경기 평균 ${m.stats.average!.toFixed(2)}위, TOP4 ${Math.round(m.stats.top4! * 100)}%. ${reason}`;
  // Most frequently fielded item-equipped unit per match is a proxy, not a verified carry.
  const coreGames = m.games.map((g) => ({
    ...g,
    player: {
      ...g.player,
      units: g.player.units.filter((u) => (u.itemNames ?? u.items).length >= 2),
    },
  }));
  return {
    ...m,
    name,
    reason,
    comment,
    core: preferenceAnalysis(coreGames, 'unit').top.slice(0, 3),
  };
}
export function extremeComparison(input: Game[]) {
  const games = recentSample(input);
  const group = (selected: Game[]) => ({
    count: selected.length,
    level: mean(selected.map((g) => g.player.level)),
    units: preferenceAnalysis(selected, 'unit').top.slice(0, 3),
    traits: preferenceAnalysis(selected, 'trait').top.slice(0, 3),
  });
  const high = group(games.filter((g) => g.player.placement <= 2)),
    low = group(games.filter((g) => g.player.placement >= 7));
  const enough = high.count >= 3 && low.count >= 3;
  return { high, low, enough, levelDelta: enough ? high.level! - low.level! : null };
}
