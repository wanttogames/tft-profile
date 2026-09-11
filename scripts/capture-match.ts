/** Capture a real response locally; never fetch Riot through a browser or persist API keys. */
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
import { parseRiotId } from '../src/utils/riotId';
import { augmentFields, parseAugments } from '../netlify/lib/augmentParser';

Object.assign(process.env, loadEnv('development', process.cwd(), ''));
async function main() {
  const { gameName, tagLine } = parseRiotId(process.argv[2] || '');
  const key = process.env.RIOT_API_KEY;
  if (!key) throw new Error('.env에 RIOT_API_KEY를 설정하세요. 키를 명령행에 입력하지 마세요.');
  const get = async (path: string): Promise<unknown> => {
    const response = await fetch(`https://asia.api.riotgames.com${path}`, {
      headers: { 'X-Riot-Token': key },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new Error(
        `Riot HTTP ${response.status}${response.status === 429 ? ': 요청 한도 초과. 잠시 후 다시 시도하세요.' : ''}`,
      );
    return response.json();
  };
  const enc = encodeURIComponent;
  const account = (await get(
    `/riot/account/v1/accounts/by-riot-id/${enc(gameName)}/${enc(tagLine)}`,
  )) as { puuid?: string };
  if (typeof account?.puuid !== 'string') throw new Error('ACCOUNT-V1 PUUID 응답 오류');
  let id = process.argv[3];
  if (!id) {
    const ids = await get(
      `/tft/match/v1/matches/by-puuid/${enc(account.puuid)}/ids?start=0&count=1`,
    );
    if (!Array.isArray(ids) || typeof ids[0] !== 'string') throw new Error('최근 경기 없음');
    id = ids[0];
  }
  const raw = (await get(`/tft/match/v1/matches/${enc(id!)}`)) as {
    info?: { participants?: Record<string, unknown>[] };
  };
  const participants = raw?.info?.participants;
  if (!Array.isArray(participants)) throw new Error('info.participants 응답 오류');
  const selected = participants.find((p) => p.puuid === account.puuid);
  if (!selected) throw new Error('검색한 PUUID와 일치하는 participant 없음');
  console.log('검색 참가자 증강 진단:', {
    fields: augmentFields(selected),
    ...parseAugments(selected),
  });
  const aliases = new Map(
    participants
      .filter((p) => typeof p.puuid === 'string')
      .map((p, i) => [p.puuid, `fixture-player-${i + 1}`]),
  );
  // Preserve wire keys/values except identifiers. Never write account data or request headers.
  const anonymize = (value: unknown, key = ''): unknown => {
    if (typeof value === 'string') {
      if (aliases.has(value)) return aliases.get(value);
      if (/riotId|summonerName|summonerId|accountId/i.test(key)) return 'anonymized';
      return value;
    }
    if (Array.isArray(value)) return value.map((v) => anonymize(v, key));
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, anonymize(v, k)]));
    return value;
  };
  await mkdir('diagnostics', { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `diagnostics/riot-match-${stamp}.json`;
  const content = JSON.stringify(anonymize(raw), null, 2) + '\n';
  await writeFile(path, content, { flag: 'wx' });
  await writeFile(
    path.replace('.json', '.provenance.json'),
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        endpoint: '/tft/match/v1/matches/{matchId}',
        selectedPuuid: aliases.get(account.puuid),
        sha256: createHash('sha256').update(content).digest('hex'),
        transformation:
          'PUUIDs and Riot/summoner/account identifiers anonymized; all augment keys and values preserved',
      },
      null,
      2,
    ),
  );
  console.log(`저장 완료: ${path}`);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : '캡처 실패');
  process.exitCode = 1;
});
