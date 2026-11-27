import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MetaData, MetaRow } from '../src/types/meta';
import { assetKey, indexCommunityDragon } from '../src/static-data/catalog';
import { rankTiers, tierScope } from '../src/meta/tierList';
import handler from '../server/handlers/tft-meta';

vi.mock('../server/lib/staticData', () => ({ loadMetaAssets: vi.fn(async () => ({})) }));

const stats = (n: number, avg: number, top4: number, win: number): MetaRow => ({
  sample_count: n,
  avg_placement: avg,
  top4_rate: top4,
  win_rate: win,
});
const summary: MetaData['summary'] = {
  scope_ready: true,
  generation: 1,
  aggregate_set_number: 19,
  match_count: 200,
  participant_count: 1600,
  player_count: 50,
  latest_collected_at: null,
  current_patch: '19.1',
  patch_source: 'match',
};
afterEach(() => vi.unstubAllGlobals());

describe('tier scoring', () => {
  it('normalizes within a group and applies the weighted shrunk metrics', () => {
    const result = rankTiers(
      'trait',
      [
        { trait_name: 'a', ...stats(100, 4, 0.8, 0.1) },
        { trait_name: 'b', ...stats(100, 6, 0.2, 0.3) },
      ],
      {},
      50,
    );
    expect(result.map((row) => [row.score, row.tier])).toEqual([
      [70, 'A'],
      [30, 'D'],
    ]);
  });

  it('leaves low samples unranked and shrinks provisional outliers toward a weighted prior', () => {
    const result = rankTiers(
      'trait',
      [
        { trait_name: 'a', ...stats(52, 2, 0.9, 0.7) },
        { trait_name: 'b', ...stats(5000, 6, 0.3, 0.1) },
        { trait_name: 'c', ...stats(49, 1, 1, 1) },
      ],
      {},
      50,
    );
    expect(result.find((row) => row.id === 'a')).toMatchObject({ tier: 'C', confidence: 'low' });
    expect(result.find((row) => row.id === 'c')).toMatchObject({
      tier: null,
      confidence: 'insufficient',
    });
    expect(rankTiers('trait', result, {}, 100).every((row) => row.tier === null)).toBe(true);
  });

  it('compares champions by cost and keeps unknown costs out of comparison', () => {
    const make = (id: string, avg: number) => ({ character_id: id, ...stats(100, avg, 0.5, 0.2) });
    const pool = [make('a', 4), make('b', 6)];
    const assets = Object.fromEntries(
      [
        ['a', 1],
        ['b', 1],
        ['expensive', 5],
      ].map(([id, cost]) => [
        assetKey('unit', String(id)),
        { name: String(id), cost: Number(cost) },
      ]),
    );
    const extra = rankTiers(
      'champion',
      [...pool, make('expensive', 1), make('unknown', 1)],
      assets,
      50,
    );
    expect(extra.filter((row) => row.tier)).toEqual(rankTiers('champion', pool, assets, 50));
    expect(extra.find((row) => row.id === 'unknown')).toMatchObject({
      group: 'special',
      tier: null,
    });
  });

  it('separates observed CommunityDragon item families and excludes consumables', () => {
    const catalog = indexCommunityDragon({
      sets: {},
      items: [
        { apiName: 'a', name: '완성 A', isAugment: false, tags: ['{7ea41d13}'] },
        { apiName: 'b', name: '완성 B', isAugment: false, tags: ['{7ea41d13}'] },
        { apiName: 'c', name: '빛나는 A', isAugment: false, tags: ['{6ef5c598}'] },
        { apiName: 'd', name: '소모품', isAugment: false, tags: ['Consumable', '{7ea41d13}'] },
      ],
    });
    const ranked = rankTiers(
      'item',
      ['a', 'b', 'c', 'd'].map((id) => ({ item_name: id, ...stats(100, 4, 0.5, 0.2) })),
      catalog.assets,
      50,
    );
    expect(ranked.map((row) => [row.group, row.tier])).toEqual([
      ['completed', 'C'],
      ['completed', 'C'],
      ['radiant', null],
      ['special', null],
    ]);
  });

  it('sorts ties by sample count, placement and ID', () => {
    const result = rankTiers(
      'trait',
      [
        { trait_name: 'z', ...stats(100, 4, 0.5, 0.2) },
        { trait_name: 'a', ...stats(100, 4, 0.5, 0.2) },
        { trait_name: 'n', ...stats(101, 4, 0.5, 0.2) },
      ],
      {},
      50,
    );
    expect(result.map((row) => row.id)).toEqual(['n', 'a', 'z']);
  });

  it('separates official estimates, unknown sets and new-patch transitions', () => {
    expect(tierScope(summary)).toBe('confirmed');
    expect(tierScope({ ...summary, patch_source: 'official' })).toBe('estimated');
    expect(tierScope({ ...summary, preview_set_number: 20, preview_patch: '20.1' })).toBe(
      'transition',
    );
    expect(tierScope({ ...summary, preview_set_number: 20 })).toBe('unconfirmed');
    expect(tierScope({ ...summary, aggregate_set_number: null })).toBe('unconfirmed');
    expect(tierScope({ ...summary, external_patch: '19.2' })).toBe('transition');
    expect(tierScope({ ...summary, scope_ready: false })).toBe('collecting');
  });
});

let project = 0;
const request = () =>
  handler(
    new Request('https://test/api/meta/tier-list?kind=trait'),
    {
      SUPABASE_URL: `https://tier-${++project}.supabase.co`,
      SUPABASE_SECRET_KEY: 'secret',
    },
    false,
    true,
  );

it('reads every deterministic aggregate page before scoring', async () => {
  const rows = Array.from({ length: 51 }, (_, i) => ({
    trait_name: String(i),
    ...stats(i === 50 ? 900 : 100, i === 50 ? 1 : 5, 0.5, 0.2),
  }));
  const offsets: number[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const uri = new URL(url);
      if (uri.pathname.endsWith('summary')) return Response.json([summary]);
      expect(uri.pathname).toBe('/rest/v1/mv_tft_trait_stats');
      expect(uri.searchParams.get('order')).toBe('trait_name.asc');
      const offset = Number(uri.searchParams.get('offset'));
      offsets.push(offset);
      return Response.json(rows.slice(offset, offset + 50));
    }),
  );
  const response = await request();
  expect(response.status).toBe(200);
  const json = await response.json();
  expect(json.rows).toHaveLength(51);
  expect(json.rows[0].id).toBe('50');
  expect(offsets).toEqual([0, 50]);
});

it('rejects mixed generations during refresh', async () => {
  let generation = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      Response.json(url.includes('summary') ? [{ ...summary, generation: ++generation }] : []),
    ),
  );
  expect((await request()).status).toBe(503);
});

it.each([
  [{ ...summary, preview_set_number: 20 }, 'unconfirmed', 1],
  [{ ...summary, external_patch: '20.1' }, 'transition', 1],
  [summary, 'insufficient', 3],
] as const)('handles unrankable aggregate scope', async (scope, expected, calls) => {
  const fetch = vi.fn(async (url: string) => Response.json(url.includes('summary') ? [scope] : []));
  vi.stubGlobal('fetch', fetch);
  expect(await (await request()).json()).toMatchObject({ status: expected, rows: [] });
  expect(fetch).toHaveBeenCalledTimes(calls);
});

it('returns a safe error if Supabase fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Response.json({ message: 'private' }, { status: 500 })),
  );
  const response = await request();
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private');
});
