import type { ApiEnv } from '../env';
import { loadMetaAssets, type AssetRequest } from '../lib/staticData';
import type { MetaKind } from '../../src/types/meta';
import { assetKey } from '../../src/static-data/catalog';
import {
  rankTiers,
  tierMinimum,
  TIER_VERSION,
  GROUP_LABELS,
  type TierRow,
} from '../../src/meta/tierList';
import {
  compareSnapshots,
  snapshotMetaRow,
  patchSnapshots,
  TREND_KINDS,
  type Snapshot,
  type SnapshotEntity,
} from '../../src/meta/trends';

type Mode = 'history' | 'trends' | 'entity';
const cache = new Map<string, { at: number; data: unknown }>();
const pending = new Map<string, Promise<unknown>>();
const patchPattern = /^\d{1,3}\.\d{1,3}$/;
const entityPattern = /^[a-z0-9_.:-]{1,120}$/i;
const response = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': status === 200 ? 'public,max-age=60' : 'no-store' },
  });

class MissingSchema extends Error {}

export default async function trends(request: Request, env: ApiEnv, mode: Mode) {
  if (request.method !== 'GET') return response({ message: 'GET 요청만 지원합니다.' }, 405);
  const q = new URL(request.url).searchParams;
  const kind = (q.get('kind') ?? 'all') as MetaKind | 'all';
  const set = q.has('set') ? Number(q.get('set')) : undefined;
  const fromPatch = q.get('fromPatch'),
    toPatch = q.get('toPatch');
  const entities = [...new Set(q.getAll('entityId'))];
  const page = Number(q.get('page') ?? '0'),
    limit = Number(q.get('limit') ?? '30');
  const sort = q.get('sort') ?? 'improvement';
  const group = q.get('group');
  const sorts = ['improvement', 'decline', 'usage', 'top4', 'win'];
  const allowed = [
    'kind',
    'set',
    'fromPatch',
    'toPatch',
    'entityId',
    'sort',
    'group',
    'page',
    'limit',
  ];
  if (
    [...q.keys()].some((key) => !allowed.includes(key)) ||
    (kind !== 'all' && !TREND_KINDS.includes(kind)) ||
    (set !== undefined && (!Number.isInteger(set) || set < 1 || set > 999)) ||
    [fromPatch, toPatch].some((patch) => patch !== null && !patchPattern.test(patch)) ||
    !Number.isInteger(page) ||
    page < 0 ||
    page > 500 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100 ||
    !sorts.includes(sort) ||
    (group !== null &&
      (kind === 'all' || !GROUP_LABELS[kind] || !Object.hasOwn(GROUP_LABELS[kind], group))) ||
    entities.length > 3 ||
    entities.some((id) => !entityPattern.test(id)) ||
    (mode === 'entity' && (kind === 'all' || !entities.length || !set))
  )
    return response({ message: '메타 변화 조회 조건이 올바르지 않습니다.' }, 400);

  const secret = env.SUPABASE_SECRET_KEY;
  let base: string;
  try {
    const url = new URL(env.SUPABASE_URL ?? '');
    if (url.protocol !== 'https:' || !secret) throw Error();
    base = url.origin;
  } catch {
    return response({ message: '메타 이력 데이터 연결을 확인해 주세요.' }, 503);
  }
  const minimum = tierMinimum(Number(env.MIN_SAMPLE_SIZE ?? 50));
  if (!Number.isInteger(minimum) || minimum > 1000000)
    return response({ message: '최소 표본 설정을 확인해 주세요.' }, 503);
  q.sort();
  const key = `${base}|${mode}|${q}|${minimum}|${env.TFT_STATIC_VERSION}`;
  const hit = cache.get(key);
  if (hit && hit.at > Date.now()) return response(hit.data);

  async function read<T>(table: string, params: Record<string, string>) {
    const rows: T[] = [];
    for (let offset = 0; offset < 50000; offset += 500) {
      const result = await fetch(
        `${base}/rest/v1/${table}?` +
          new URLSearchParams({
            ...params,
            limit: '500',
            offset: String(offset),
          }),
        {
          headers: {
            apikey: secret!,
            ...(secret!.startsWith('eyJ') ? { Authorization: `Bearer ${secret}` } : {}),
          },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (result.status === 404) throw new MissingSchema();
      if (!result.ok) throw Error('DB 조회 실패');
      const batch: unknown = await result.json();
      if (!Array.isArray(batch)) throw Error('DB 응답 오류');
      rows.push(...batch);
      if (batch.length < 500) return rows;
    }
    throw Error('이력 조회 범위 초과');
  }

  async function load() {
    const snapshots = await read<Snapshot>('tft_meta_snapshot', {
      select: '*',
      order: 'aggregation_generation.desc',
      ...(set ? { set_number: `eq.${set}` } : {}),
    });
    const patches = patchSnapshots(snapshots);
    if (mode === 'history')
      return {
        patches,
        snapshots: snapshots.slice(page * limit, (page + 1) * limit),
        total: snapshots.length,
      };

    const to = toPatch ? patches.find((row) => row.patch === toPatch) : patches[0];
    const comparable = patches.filter((row) => row.set_number === to?.set_number);
    const from = fromPatch
      ? comparable.find((row) => row.patch === fromPatch)
      : comparable.find(
          (row) =>
            row.patch !== to?.patch &&
            row.aggregation_generation < (to?.aggregation_generation ?? 0),
        );

    async function readEntities(selected: Snapshot[], extra = {}) {
      if (!selected.length) return [];
      return read<SnapshotEntity>('tft_meta_snapshot_entity', {
        select: '*',
        snapshot_id: `in.(${selected.map((row) => row.snapshot_id).join(',')})`,
        order: 'snapshot_id.asc,kind.asc,entity_id.asc',
        ...(kind === 'all' ? {} : { kind: `eq.${kind}` }),
        ...extra,
      });
    }
    async function verifyGeneration(selected: Snapshot[]) {
      if (!selected.length) return;
      // A daily UPSERT can replace its entity rows while this request is reading.
      const confirmed = await read<Pick<Snapshot, 'snapshot_id' | 'aggregation_generation'>>(
        'tft_meta_snapshot',
        {
          select: 'snapshot_id,aggregation_generation',
          order: 'snapshot_id.asc',
          snapshot_id: `in.(${selected.map((snapshot) => snapshot.snapshot_id).join(',')})`,
        },
      );
      if (
        !selected.every((snapshot) =>
          confirmed.some(
            (value) =>
              value.snapshot_id === snapshot.snapshot_id &&
              value.aggregation_generation === snapshot.aggregation_generation,
          ),
        )
      )
        throw Error('집계 갱신 중');
    }
    if (mode === 'entity') {
      const points = comparable.slice(0, 60).reverse();
      const series = await readEntities(points, { entity_id: `in.(${entities.join(',')})` });
      await verifyGeneration(points);
      return { patches: points, rows: series, minimum };
    }
    if (
      !to ||
      !from ||
      from.snapshot_id === to.snapshot_id ||
      from.definition_version !== to.definition_version
    )
      return {
        patches,
        from: from ?? null,
        to: to ?? null,
        rows: [],
        assets: {},
        total: 0,
        minimum,
        status: 'waiting',
      };

    const chosen = [from, to];
    const rows = await readEntities(chosen);
    await verifyGeneration(chosen);
    const requests: AssetRequest[] = rows.flatMap((row) => [
      {
        kind: row.kind === 'champion' ? 'unit' : row.kind,
        id: row.entity_id,
        set: row.kind === 'item' ? undefined : to.set_number,
      },
      ...(row.details?.common_items ?? []).map((item) => ({ kind: 'item' as const, id: item.id })),
      ...(row.details?.common_champions ?? []).map((champion) => ({
        kind: 'unit' as const,
        id: champion.id,
        set: to.set_number,
      })),
    ]);
    const assets = requests.length
      ? await loadMetaAssets(requests, env.TFT_STATIC_VERSION, true)
      : {};
    const before = rows.filter((row) => row.snapshot_id === from.snapshot_id);
    const after = rows.filter((row) => row.snapshot_id === to.snapshot_id);
    function tiers(snapshot: Snapshot, selected: SnapshotEntity[]) {
      const result = new Map<string, TierRow>();
      const supported = snapshot.scoring_version === TIER_VERSION;
      const sealed = snapshot.metadata_generation === snapshot.aggregation_generation;
      for (const k of TREND_KINDS) {
        const entities = selected.filter((row) => row.kind === k);
        if (sealed) {
          for (const row of entities) {
            const catalog = row.catalog;
            if (!catalog) continue;
            const eligible = catalog.minimum === minimum;
            result.set(k + ':' + row.entity_id, {
              ...snapshotMetaRow(row),
              id: row.entity_id,
              group: catalog.group,
              confidence: catalog.confidence,
              tier: eligible ? catalog.tier : null,
              score: eligible ? catalog.score : null,
            });
          }
        } else {
          for (const rank of rankTiers(k, entities.map(snapshotMetaRow), assets, minimum))
            result.set(k + ':' + rank.id, supported ? rank : { ...rank, tier: null, score: null });
        }
      }
      return result;
    }
    const beforeRanks = tiers(from, before),
      afterRanks = tiers(to, after);
    // Prefer the name and icon archived with the compared patch.
    for (const [snapshot, entities] of [
      [from, before],
      [to, after],
    ] as const) {
      if (snapshot.metadata_generation !== snapshot.aggregation_generation) continue;
      for (const row of entities)
        if (row.catalog?.asset)
          assets[assetKey(row.kind === 'champion' ? 'unit' : row.kind, row.entity_id)] =
            row.catalog.asset;
    }
    const ranked = compareSnapshots(from, to, before, after, beforeRanks, afterRanks, minimum);
    const field =
      sort === 'decline' || sort === 'improvement'
        ? 'placement'
        : (sort as 'usage' | 'top4' | 'win');
    ranked.sort((a, b) => {
      const av = a[field],
        bv = b[field];
      if (av === null || bv === null)
        return Number(av === null) - Number(bv === null) || a.id.localeCompare(b.id);
      return (sort === 'decline' ? av - bv : bv - av) || a.id.localeCompare(b.id);
    });
    const filtered = group ? ranked.filter((row) => row.group === group) : ranked;
    const highlights =
      kind === 'all'
        ? TREND_KINDS.flatMap((k) =>
            Object.keys(GROUP_LABELS[k]).flatMap((group) => {
              const members = ranked.filter((row) => row.kind === k && row.group === group);
              const up = members
                .filter((row) => row.status === '급상승' || row.status === '상승')
                .sort((a, b) => b.placement! - a.placement!)
                .slice(0, 10);
              const down = members
                .filter((row) => row.status === '급하락' || row.status === '하락')
                .sort((a, b) => a.placement! - b.placement!)
                .slice(0, 10);
              return up.length || down.length ? [{ kind: k, group, up, down }] : [];
            }),
          )
        : [];
    const movements = ranked
      .filter(
        (row) =>
          row.previousTier?.tier &&
          row.currentTier?.tier &&
          row.previousTier.group === row.currentTier.group &&
          row.previousTier.tier !== row.currentTier.tier,
      )
      .slice(0, 20);
    return {
      patches,
      from,
      to,
      status: 'ready',
      rows: filtered.slice(page * limit, (page + 1) * limit),
      total: filtered.length,
      minimum,
      assets,
      highlights,
      movements,
    };
  }

  let job = pending.get(key);
  if (!job) {
    job = load()
      .then((data) => {
        if (cache.size >= 64) cache.delete(cache.keys().next().value!);
        cache.set(key, { at: Date.now() + 60000, data });
        return data;
      })
      .finally(() => pending.delete(key));
    pending.set(key, job);
  }
  try {
    return response(await job);
  } catch (error) {
    if (error instanceof MissingSchema)
      return response({
        status: 'setup',
        patches: [],
        snapshots: [],
        from: null,
        to: null,
        rows: [],
        assets: {},
        total: 0,
        minimum,
      });
    return response(
      { message: '메타 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      503,
    );
  }
}
