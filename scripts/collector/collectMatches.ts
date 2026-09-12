import { logError, responseShape, protect, redact } from './diagnostics';
import { fatal, safeError, type RiotClient } from './riot';
import type { Store } from './supabase';
import type { Player } from './collectPlayers';
import { normalizeMatch, saveNormalizedMatch, MatchSkipped } from './saveMatch';
export async function collectMatches(
  riot: RiotClient,
  store: Store,
  players: Player[],
  observed: Map<string, Player>,
  count: number,
) {
  const ids = new Set<string>();
  const result = {
    Players: players.length,
    'Candidate matches': 0,
    'Existing matches': 0,
    'New matches': 0,
    'Saved matches': 0,
    'Failed matches': 0,
    'Skipped matches': 0,
    'Failed player scans': 0,
    'Patch unresolved matches': 0,
  };
  for (const player of players) {
    protect(player.puuid);
    try {
      const list = await riot.get(
        `/tft/match/v1/matches/by-puuid/${encodeURIComponent(player.puuid)}/ids?start=0&count=${count}`,
      );
      if (!Array.isArray(list) || list.some((id) => typeof id !== 'string' || !/^KR_\d+$/.test(id)))
        throw new Error('Invalid match IDs');
      for (const id of list) ids.add(id);
      await store.request(`tft_players?puuid=eq.${encodeURIComponent(player.puuid)}`, 'PATCH', {
        last_scanned_at: new Date().toISOString(),
      });
    } catch (error) {
      logError(error, { stage: 'Player ID scan / last_scanned_at update' });
      if (fatal(error)) throw error;
      result['Failed player scans']++;
    }
  }
  result['Candidate matches'] = ids.size;
  // Includes incomplete legacy rows: never re-fetch a detail whose ID already exists.
  const existing = await store.existing([...ids]);
  result['Existing matches'] = existing.size;
  const fresh = [...ids].filter((id) => !existing.has(id));
  result['New matches'] = fresh.length;
  let summarized = false;
  let versionLogged = false;
  let patchWarningLogged = false;
  const failures: Record<string, number> = {};
  for (const id of fresh) {
    let raw: unknown;
    let stage = 'Riot Match Detail request';
    try {
      raw = await riot.get(`/tft/match/v1/matches/${id}`);
      responseShape(raw); // Register private identity values before any DB/validation error logging.
      if (!versionLogged) {
        const version = (raw as { info?: { game_version?: unknown } } | null)?.info?.game_version;
        console.log(
          '[GAME VERSION]',
          redact({ matchId: id, raw: typeof version === 'string' ? version : null }),
        );
        versionLogged = true;
      }
      stage = 'Match schema/field validation';
      const payload = normalizeMatch(raw, id, observed);
      if (payload.queue_id === 1100 && payload.patch === null && !patchWarningLogged) {
        console.warn(
          '[PATCH WARNING]',
          redact({
            matchId: id,
            gameVersion: payload.game_version,
            reason: 'Unable to extract patch; subsequent warnings suppressed for this run',
          }),
        );
        patchWarningLogged = true;
      }
      stage = 'Supabase atomic save';
      const status = await saveNormalizedMatch(store, payload);
      if (status === 'saved') {
        result['Saved matches']++;
        if (payload.patch === null) result['Patch unresolved matches']++;
      } else if (status === 'existing') result['Existing matches']++;
      else result['Skipped matches']++;
    } catch (error) {
      if (error instanceof MatchSkipped) {
        result['Skipped matches']++;
        console.log('[MATCH SKIPPED]', redact(error.context));
        continue;
      }
      result['Failed matches']++;
      logError(error, { matchId: id, stage });
      const name = error instanceof Error ? error.name + ': ' + error.message : String(error);
      failures[name] = (failures[name] ?? 0) + 1;
      if (!summarized) {
        console.error(
          '[FIRST FAILED MATCH STRUCTURE]',
          JSON.stringify({
            matchId: id,
            response:
              raw === undefined
                ? 'Unavailable: request/status/JSON stage failed'
                : responseShape(raw),
          }),
        );
        summarized = true;
      }
    }
  }
  for (const [reason, count] of Object.entries(failures))
    console.error('[FAILURE SUMMARY]', safeError(new Error(reason)), `count=${count}`);
  return result;
}

// Expected exclusions are successful processing; infrastructure/scan failures remain failures.
export function collectorExitCode(result: {
  'Failed matches': number;
  'Failed player scans': number;
  Players: number;
}): 0 | 1 {
  return result['Failed matches'] > 0 || result['Failed player scans'] > 0 || result.Players === 0
    ? 1
    : 0;
}
