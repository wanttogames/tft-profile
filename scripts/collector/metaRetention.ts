import type { Store } from './supabase';
import { refreshMetaStats, type MetaRefreshResult } from './refreshMeta';
import { logError } from './diagnostics';
import { collectorExitCode } from './collectMatches';
type Client = Pick<Store, 'request'>;
export function sizeStatus(bytes: number) {
  return {
    currentMB: +(bytes / 1024 / 1024).toFixed(2),
    warning: bytes >= 350 * 1024 ** 2,
    critical: bytes >= 400 * 1024 ** 2,
  };
}
async function logSize(store: Client, phase: string) {
  try {
    const value = (await store.request('rpc/tft_meta_db_size', 'POST', {}, 1)) as { bytes: number };
    if (!Number.isFinite(value?.bytes) || value.bytes < 0) throw Error('Invalid DB size response');
    const status = sizeStatus(value.bytes);
    console.log('[db-size]', { phase, ...status });
    if (status.critical)
      console.warn('[db-size][critical] Database size exceeds 400MiB; retention remains 7 days');
    else if (status.warning) console.warn('[db-size][warning] Database size exceeds 350MiB');
  } catch (error) {
    logError(error, { stage: 'DB size (non-fatal)' });
  }
}
/** Successful collection only. Each cleanup RPC is its own short transaction.
 * A refresh generation binds cleanup to verified aggregates and rejects concurrent/stale runs. */
export async function maintainMeta(
  store: Client,
  result: Parameters<typeof collectorExitCode>[0],
): Promise<boolean> {
  await logSize(store, 'before');
  try {
    if (collectorExitCode(result)) {
      console.warn('[meta-refresh] skipped: collection failed; cleanup skipped');
      return false;
    }
    let refreshed: MetaRefreshResult;
    try {
      refreshed = await refreshMetaStats(store);
      console.log('[patch]', refreshed);
      if (refreshed.status === 'busy') return true; // Never clean after another run's refresh.
      if (!Number.isSafeInteger(refreshed.generation))
        throw Error('Missing verified aggregate generation');
    } catch (error) {
      logError(error, { stage: 'Meta refresh failed; cleanup skipped; saved matches preserved' });
      return false;
    }
    try {
      // Bounded work per invocation; remaining rows are handled next successful batch.
      for (let batch = 0; batch < 100; batch++) {
        const cleaned = (await store.request(
          'rpc/cleanup_tft_meta_data',
          'POST',
          {
            expected_generation: refreshed.generation,
            batch_size: 200,
          },
          1,
        )) as { status: string; deletedMatches?: number };
        console.log('[cleanup]', cleaned);
        if (
          cleaned?.status === 'disabled' ||
          cleaned?.status === 'busy' ||
          cleaned?.status === 'awaiting-matches'
        )
          return true;
        if (cleaned?.status !== 'cleaned' || !Number.isInteger(cleaned.deletedMatches))
          throw Error('Invalid cleanup response');
        if (cleaned.deletedMatches! < 200) return true;
      }
      console.warn('[cleanup] batch budget reached; remaining eligible rows deferred');
      return true;
    } catch (error) {
      logError(error, { stage: 'Cleanup failed; saved matches and aggregate preserved' });
      return false;
    }
  } finally {
    await logSize(store, 'after');
  }
}
