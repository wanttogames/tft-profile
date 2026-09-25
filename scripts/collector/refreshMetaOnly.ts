import { Store } from './supabase';
import { refreshMetaStats } from './refreshMeta';
import { logError } from './diagnostics';
// Operator repair command: no Riot requests, no collection and NO cleanup.
try {
  const url = process.env.SUPABASE_URL,
    secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret || new URL(url).protocol !== 'https:')
    throw Error('SUPABASE_URL / SUPABASE_SECRET_KEY required');
  const result = await refreshMetaStats(new Store(url, secret));
  console.log('[meta-verification]', result);
} catch (error) {
  logError(error, { stage: 'Official patch registration / meta refresh' });
  process.exitCode = 1;
}
