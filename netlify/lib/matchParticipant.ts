import type { Participant, Trait, Unit } from '../../src/types/riot';

/** A safe field path, never a raw response, token or player identifier. */
export class ParticipantParseError extends Error {
  constructor(public field: string) {
    super(`Riot 참가자 데이터 형식을 확인할 수 없습니다. (${field})`);
  }
}
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
function number(value: unknown, path: string, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || (integer && !Number.isInteger(value)))
    throw new ParticipantParseError(path);
  return value;
}
function string(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.length) throw new ParticipantParseError(path);
  return value;
}
function parseUnit(value: unknown, index: number): Unit {
  const path = `units[${index}]`;
  if (!object(value)) throw new ParticipantParseError(path);
  // Observed Match-V1 data_version 5 responses contain itemNames and OMIT items.
  // These are alternative representations, not two required copies of equipment.
  // Missing/null optional representation is accepted only when the other exists.
  if (value.items != null && !Array.isArray(value.items))
    throw new ParticipantParseError(`${path}.items`);
  if (value.itemNames != null && !Array.isArray(value.itemNames))
    throw new ParticipantParseError(`${path}.itemNames`);
  if (!Array.isArray(value.items) && !Array.isArray(value.itemNames))
    throw new ParticipantParseError(`${path}.items/itemNames`);
  const items =
    (value.items as unknown[] | null | undefined)?.map((v, i) =>
      number(v, `${path}.items[${i}]`, true),
    ) ?? [];
  const itemNames = (value.itemNames as unknown[] | null | undefined)?.map((v, i) =>
    string(v, `${path}.itemNames[${i}]`),
  );
  const tier = number(value.tier, `${path}.tier`, true);
  if (tier < 1) throw new ParticipantParseError(`${path}.tier`);
  return {
    character_id: string(value.character_id, `${path}.character_id`),
    tier,
    rarity: number(value.rarity, `${path}.rarity`, true),
    items,
    itemNames,
  };
}
function parseTrait(value: unknown, index: number): Trait {
  const path = `traits[${index}]`;
  if (!object(value)) throw new ParticipantParseError(path);
  return {
    name: string(value.name, `${path}.name`),
    num_units: number(value.num_units, `${path}.num_units`, true),
    style: number(value.style, `${path}.style`, true),
    tier_current: number(value.tier_current, `${path}.tier_current`, true),
    tier_total: number(value.tier_total, `${path}.tier_total`, true),
  };
}
/** Match participants by PUUID value in info.participants; metadata order is irrelevant. */
export function parseParticipant(participants: unknown, puuid: string): Participant | null {
  if (!Array.isArray(participants)) throw new ParticipantParseError('info.participants');
  const value = participants.find((p) => object(p) && p.puuid === puuid);
  if (!value) return null;
  if (!Array.isArray(value.units)) throw new ParticipantParseError('units');
  if (!Array.isArray(value.traits)) throw new ParticipantParseError('traits');
  const placement = number(value.placement, 'placement', true);
  if (placement < 1 || placement > 8) throw new ParticipantParseError('placement');
  return {
    puuid,
    placement,
    level: number(value.level, 'level', true),
    last_round: number(value.last_round, 'last_round', true),
    time_eliminated: number(value.time_eliminated, 'time_eliminated'),
    units: value.units.map(parseUnit),
    traits: value.traits.map(parseTrait),
    players_eliminated: optionalCount(value.players_eliminated),
    total_damage_to_players: optionalCount(value.total_damage_to_players),
  };
}

// Optional combat counters: never turn missing/invalid data into a measured zero.
function optionalCount(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : undefined;
}
