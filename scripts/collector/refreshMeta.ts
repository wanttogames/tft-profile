import type { Store } from './supabase';
import { archiveSnapshotCatalog } from './trendSnapshot';
import { prepareOfficialPatch } from './officialPatch';
export interface MetaRefreshResult {
  status: 'refreshed' | 'busy';
  generation?: number;
  snapshotId?: number | null;
  current?: string | null;
  candidate?: string | null;
  sampleSize?: number;
  candidateCount?: number;
  ratio?: number;
  confirmed?: boolean;
  elapsed_ms?: number;
}
/** Refresh is not retried: a timed-out transaction may still run. */
export async function refreshMetaStats(
  store: Pick<Store, 'request'>,
  preparePatch = true,
): Promise<MetaRefreshResult> {
  const started = Date.now();
  if (preparePatch) await prepareOfficialPatch(store);
  const result = (await store.request(
    'rpc/refresh_tft_meta_stats',
    'POST',
    {},
    1,
  )) as MetaRefreshResult | null;
  if (!result || !['refreshed', 'busy'].includes(result.status))
    throw Error('Unexpected meta refresh response');
  console.log('[meta-refresh]', { ...result, elapsed: Date.now() - started });
  if (result.status === 'refreshed' && result.snapshotId && result.generation)
    await archiveSnapshotCatalog(store, result.snapshotId, result.generation);
  return result;
}
