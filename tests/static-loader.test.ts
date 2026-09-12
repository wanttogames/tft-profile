import { afterEach, describe, it, expect, vi } from 'vitest';
import { loadGameAssets } from '../server/lib/staticData';
import snapshot from '../netlify/data/tft-ko-snapshot.json';
import { displayName } from '../src/static-data/catalog';
import { demoPlayer } from '../src/data/demo';
// Synthetic board referencing the exact IDs verified in the real static excerpt.
const games = () => {
  const g = demoPlayer().games[0]!;
  g.set = 18;
  g.version = 'fixture';
  g.player.units = [
    {
      character_id: 'DA_18_Sejuani',
      tier: 2,
      rarity: 1,
      items: [],
      itemNames: ['TFT_Item_InfinityEdge'],
    },
  ];
  g.player.traits = [
    { name: 'DA_18_Elderwood', num_units: 3, style: 1, tier_current: 1, tier_total: 5 },
  ];
  return [g];
};
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe('server static data delivery', () => {
  it('uses the compact fresh snapshot and only returns requested aliases', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse(snapshot.fetchedAt) + 1000);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const result = await loadGameAssets(games());
    expect(Object.keys(result.assets)).toHaveLength(3);
    expect(fetch).not.toHaveBeenCalled();
    expect(result.warnings).toEqual([]);
    expect(displayName(result.assets, 'unit', 'DA_18_Sejuani', 18)).toBe('세주아니');
  });
  it('retains Korean mappings on refresh network failure', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse(snapshot.fetchedAt) + 2 * 24 * 60 * 60 * 1000);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const result = await loadGameAssets(games());
    expect(displayName(result.assets, 'item', 'TFT_Item_InfinityEdge')).toBe('무한의 대검');
    expect(result.warnings.some((w) => w.includes('갱신에 실패'))).toBe(true);
  });
  it('does not invent a translated label for an unknown ID', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse(snapshot.fetchedAt) + 1000);
    vi.stubGlobal('fetch', vi.fn());
    const g = games();
    g[0]!.player.units[0]!.character_id = 'unmapped-fixture';
    const result = await loadGameAssets(g);
    expect(displayName(result.assets, 'unit', 'unmapped-fixture', 18)).toBe('unmapped-fixture');
    expect(result.warnings.some((w) => w.includes('한글 이름 1개'))).toBe(true);
  });
});
