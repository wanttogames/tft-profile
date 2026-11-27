import { Store } from './supabase';
import { syncPatchCalendar } from './patchCalendar';
import { refreshMetaStats } from './refreshMeta';
import { logError } from './diagnostics';
try {
  const url = process.env.SUPABASE_URL, secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret || new URL(url).protocol !== 'https:') throw Error('SUPABASE_URL / SUPABASE_SECRET_KEY required');
  const store = new Store(url, secret);
  await syncPatchCalendar(store);
  const result = await refreshMetaStats(store, false);
  if (result.status === 'busy') throw Error('Meta refresh busy');
  console.log('[patch-sync-complete]', result);
} catch (error) {
  logError(error, { stage: 'Official patch calendar sync / meta refresh' });
  process.exitCode = 1;
}
