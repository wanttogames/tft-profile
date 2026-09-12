import type { ApiEnv } from '../env';
import { loadMetaAssets } from '../lib/staticData';
import type { MetaData, MetaKind, MetaRow, MetaSort } from '../../src/types/meta';
const views = {
  item: 'v_tft_item_stats',
  champion: 'v_tft_champion_stats',
  trait: 'v_tft_trait_stats',
};
const ids = { item: 'item_name', champion: 'character_id', trait: 'trait_name' };
const cache = new Map<string, { expires: number; data: MetaData }>();
const pending = new Map<string, Promise<MetaData>>();
const reply = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': status === 200 ? 'public,max-age=60' : 'no-store' },
  });
export default async function handler(
  request: Request,
  env: ApiEnv,
  summaryOnly = false,
): Promise<Response> {
  if (request.method !== 'GET') return reply({ message: 'GET 요청만 지원합니다.' }, 405);
  const q = new URL(request.url).searchParams;
  const kind = (q.get('kind') ?? 'item') as MetaKind,
    sort = (q.get('sort') ?? 'sample_count') as MetaSort;
  const page = Number(q.get('page') ?? '0');
  if (
    !Object.hasOwn(views, kind) ||
    !['sample_count', 'avg_placement', 'top4_rate', 'win_rate'].includes(sort) ||
    !Number.isInteger(page) ||
    page < 0 ||
    page > 100
  )
    return reply({ message: '메타 조회 조건이 올바르지 않습니다.' }, 400);
  const min = Number(env.MIN_SAMPLE_SIZE ?? '10');
  if (!Number.isInteger(min) || min < 1 || min > 1000000)
    return reply({ message: 'MIN_SAMPLE_SIZE 설정을 확인해 주세요.' }, 503);
  const url = env.SUPABASE_URL,
    secret = env.SUPABASE_SECRET_KEY;
  if (!url || !secret)
    return reply(
      {
        message:
          '메타 데이터 연결이 설정되지 않았습니다. Cloudflare Pages의 SUPABASE_URL / SUPABASE_SECRET_KEY를 설정해 주세요.',
      },
      503,
    );
  let base: string;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') throw Error();
    base = u.origin;
  } catch {
    return reply({ message: 'Supabase URL 설정을 확인해 주세요.' }, 503);
  }
  const key = `${base}|${min}|${kind}|${sort}|${page}|${summaryOnly}|${env.TFT_STATIC_VERSION}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return reply(hit.data);
  async function query(path: string) {
    const r = await fetch(`${base}/rest/v1/${path}`, {
      headers: {
        apikey: secret!,
        ...(secret!.startsWith('eyJ') ? { Authorization: `Bearer ${secret}` } : {}),
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok)
      throw new Error(
        r.status === 404
          ? '메타 View가 없습니다. Supabase에 005 SQL을 적용해 주세요.'
          : `메타 DB 조회 실패 (HTTP ${r.status}). 서버 연결과 View 권한을 확인해 주세요.`,
      );
    const rows: unknown = await r.json();
    if (!Array.isArray(rows)) throw Error('메타 응답 형식을 확인할 수 없습니다.');
    return rows;
  }
  if (!pending.has(key)) {
    const job = (async (): Promise<MetaData> => {
      const params = new URLSearchParams({
        select: '*',
        sample_count: `gte.${min}`,
        order: `${sort}.${sort === 'avg_placement' ? 'asc' : 'desc'},${ids[kind]}.asc`,
        offset: String(page * 50),
        limit: '51',
      });
      const [raw, summary] = await Promise.all([
        summaryOnly ? Promise.resolve([]) : query(`${views[kind]}?${params}`),
        query(
          'v_tft_meta_summary?select=match_count,participant_count,player_count,latest_collected_at',
        ),
      ]);
      if (!summary[0]) throw Error('메타 요약 View를 확인해 주세요.');
      const rows = raw.slice(0, 50) as MetaRow[];
      const requests = rows.flatMap((row) => [
        {
          kind: kind === 'champion' ? ('unit' as const) : kind,
          id: String(row[ids[kind] as keyof MetaRow]),
        },
        ...(row.common_champions ?? []).map((c) => ({ kind: 'unit' as const, id: c.id })),
        ...(row.common_items ?? []).map((c) => ({ kind: 'item' as const, id: c.id })),
      ]);
      const data: MetaData = {
        rows,
        summary: summary[0] as MetaData['summary'],
        minSampleSize: min,
        hasMore: raw.length > 50,
        page,
        assets: requests.length ? await loadMetaAssets(requests, env.TFT_STATIC_VERSION) : {},
      };
      if (cache.size >= 64) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: Date.now() + 60000, data });
      return data;
    })().finally(() => pending.delete(key));
    pending.set(key, job);
  }
  try {
    return reply(await pending.get(key)!);
  } catch (error) {
    // DB error bodies may contain private identifiers. Only known operational messages go to browser.
    const message =
      error instanceof Error && error.message.startsWith('메타')
        ? error.message
        : '메타 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    return reply({ message }, 503);
  }
}
