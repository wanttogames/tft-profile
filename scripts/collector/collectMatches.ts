import { fatal, safeError, type RiotClient } from './riot';
import type { Store } from './supabase';
import type { Player } from './collectPlayers';
import { saveMatch } from './saveMatch';
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
  };
  for (const player of players) {
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
      if (fatal(error)) throw error;
      result['Failed player scans']++;
      console.warn(`Player scan failed: ${safeError(error)}`);
    }
  }
  result['Candidate matches'] = ids.size;
  // Includes incomplete legacy rows: never re-fetch a detail whose ID already exists.
  const existing = await store.existing([...ids]);
  result['Existing matches'] = existing.size;
  const fresh = [...ids].filter((id) => !existing.has(id));
  result['New matches'] = fresh.length;
  for (const id of fresh) {
    try {
      const status = await saveMatch(
        store,
        await riot.get(`/tft/match/v1/matches/${id}`),
        id,
        observed,
      );
      if (status === 'saved') result['Saved matches']++;
      else if (status === 'existing') result['Existing matches']++;
      else result['Skipped matches']++;
    } catch (error) {
      if (fatal(error)) throw error;
      result['Failed matches']++;
      console.warn(`Match ${id} failed: ${safeError(error)}`);
    }
  }
  return result;
}
