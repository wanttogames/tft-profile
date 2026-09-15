import type { ApiEnv } from '../env';
import type { Match } from '../../src/types/riot';
import { TTL } from './profileCache';
const table = 'tft_profile_match_cache';
/** Store all participants, but omit names, cosmetics, missions and unused counters. */
export function compactMatch(match: Match): Match {
  return {
    metadata: { match_id: match.metadata.match_id, participants: match.metadata.participants },
    info: {
      game_datetime: match.info.game_datetime,
      game_length: match.info.game_length,
      game_version: match.info.game_version,
      tft_set_number: match.info.tft_set_number,
      queue_id: match.info.queue_id,
      participants: match.info.participants.map((p) => ({
        puuid: p.puuid,
        placement: p.placement,
        level: p.level,
        last_round: p.last_round,
        time_eliminated: p.time_eliminated,
        units: p.units.map((u) => ({
          character_id: u.character_id,
          tier: u.tier,
          rarity: u.rarity,
          itemNames: u.itemNames,
          items: u.items,
        })),
        traits: p.traits.map((t) => ({
          name: t.name,
          num_units: t.num_units,
          style: t.style,
          tier_current: t.tier_current,
          tier_total: t.tier_total,
        })),
      })),
    },
  };
}
async function query(env: ApiEnv, params: string, rows?: unknown) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new Error('cache unavailable');
  const secret = env.SUPABASE_SECRET_KEY;
  const r = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?${params}`, {
    method: rows ? 'POST' : 'GET',
    headers: {
      apikey: secret,
      ...(secret.startsWith('eyJ') ? { Authorization: `Bearer ${secret}` } : {}),
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: rows ? JSON.stringify(rows) : undefined,
    signal: AbortSignal.timeout(4000),
  });
  if (!r.ok) throw new Error(`cache HTTP ${r.status}`);
  return rows ? null : r.json();
}
export async function readMatches(env: ApiEnv, ids: string[]): Promise<Map<string, Match>> {
  const result = new Map<string, Match>();
  if (!ids.length) return result;
  try {
    const params = new URLSearchParams({
      select: 'match_id,payload,expires_at',
      match_id: `in.(${ids.map((id) => '"' + id.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',')})`,
      expires_at: `gt.${new Date().toISOString()}`,
    });
    const rows = await query(env, params.toString());
    if (!Array.isArray(rows)) throw new Error('cache shape');
    for (const row of rows)
      if (
        ids.includes(row.match_id) &&
        Date.parse(row.expires_at) > Date.now() &&
        row.payload?.metadata?.match_id === row.match_id &&
        Array.isArray(row.payload?.info?.participants) &&
        Number.isFinite(row.payload.info.game_datetime) &&
        Number.isFinite(row.payload.info.game_length) &&
        typeof row.payload.info.game_version === 'string' &&
        Number.isInteger(row.payload.info.tft_set_number) &&
        Number.isInteger(row.payload.info.queue_id)
      )
        result.set(row.match_id, row.payload);
  } catch {
    console.warn('[profile-cache] read unavailable; using Riot');
  }
  return result;
}
export async function writeMatches(env: ApiEnv, matches: Match[]) {
  if (!matches.length) return;
  try {
    await query(
      env,
      'on_conflict=match_id',
      matches.map((payload) => ({
        match_id: payload.metadata.match_id,
        payload,
        expires_at: new Date(Date.now() + TTL.match).toISOString(),
      })),
    );
  } catch {
    console.warn('[profile-cache] write unavailable');
  }
}
