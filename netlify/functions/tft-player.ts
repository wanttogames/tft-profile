import { ANALYSIS_MATCH_COUNT } from '../../src/config/analysis';
import { loadGameAssets } from '../lib/staticData';
import { parseParticipant, ParticipantParseError } from '../lib/matchParticipant';
import { parseRiotId } from '../../src/utils/riotId';
import type { Account, Game, League, Match, PlayerData } from '../../src/types/riot';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter = 0,
  ) {
    super(message);
  }
}
type Entry<T> = { value: T; expires: number };
const cache = new Map<string, Entry<unknown>>();
const pending = new Map<string, Promise<unknown>>();
let cooldown = 0;
const recentRequests: number[] = [];
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
export async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  if (pending.has(key)) return pending.get(key) as Promise<T>;
  const promise = fn()
    .then((value) => {
      if (cache.size >= 500) cache.delete(cache.keys().next().value!);
      cache.set(key, { value, expires: Date.now() + ttl });
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
async function reserve() {
  while (true) {
    if (Date.now() < cooldown)
      throw new ApiError(
        429,
        '요청 한도에 도달했습니다. 잠시 후 다시 검색해 주세요.',
        Math.ceil((cooldown - Date.now()) / 1000),
      );
    const now = Date.now();
    while (recentRequests.length && recentRequests[0]! < now - 120000) recentRequests.shift();
    if (recentRequests.length >= 90)
      throw new ApiError(429, '조회가 많아 잠시 쉬고 있습니다. 약 2분 뒤 다시 검색해 주세요.', 120);
    const last = recentRequests.at(-1) || 0;
    if (now - last >= 80) {
      recentRequests.push(now);
      return;
    }
    await pause(80 - (now - last));
  }
}
async function riot<T>(
  host: string,
  path: string,
  key: string,
  deadline?: AbortSignal,
): Promise<T> {
  await reserve();
  let r: Response;
  try {
    r = await fetch(`https://${host}.api.riotgames.com${path}`, {
      headers: { 'X-Riot-Token': key },
      signal: deadline
        ? AbortSignal.any([deadline, AbortSignal.timeout(7000)])
        : AbortSignal.timeout(7000),
    });
  } catch {
    throw new ApiError(504, 'Riot API 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (!r.ok) {
    if (r.status === 429) {
      const raw = Number(r.headers.get('retry-after'));
      const seconds = Number.isFinite(raw) && raw > 0 ? Math.min(raw, 300) : 120;
      cooldown = Date.now() + seconds * 1000;
      throw new ApiError(
        429,
        'Riot API 요청 한도에 도달했습니다. 안내된 시간 후 다시 시도해 주세요.',
        seconds,
      );
    }
    const messages: Record<number, string> = {
      401: 'Riot API Key 인증에 실패했습니다.',
      403: 'Riot API Key가 만료되었거나 TFT API 권한이 없습니다.',
      404: '플레이어 또는 경기 정보를 찾을 수 없습니다. Riot ID와 한국 서버를 확인해 주세요.',
    };
    throw new ApiError(
      r.status >= 500 ? 502 : r.status,
      messages[r.status] || 'Riot API에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    );
  }
  return r.json() as Promise<T>;
}
/** Bounded fan-out; no new work starts after any request fails, including 429. */
export async function limitedMap<T, R>(
  input: T[],
  limit: number,
  fn: (v: T) => Promise<R>,
): Promise<R[]> {
  const output: R[] = new Array(input.length);
  let next = 0;
  let failed = false;
  let failure: unknown;
  await Promise.all(
    Array.from({ length: Math.min(limit, input.length) }, async () => {
      while (!failed) {
        const i = next++;
        if (i >= input.length) return;
        try {
          output[i] = await fn(input[i]!);
        } catch (e) {
          failed = true;
          failure = e;
        }
      }
    }),
  );
  if (failed) throw failure;
  return output;
}
function validMatch(m: Match): boolean {
  return (
    !!m?.metadata?.match_id &&
    Number.isFinite(m?.info?.game_datetime) &&
    Number.isFinite(m.info.game_length) &&
    typeof m.info.game_version === 'string' &&
    Number.isInteger(m.info.tft_set_number) &&
    Number.isInteger(m.info.queue_id) &&
    Array.isArray(m.info.participants)
  );
}
export function toGame(m: Match, puuid: string): Game | null {
  if (!validMatch(m)) throw new ApiError(502, 'Riot 경기 데이터 형식을 확인할 수 없습니다.');
  if (m.info.queue_id !== 1100) return null;
  let participant;
  try {
    participant = parseParticipant(m.info.participants, puuid);
  } catch (error) {
    if (error instanceof ParticipantParseError) throw new ApiError(502, error.message);
    throw error;
  }
  if (!participant)
    throw new ApiError(502, '검색한 PUUID와 일치하는 참가자가 경기 응답에 없습니다.');
  return {
    id: m.metadata.match_id,
    date: m.info.game_datetime,
    duration: m.info.game_length,
    version: m.info.game_version,
    set: m.info.tft_set_number,
    player: participant,
  };
}
export async function loadPlayer(
  gameName: string,
  tagLine: string,
  key: string,
): Promise<PlayerData> {
  return cached(`player:${gameName.toLowerCase()}#${tagLine.toLowerCase()}`, 120000, async () => {
    const enc = encodeURIComponent;
    const deadline = AbortSignal.timeout(35000);
    const request = <T>(host: string, path: string, key: string) =>
      riot<T>(host, path, key, deadline);
    const account = await request<Account>(
      'asia',
      `/riot/account/v1/accounts/by-riot-id/${enc(gameName)}/${enc(tagLine)}`,
      key,
    );
    if (typeof account?.puuid !== 'string')
      throw new ApiError(502, 'Riot 계정 데이터 형식을 확인할 수 없습니다.');
    const [leagues, ids] = await Promise.all([
      request<League[]>('kr', `/tft/league/v1/by-puuid/${enc(account.puuid)}`, key),
      request<string[]>(
        'asia',
        `/tft/match/v1/matches/by-puuid/${enc(account.puuid)}/ids?start=0&count=${ANALYSIS_MATCH_COUNT}`,
        key,
      ),
    ]);
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string') || !Array.isArray(leagues))
      throw new ApiError(502, 'Riot 전적 데이터 형식을 확인할 수 없습니다.');
    const matches = await limitedMap([...new Set(ids)].slice(0, ANALYSIS_MATCH_COUNT), 3, (id) =>
      cached<Match>('match:' + id, 3600000, () =>
        request('asia', `/tft/match/v1/matches/${enc(id)}`, key),
      ),
    );
    const eligible = matches
      .map((m) => toGame(m, account.puuid))
      .filter((g): g is Game => !!g)
      .sort((a, b) => b.date - a.date);
    const set = eligible[0]?.set;
    const games = eligible.filter((g) => g.set === set).slice(0, ANALYSIS_MATCH_COUNT);
    const warnings: string[] = [];
    if (games.length < ANALYSIS_MATCH_COUNT)
      warnings.push(
        `최근 ${ids.length}경기를 조회해 최신 플레이 세트의 랭크 ${games.length}경기를 찾았습니다. 일반·더블 업·이전 세트는 제외합니다.`,
      );
    const staticResult = games.length ? await loadGameAssets(games) : null;
    if (staticResult) warnings.push(...staticResult.warnings);
    const augmentErrors = games.filter((g) => g.player.augmentStatus === 'parse-error').length;
    if (augmentErrors)
      warnings.push(`증강 데이터 파싱 오류 ${augmentErrors}경기: 증강 통계에서 제외했습니다.`);
    const missingAugments = games.filter((g) => g.player.augmentStatus === 'missing').length;
    if (missingAugments)
      warnings.push(
        `증강체 정보가 없는 ${missingAugments}경기는 증강체 분석의 분모에서 제외합니다.`,
      );
    return {
      account: {
        puuid: account.puuid,
        gameName: account.gameName || gameName,
        tagLine: account.tagLine || tagLine,
      },
      rank: leagues.find((l) => l.queueType === 'RANKED_TFT') || null,
      games,
      assets: staticResult?.assets ?? {},
      staticData: staticResult
        ? { source: staticResult.source, fetchedAt: staticResult.fetchedAt }
        : undefined,
      warnings,
      fetchedAt: Date.now(),
      scanned: ids.length,
    };
  });
}
export default async function handler(request: Request): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
  try {
    if (request.method !== 'GET')
      return Response.json(
        { message: 'GET 요청만 지원합니다.' },
        { status: 405, headers: { ...headers, Allow: 'GET' } },
      );
    const params = new URL(request.url).searchParams;
    let id;
    try {
      id = parseRiotId(
        params.get('riotId') ?? params.get('gameName') ?? '',
        params.get('tagLine') ?? '',
      );
    } catch (error) {
      throw new ApiError(400, error instanceof Error ? error.message : 'Riot ID를 확인해 주세요.');
    }
    const { gameName: name, tagLine: tag } = id;
    const key = process.env.RIOT_API_KEY?.trim();
    if (!key) throw new ApiError(503, 'Riot API Key가 설정되지 않았습니다.');
    return Response.json(await loadPlayer(name, tag, key), { headers });
  } catch (e) {
    const err =
      e instanceof ApiError
        ? e
        : new ApiError(502, '전적을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    if (err.retryAfter) headers['Retry-After'] = String(err.retryAfter);
    return Response.json(
      { message: err.message, retryAfter: err.retryAfter },
      { status: err.status, headers },
    );
  }
}
