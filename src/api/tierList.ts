import type { TierData } from '../meta/tierList';
import type { MetaKind } from '../types/meta';

const cache = new Map<MetaKind, { data: TierData; expires: number }>();
const pending = new Map<MetaKind, Promise<TierData>>();

export function fetchTierList(kind: MetaKind): Promise<TierData> {
  const hit = cache.get(kind);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.data);
  const running = pending.get(kind);
  if (running) return running;
  const job = (async () => {
    const response = await fetch('/api/meta/tier-list?' + new URLSearchParams({ kind }), {
      signal: AbortSignal.timeout(20000),
    });
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw Error('티어리스트 API에 연결할 수 없습니다.');
    const data = await response.json();
    if (!response.ok) throw Error(data.message || '티어리스트를 불러오지 못했습니다.');
    if (
      !Array.isArray(data.rows) ||
      !data.tierVersion ||
      !data.summary ||
      !data.assets ||
      !data.status
    )
      throw Error('티어리스트 응답 형식이 올바르지 않습니다.');
    cache.set(kind, { data, expires: Date.now() + 30000 });
    return data as TierData;
  })().finally(() => pending.delete(kind));
  pending.set(kind, job);
  return job;
}
