import type { MetaKind, MetaRow } from '../types/meta';
import type { Asset } from '../types/riot';
import type { TierRow } from './tierList';

export const TREND_PATH = '/meta/trends';
export const HISTORY_PATH = '/meta/patch-history';
export const TREND_PAGES = {
  champion: { label: '챔피언', path: TREND_PATH + '/champions' },
  item: { label: '아이템', path: TREND_PATH + '/items' },
  trait: { label: '특성', path: TREND_PATH + '/traits' },
} as const;
export const TREND_KINDS = Object.keys(TREND_PAGES) as MetaKind[];
export const trendKind = (path: string) =>
  TREND_KINDS.find((kind) => TREND_PAGES[kind].path === path);

export interface Snapshot {
  snapshot_id: number;
  set_number: number;
  patch: string;
  snapshot_date: string;
  snapshot_at: string;
  snapshot_type: 'daily' | 'final';
  aggregation_generation: number;
  window_start: string;
  window_end: string;
  match_count: number;
  participant_count: number;
  patch_source: 'match' | 'official';
  confidence_status: 'confirmed' | 'verified' | 'schedule-estimate' | 'first-observed';
  definition_version: number;
  scoring_version: string;
  metadata_generation?: number | null;
}
export interface SnapshotEntity extends Pick<
  MetaRow,
  'sample_count' | 'avg_placement' | 'top4_rate' | 'win_rate'
> {
  snapshot_id: number;
  catalog?: SnapshotCatalog | null;
  kind: MetaKind;
  entity_id: string;
  details?: Pick<
    MetaRow,
    'avg_star_level' | 'common_items' | 'common_champions' | 'tier_samples'
  > | null;
}
export interface SnapshotCatalog {
  asset?: Pick<Asset, 'name' | 'image' | 'cost' | 'tierItemType'>;
  group: string;
  tier: TierRow['tier'];
  score: number | null;
  confidence: TierRow['confidence'];
  minimum: number;
}

export function snapshotMetaRow(row: SnapshotEntity): MetaRow {
  const id = { champion: 'character_id', item: 'item_name', trait: 'trait_name' }[row.kind];
  return {
    [id]: row.entity_id,
    sample_count: row.sample_count,
    avg_placement: row.avg_placement,
    top4_rate: row.top4_rate,
    win_rate: row.win_rate,
  };
}
export const confidenceLabel = {
  confirmed: '경기 버전 확인',
  verified: '검증된 적용 기준',
  'schedule-estimate': '공식 일정 기반 추정',
  'first-observed': '최초 감지 기반 추정',
};
export const PERFORMANCE_THRESHOLDS = {
  rapid: 0.5,
  change: 0.15,
  popularity: 1,
  rapidPopularity: 5,
};

export function patchSnapshots(snapshots: Snapshot[]) {
  const latest = new Map<string, Snapshot>();
  for (const snapshot of snapshots) {
    const key = `${snapshot.set_number}:${snapshot.patch}`;
    const prior = latest.get(key);
    if (
      !prior ||
      (snapshot.snapshot_type === 'final' && prior.snapshot_type !== 'final') ||
      (snapshot.snapshot_type === prior.snapshot_type &&
        snapshot.aggregation_generation > prior.aggregation_generation)
    )
      latest.set(key, snapshot);
  }
  return [...latest.values()].sort((a, b) => b.aggregation_generation - a.aggregation_generation);
}

export const usageRate = (row: SnapshotEntity, snapshot: Snapshot) =>
  snapshot.participant_count ? row.sample_count / snapshot.participant_count : null;
const pp = (after: number, before: number) => Math.round((after - before) * 10000) / 100;
export type ChangeStatus = '급상승' | '상승' | '유지' | '하락' | '급하락' | '미관측' | '표본 부족';
export interface TrendRow {
  id: string;
  kind: MetaKind;
  group: string;
  previous?: SnapshotEntity;
  current?: SnapshotEntity;
  previousTier?: TierRow;
  currentTier?: TierRow;
  previousUsage: number | null;
  currentUsage: number | null;
  placement: number | null;
  top4: number | null;
  win: number | null;
  usage: number | null;
  status: ChangeStatus;
  popularity: '사용률 급증' | '사용률 상승' | '유지' | '사용률 하락' | '사용 급감' | null;
}

