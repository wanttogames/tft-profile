> 현재 배포 대상은 **Cloudflare Pages + Pages Functions**입니다. 최신 설정/경로/로컬 실행은 [Cloudflare 전환 안내](docs/cloudflare-migration.md)를 따르세요. 아래 Netlify 배포 설명은 이전 구성의 기록입니다.

# TFT PROFILE

**“무엇이 강한가”보다 “나는 어떻게 플레이하고 있는가”.** 최근 **30경기 조회 범위**에서 완료된 TFT 랭크 경기를 분석하는 Vue 3 개인 대시보드입니다.

## 제공 기능

- Riot ID(`게임이름#태그`) → ACCOUNT-V1 PUUID → 한국 서버 TFT 리그 / 경기 조회.
- 최대 30경기를 표본으로 평균 등수·TOP4·1등률, 스타일 비율, 플레이어 카드, 강점/살펴볼 점, 덱 다양성, 고점/저점, 순방 실패 보드 분석.
- 최근 폼은 **최근 15경기 vs 이전 15경기** 비교. 30경기 미만일 때 15 대 15 비교를 표시하지 않습니다. 카드 폼 점수는 20경기부터 표시합니다. 최근 5경기 평균은 보조 지표입니다.
- 선호 챔피언·아이템·활성 특성 TOP 10: 사용 경기 수, 사용 비율, 평균 등수, TOP4 비율. 아이템 장착 개수는 별도 표시.
- TFT PLAYER PROFILE: Riot ID, 티어/LP, 평균 등수/TOP4/1등률, 규칙 기반 성향, 6개 점수, 선호 특성·핵심 유닛 TOP 3, 한줄 분석.
- 챔피언·특성 사용 집중도와 플레이어 피해량·처치·라운드 요약, 고점/저점 챔피언·특성 TOP 3 및 레벨 차이.
- 실제 응답에서 증강 선택 정보를 제공하지 않는 것을 사용자가 확인하여 증강 분석·화면·경고·진단 명령을 제거했습니다.
- 유닛·아이템·특성의 한글 이름. 내부 ID와 정적 데이터의 명시적인 식별자로 연결하며 접두사 추측/수동 이름 사전은 사용하지 않습니다.
- 목록은 처음 **10경기**만 렌더링하고 `더 보기`로 10개씩 추가합니다. 목록의 표시 개수는 분석 표본에 영향을 주지 않습니다.
- 30경기의 가상 샘플 분석. 샘플임을 명확히 표시하며 API 키 없이 UI를 둘러볼 수 있습니다.

친구 비교, PNG 카드 내보내기, Production RSO 인증은 후속 범위입니다.

## 기술 스택

Vue 3 Composition API / `<script setup>` / TypeScript / Vite / Netlify Functions / Vitest. 그래프는 SVG로 그립니다. 별도 차트 라이브러리나 LLM 호출은 없습니다.

## 로컬 실행

Node.js 20.19 이상 (Actions: Node 20). Windows PowerShell:

```powershell
git clone https://github.com/wanttogames/tft-profile.git
cd tft-profile
npm ci
Copy-Item .env.example .env
```

`.env`를 직접 편집합니다.

```dotenv
RIOT_API_KEY=발급받은_키
```

두 개의 터미널에서 실행:

```bash
npm run dev:api
```

```bash
npm run dev
```

Vite에 표시되는 주소(기본 `http://localhost:5173`)를 엽니다. `dev:api`는 배포용 Netlify handler를 그대로 사용하는 가벼운 로컬 서버입니다. Netlify CLI가 있으면 `netlify dev`로 플랫폼 환경을 확인할 수도 있습니다. `npm run preview`는 정적 빌드 확인용으로 API 서버를 포함하지 않습니다.

## Riot 키 발급 / Netlify 설정

