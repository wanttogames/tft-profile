import { describe, it, expect } from 'vitest';
import source from './fixtures/cdragon-ko-kr.excerpt.json';
import snapshot from '../netlify/data/tft-ko-snapshot.json';
import {
  indexCommunityDragon,
  indexDataDragon,
  displayName,
  lookupAsset,
  assetKey,
  communityImage,
} from '../src/static-data/catalog';
const catalog = indexCommunityDragon(source);
describe('actual ko_KR static data excerpt', () => {
  it('resolves the observed DA_18 champion ID without rewriting it', () =>
    expect(displayName(catalog.assets, 'unit', 'DA_18_Sejuani', 18)).toBe('세주아니'));
  it('resolves item API name to Korean', () =>
    expect(displayName(catalog.assets, 'item', 'TFT_Item_InfinityEdge')).toBe('무한의 대검'));
  it('resolves trait API name to Korean', () =>
    expect(displayName(catalog.assets, 'trait', 'DA_18_Elderwood', 18)).toBe('나무정령'));
  it('keeps categories separate and preserves unknown IDs', () => {
    expect(displayName(catalog.assets, 'unit', 'TFT18_Sejuani', 18)).toBe('TFT18_Sejuani');
    expect(displayName(catalog.assets, 'trait', 'DA_18_Sejuani', 18)).toBe('DA_18_Sejuani');
    expect(displayName(catalog.assets, 'item', 'UNKNOWN')).toBe('UNKNOWN');
  });
  it('has the same real names in the bundled server fallback', () => {
    for (const [kind, id, set] of [
      ['unit', 'DA_18_Sejuani', 18],
      ['item', 'TFT_Item_InfinityEdge', undefined],
      ['trait', 'DA_18_Elderwood', 18],
    ] as const)
      expect(displayName(snapshot.assets, kind, id, set)).toBe(
        displayName(catalog.assets, kind, id, set),
      );
  });
  it('reads setData variants when a set is absent from sets', () => {
    const alternate = {
      items: source.items,
      sets: {},
      setData: [{ number: 18, ...source.sets['18'] }],
    };
    expect(displayName(indexCommunityDragon(alternate).assets, 'unit', 'DA_18_Sejuani', 18)).toBe(
      '세주아니',
    );
  });
  it('keeps same IDs from different sets distinct', () => {
    const raw = {
      items: [],
      sets: {
        1: { champions: [{ apiName: 'shared', name: '첫 번째' }] },
        2: { champions: [{ apiName: 'shared', name: '두 번째' }] },
      },
    };
    const a = indexCommunityDragon(raw).assets;
    expect(displayName(a, 'unit', 'shared', 1)).toBe('첫 번째');
    expect(displayName(a, 'unit', 'shared', 2)).toBe('두 번째');
  });
  it('uses numeric aliases only when explicitly supplied by static data', () => {
    const a = indexCommunityDragon({
      items: [{ apiName: 'known', id: 42, name: '검증용 이름', isAugment: false }],
      sets: {},
    }).assets;
    expect(displayName(a, 'item', '42')).toBe('검증용 이름');
    expect(displayName(a, 'item', '43')).toBe('43');
  });
  it('supports the official Data Dragon keyed data format', () => {
    const a = indexDataDragon(
      {
        data: {
          sample: {
            id: '123',
            name: '공식 형식 예제',
            image: { group: 'tft-item', full: 'sample.png' },
          },
        },
      },
      'item',
      '16.18.1',
    );
    expect(displayName(a, 'item', '123')).toBe('공식 형식 예제');
    expect(lookupAsset(a, 'item', 'sample')?.image).toContain('/16.18.1/img/tft-item/sample.png');
  });
  it('uses the documented game image path and rejects invalid paths', () => {
    expect(lookupAsset(catalog.assets, 'unit', 'DA_18_Sejuani', 18)?.image).toBe(
      'https://raw.communitydragon.org/latest/game/assets/characters/tft18_sejuani/skins/base/images/tft18_sejuani_splash_tile_26.png',
    );
    expect(communityImage('https://other.example/a.png', 'latest')).toBeUndefined();
    expect(communityImage('assets/../../secret.png', 'latest')).toBeUndefined();
  });
  it('rejects malformed source data instead of publishing an empty mapping', () => {
    expect(() => indexCommunityDragon({})).toThrow();
    expect(() => indexDataDragon({}, 'item', '16.18.1')).toThrow();
  });
});
