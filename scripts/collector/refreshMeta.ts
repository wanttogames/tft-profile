import type { Store } from './supabase';
import { prepareOfficialPatch } from './officialPatch';
export interface MetaRefreshResult {
  status: 'refreshed' | 'busy';
  generation?: number;
  current?: string | null;
  candidate?: string | null;
  sampleSize?: number;
  candidateCount?: number;
  ratio?: number;
  confirmed?: boolean;
  elapsed_ms?: number;
}
/** One RPC per successful batch, without retries: a timed-out refresh may still run. */
export async function refreshMetaStats(store: Pick<Store, 'request'>): Promise<MetaRefreshResult> {
  const started = Date.now();
  await prepareOfficialPatch(store);
  const result = (await store.request(
    'rpc/refresh_tft_meta_stats',
    'POST',
    {},
    1,
  )) as MetaRefreshResult | null;
  if (!result || !['refreshed', 'busy'].includes(result.status))
    throw Error('Unexpected meta refresh response');
  console.log('[meta-refresh]', { ...result, elapsed: Date.now() - started });
  return result;
}
