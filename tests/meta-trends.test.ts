import { afterEach, expect, it, vi } from 'vitest';
import handler from '../server/handlers/tft-trends';
import {
  compareSnapshots,
  patchSnapshots,
  type Snapshot,
  type SnapshotEntity,
} from '../src/meta/trends';

vi.mock('../server/lib/staticData', () => ({ loadMetaAssets: vi.fn(async () => ({})) }));
const base: Snapshot = {
  snapshot_id: 1,
  patch: '19.1',
  set_number: 19,
  snapshot_date: '2026-12-10',
  snapshot_at: '2026-12-10T01:00:00Z',
  snapshot_type: 'final',
  aggregation_generation: 1,
  window_start: '2026-12-03T01:00:00Z',
  window_end: '2026-12-10T01:00:00Z',
  match_count: 100,
  participant_count: 800,
  patch_source: 'match',
  confidence_status: 'confirmed',
  definition_version: 1,
  scoring_version: '1.0',
};
const current: Snapshot = {
  ...base,
  snapshot_id: 2,
  patch: '19.2',
  snapshot_type: 'daily',
  aggregation_generation: 3,
  match_count: 200,
  participant_count: 1600,
};
const entity = (
  id: string,
  snapshot: number,
  count: number,
  avg: number,
  top4 = 0.5,
): SnapshotEntity => ({
  snapshot_id: snapshot,
  kind: 'trait',
  entity_id: id,
  sample_count: count,
  avg_placement: avg,
  top4_rate: top4,
  win_rate: 0.2,
});
afterEach(() => vi.unstubAllGlobals());
it('chooses one observation per patch without combining overlapping windows', () => {
  expect(
    patchSnapshots([
      base,
      current,
      { ...base, snapshot_type: 'daily', snapshot_id: 3, aggregation_generation: 2 },
    ]),
  ).toEqual([current, base]);
});
it('uses board denominators, percentage points and lower placement as improvement', () => {
  const [result] = compareSnapshots(
    base,
    current,
    [entity('a', 1, 80, 4)],
    [entity('a', 2, 240, 3.5, 0.6)],
    new Map(),
    new Map(),
    50,
  );
  expect(result).toMatchObject({
    placement: 0.5,
    top4: 10,
    usage: 5,
    status: '급상승',
    popularity: '사용률 급증',
  });
});
it('does not infer content removal or compare weak samples or different sets', () => {
  const before = [entity('a', 1, 80, 4), entity('b', 1, 20, 4)];
  const after = [entity('b', 2, 100, 3), entity('c', 2, 100, 3)];
  expect(
    compareSnapshots(base, current, before, after, new Map(), new Map(), 50).map(
      (row) => row.status,
    ),
  ).toEqual(['표본 부족', '미관측', '미관측']);
  expect(
    compareSnapshots(base, { ...current, set_number: 20 }, before, after, new Map(), new Map(), 50),
  ).toEqual([]);
  expect(
    compareSnapshots(
      base,
      { ...current, definition_version: 2 },
      before,
      after,
      new Map(),
      new Map(),
      50,
    ),
  ).toEqual([]);
});
it('suppresses tier movement across scoring versions', () => {
  const ranks = new Map([
    [
      'trait:a',
      {
        ...entity('a', 1, 80, 4),
        id: 'a',
        group: 'trait',
        tier: 'S' as const,
        score: 90,
        confidence: 'medium' as const,
      },
    ],
  ]);
  const [row] = compareSnapshots(
    base,
    { ...current, scoring_version: '2.0' },
    [entity('a', 1, 80, 4)],
    [entity('a', 2, 80, 3)],
    ranks,
    ranks,
    50,
  );
  expect(row?.currentTier).toBeUndefined();
  expect(row?.previousTier).toBeUndefined();
  expect(row?.group).toBe('trait');
});

let serial = 0;
const env = () => ({
  SUPABASE_URL: `https://trends-${++serial}.supabase.co`,
  SUPABASE_SECRET_KEY: 'secret',
});
it('serves only snapshots, validates identity filters and deduplicates requests', async () => {
  const requests = vi.fn(async (url: string) => {
    expect(new URL(url).pathname).toMatch(/\/rest\/v1\/tft_meta_snapshot(?:_entity)?$/);
    return Response.json(
      url.includes('_entity') ? [entity('a', 1, 80, 4), entity('a', 2, 240, 3.5)] : [current, base],
    );
  });
  vi.stubGlobal('fetch', requests);
  const config = env();
  const request = new Request('https://test/api/meta/trends?kind=trait');
  const [a, b] = await Promise.all([
    handler(request, config, 'trends'),
    handler(request, config, 'trends'),
  ]);
  expect((await a.json()).rows[0].usage).toBe(5);
  expect((await b.json()).status).toBe('ready');
  expect(requests).toHaveBeenCalledTimes(3);
  expect(
    (
      await handler(
        new Request('https://test/api/meta/trends/entity?kind=trait&set=19&entityId=a,b'),
        config,
        'entity',
      )
    ).status,
  ).toBe(400);
});
it('exposes an empty setup state before migration and hides backend errors', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ message: 'private' }, { status: 404 })),
  );
  expect(
    await (await handler(new Request('https://test/api'), env(), 'history')).json(),
  ).toMatchObject({ status: 'setup', patches: [] });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ message: 'private' }, { status: 500 })),
  );
  const result = await handler(new Request('https://test/api'), env(), 'history');
  expect(result.status).toBe(503);
  expect(await result.text()).not.toContain('private');
});
