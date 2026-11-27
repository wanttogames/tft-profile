import { lookupAsset } from '../static-data/catalog';
import type { AssetMap } from '../static-data/catalog';
import type { MetaData, MetaKind, MetaRow } from '../types/meta';

export const TIER_VERSION = '1.0';
export const TIERS = ['S', 'A', 'B', 'C', 'D'] as const;
export type Tier = (typeof TIERS)[number];
export type TierStatus =
  'confirmed' | 'estimated' | 'transition' | 'unconfirmed' | 'collecting' | 'insufficient';
export type TierRow = MetaRow & {
  id: string;
  group: string;
  score: number | null;
  tier: Tier | null;
  confidence: 'insufficient' | 'low' | 'medium' | 'high';
};
export interface TierData extends MetaData {
  rows: TierRow[];
  tierVersion: string;
  status: TierStatus;
}

export const GROUP_LABELS: Record<MetaKind, Record<string, string>> = {
  champion: {
    '1': '1코스트',
    '2': '2코스트',
    '3': '3코스트',
    '4': '4코스트',
    '5+': '5코스트 이상',
    special: '기타 특수 챔피언',
  },
  item: {
    completed: '일반 완성 아이템',
    component: '조합 아이템',
    radiant: '빛나는 아이템',
    artifact: '유물 아이템',
    support: '지원 아이템',
    emblem: '상징',
    special: '기타 시즌 특수 아이템',
  },
  trait: { trait: '활성 특성' },
};

const metricWeights = [0.45, 0.35, 0.2] as const;
const metrics = (row: MetaRow) => [8 - row.avg_placement, row.top4_rate, row.win_rate];
export const tierMinimum = (minimum: number) => Math.max(50, minimum);

export function tierScope(summary: MetaData['summary']): TierStatus {
  if (!summary.scope_ready) return 'collecting';
  if (
    summary.preview_patch ||
    [summary.external_patch, summary.detected_patch].some(
      (patch) => patch && summary.current_patch && comparePatches(patch, summary.current_patch) > 0,
    )
  )
    return 'transition';
  if (summary.preview_set_number || !summary.current_patch) return 'unconfirmed';
  if (!summary.match_count) return 'collecting';
  if (!summary.aggregate_set_number || !summary.generation) return 'unconfirmed';
  if (summary.patch_source === 'match') return 'confirmed';
  return summary.patch_source === 'official' ? 'estimated' : 'unconfirmed';
}

function comparePatches(a: string, b: string) {
  const [majorA = 0, minorA = 0] = a.split('.').map(Number);
  const [majorB = 0, minorB = 0] = b.split('.').map(Number);
  return majorA - majorB || minorA - minorB;
}

export function rankTiers(
  kind: MetaKind,
  rows: MetaRow[],
  assets: AssetMap,
  configuredMinimum: number,
): TierRow[] {
  const minimum = tierMinimum(configuredMinimum);
  const groups = new Map<string, TierRow[]>();
  const entries = rows.map((row): TierRow => {
    const id = String(
      row[
        { champion: 'character_id', item: 'item_name', trait: 'trait_name' }[kind] as keyof MetaRow
      ],
    );
    const asset = lookupAsset(assets, kind === 'champion' ? 'unit' : kind, id);
    const cost = asset?.cost;
    const group =
      kind === 'trait'
        ? 'trait'
        : kind === 'item'
          ? (asset?.tierItemType ?? 'special')
          : !Number.isInteger(cost) || !cost || cost < 1
            ? 'special'
            : cost >= 5
              ? '5+'
              : String(cost);
    const n = row.sample_count;
    const confidence = n < minimum ? 'insufficient' : n < 100 ? 'low' : n < 300 ? 'medium' : 'high';
    const entry: TierRow = { ...row, id, group, confidence, score: null, tier: null };
    // Missing classification and incomparable seasonal or consumable items remain descriptive.
    if (group !== 'special' && n > 0 && metrics(row).every(Number.isFinite)) {
      const members = groups.get(group) ?? [];
      members.push(entry);
      groups.set(group, members);
    }
    return entry;
  });

  for (const members of groups.values()) {
    const eligible = members.filter((row) => row.sample_count >= minimum);
    if (eligible.length < 2) continue;
    const total = members.reduce((sum, row) => sum + row.sample_count, 0);
    const normalized = metricWeights.map((weight, i) => {
      const values = eligible.map((row) => metrics(row)[i]!);
      const low = Math.min(...values);
      const high = Math.max(...values);
      const prior =
        members.reduce((sum, row) => sum + metrics(row)[i]! * row.sample_count, 0) / total;
      return { low, high, prior, weight };
    });
    for (const row of eligible) {
      const values = metrics(row);
      const score = normalized.reduce((sum, { low, high, prior, weight }, i) => {
        const adjusted =
          (values[i]! * row.sample_count + prior * minimum) / (row.sample_count + minimum);
        const points =
          high === low ? 50 : Math.max(0, Math.min(100, (100 * (adjusted - low)) / (high - low)));
        return sum + points * weight;
      }, 0);
      row.score = Math.round(score * 10) / 10;
      row.tier =
        row.score >= 85
          ? 'S'
          : row.score >= 70
            ? 'A'
            : row.score >= 55
              ? 'B'
              : row.score >= 40
                ? 'C'
                : 'D';
    }
  }
  return entries.sort(
    (a, b) =>
      (b.score ?? -1) - (a.score ?? -1) ||
      b.sample_count - a.sample_count ||
      a.avg_placement - b.avg_placement ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
