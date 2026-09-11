import type { RiotClient } from './riot';
import type { Store } from './supabase';
export interface Player {
  puuid: string;
  current_tier: 'CHALLENGER' | 'GRANDMASTER';
  league_points: number;
  rank_observed_at: string;
}
export async function collectPlayers(riot: RiotClient, store: Store, limit: number) {
  const lists: Player[][] = [];
  for (const tier of ['CHALLENGER', 'GRANDMASTER'] as const) {
    const data = (await riot.get(
      `/tft/league/v1/${tier.toLowerCase()}?queue=RANKED_TFT`,
      true,
    )) as { entries?: unknown; queue?: string };
    if (data.queue !== 'RANKED_TFT' || !Array.isArray(data.entries))
      throw new Error('Invalid League response');
    lists.push(
      data.entries
        .map((entry) => {
          if (
            typeof entry.puuid !== 'string' ||
            !entry.puuid.trim() ||
            !Number.isInteger(entry.leaguePoints) ||
            entry.leaguePoints < 0
          )
            throw new Error('Invalid League entry');
          return {
            puuid: entry.puuid,
            current_tier: tier,
            league_points: entry.leaguePoints,
            rank_observed_at: new Date().toISOString(),
          };
        })
        .sort((a, b) => b.league_points - a.league_points || a.puuid.localeCompare(b.puuid)),
    );
  }
  const observed = new Map(lists.flat().map((player) => [player.puuid, player]));
  const selected = new Map<string, Player>();
  for (let i = 0; i < Math.max(...lists.map((list) => list.length)) && selected.size < limit; i++) {
    for (const list of lists)
      if (list[i] && selected.size < limit) selected.set(list[i].puuid, list[i]);
  }
  const players = [...selected.values()];
  if (players.length)
    await store.request(
      'tft_players?on_conflict=puuid',
      'POST',
      players.map((player) => ({ ...player, platform: 'kr', is_tracked: true })),
    );
  return { players, observed };
}
