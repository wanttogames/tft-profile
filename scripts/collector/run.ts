import { config } from './config';
import { RiotClient, safeError } from './riot';
import { Store } from './supabase';
import { collectPlayers } from './collectPlayers';
import { collectMatches } from './collectMatches';
try {
  const settings = config();
  const riot = new RiotClient(settings.riotKey, settings.delayMs);
  const store = new Store(settings.url, settings.secret);
  const { players, observed } = await collectPlayers(riot, store, settings.playersLimit);
  const result = await collectMatches(riot, store, players, observed, settings.matchesPerPlayer);
  for (const [name, value] of Object.entries(result)) console.log(`${name}: ${value}`);
  if (result['Failed matches'] || result['Failed player scans'] || !players.length)
    process.exitCode = 1;
} catch (error) {
  console.error(
    error instanceof Error &&
      /^(Missing environment variable:|Invalid (PLAYERS_LIMIT|MATCHES_PER_PLAYER|RIOT_REQUEST_DELAY_MS)|SUPABASE_URL must)/.test(
        error.message,
      )
      ? error.message
      : safeError(error),
  );
  process.exitCode = 1;
}
