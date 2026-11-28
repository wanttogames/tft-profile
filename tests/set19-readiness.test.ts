import { afterEach, expect, it, vi } from 'vitest';
import { onRequest } from '../functions/api/meta/readiness';
import { readinessStatus, type ReadinessData } from '../src/meta/readiness';

const { summary } = vi.hoisted(() => ({
  summary: {
    scope_ready: true,
    match_count: 100,
    participant_count: 800,
    player_count: 10,
    latest_collected_at: null,
    current_patch: '18.7',
    aggregate_set_number: 18,
  },
}));
vi.mock('../functions/api/meta/summary', () => ({ onRequest: async () => Response.json(summary) }));
vi.mock('../server/lib/staticData', () => ({ catalogReadiness: async () => ({ champions: 12 }) }));
afterEach(() => vi.unstubAllGlobals());

it('does not mistake an older aggregate or a current preview for a confirmed Set 19 aggregate', () => {
  const data: ReadinessData = {
    summary,
    collection: { count: 12, unknownVersion: 12, latest: null },
    catalog: null,
  };
  expect(readinessStatus(data)).toContain('수집 중');
  expect(readinessStatus({ ...data, summary: { ...summary, preview_set_number: 19 } })).toContain(
    '참고 집계',
  );
  expect(
    readinessStatus({
      ...data,
      summary: {
        ...summary,
        aggregate_set_number: 19,
        patch_source: 'official',
        boundary_basis: 'schedule-estimate',
      },
    }),
  ).toContain('추정');
  expect(
    readinessStatus({
      ...data,
      summary: { ...summary, aggregate_set_number: 19, patch_source: 'match' },
    }),
  ).toContain('경기 버전');
});

it('counts only complete KR ranked Set 19 matches without returning identifiers', async () => {
  const fetcher = vi.fn(async (url: string, options: RequestInit) => {
    const q = new URL(url).searchParams;
    expect(q.get('set_number')).toBe('eq.19');
    expect(q.get('ingestion_complete')).toBe('eq.true');
    expect(q.get('platform')).toBe('eq.kr');
    expect(q.get('queue_id')).toBe('eq.1100');
    expect(q.get('collected_at')).toMatch(/^gte\./);
    if (options.method === 'HEAD') {
      expect(q.get('patch')).toBe('is.null');
      return new Response(null, { headers: { 'Content-Range': '0-0/2' } });
    }
    return Response.json([{ collected_at: '2026-12-02T10:00:00Z' }], {
      headers: { 'Content-Range': '0-0/3' },
    });
  });
  vi.stubGlobal('fetch', fetcher);
  const context = {
    request: new Request('https://tft.test/api/meta/readiness'),
    env: { SUPABASE_URL: 'https://test.example', SUPABASE_SECRET_KEY: 'private' },
  };
  const result = await onRequest(context);
  expect(await result.json()).toMatchObject({ collection: { count: 3, unknownVersion: 2 } });
  await onRequest(context);
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('keeps summary and catalog available when collection counts cannot be read', async () => {
  vi.stubGlobal('fetch', async () => new Response(null, { status: 503 }));
  const result = await onRequest({
    request: new Request('https://tft.test/api/meta/readiness'),
    env: { SUPABASE_URL: 'https://failure.example', SUPABASE_SECRET_KEY: 'private' },
  });
  expect(await result.json()).toMatchObject({
    summary,
    catalog: { champions: 12 },
    collection: null,
  });
});
