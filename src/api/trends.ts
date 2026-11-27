import type { AssetMap } from '../static-data/catalog';
import type { MetaKind } from '../types/meta';
import type { Snapshot, SnapshotEntity, TrendRow } from '../meta/trends';

export interface TrendData {
  status: 'setup' | 'waiting' | 'ready';
  patches: Snapshot[];
  from: Snapshot | null;
  to: Snapshot | null;
  rows: TrendRow[];
  assets: AssetMap;
  minimum: number;
  total: number;
  movements?: TrendRow[];
  highlights?: { kind: MetaKind; group: string; up: TrendRow[]; down: TrendRow[] }[];
}
export interface TrendHistory {
  status?: 'setup';
  patches: Snapshot[];
  snapshots: Snapshot[];
  total: number;
}
export interface TrendSeries {
  patches: Snapshot[];
  rows: SnapshotEntity[];
  minimum: number;
}

export async function fetchTrend<T>(
  path: 'trends' | 'patch-history' | 'trends/entity',
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<T> {
  const timeout = AbortSignal.timeout(20000);
  const response = await fetch('/api/meta/' + path + '?' + params, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.headers.get('content-type')?.includes('application/json'))
    throw Error('메타 이력 API에 연결할 수 없습니다.');
  const data = await response.json();
  if (!response.ok) throw Error(data.message || '메타 이력을 읽지 못했습니다.');
  if (!Array.isArray(data.patches)) throw Error('메타 이력 응답을 확인해 주세요.');
  return data;
}
