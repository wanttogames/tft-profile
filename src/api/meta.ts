import type { MetaData, MetaKind, MetaSort } from '../types/meta';
export async function fetchMeta(
  kind: MetaKind,
  sort: MetaSort,
  page = 0,
  signal?: AbortSignal,
): Promise<MetaData> {
  const r = await fetch(
    '/api/meta/' +
      { item: 'items', champion: 'champions', trait: 'traits' }[kind] +
      '?' +
      new URLSearchParams({ kind, sort, page: String(page) }),
    { signal },
  );
  if (!r.headers.get('content-type')?.includes('application/json'))
    throw Error(
      import.meta.env.DEV
        ? '메타 API에 연결할 수 없습니다. 로컬에서는 npm run dev:api도 실행해 주세요.'
        : 'Cloudflare 메타 API에 연결할 수 없습니다. Pages Functions 배포 상태를 확인해 주세요.',
    );
  const data = await r.json();
  if (!r.ok) throw Error(data.message ?? '메타 조회 실패');
  return data;
}
