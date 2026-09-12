import { logError } from './diagnostics';
import { config } from './config';
import { RiotClient } from './riot';
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
  logError(error, { stage: 'Collector setup / player collection / existing match lookup' });
  process.exitCode = 1;
}
