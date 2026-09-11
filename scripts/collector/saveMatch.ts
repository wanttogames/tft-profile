import type { Player } from './collectPlayers';
import type { Store } from './supabase';
type Row = Record<string, unknown>;
function object(value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid object');
  return value as Row;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid string');
  return value;
}
function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max)
    throw new Error('Invalid integer');
  return value as number;
}
function optional(value: unknown) {
  return value == null ? null : integer(value);
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error('Missing array');
  return value;
}
export function patchFromVersion(value: string) {
  const match = /^(?:Version\s+)?(\d+)\.(\d+)\./i.exec(value.trim());
  if (!match) throw new Error('Unrecognized game_version');
  return `${match[1]}.${match[2]}`;
}
export function normalizeMatch(raw: unknown, id: string, observed = new Map<string, Player>()) {
  const root = object(raw),
    info = object(root.info);
  if (object(root.metadata).match_id !== id) throw new Error('Match ID mismatch');
  const version = text(info.game_version);
  const participants = array(info.participants).map((value) => {
    const p = object(value),
      puuid = text(p.puuid),
      rank = observed.get(puuid);
    return {
      puuid,
      placement: integer(p.placement, 1, 8),
      level: integer(p.level, 1),
      last_round: integer(p.last_round),
      players_eliminated: optional(p.players_eliminated),
      total_damage_to_players: optional(p.total_damage_to_players),
      tier_at_collection: rank?.current_tier ?? null,
      league_points_at_collection: rank?.league_points ?? null,
      rank_observed_at: rank?.rank_observed_at ?? null,
      units: array(p.units).map((value) => {
        const u = object(value);
        return {
          character_id: text(u.character_id),
          tier: integer(u.tier, 1),
          rarity: integer(u.rarity, -32768, 32767),
          itemNames: array(u.itemNames).map(text),
        };
      }),
      traits: array(p.traits).map((value) => {
        const t = object(value);
        return {
          name: text(t.name),
          num_units: integer(t.num_units),
          tier_current: integer(t.tier_current),
          tier_total: integer(t.tier_total),
        };
      }),
    };
  });
  if (participants.length !== 8 || new Set(participants.map((p) => p.puuid)).size !== 8)
    throw new Error('Incomplete ranked participant list');
  return {
    match_id: id,
    game_datetime: integer(info.game_datetime),
    game_version: version,
    patch: patchFromVersion(version),
    queue_id: integer(info.queue_id, 1),
    set_number: info.tft_set_number == null ? null : integer(info.tft_set_number, 1),
    participants,
  };
}
export async function saveMatch(
  store: Store,
  raw: unknown,
  id: string,
  observed: Map<string, Player>,
) {
  const payload = normalizeMatch(raw, id, observed);
  if (payload.queue_id !== 1100) return 'skipped' as const;
  const saved = await store.request('rpc/tft_save_match', 'POST', { payload });
  if (typeof saved !== 'boolean') throw new Error('Invalid save response');
  return saved ? ('saved' as const) : ('existing' as const);
}
