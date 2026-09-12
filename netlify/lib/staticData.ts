import snapshot from '../data/tft-ko-snapshot.json';
import {
  assetKey,
  indexCommunityDragon,
  indexDataDragon,
  lookupAsset,
  type AssetKind,
  type AssetMap,
  type StaticCatalog,
} from '../../src/static-data/catalog';
import type { Game } from '../../src/types/riot';
const TTL = 24 * 60 * 60 * 1000;
let live: StaticCatalog | undefined;
let pending: Promise<StaticCatalog> | undefined;
let retryAt = 0;
const ddCache = new Map<string, { expires: number; value: AssetMap }>();
const ddPending = new Map<string, Promise<AssetMap>>();
async function json(url: string): Promise<unknown> {
  const r = await fetch(url, { signal: AbortSignal.timeout(5500) });
  if (!r.ok) throw new Error(`Static HTTP ${r.status}`);
  return r.json();
}
function staticVersion() {
  const v = process.env.TFT_STATIC_VERSION || 'latest';
  return /^(latest|\d+\.\d+)$/.test(v) ? v : 'latest';
}
async function catalog(): Promise<StaticCatalog> {
  const version = staticVersion();
  if (live?.version === version && Date.now() - Date.parse(live.fetchedAt) < TTL) return live;
  if (snapshot.version === version && Date.now() - Date.parse(snapshot.fetchedAt) < TTL)
    return snapshot as StaticCatalog;
  if (Date.now() < retryAt) return snapshot as StaticCatalog;
  if (pending) return pending;
  pending = (async () => {
    try {
      live = indexCommunityDragon(
        await json(`https://raw.communitydragon.org/${version}/cdragon/tft/ko_kr.json`),
        version,
      );
      return live;
    } catch {
      retryAt = Date.now() + 60 * 60 * 1000;
      return snapshot as StaticCatalog;
    } finally {
      pending = undefined;
    }
  })();
  return pending;
}
export interface AssetRequest {
  kind: AssetKind;
  id: string;
  set?: number;
}
export function requestedAssets(games: Game[]): AssetRequest[] {
  const requests = new Map<string, AssetRequest>();
  function add(kind: AssetKind, id: string, set?: number) {
    requests.set(assetKey(kind, id, set), { kind, id, set });
  }
  games.forEach((g) => {
    g.player.units.forEach((u) => {
      add('unit', u.character_id, g.set);
      (u.itemNames?.length ? u.itemNames : u.items.map(String)).forEach((id) => add('item', id));
    });
    g.player.traits.forEach((t) => add('trait', t.name, g.set));
  });
  return [...requests.values()];
}
async function officialFallback(version: string, set: number): Promise<AssetMap> {
  const match = version.match(/(?:Version\s+)?(\d+)\.(\d+)\./);
  if (!match) return {};
  const key = `${match[1]}.${match[2]}:${set}`;
  const hit = ddCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  if (ddPending.has(key)) return ddPending.get(key)!;
  const job = (async () => {
    const versions = await json('https://ddragon.leagueoflegends.com/api/versions.json');
    const v = Array.isArray(versions)
      ? versions.find((v) => typeof v === 'string' && v.startsWith(`${match[1]}.${match[2]}.`))
      : undefined;
    if (!v) return {};
    const combined: AssetMap = {};
    const types: [AssetKind, string][] = [
      ['unit', 'champion'],
      ['item', 'item'],
      ['trait', 'trait'],
    ];
    const results = await Promise.allSettled(
      types.map(async ([kind, file]) =>
        indexDataDragon(
          await json(`https://ddragon.leagueoflegends.com/cdn/${v}/data/ko_KR/tft-${file}.json`),
          kind,
          v,
          kind === 'unit' || kind === 'trait' ? set : undefined,
        ),
      ),
    );
    for (const result of results)
      if (result.status === 'fulfilled') Object.assign(combined, result.value);
    if (ddCache.size >= 8) ddCache.delete(ddCache.keys().next().value!);
    ddCache.set(key, { value: combined, expires: Date.now() + TTL });
    return combined;
  })().finally(() => ddPending.delete(key));
  ddPending.set(key, job);
  return job;
}
export async function loadGameAssets(
  games: Game[],
): Promise<{ assets: AssetMap; warnings: string[]; source: string; fetchedAt: string }> {
  const source = await catalog();
  const requests = requestedAssets(games),
    assets: AssetMap = {},
    warnings: string[] = [];
  for (const r of requests) {
    const asset = lookupAsset(source.assets, r.kind, r.id, r.set);
    if (asset) assets[assetKey(r.kind, r.id, r.set)] = asset;
  }
  let missing = requests.filter((r) => !assets[assetKey(r.kind, r.id, r.set)]);
  // Bound fallback work: latest played patch only. Never issue one lookup per game or identifier.
  if (missing.length && games[0]) {
    try {
      const fallback = await officialFallback(games[0].version, games[0].set);
      for (const r of missing) {
        const asset = lookupAsset(fallback, r.kind, r.id, r.set);
        if (asset) assets[assetKey(r.kind, r.id, r.set)] = asset;
      }
    } catch {
      /* Original IDs remain visible and the match itself stays usable. */
    }
  }
  missing = requests.filter((r) => !assets[assetKey(r.kind, r.id, r.set)]);
  if (missing.length)
    warnings.push(
      `한글 이름 ${missing.length}개를 정적 데이터에서 찾지 못해 원본 ID로 표시합니다.`,
    );
  if (Date.now() - Date.parse(source.fetchedAt) >= TTL)
    warnings.push('정적 데이터 갱신에 실패해 저장된 한글 이름을 사용합니다.');
  return { assets, warnings, source: source.source, fetchedAt: source.fetchedAt };
}

// Aggregate IDs only, no raw match data or patch guess needed.
export async function loadMetaAssets(requests: AssetRequest[]): Promise<AssetMap> {
  const source = await catalog();
  const assets: AssetMap = {};
  for (const request of requests) {
    const asset =
      lookupAsset(source.assets, request.kind, request.id) ??
      Object.entries(source.assets).find(
        ([key]) => key.startsWith(request.kind + ':') && key.endsWith(':' + request.id),
      )?.[1];
    if (asset) assets[assetKey(request.kind, request.id)] = asset;
  }
  return assets;
}
