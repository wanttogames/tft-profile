import { parseRiotId } from '../utils/riotId';
import type { PlayerData } from '../types/riot';
const cache = new Map<string, { data: PlayerData; expires: number }>();
const pending = new Map<string, Promise<PlayerData>>();
let blockedUntil = 0;
export async function fetchPlayer(gameName: string, tagLine = ''): Promise<PlayerData> {
  ({ gameName, tagLine } = parseRiotId(gameName, tagLine));
  const key = `${gameName.trim().toLowerCase()}#${tagLine.replace(/^#/, '').trim().toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.data;
  if (pending.has(key)) return pending.get(key)!;
  if (blockedUntil > Date.now())
    throw new Error(
      `Riot API 요청이 많습니다. ${Math.ceil((blockedUntil - Date.now()) / 1000)}초 후 다시 시도해 주세요.`,
    );
  const job = (async () => {
    let r: Response;
    try {
      r = await fetch(
        '/api/tft/profile?' +
          new URLSearchParams({
            gameName: gameName.trim(),
            tagLine: tagLine.trim().replace(/^#/, ''),
          }),
        { signal: AbortSignal.timeout(55000) },
      );
    } catch {
      throw new Error('서버 연결이 지연되거나 끊겼습니다. 잠시 후 다시 시도해 주세요.');
    }
    if (!r.headers.get('content-type')?.includes('application/json'))
      throw new Error(
        import.meta.env.DEV
          ? 'API 서버에 연결할 수 없습니다. 로컬에서는 npm run dev:api도 실행해 주세요.'
          : 'Cloudflare API에 연결할 수 없습니다. Pages Functions 배포 상태를 확인해 주세요.',
      );
    const json = await r.json();
    if (!r.ok) {
      if (r.status === 429) {
        const seconds = Number(r.headers.get('Retry-After') ?? json.retryAfter);
        if (Number.isFinite(seconds) && seconds > 0) blockedUntil = Date.now() + seconds * 1000;
      }
      throw new Error(json.message || '전적을 불러오지 못했습니다.');
    }
    if (!Array.isArray(json.games) || !json.account)
      throw new Error('서버 데이터 형식을 확인할 수 없습니다.');

    if (cache.size >= 5) cache.delete(cache.keys().next().value!);
    cache.set(key, { data: json, expires: Date.now() + 120000 });
    return json as PlayerData;
  })().finally(() => pending.delete(key));
  pending.set(key, job);
  return job;
}
export interface SearchEntry {
  gameName: string;
  tagLine: string;
}
export function recentSearches(): SearchEntry[] {
  try {
    const x = JSON.parse(localStorage.getItem('tft-recent') || '[]');
    return Array.isArray(x)
      ? x
          .filter((v) => v && typeof v.gameName === 'string' && typeof v.tagLine === 'string')
          .slice(0, 5)
      : [];
  } catch {
    return [];
  }
}
export function saveSearch(entry: SearchEntry) {
  const entries = [
    entry,
    ...recentSearches().filter(
      (x) =>
        (x.gameName + '#' + x.tagLine).toLowerCase() !==
        (entry.gameName + '#' + entry.tagLine).toLowerCase(),
    ),
  ].slice(0, 5);
  try {
    localStorage.setItem('tft-recent', JSON.stringify(entries));
  } catch {
    /* Private mode / quota: search remains functional. */
  }
  return entries;
}
