import type { Game, Unit } from '../types/riot';
import { statistics } from './formAnalysis';
import { ANALYSIS_MATCH_COUNT, MIN_PREFERENCE_SAMPLE } from '../config/analysis';
export type PreferenceKind = 'unit' | 'item' | 'trait';
export const recentSample = (games: Game[], limit = ANALYSIS_MATCH_COUNT) =>
  [...games].sort((a, b) => b.date - a.date).slice(0, limit);
export const unitItems = (u: Unit): string[] => u.itemNames ?? u.items.map(String);
export function boardIds(g: Game, kind: PreferenceKind): string[] {
  if (kind === 'unit') return g.player.units.map((u) => u.character_id);
  if (kind === 'item') return g.player.units.flatMap(unitItems);
  return g.player.traits.filter((t) => t.tier_current > 0).map((t) => t.name);
}
export function preferenceAnalysis(
  input: Game[],
  kind: PreferenceKind,
  limit = ANALYSIS_MATCH_COUNT,
) {
  const games = recentSample(input, limit);
  // Empty boards are unavailable for unit/item observations. Empty active traits aren't invented.
  const available = games.filter((g) =>
    kind === 'trait' ? boardIds(g, kind).length > 0 : g.player.units.length > 0,
  );
  const groups = new Map<string, { id: string; set: number; games: Game[]; copies: number }>();
  for (const g of available) {
    const counts = new Map<string, number>();
    for (const id of boardIds(g, kind)) counts.set(id, (counts.get(id) ?? 0) + 1);
    for (const [id, copies] of counts) {
      const key = `${g.set}:${id}`;
      const group = groups.get(key) ?? { id, set: g.set, games: [], copies: 0 };
      group.games.push(g);
      group.copies += copies;
      groups.set(key, group);
    }
  }
  const rows = [...groups.values()]
    .map(({ id, set, games: sample, copies }) => ({
      id,
      set,
      count: sample.length,
      copies,
      rate: sample.length / available.length,
      average: statistics(sample).average!,
      top4: statistics(sample).top4!,
      enough: sample.length >= MIN_PREFERENCE_SAMPLE,
    }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  return {
    kind,
    total: games.length,
    available: available.length,
    missing: games.length - available.length,
    rows,
    top: rows.slice(0, 10),
  };
}
export type PreferenceRow = ReturnType<typeof preferenceAnalysis>['rows'][number];
