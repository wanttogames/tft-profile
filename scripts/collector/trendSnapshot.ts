import type { Store } from './supabase';
import { logError } from './diagnostics';
import { loadMetaAssets } from '../../server/lib/staticData';
import { lookupAsset } from '../../src/static-data/catalog';
import { rankTiers, TIER_VERSION, tierMinimum } from '../../src/meta/tierList';
import {
  snapshotMetaRow,
  TREND_KINDS,
  type Snapshot,
  type SnapshotEntity,
  type SnapshotCatalog,
} from '../../src/meta/trends';

/** Numeric history is already committed. A catalog outage can be retried on the next refresh. */
export async function archiveSnapshotCatalog(
  store: Pick<Store, 'request'>,
  id: number,
  generation: number,
) {
  try {
    const params = new URLSearchParams({ snapshot_id: `eq.${id}` });
    const [snapshot] = (await store.request(
      'tft_meta_snapshot?' + params,
      'GET',
      undefined,
      1,
    )) as Snapshot[];
    if (
      !snapshot ||
      snapshot.aggregation_generation !== generation ||
      snapshot.scoring_version !== TIER_VERSION
    )
      return;
    const rows: SnapshotEntity[] = [];
    for (let offset = 0; offset < 10000; offset += 500) {
      const batch = (await store.request(
        'tft_meta_snapshot_entity?' +
          new URLSearchParams({
            snapshot_id: `eq.${id}`,
            order: 'kind.asc,entity_id.asc',
            offset: String(offset),
            limit: '500',
          }),
        'GET',
        undefined,
        1,
      )) as SnapshotEntity[];
      if (!Array.isArray(batch)) throw Error('Invalid snapshot entities');
      rows.push(...batch);
      if (batch.length < 500) break;
    }
    if (!rows.length || rows.length >= 10000) return;
    const requests = rows.map((row) => ({
      kind: row.kind === 'champion' ? ('unit' as const) : row.kind,
      id: row.entity_id,
      set: row.kind === 'item' ? undefined : snapshot.set_number,
    }));
    const assets = await loadMetaAssets(requests, process.env.TFT_STATIC_VERSION, true);
    const minimum = tierMinimum(Number(process.env.MIN_SAMPLE_SIZE ?? 50));
    if (!Number.isInteger(minimum) || minimum > 1000000) return;
    const entries = TREND_KINDS.flatMap((kind) =>
      rankTiers(
        kind,
        rows.filter((row) => row.kind === kind).map(snapshotMetaRow),
        assets,
        minimum,
      ).map((row) => {
        const source = lookupAsset(assets, kind === 'champion' ? 'unit' : kind, row.id);
        const asset = source && {
          name: source.name,
          image: source.image,
          cost: source.cost,
          tierItemType: source.tierItemType,
        };
        return {
          kind,
          entity_id: row.id,
          catalog: {
            asset,
            group: row.group,
            tier: row.tier,
            score: row.score,
            confidence: row.confidence,
            minimum,
          } satisfies SnapshotCatalog,
        };
      }),
    );
    await store.request(
      'rpc/seal_tft_meta_snapshot_metadata',
      'POST',
      {
        target_id: id,
        expected_generation: generation,
        expected_scoring_version: TIER_VERSION,
        entries,
      },
      1,
    );
  } catch (error) {
    logError(error, { stage: 'Meta snapshot catalog (summary already saved)' });
  }
}
