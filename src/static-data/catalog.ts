import type { Asset } from '../types/riot';
export type AssetKind = 'unit' | 'item' | 'augment' | 'trait';
export type AssetMap = Record<string, Asset>;
export interface StaticCatalog {
  source: string;
  version: string;
  fetchedAt: string;
  sets: number[];
  assets: AssetMap;
}
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
export const assetKey = (kind: AssetKind, id: string, set?: number) =>
  `${kind}:${set ?? '*'}:${id}`;
export function lookupAsset(
  assets: AssetMap,
  kind: AssetKind,
  id: string,
  set?: number,
): Asset | undefined {
  return assets[assetKey(kind, id, set)] ?? assets[assetKey(kind, id)] ?? assets[id];
}
export function displayName(assets: AssetMap, kind: AssetKind, id: string, set?: number): string {
  return lookupAsset(assets, kind, id, set)?.name || id;
}
// CDragon's documented game asset path: lower case .tex -> .png under game/.
export function communityImage(path: unknown, version: string): string | undefined {
  if (
    typeof path !== 'string' ||
    !/^assets\/[\w/ .-]+\.(tex|png)$/i.test(path) ||
    path.includes('..')
  )
    return;
  return `https://raw.communitydragon.org/${version}/game/${path
    .toLowerCase()
    .replace(/\.tex$/, '.png')
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}
/** Parse observed CDragon ko_kr data. Names/aliases are read only from fields, never inferred from ID prefixes. */
export function indexCommunityDragon(
  raw: unknown,
  version = 'latest',
  fetchedAt = new Date().toISOString(),
): StaticCatalog {
  if (
    !record(raw) ||
    !Array.isArray(raw.items) ||
    (!record(raw.sets) && !Array.isArray(raw.setData))
  )
    throw new Error('TFT 정적 데이터 구조를 확인할 수 없습니다.');
  const assets: AssetMap = Object.create(null);
  const sets = new Set<number>();
  function add(kind: AssetKind, value: unknown, set?: number) {
    if (!record(value) || typeof value.name !== 'string' || !value.name.trim()) return;
    const id = value.apiName;
    if (typeof id !== 'string' || !id) return;
    const asset: Asset = {
      name: value.name,
      image: communityImage(value.squareIcon ?? value.icon, version),
      cost: kind === 'unit' && typeof value.cost === 'number' ? value.cost : undefined,
    };
    const aliases = [id];
    if (kind === 'unit' && typeof value.characterName === 'string')
      aliases.push(value.characterName);
    if (typeof value.id === 'string' || typeof value.id === 'number')
      aliases.push(String(value.id));
    for (const alias of aliases) {
      const key = assetKey(kind, alias, set);
      if (!assets[key]) assets[key] = asset;
    }
  }
  function addSet(value: unknown, set: number) {
    if (!record(value) || !Number.isInteger(set)) return;
    sets.add(set);
    if (Array.isArray(value.champions)) value.champions.forEach((c) => add('unit', c, set));
    if (Array.isArray(value.traits)) value.traits.forEach((t) => add('trait', t, set));
  }
  if (record(raw.sets))
    for (const [key, value] of Object.entries(raw.sets)) addSet(value, Number(key));
  if (Array.isArray(raw.setData))
    for (const value of raw.setData)
      if (record(value) && typeof value.number === 'number') addSet(value, value.number);
  for (const value of raw.items)
    if (record(value) && typeof value.isAugment === 'boolean')
      add(value.isAugment ? 'augment' : 'item', value);
  if (!Object.keys(assets).length) throw new Error('TFT 정적 데이터가 비어 있습니다.');
  return {
    source: `https://raw.communitydragon.org/${version}/cdragon/tft/ko_kr.json`,
    version,
    fetchedAt,
    sets: [...sets].sort((a, b) => a - b),
    assets,
  };
}
/** Official Data Dragon is an exact-ID fallback when CDragon lacks an identifier. */
export function indexDataDragon(
  raw: unknown,
  kind: AssetKind,
  version: string,
  set?: number,
): AssetMap {
  if (!record(raw) || !record(raw.data))
    throw new Error('Data Dragon 데이터 구조가 올바르지 않습니다.');
  const assets: AssetMap = Object.create(null);
  for (const [id, value] of Object.entries(raw.data)) {
    if (!record(value) || typeof value.name !== 'string' || !value.name.trim()) continue;
    const im = record(value.image) ? value.image : undefined;
    const image =
      im && typeof im.group === 'string' && typeof im.full === 'string'
        ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/${encodeURIComponent(im.group)}/${encodeURIComponent(im.full)}`
        : undefined;
    const asset = { name: value.name, image };
    assets[assetKey(kind, id, set)] = asset;
    if (typeof value.id === 'string' || typeof value.id === 'number')
      assets[assetKey(kind, String(value.id), set)] = asset;
  }
  return assets;
}
