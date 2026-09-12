import { ValidationError, StageError } from './diagnostics';
import type { Player } from './collectPlayers';
import type { Store } from './supabase';
type Row = Record<string, unknown>;
function object(value: unknown, field: string): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ValidationError(field, 'Expected object');
  return value as Row;
}
function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new ValidationError(field, 'Expected non-empty string');
  return value;
}
function integer(value: unknown, field: string, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max)
    throw new ValidationError(
      field,
      `Expected integer in range ${min}..${max}; received ${typeof value}`,
    );
  return value as number;
}
function optional(value: unknown, field: string) {
  return value == null ? null : integer(value, field);
}
function array(value: unknown, field: string, optional = false): unknown[] {
  if (optional && value == null) return [];
  if (!Array.isArray(value)) throw new ValidationError(field, 'Expected array');
  return value;
}
// Version is opaque API text. Extract a patch candidate, never reject its format.
// Prefer an explicit Version label over unrelated dotted numbers (e.g. OS version).
// Unlabelled, ambiguous candidates return null rather than guessing a patch.
export function patchFromVersion(value: string): string | null {
  const labelled = [...value.matchAll(/\bVersion\s+(\d{1,2})\.(\d{1,2})(?!\d)/gi)];
  const matches = labelled.length
    ? labelled
    : [...value.matchAll(/(?<![\w.])(\d{1,2})\.(\d{1,2})(?!\d)/g)];
  const candidates = new Set(matches.map((match) => `${Number(match[1])}.${Number(match[2])}`));
  return candidates.size === 1 ? [...candidates][0]! : null;
}
export class MatchSkipped extends StageError {
  constructor(context: Record<string, unknown>) {
    super('MATCH SKIPPED', context);
  }
}
export function normalizeMatch(raw: unknown, id: string, observed = new Map<string, Player>()) {
  const root = object(raw, 'root'),
    info = object(root.info, 'info');
  if (object(root.metadata, 'metadata').match_id !== id)
    throw new ValidationError('metadata.match_id', 'Does not match requested match ID');
  const version = text(info.game_version, 'info.game_version');
  const participants = array(info.participants, 'info.participants').map((value, index) => {
    const field = `info.participants[${index}]`;
    const p = object(value, field),
      puuid = text(p.puuid, `${field}.puuid`),
      rank = observed.get(puuid);
    return {
      puuid,
      placement: integer(p.placement, `${field}.placement`, 1, 8),
      level: integer(p.level, `${field}.level`, 1),
      last_round: integer(p.last_round, `${field}.last_round`),
      players_eliminated: optional(p.players_eliminated, `${field}.players_eliminated`),
      total_damage_to_players: optional(
        p.total_damage_to_players,
        `${field}.total_damage_to_players`,
      ),
      tier_at_collection: rank?.current_tier ?? null,
      league_points_at_collection: rank?.league_points ?? null,
      rank_observed_at: rank?.rank_observed_at ?? null,
      units: array(p.units, `${field}.units`, true).map((value, index) => {
        const unitField = `${field}.units[${index}]`;
        const u = object(value, unitField);
        return {
          character_id: text(u.character_id, `${unitField}.character_id`),
          tier: integer(u.tier, `${unitField}.tier`, 1),
          rarity: integer(u.rarity, `${unitField}.rarity`, -32768, 32767),
          itemNames: array(u.itemNames ?? u.item_names, `${unitField}.itemNames`, true).map(
            (item, index) => text(item, `${unitField}.itemNames[${index}]`),
          ),
        };
      }),
      traits: array(p.traits, `${field}.traits`, true).map((value, index) => {
        const traitField = `${field}.traits[${index}]`;
        const t = object(value, traitField);
        return {
          name: text(t.name, `${traitField}.name`),
          num_units: integer(t.num_units, `${traitField}.num_units`),
          tier_current: integer(t.tier_current, `${traitField}.tier_current`),
          tier_total: integer(t.tier_total, `${traitField}.tier_total`),
        };
      }),
    };
  });
  const payload = {
    match_id: id,
    game_datetime: integer(info.game_datetime, 'info.game_datetime'),
    game_version: version,
    patch: patchFromVersion(version),
    queue_id: integer(info.queue_id, 'info.queue_id', 1),
    set_number:
      info.tft_set_number == null ? null : integer(info.tft_set_number, 'info.tft_set_number', 1),
    participants,
  };
  const distinctPuuidCount = new Set(participants.map((p) => p.puuid)).size;
  if (participants.length !== 8 || distinctPuuidCount !== 8) {
    throw new MatchSkipped({
      matchId: id,
      queueId: payload.queue_id,
      participantCount: participants.length,
      distinctPuuidCount,
      reason: 'Expected eight distinct participants',
    });
  }
  return payload;
}
export async function saveMatch(
  store: Store,
  raw: unknown,
  id: string,
  observed: Map<string, Player>,
) {
  return saveNormalizedMatch(store, normalizeMatch(raw, id, observed));
}
export async function saveNormalizedMatch(
  store: Store,
  payload: ReturnType<typeof normalizeMatch>,
) {
  if (payload.queue_id !== 1100) return 'skipped' as const;
  const saved = await store.request('rpc/tft_save_match', 'POST', { payload });
  if (typeof saved !== 'boolean')
    throw new StageError('SUPABASE ERROR', {
      table: 'rpc/tft_save_match',
      stage: 'Supabase RPC result validation',
      message: 'Expected boolean result',
    });
  return saved ? ('saved' as const) : ('existing' as const);
}