export function compareSnapshots(
  from: Snapshot,
  to: Snapshot,
  previous: SnapshotEntity[],
  current: SnapshotEntity[],
  beforeTiers: Map<string, TierRow>,
  afterTiers: Map<string, TierRow>,
  minimum: number,
): TrendRow[] {
  if (from.set_number !== to.set_number || from.definition_version !== to.definition_version)
    return [];
  const key = (row: SnapshotEntity) => row.kind + ':' + row.entity_id;
  const before = new Map(previous.map((row) => [key(row), row]));
  const after = new Map(current.map((row) => [key(row), row]));
  const comparableTiers = from.scoring_version === to.scoring_version;
  return [...new Set([...after.keys(), ...before.keys()])].map((id): TrendRow => {
    const a = before.get(id),
      b = after.get(id);
    const entity = b ?? a!;
    const previousTier = comparableTiers ? beforeTiers.get(id) : undefined;
    const currentTier = comparableTiers ? afterTiers.get(id) : undefined;
    const previousUsage = a ? usageRate(a, from) : null;
    const currentUsage = b ? usageRate(b, to) : null;
    const base = {
      id: entity.entity_id,
      kind: entity.kind,
      group: afterTiers.get(id)?.group ?? beforeTiers.get(id)?.group ?? 'special',
      previous: a,
      current: b,
      previousTier,
      currentTier,
      previousUsage,
      currentUsage,
    };
    if (!a || !b || Math.min(a.sample_count, b.sample_count) < minimum)
      return {
        ...base,
        status: !a || !b ? '미관측' : '표본 부족',
        placement: null,
        top4: null,
        win: null,
        usage: null,
        popularity: null,
      };
    const placement = Math.round((a.avg_placement - b.avg_placement) * 100) / 100;
    const top4 = pp(b.top4_rate, a.top4_rate);
    const win = pp(b.win_rate, a.win_rate);
    const usage =
      currentUsage !== null && previousUsage !== null ? pp(currentUsage, previousUsage) : null;
    const { rapid, change, popularity, rapidPopularity } = PERFORMANCE_THRESHOLDS;
    const status =
      placement >= rapid
        ? '급상승'
        : placement >= change
          ? '상승'
          : placement <= -rapid
            ? '급하락'
            : placement <= -change
              ? '하락'
              : '유지';
    return {
      ...base,
      placement,
      top4,
      win,
      usage,
      status,
      popularity:
        usage === null
          ? null
          : usage >= rapidPopularity
            ? '사용률 급증'
            : usage >= popularity
              ? '사용률 상승'
              : usage <= -rapidPopularity
                ? '사용 급감'
                : usage <= -popularity
                  ? '사용률 하락'
                  : '유지',
    };
  });
}

export function trendInsights(rows: TrendRow[], name: (row: TrendRow) => string) {
  const contrast = rows.find(
    (row) =>
      (row.usage ?? 0) >= PERFORMANCE_THRESHOLDS.popularity &&
      (row.placement ?? 0) <= -PERFORMANCE_THRESHOLDS.change,
  );
  const strongest = [...rows]
    .filter((row) => row.status === '급상승' || row.status === '상승')
    .sort((a, b) => (b.placement ?? 0) - (a.placement ?? 0))[0];
  return [
    strongest &&
      `${name(strongest)}의 평균 등수가 ${strongest.placement!.toFixed(2)}위 개선됐습니다.`,
    contrast &&
      `${name(contrast)}의 사용률은 ${contrast.usage!.toFixed(2)}%p 늘었고, 평균 등수는 ${Math.abs(contrast.placement!).toFixed(2)}위 악화됐습니다.`,
  ].filter((message): message is string => Boolean(message));
}