1. [Riot Developer Portal](https://developer.riotgames.com/)에서 로그인하고 TFT 사용 권한이 있는 Development API Key를 발급합니다. Development Key는 일반적으로 24시간 후 만료되므로 인증 오류 시 재생성과 권한을 확인합니다.
2. Netlify에서 GitHub의 `wanttogames/tft-profile` 저장소를 연결합니다.
3. 브랜치 `main`, Build command `npm run build`, Publish directory `dist`, Functions directory `netlify/functions`. `netlify.toml`에 설정되어 있습니다.
4. Netlify 환경변수 **`RIOT_API_KEY`**를 Functions에 적용하고 배포합니다. 키를 변경했다면 재배포하세요.
5. 배포 완료 후 한국 서버 Riot ID를 검색합니다. 이름/태그를 나눠 입력하거나 이름 칸에 `게임이름#태그` 전체를 붙여넣을 수 있습니다.

키는 서버의 `X-Riot-Token` 헤더로만 전송합니다. **`VITE_RIOT_API_KEY`를 만들거나 키를 소스·Git·채팅에 넣지 마세요.** 키가 없으면 “Riot API Key가 설정되지 않았습니다.”라는 안내를 표시합니다.

공개 서비스 운영 전에는 Riot 제품 등록, 적합한 Production Key 및 RSO 승인 조건을 확인해야 합니다. 이 MVP가 Production 운영 승인을 받은 것은 아닙니다. 실시간 scouting, 게임 중 동적 추천, MMR/ELO 추정은 포함하지 않습니다.

## 정확한 30경기 범위

공식 Match-V1 목록 endpoint에 `start=0&count=30`을 보냅니다. 최대 30개의 고유 ID 상세를 읽고 `queue_id === 1100`인 랭크 경기만 남깁니다. 이 중 가장 최근 플레이 세트에 속하는 **최대 30경기**가 모든 분석에 전달됩니다.

따라서 일반·더블 업·과거 세트가 섞이거나 기록 자체가 부족하면 실제 표본은 50개 미만입니다. 추가 페이지를 조회해서 채우지는 않습니다. UI에 “최근 30경기 기준 · N경기 분석”과 제외 안내를 표시합니다. 최신 플레이 세트는 사용자의 최근 랭크 경기 세트이며 현재 운영 세트를 추측해서 고르는 값이 아닙니다.

세트는 섞지 않지만 같은 세트의 서로 다른 패치는 포함될 수 있습니다. 고점·저점·선호 항목의 통계는 관찰된 관계이며 원인이나 메타의 우열을 의미하지 않습니다.

## 한글 이름 매핑과 갱신

기본 소스는 [CommunityDragon의 ko_kr TFT 데이터](https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json)입니다. CommunityDragon이 Riot 게임 파일에서 추출·구성한 커뮤니티 데이터이며 Riot이 직접 제공하는 API 응답은 아닙니다. [제공자 문서](https://github.com/CommunityDragon/Docs/blob/master/assets.md)를 참고하세요.

`src/static-data/catalog.ts`가 아래 구조를 인덱싱합니다.

| 종류   | 실제 소스 필드                                           | 앱 조회 키    |
| ------ | -------------------------------------------------------- | ------------- |
| 유닛   | sets / setData의 champions: apiName, characterName, name | unit:세트:ID  |
| 특성   | sets / setData의 traits: apiName, name                   | trait:세트:ID |
| 아이템 | items: isAugment=false, apiName, 명시적 id, name         | item:*:ID     |

현재 데이터의 `DA_18_Sejuani`는 그 자체로 세주아니의 apiName입니다. 이를 `TFT18_Sejuani` 등으로 고쳐 추측하지 않습니다. 세트별 키로 이름 충돌을 막고, UI 전체는 `lookupAsset` / `displayName`을 사용합니다.

- `netlify/data/tft-ko-snapshot.json`: 서버 전용 압축 인덱스. 이름·이미지 경로 등 필요한 필드만 보관하며 클라이언트 번들에 전체 데이터를 넣지 않습니다.
- `netlify/lib/staticData.ts`: 24시간 캐시/스냅샷 사용, 오래된 경우 런타임 갱신, 실패 시 기존 사본 사용. 갱신 실패 후 1시간 재시도 대기.
- 기본 소스에 없는 ID는 최근 경기 패치의 공식 Data Dragon `ko_KR` 유닛·아이템·특성 데이터로 한 번 더 조회합니다. 지원되지 않는 과거 패치/ID는 원본 ID로 표시하고 누락 수를 안내합니다.
- 응답에는 해당 분석에서 사용하는 이름만 넣습니다. 게임마다 전체 정적 데이터를 다시 내려받지 않습니다.

수동 갱신:

```bash
npm run update:static
npm test
npm run build
```

갱신된 snapshot JSON도 커밋하고 배포하세요. 기본 버전은 `latest`입니다. 특정 버전을 고정하려면 서버 환경변수 `TFT_STATIC_VERSION`에 CommunityDragon의 `major.minor` 값을 지정할 수 있습니다. 실제 지원 버전이어야 합니다. 로컬 갱신 스크립트에도 같은 환경변수를 지정하세요. 오래된 이름 사본을 사용할 수 있으므로 과거 경기의 표시 이름이 그 경기 패치 당시 명칭과 항상 일치하는 것은 아닙니다.

## 보드 분석과 표본 기준

- `info.participants`에서 ACCOUNT-V1 PUUID와 일치하는 객체를 선택합니다. 개인 분석은 `units`, `itemNames`, `traits`, `placement`, `level`, `last_round`를 사용합니다.
- 챔피언과 활성 특성(`tier_current > 0`)은 한 경기의 같은 ID를 1회로 집계합니다. 아이템도 성적 계산은 경기당 1회이며 장착 개수는 별도 합산합니다. 아이템 보유량·구매·조합 과정은 알 수 없습니다.
- 사용 비율의 분모는 해당 보드 기록이 있는 경기입니다. 빈 유닛 배열은 챔피언·아이템 표본에서, 빈 특성 배열은 특성 표본에서 제외합니다. 항목 3경기 미만은 성적을 표시하되 `표본 부족`을 함께 표시합니다.
- 핵심 유닛은 최종 아이템 2개 이상을 장착한 유닛의 사용 경기 수 TOP 3입니다. 실제 캐리 여부를 단정하지 않습니다.
- 챔피언·특성 의존도는 최다 사용 항목의 경기 비율로 표시합니다. 보조 유닛·특성 반복일 수 있어 과도한 의존을 뜻하지 않습니다.
- 마지막 라운드는 API 번호 그대로의 평균입니다. 최근 응답에서 일관되게 0인 피해량·처치 필드는 개인 카드 점수·칭호·문구에 사용하지 않습니다.
- 1~~2위와 7~~8위 집단 각각의 챔피언·특성 TOP 3와 평균 최종 레벨을 비교합니다. 차이 해석은 각 집단 3경기 이상부터 표시합니다. 인과관계는 주장하지 않습니다.

## TFT PLAYER PROFILE 계산 기준

점수는 5경기 이상부터 제공하며, 0~100 범위의 자체 기록 요약입니다. **Riot 공식 실력·백분위 지표가 아닙니다.**

고점력(1등·1~~2등·평균), 안정성(TOP4·7~~8등·표준편차), 순방력(TOP4·3~4등), 후반 운영력(레벨·라운드), 덱 다양성, 유연성, 보드 완성도(별 등급·완성 아이템·활성 특성 단계), 최근 폼의 8개 지표를 사용합니다. 상세 가중치와 근거는 `src/analytics/playerScores.ts` 및 화면 도움말에 있습니다.

카드 최근 폼 점수는 최근 10경기와 직전 10~20경기를 비교하며 최소 20경기가 필요합니다. 전체 폼 변화와 YOU VS PAST YOU는 15경기씩 두 집단을 비교하므로 30경기가 필요합니다.
칭호는 최소 20경기·보드 및 활성 특성 기록 80%와 여러 지표를 함께 요구합니다. 선호 항목의 최소 사용 표본 3회는 유지하며 2회 이하는 표본 부족으로 표시합니다. 이 지표들은 최종 결과의 자체 요약이며 경기 중 전환 능력이나 실력을 확정하지 않습니다.

## API 호출 보호

프로필은 `/api/tft/profile` 한 번으로 최대 30경기를 반환합니다.
Cloudflare Cache API: 프로필 120초, Account 7일, Rank 5분, Match IDs 120초.
Supabase `tft_profile_match_cache`: 전체 참가자를 포함한 경기 JSON을 7일 보관하며 batch 조회/upsert합니다.
Riot 429의 Retry-After만 대기 안내에 사용하며 임의 90회 차단은 없습니다.
배포 전 SQL, 일일 cleanup, Cloudflare 플랜 조건 및 호출량은 [프로필 캐시 운영](docs/profile-cache.md)을 확인하세요.

## 구조

```text
src/config/analysis.ts          # 기본 30경기 / 15경기 폼 / 10개 목록
src/static-data/catalog.ts      # 순수 한글 매핑과 fallback
src/analytics/preferences.ts    # 챔피언·아이템·특성 TOP 10
src/analytics/profileAnalysis.ts # 다중 지표 성향·집중도·고점/저점
src/analytics/playerScores.ts    # 카드 6개 점수 순수 함수
src/analytics/*.ts              # 등수·폼·스타일·점수·다양성
src/components/*.vue            # 표시 전용 컴포넌트
netlify/functions/tft-player.ts # ACCOUNT → PUUID → 30경기
netlify/lib/matchParticipant.ts # 실응답 파싱 / 선택 필드
netlify/lib/staticData.ts       # 정적 데이터 캐시 / 갱신
netlify/data/tft-ko-snapshot.json
scripts/update-static.ts
tests/fixtures/                 # 실응답·ko_kr 정적 데이터 발췌 및 출처
```

## 검증

```bash
npm test
npm run build
```

30경기 통계·폼·점수, 호출 개수/중복/동시성/캐시/429, 실제 정적 데이터의 한글 유닛·아이템·특성 매핑, 부족 표본, 누락 피해량·처치, 성향 규칙, 증강 UI 제거, 10경기 초기 렌더링, 서버 정적 데이터 fallback을 fixture로 검증합니다.

**최신 세트 18 ko_kr 정적 데이터는 직접 확인했지만, 이 작업 환경에는 Riot 키와 사용자의 현재 Match 응답이 없어 최신 실제 계정 조회를 직접 검증하지 못했습니다.** Match fixture는 공개된 2023년 과거 응답을 익명화한 것입니다. 새로운 분석·30경기 HTTP 테스트에는 이를 명시적으로 변형한 데이터와 합성 fixture를 사용합니다. Vue 서버 렌더링 테스트는 실제 브라우저의 시각·클릭 검증을 대체하지 않습니다.

공식 경로 및 fixture 출처: [docs/API.md](docs/API.md), [tests/fixtures/README.md](tests/fixtures/README.md).

## ZIP 업데이트 시 삭제 파일 반영

압축 파일 덮어쓰기는 이전 버전의 삭제 파일을 지우지 않습니다. 기존 폴더에 새 ZIP을 적용했다면 프로젝트에서 아래 명령을 실행하세요. 이전 구현의 파서·테스트·캡처 스크립트 3개만 삭제합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\remove-obsolete-files.ps1
npm test
npm run build
git add -A
git commit -m "Remove obsolete analysis files"
git push origin main
```

`src/types/riot.ts`에 삭제된 기능의 필드를 복구할 필요는 없습니다. `git add -A`로 파일 삭제까지 커밋해야 Netlify에도 반영됩니다.

## 게임 프로필 / 재계산형 게임화

검색 결과는 PLAYER PROFILE → PLAY DNA → YOU VS PAST YOU → PERSONAL CHALLENGE → ACHIEVEMENTS → 기존 상세 분석 순서입니다. 계산은 `src/analytics/game/`의 순수 함수에 분리했습니다. 새 로그인·DB·영구 저장·추가 Riot 호출은 없습니다.

- PLAYER SCORE: 평균 등수 정규화 60% + TOP4 25% + 1등률 15%, 0~1000. 최소 5경기. 스타일 관련 보너스는 없습니다. 변화량은 최근 15경기 점수 − 이전 15경기 점수이며 과거 방문 시점의 점수가 아닙니다.
- PLAY DNA: 고점력, 안정성, 순방력, 후반 운영력, 덱 다양성, 유연성, 보드 완성도, 최근 폼을 최근 최대 30경기의 관측 가능한 결과와 최종 보드로 계산합니다. 각 공식과 고정 정규화 기준은 UI 도움말과 `playerScores.ts`에 있습니다. 최소 유효 표본 5개가 필요하며, 정적 데이터로 분류할 수 없는 아이템은 완성도 계산에서 제외합니다.
- 완성도는 최종 보드의 대리 지표입니다. 실제 완성 아이템 판별·벤치·구매 과정·의사결정을 평가하지 않습니다. 피해량·라운드는 생존 시간과 패치 영향을 받습니다. 점수는 Riot 공식 실력·백분위가 아닙니다.
- 대표 클래스: 최소 20경기·보드/특성 기록 80% 필요. DNA와 조합 반복·성과 조건을 함께 사용합니다. 조건이 겹치면 장인→승부사→파괴자→올라운드→탐험가→생존자 순으로 선택하고 그 외에는 중립 클래스를 표시합니다. 기준은 `playerClass.ts`에 명시했습니다.
- 업적은 최근 최대 30경기에서 달성 여부를 재계산합니다. 영구 획득·획득 시각·새 업적 알림을 가장하지 않습니다. 잠긴 HIDDEN은 이름·조건·실제 진행도를 UI에 넘기지 않습니다. 공개된 클라이언트 코드 자체의 조건까지 비밀로 보장하는 기능은 아닙니다.
- 도전은 현재 성적에 따라 최근 10경기 TOP4 5회 또는 1위 2회를 제시합니다. 10경기가 모여야 달성 처리하며, 다음 10경기나 주간 퀘스트로 표현하지 않습니다. 반환 객체의 id/window/target은 향후 시작 시점 기반 저장 모델과 구분해 확장할 수 있습니다.
- 연속 기록은 조회된 랭크 경기 순서 기준입니다. 제외된 모드의 경기는 포함하지 않습니다. 8위 다음 1위는 시간 순서로 판정합니다.
- 경기 피드백은 자신을 제외한 나머지 표본 최소 5개와 비교합니다. 보드 점수·3성 유닛 수·피해량·마지막 라운드에 특징적인 차이가 있을 때만 태그를 표시합니다.

기존 챔피언·아이템·특성·스타일·프로필 분석은 유지합니다. 합성 fixture로 빈 표본, optional 미제공/0, 반복·다양한 조합, 모든 상위/하위 결과, 연속 기록, 숨겨진 업적 시간 순서, 15경기 비교 및 화면 순서를 검증합니다.

## 상위 플레이어 메타 데이터베이스 설계

Supabase SQL Editor에서 실행할 초기 스키마는 `supabase/migrations/001_tft_meta_schema.sql`입니다. 테이블 관계, 수집 트랜잭션 계약, 패치별 집계 예시, 접근 권한과 검증은 [supabase/README.md](supabase/README.md)를 참고하세요. 수집기 설정은 아래 절차를 따릅니다.

### GitHub Actions 메타 Collector

1. 기존 001 스키마가 적용된 Supabase에서 `supabase/migrations/002_tft_collector_rpc.sql` 전체를 SQL Editor로 한 번 실행합니다. 001을 다시 실행하지 않습니다.
2. GitHub 저장소 **Settings → Secrets and variables → Actions → Repository secrets**에 `RIOT_API_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`를 등록합니다. Supabase의 서버용 secret key를 사용합니다. 키는 코드나 VITE_ 환경변수에 넣지 않습니다.
3. 변경 파일을 기본 브랜치에 push한 뒤 **Actions → Collect TFT meta → Run workflow**로 실행합니다. 이후 UTC 00:17/06:17/12:17/18:17에 예약 실행합니다. 예약은 기본 브랜치 기준이며 GitHub 사정으로 지연될 수 있습니다.
4. Actions Variables에서 `PLAYERS_LIMIT`(기본 2), `MATCHES_PER_PLAYER`(2), `RIOT_REQUEST_DELAY_MS`(1400)를 조정할 수 있습니다. 작업 제한은 30분입니다. 규모를 크게 늘리기 전 실제 API 제한과 실행 시간을 확인하세요.

`npm run collect:tft`는 process.env만 읽습니다. 로컬에서는 환경변수를 먼저 설정하거나 Node 20.19 이상에서 `node --env-file=.env --import tsx scripts/collector/run.ts`로 실행하세요. `.env`는 Git에 올리지 않습니다. Development Riot API Key는 만료되므로 지속 수집에는 적절한 키 관리가 필요합니다.

Collector는 KR Challenger와 Grandmaster를 LP 내림차순으로 번갈아 기본 2명 선택합니다. 무작위 대표 표본은 아니며 래더 상단 편향이 있습니다. Riot 공식 `/tft/league/v1/challenger`, `/tft/league/v1/grandmaster`의 `entries[].puuid`를 사용하며 region은 KR, Match routing은 ASIA입니다. 모든 래더 관측으로 참가자의 수집 당시 티어를 확인하지만, 추적 대상으로 upsert하는 목록은 선택한 플레이어입니다.

경기 ID는 플레이어당 최근 2개(모드 혼합 가능)를 가져옵니다. 중복 제거와 DB 존재 확인 후 신규 상세만 조회하고 **queue_id=1100 일반 랭크 TFT**만 저장합니다. 따라서 저장 경기 수는 4보다 작을 수 있습니다. 저장되지 않은 비랭크 경기는 다음 실행에서 다시 조회될 수 있습니다. 장착 itemNames와 trait 내부 ID를 원문으로 저장하고 한글 표시는 기존 정적 데이터 모듈에서 처리합니다.

Riot 요청은 동시 1개, 매 시도 최소 1.4초 간격입니다. 429의 Retry-After를 반영하고 네트워크/5xx도 최대 4회 시도합니다. 동일 키를 쓰는 다른 서비스와 한도를 공유할 수 있습니다. 플레이어 수집 단계의 401/403은 실행을 중단하고, 경기 처리 단계에서는 오류를 기록한 뒤 다음 경기를 처리합니다. 개별 경기 실패는 나머지 수집을 계속한 뒤 실패 건수를 로그에 남기고 Actions를 실패 상태로 종료합니다. 다음 실행에서 다시 최근 ID에 포함되는 실패 경기는 재시도할 수 있지만 별도 백로그는 없습니다.

로그: Players / Candidate matches(고유 ID) / Existing matches / New matches / Saved matches / Failed matches / Skipped matches / Failed player scans. DB 저장 중 다른 실행이 먼저 저장한 경우 Existing 수가 증가합니다. 오류 응답 본문은 민감 값을 마스킹하여 출력하고 성공한 경기의 원문은 출력하지 않습니다.

저장 RPC는 경기 전체를 트랜잭션으로 커밋합니다. DB에 존재하는 incomplete 행도 재조회하지 않으므로 기존 부분 저장 데이터는 운영자가 별도로 확인해야 합니다. 기존 Vue/Netlify 개인 분석 경로와 Collector는 분리되어 있습니다.

확인한 공식 문서:

- https://developer.riotgames.com/apis#tft-league-v1
- https://developer.riotgames.com/apis#tft-match-v1
- https://supabase.com/docs/guides/getting-started/api-keys
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax

테스트는 기존 익명화 Match 응답 fixture를 재사용합니다. Collector 테스트의 KR ID/queue=1100 변경은 합성 변형이며 현재 상위 랭커의 실 API 응답이라고 주장하지 않습니다. 테스트는 키 없이 실행 가능하며 라이브 수집은 위 설정 후 별도 실행합니다.

### Collector 실패 진단 (003 업데이트)

기존 DB에서 `supabase/migrations/003_tft_collector_diagnostics.sql`만 추가 실행하세요. 기존 001/002를 재실행할 필요가 없습니다. 003은 저장 RPC를 교체하여 실패 테이블과 원래 PostgreSQL code/message/details/hint를 전달합니다. 저장은 계속 한 트랜잭션이며 어떤 INSERT 오류라도 전체 롤백합니다. 테이블별 REST 저장으로 분할하지 않습니다.

Actions의 Run workflow 입력 기본값은 디버깅용 **2명 × 2경기**입니다. 수동 입력이 Actions Variables보다 우선합니다. 예약 실행은 Variables 또는 기본 2×2를 사용합니다. 로컬 config 기본값도 2×2로 변경했습니다.

실패 로그는 `[RIOT MATCH ERROR]`(요청/HTTP 상태), `[RIOT JSON ERROR]`, `[VALIDATION ERROR]`(정확한 field/reason), `[SUPABASE ERROR]`(table/code/message/details/hint)로 구분됩니다. 첫 실패에는 `[FIRST FAILED MATCH STRUCTURE]`로 필드 타입과 배열 길이를 출력하며 마지막 `[FAILURE SUMMARY]`로 원인별 건수를 출력합니다. 실제 비밀키와 PUUID 등 민감 값은 마스킹합니다. 개별 경기 실패는 다음 경기 처리를 계속합니다.

2026-09-11 Riot 공식 Match-V1 DTO를 다시 확인했습니다. 공식 UnitDto의 필드는 `itemNames`이며 `item_names`는 사용자 요청에 따른 호환 입력으로만 지원합니다. 현재 실패한 KR 경기의 라이브 응답은 이 개발 환경에 없어 원인을 확정하지 않았습니다. 기존 익명화 응답 fixture와 누락/오류를 주입한 테스트로 검증했습니다. 새 로그를 통해 실제 런타임 구조를 확인할 수 있습니다.

선택 필드인 combat counters는 없으면 NULL, units/traits/itemNames 배열은 없으면 []로 처리합니다. 필수 match ID, 참가자 ID, 등수, 레벨, 라운드와 실제 배열 내 잘못된 원소는 경로를 명시하여 실패 처리합니다. 누락 배열을 []로 저장한 경기는 해당 항목의 관측 정보가 없는 것이므로 향후 집계에서 완전한 보드 관측으로 해석하지 마세요.

### game_version 원문 보존 / 패치 추출 완화 (004)

기존 001~003이 적용된 DB에서 `supabase/migrations/004_tft_nullable_patch.sql`을 실행하세요. patch의 NOT NULL만 해제하고 원본 game_version 및 나머지 데이터/제약은 유지합니다. SQL 적용 전에는 null patch 저장이 DB 제약으로 실패할 수 있습니다.

첫 신규 Match Detail 응답에서 `[GAME VERSION]`으로 game_version 문자열을 한 번 출력합니다(민감 값 마스킹). Version 라벨 뒤의 MAJOR.MINOR를 우선 추출하고, 라벨이 없으면 단일 명확한 후보를 사용합니다. prefix/suffix 및 전체 BUILD 형식은 검증하지 않습니다. 추출 불가/모호한 버전은 patch=null로 저장하며 `[PATCH WARNING]`만 남깁니다. game_version은 trim하거나 재구성하지 않고 원문 그대로 저장합니다. 공백뿐이거나 문자열이 아닌 필수값은 여전히 VALIDATION ERROR입니다.

실제 실패 로그의 raw 문자열은 아직 전달되지 않았습니다. 기존 공개 응답 fixture와 합성 버전 변형을 사용한 테스트이며 라이브 Actions 수집 성공을 의미하지 않습니다. 004 적용 및 push 후 Run workflow에서 2명 × 2경기로 확인하세요. itemNames가 우선이며 item_names는 누락 시 fallback입니다. 기존 상세 오류 로깅과 DB 트랜잭션은 유지됩니다.

패치별 집계는 `patch IS NOT NULL`로 제한하거나 NULL을 미분류로 분리하세요. 세트 번호나 추측한 최신 패치로 대체하지 않습니다. DB 회귀 테스트는 `supabase/tests/004_nullable_patch.test.sql`입니다.

### 참가자 수 제외와 패치 경고 집계

필수 필드 검증이 통과한 뒤 참가자 수 또는 서로 다른 PUUID 수가 8이 아니면 `[MATCH SKIPPED]`로 제외합니다. matchId / queueId / participantCount / distinctPuuidCount / reason을 기록하며 DB 저장 RPC는 호출하지 않습니다. 필수 필드 누락, HTTP/JSON 오류, Supabase 오류와 예상하지 못한 예외는 계속 Failed입니다. 중복 ID 및 기존 DB 경기 제외 로직은 유지합니다.

Skipped만 있으면 성공 종료합니다. Failed matches 또는 Failed player scans가 있거나 수집 대상 플레이어가 없으면 실패 종료합니다. `[PATCH WARNING]`은 실행당 최대 한 번만 출력합니다. `Patch unresolved matches`는 **이번 실행에서 신규 저장에 성공한 경기 중 patch=NULL인 수**이며, 제외/실패/기존 경기는 포함하지 않습니다. 동일 placeholder 버전 경고를 반복하지 않습니다. 추가 SQL migration은 필요하지 않습니다(이전 004 적용 상태 기준).

### 메타 통계 (005)

1. Supabase에 기존 001~004 적용 후 `supabase/migrations/005_tft_meta_views.sql` 전체를 실행합니다. 새 View와 서버 전용 조회 권한을 생성하며 기존 테이블/데이터를 삭제하지 않습니다.
2. **Netlify 환경변수에도** `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `MIN_SAMPLE_SIZE=50`을 등록하고 재배포하세요. GitHub Actions Secrets는 Netlify로 자동 전달되지 않습니다. 키는 브라우저로 전송하지 않습니다.
3. 사이트 상단 **메타 → 아이템 / 챔피언 / 특성**에서 조회합니다. 로컬은 `.env` 설정 후 `npm run dev:api`와 `npm run dev`를 실행합니다.

경로: Vue → `/.netlify/functions/tft-meta` → Supabase 집계 View. 원본 경기/참가자 배열을 브라우저에서 집계하지 않습니다. 서버에서 최소 표본과 정렬을 적용하고 50개씩 페이지 처리합니다. 평균 등수는 오름차순, 나머지 정렬은 내림차순입니다. 응답은 최대 약 60초 캐시되므로 수집 직후 반영에 잠시 걸릴 수 있습니다.

대상은 **확인된 현재 패치 · 최근 7일의 완료된 KR queue_id=1100 경기 전체 참가자**입니다. Challenger/Grandmaster는 수집을 시작한 래더이며, 상대 참가자의 티어를 동일하다고 가정하지 않습니다. patch=NULL은 메타 통계에서 제외합니다. 패치 확인 전에는 빈 통계를 표시합니다. 관측 통계이며 특정 아이템의 효과를 인과적으로 증명하지 않습니다.

- `v_tft_item_stats`: participant_id + item_name DISTINCT. DB의 UNIQUE(match_id,puuid) 때문에 요청한 (match_id,puuid,item_name) 기준과 같습니다. 중복 장착으로 가중하지 않습니다.
- `v_tft_champion_stats`: 참가자별 같은 character_id를 한 표본으로 집계합니다. avg_star_level은 동일 보드 내 해당 챔피언들의 tier를 먼저 평균한 뒤 보드별 평균을 냅니다.
- `common_champions` / `common_items`: 실제 장착한 챔피언-아이템 조합을 참가자별로 중복 제거한 사용 횟수 TOP 5입니다. 보드에 같이 있기만 한 조합을 장착으로 간주하지 않습니다.
- `v_tft_trait_stats`: tier_current>0인 활성 특성만 집계합니다. tier_samples는 활성 단계별 표본 수입니다.
- `v_tft_meta_summary`: 동일 범위의 match_count, participant_count, 고유 player_count, latest_collected_at. 최소 표본 필터와 무관한 전체 수집 규모입니다.
- top4_rate/win_rate는 0~1이며 화면에서 %로 변환합니다. 소표본은 View에서 삭제하지 않고 API에서 sample_count>=MIN_SAMPLE_SIZE로 제외합니다. 연관 TOP 5는 참고용 횟수이며 성적 랭킹이 아닙니다.

한글명은 기존 ko_KR 정적 데이터 모듈을 재사용하며, 찾지 못하면 원본 ID를 표시합니다. 수집 기간에 여러 세트가 포함되고 동일 내부 ID가 재사용되는 경우에는 구분이 제한됩니다. 향후 세트별 집계로 확장할 수 있습니다.

모든 View는 security_invoker=true이고 anon/authenticated 조회 권한을 부여하지 않습니다. Netlify 서버만 service_role로 조회합니다. 테이블 RLS를 끄지 마세요. 참고: https://supabase.com/docs/guides/database/postgres/row-level-security

일반 View는 조회할 때 집계합니다. 현재 수백 경기 규모를 위한 구조이며 데이터가 커져 느려지면 실행 계획을 확인한 뒤 materialized view/정기 집계 테이블로 전환하세요. `supabase/tests/005_meta_views.test.sql`은 중복 아이템·챔피언, 활성 특성, NULL patch, 불완전/다른 queue 제외, 최소 표본 및 권한을 검증합니다. 테스트 데이터는 롤백됩니다.


## 공유 카드와 공개 페이지

공유 PNG, 프로필 URL, 공개 페이지 사전 렌더링 및 배포 확인 사항은 [구현 결과](docs/public-content-sharing.md)를 참고하세요. `npm run build`는 공개 HTML 9개도 생성합니다. 추가 환경변수는 없습니다.

## 제공 Hero Artwork 및 티어 프레임

프로필 카드의 나르/아리 제공 아트, 자동 파일 인덱스, fallback 및 자산 확장 방법은 [Hero Artwork 안내](docs/profile-hero-artwork.md)를 참고하세요. 신규 AI 이미지 생성 없이 제공된 8개 WebP를 사용합니다.


## 메타 사전 집계 (008)

메타 API는 Materialized View를 조회합니다. 배포 전 Supabase SQL Editor에서 `supabase/migrations/008_tft_meta_performance.sql`을 실행하세요. Collector 종료 후 서비스 전용 RPC로 한 번 갱신합니다. [진단·성능·적용 안내](docs/meta-performance.md)를 참고하세요. 환경변수와 API 계약은 유지합니다.


### 메타 용량 및 현재 패치 (009)

[운영/최초 적용 안내](docs/meta-retention.md)를 따르세요. 009 migration은 원본을 삭제하지 않습니다. Collector의 동일한 patch parser → 최근 최대 100경기, 최소 30경기·90% 확인 → 현재 패치 최근 7일 MV 갱신 및 검증 → 별도 RPC 200경기씩 정리 순서입니다. 최초 API 검증 후 SQL로 cleanup_enabled를 켜야 합니다. game_version이 불명확하면 패치를 추측하지 않으며 빈 메타 + 7일 보관만 가능합니다. 개인 프로필 캐시와 메타 보관 정책은 분리되어 있습니다.


### 원본 game_version이 불명확한 경우 (010)

[공식 TFT 패치 fallback 적용 안내](docs/meta-official-fallback.md). 009 다음에 010을 적용하고 GitHub Actions의 **Refresh TFT meta** 또는 `npm run refresh:meta`를 실행합니다. 공식 정보를 확인한 뒤 새 경기 표본으로 확정하며, NULL patch 원본은 변경하지 않습니다. 배포 완료 시각을 알 수 없으므로 confirmed_at 이후 시작한 경기만 외부 판별 scope에 포함합니다.
