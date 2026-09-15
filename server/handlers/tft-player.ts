import type { ApiEnv } from '../env';
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
export { cacheValue as cached } from '../lib/profileCache';
import { cacheValue, TTL, type EdgeCache } from '../lib/profileCache';
import { readMatches, writeMatches, compactMatch } from '../lib/profileMatchCache';
// Shared within an isolate only; cache reuse is the primary cross-request protection.
let active = 0;
const waiters: (() => void)[] = [];
async function acquire() {
  if (active >= 4) await new Promise<void>((resolve) => waiters.push(resolve));
  else active++;
}
function release() {
  const next = waiters.shift();
  if (next) next();
  else active--;
}
let cooldown = 0;
let nextStart = 0;
async function riot<T>(
  host: string,
  path: string,
  key: string,
  deadline?: AbortSignal,
  onRequest?: () => void,
): Promise<T> {
  await acquire();
  try {
    const start = Math.max(Date.now(), nextStart);
    nextStart = start + 80;
    if (start > Date.now()) await new Promise((resolve) => setTimeout(resolve, start - Date.now()));
    if (deadline?.aborted) throw new ApiError(504, 'Riot 요청이 중단됐습니다.');
    if (cooldown > Date.now()) {
      const seconds = Math.ceil((cooldown - Date.now()) / 1000);
      throw new ApiError(
        429,
        `Riot API 요청이 많습니다. ${seconds}초 후 다시 시도해 주세요.`,
        seconds,
      );
    }
    let r: Response;
    try {
      onRequest?.();
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
        const header = r.headers.get('retry-after');
        const raw = Number(header);
        const seconds =
          header && Number.isFinite(raw) && raw >= 0
            ? Math.max(1, Math.ceil(raw))
            : Math.max(1, Math.ceil((Date.parse(header || '') - Date.now()) / 1000) || 1);
        cooldown = Date.now() + seconds * 1000;
        throw new ApiError(
          429,
          `Riot API 요청이 많습니다. ${seconds}초 후 다시 시도해 주세요.`,
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
        messages[r.status] ||
          'Riot API에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
    return (await r.json()) as T;
  } finally {
    release();
  }
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
          if (!failure || (e instanceof ApiError && e.status === 429)) failure = e;
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
  window = { version: 'latest' },
  env: ApiEnv = {},
  edge?: EdgeCache,
  origin?: string,
): Promise<PlayerData> {
  const reuse = <T>(id: string, ttl: number, fn: () => Promise<T>) =>
    cacheValue(id, ttl, fn, edge, origin);
  let profileHit = false;
  const result = await cacheValue(
    `profile:${ANALYSIS_MATCH_COUNT}:${window.version}:${gameName.toLowerCase()}#${tagLine.toLowerCase()}`,
    120000,
    async () => {
      let riotRequests = 0;
      let riotMatchRequests = 0;
      const enc = encodeURIComponent;
      const abort = new AbortController();
      const deadline = AbortSignal.any([abort.signal, AbortSignal.timeout(45000)]);
      const request = async <T>(host: string, path: string, key: string) => {
        try {
          return await riot<T>(host, path, key, deadline, () => {
            riotRequests++;
            if (path.startsWith('/tft/match/v1/matches/') && !path.includes('/by-puuid/'))
              riotMatchRequests++;
          });
        } catch (error) {
          if (error instanceof ApiError && error.status === 429) abort.abort();
          throw error;
        }
      };
      const account = await reuse<Account>(
        `account:${gameName.toLowerCase()}#${tagLine.toLowerCase()}`,
        TTL.account,
        () =>
          request<Account>(
            'asia',
            `/riot/account/v1/accounts/by-riot-id/${enc(gameName)}/${enc(tagLine)}`,
            key,
          ),
      );
      if (typeof account?.puuid !== 'string')
        throw new ApiError(502, 'Riot 계정 데이터 형식을 확인할 수 없습니다.');
      const [leagues, ids] = await Promise.all([
        reuse(`rank:${account.puuid}`, TTL.rank, () =>
          request<League[]>('kr', `/tft/league/v1/by-puuid/${enc(account.puuid)}`, key),
        ),
        reuse(`matchIds:${ANALYSIS_MATCH_COUNT}:${account.puuid}`, TTL.matchIds, () =>
          request<string[]>(
            'asia',
            `/tft/match/v1/matches/by-puuid/${enc(account.puuid)}/ids?start=0&count=${ANALYSIS_MATCH_COUNT}`,
            key,
          ),
        ),
      ]);
      if (
        !Array.isArray(ids) ||
        ids.some((id) => typeof id !== 'string') ||
        !Array.isArray(leagues)
      )
        throw new ApiError(502, 'Riot 전적 데이터 형식을 확인할 수 없습니다.');
      const unique = [...new Set(ids)].slice(0, ANALYSIS_MATCH_COUNT);
      const hits = await readMatches(env, unique);
      const missing = unique.filter((id) => !hits.has(id));
      const fresh: Match[] = [];
      try {
        await limitedMap(missing, 3, async (id) => {
          const match = await cacheValue<Match>(
            'match:' + id,
            TTL.match,
            async () => {
              const raw = await request<Match>('asia', `/tft/match/v1/matches/${enc(id)}`, key);
              if (!validMatch(raw) || raw.metadata.match_id !== id)
                throw new ApiError(502, 'Riot 경기 데이터 형식을 확인할 수 없습니다.');
              return compactMatch(raw);
            },
            undefined,
            origin,
          );
          fresh.push(match);
          hits.set(id, match);
        });
      } finally {
        await writeMatches(env, fresh);
        console.log(
          '[profile]',
          JSON.stringify({
            analysisMatches: ANALYSIS_MATCH_COUNT,
            riotRequests,
            matchIds: unique.length,
            matchCacheHit: unique.length - missing.length,
            matchCacheMiss: missing.length,
            riotMatchRequests,
            profileCache: 'MISS',
          }),
        );
      }
      const matches = unique.map((id) => hits.get(id)!);
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
      const staticResult = games.length ? await loadGameAssets(games, window.version) : null;
      if (staticResult) warnings.push(...staticResult.warnings);
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
    },
    edge,
    origin,
    () => {
      profileHit = true;
    },
  );
  if (profileHit)
    console.log(
      '[profile]',
      JSON.stringify({
        analysisMatches: ANALYSIS_MATCH_COUNT,
        profileCache: 'HIT',
        riotRequests: 0,
      }),
    );
  return result;
}
export default async function handler(
  request: Request,
  env: ApiEnv,
  edge?: EdgeCache,
): Promise<Response> {
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

    const key = env.RIOT_API_KEY?.trim();
    if (!key) throw new ApiError(503, 'Riot API Key가 설정되지 않았습니다.');
    return Response.json(
      await loadPlayer(
        name,
        tag,
        key,
        {
          version: env.TFT_STATIC_VERSION ?? 'latest',
        },
        env,
        edge,
        new URL(request.url).origin,
      ),
      { headers },
    );
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
