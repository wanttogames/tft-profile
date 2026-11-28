import type { ApiContext } from '../../../server/env';
import { catalogReadiness } from '../../../server/lib/staticData';
import { TARGET_SET, type ReadinessData } from '../../../src/meta/readiness';
import { onRequest as readSummary } from './summary';

type Collection = NonNullable<ReadinessData['collection']>;
const collections = new Map<string, { expires: number; value: Promise<Collection> }>();

function readCollection({ env }: ApiContext) {
  const base = new URL(env.SUPABASE_URL ?? '');
  const secret = env.SUPABASE_SECRET_KEY;
  if (!secret || base.protocol !== 'https:') throw Error('Collection unavailable');
  const cached = collections.get(base.origin);
  if (cached && cached.expires > Date.now()) return cached.value;
  const params = new URLSearchParams({
    select: 'collected_at',
    limit: '1',
    order: 'collected_at.desc',
    platform: 'eq.kr',
    queue_id: 'eq.1100',
    ingestion_complete: 'eq.true',
    set_number: `eq.${TARGET_SET}`,
    collected_at: `gte.${new Date(Date.now() - 7 * 86400000).toISOString()}`,
  });
  const headers = {
    apikey: secret,
    Prefer: 'count=exact',
    ...(secret.startsWith('eyJ') ? { Authorization: `Bearer ${secret}` } : {}),
  };
  const value = (async () => {
    const result = await fetch(base.origin + '/rest/v1/tft_matches?' + params, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    const count = result.headers.get('Content-Range')?.match(/\/(\d+)$/)?.[1];
    if (!result.ok || count === undefined) throw Error('Collection unavailable');
    const rows = (await result.json()) as { collected_at: string }[];
    if (!Number(count)) return { count: 0, unknownVersion: 0, latest: null };
    params.set('patch', 'is.null');
    const unknown = await fetch(base.origin + '/rest/v1/tft_matches?' + params, {
      method: 'HEAD',
      headers,
      signal: AbortSignal.timeout(5000),
    });
    const unresolved = unknown.headers.get('Content-Range')?.match(/\/(\d+)$/)?.[1];
    if (!unknown.ok || unresolved === undefined) throw Error('Collection unavailable');
    return {
      count: Number(count),
      unknownVersion: Number(unresolved),
      latest: rows[0]?.collected_at ?? null,
    };
  })();
  if (collections.size >= 8) collections.delete(collections.keys().next().value!);
  collections.set(base.origin, { expires: Date.now() + 60000, value });
  void value.catch(() => {
    if (collections.get(base.origin)?.value === value) collections.delete(base.origin);
  });
  return value;
}

export async function onRequest(context: ApiContext): Promise<Response> {
  const response = await readSummary(context);
  if (!response.ok) return response;
  const [collection, catalog] = await Promise.allSettled([
    Promise.resolve().then(() => readCollection(context)),
    catalogReadiness(TARGET_SET, context.env.TFT_STATIC_VERSION),
  ]);
  return Response.json(
    {
      summary: (await response.json()) as ReadinessData['summary'],
      collection: collection.status === 'fulfilled' ? collection.value : null,
      catalog: catalog.status === 'fulfilled' ? catalog.value : null,
    } satisfies ReadinessData,
    { headers: { 'Cache-Control': 'public, max-age=60' } },
  );
}
