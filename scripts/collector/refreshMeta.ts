import type { Store } from './supabase';
/** Once per completed batch, including zero saves: retries a previous failed refresh next run.
 * No HTTP retry for this expensive RPC: a timed-out request may still be running. */
export async function refreshMetaStats(store: Pick<Store, 'request'>) {
  const started = Date.now();
  const result = (await store.request('rpc/refresh_tft_meta_stats', 'POST', {}, 1)) as {
    status?: string;
  } | null;
  if (!result || !['refreshed', 'busy'].includes(result.status ?? ''))
    throw Error('Unexpected meta refresh response');
  console.log('[meta-refresh]', { status: result.status, elapsed: Date.now() - started });
  return result.status;
}
