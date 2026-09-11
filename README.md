# TFT PROFILE

**“무엇이 강한가”보다 “나는 어떻게 플레이하고 있는가”.** 최근 **50경기 조회 범위**에서 완료된 TFT 랭크 경기를 분석하는 Vue 3 개인 대시보드입니다.

## 제공 기능

- Riot ID(`게임이름#태그`) → ACCOUNT-V1 PUUID → 한국 서버 TFT 리그 / 경기 조회.
- 최대 50경기를 표본으로 평균 등수·TOP4·1등률, 스타일 비율, 플레이어 카드, 강점/살펴볼 점, 덱 다양성, 고점/저점, 순방 실패 보드 분석.
- 최근 폼은 **최근 25경기 vs 이전 25경기** 비교. 50경기 미만일 때 비교와 폼 점수는 표시하지 않습니다. 최근 5경기 평균은 보조 지표입니다.
- 선호 챔피언·아이템·활성 특성 TOP 10: 사용 경기 수, 사용 비율, 평균 등수, TOP4 비율. 아이템 장착 개수는 별도 표시.
- TFT PLAYER PROFILE: Riot ID, 티어/LP, 평균 등수/TOP4/1등률, 규칙 기반 성향, 6개 점수, 선호 특성·핵심 유닛 TOP 3, 한줄 분석.
- 챔피언·특성 사용 집중도와 플레이어 피해량·처치·라운드 요약, 고점/저점 챔피언·특성 TOP 3 및 레벨 차이.
- 실제 응답에서 증강 선택 정보를 제공하지 않는 것을 사용자가 확인하여 증강 분석·화면·경고·진단 명령을 제거했습니다.
- 유닛·아이템·특성의 한글 이름. 내부 ID와 정적 데이터의 명시적인 식별자로 연결하며 접두사 추측/수동 이름 사전은 사용하지 않습니다.
- 목록은 처음 **10경기**만 렌더링하고 `더 보기`로 10개씩 추가합니다. 목록의 표시 개수는 분석 표본에 영향을 주지 않습니다.
- 50경기의 가상 샘플 분석. 샘플임을 명확히 표시하며 API 키 없이 UI를 둘러볼 수 있습니다.

친구 비교, PNG 카드 내보내기, Production RSO 인증은 후속 범위입니다.

## 기술 스택

Vue 3 Composition API / `<script setup>` / TypeScript / Vite / Netlify Functions / Vitest. 그래프는 SVG로 그립니다. 별도 차트 라이브러리나 LLM 호출은 없습니다.

## 로컬 실행

Node.js 22 이상. Windows PowerShell:

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

## 정확한 50경기 범위

공식 Match-V1 목록 endpoint에 `start=0&count=50`을 보냅니다. 최대 50개의 고유 ID 상세를 읽고 `queue_id === 1100`인 랭크 경기만 남깁니다. 이 중 가장 최근 플레이 세트에 속하는 **최대 50경기**가 모든 분석에 전달됩니다.

따라서 일반·더블 업·과거 세트가 섞이거나 기록 자체가 부족하면 실제 표본은 50개 미만입니다. 추가 페이지를 조회해서 채우지는 않습니다. UI에 “최근 50경기 기준 · N경기 분석”과 제외 안내를 표시합니다. 최신 플레이 세트는 사용자의 최근 랭크 경기 세트이며 현재 운영 세트를 추측해서 고르는 값이 아닙니다.

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

- `info.participants`에서 ACCOUNT-V1 PUUID와 일치하는 객체를 선택합니다. `units`, `itemNames`, `traits`, `placement`, `level`, `last_round`, `players_eliminated`, `total_damage_to_players`를 사용합니다.
- 챔피언과 활성 특성(`tier_current > 0`)은 한 경기의 같은 ID를 1회로 집계합니다. 아이템도 성적 계산은 경기당 1회이며 장착 개수는 별도 합산합니다. 아이템 보유량·구매·조합 과정은 알 수 없습니다.
- 사용 비율의 분모는 해당 보드 기록이 있는 경기입니다. 빈 유닛 배열은 챔피언·아이템 표본에서, 빈 특성 배열은 특성 표본에서 제외합니다. 항목 3경기 미만은 성적을 표시하되 `표본 부족`을 함께 표시합니다.
- 핵심 유닛은 최종 아이템 2개 이상을 장착한 유닛의 사용 경기 수 TOP 3입니다. 실제 캐리 여부를 단정하지 않습니다.
- 챔피언·특성 의존도는 최다 사용 항목의 경기 비율로 표시합니다. 보조 유닛·특성 반복일 수 있어 과도한 의존을 뜻하지 않습니다.
- 피해량과 처치는 유효한 비음수 정수가 있는 경기만 평균에 넣습니다. 미제공·잘못된 값을 0으로 만들지 않습니다. 마지막 라운드는 API 번호 그대로의 평균입니다.
- 1~~2위와 7~~8위 집단 각각의 챔피언·특성 TOP 3와 평균 최종 레벨을 비교합니다. 차이 해석은 각 집단 3경기 이상부터 표시합니다. 인과관계는 주장하지 않습니다.

## TFT PLAYER PROFILE 계산 기준

점수는 5경기 이상부터 제공하며, 0~100 범위의 자체 기록 요약입니다. **Riot 공식 실력·백분위 지표가 아닙니다.**

| 점수      | 계산                                                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 고점력    | 1~2위 비율 × 100                                                                                                                        |
| 안정성    | (1 − 등수 분산 / 12.25) × 100. 분산은 모집단 분산이며, 1~8 범위의 최대 분산이 12.25입니다. 계속 하위권이어도 일정하면 높을 수 있습니다. |
| 유연성    | 인접 경기의 챔피언 집합과 활성 특성 집합의 Jaccard 변화율 평균 × 100. 같은 세트이고 두 집합 모두 기록된 경기 쌍 4개 이상 필요.          |
| 덱 다양성 | 주요 특성 상위 2개 조합의 Shannon 엔트로피 / log(유효 경기 수) × 100                                                                    |
| 순방력    | TOP4 비율 × 100                                                                                                                         |
| 최근 폼   | 50 + (이전 25경기 평균 − 최근 25경기 평균) / 7 × 50. 50경기 미만은 미표시.                                                              |

유연성은 경기 사이 최종 보드의 차이이며 경기 중 전환 능력이 아닙니다. 챔피언·활성 특성 다양성도 최종 집합 서명의 정규화 엔트로피로 계산합니다. 주요 특성 조합은 실제 덱 이름과 다를 수 있습니다.

성향 분류는 **최소 20경기와 80% 이상의 보드·특성 기록**이 필요합니다. 아래 우선순위에서 처음 일치하는 규칙을 표시합니다. 수치는 자체 휴리스틱이며 패치/전체 유저 분포로 보정한 기준이 아닙니다.

| 성향          | 동시에 만족해야 하는 조건                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| 한 우물 장인  | 최다 주요 조합 ≥ 60%, 최다 챔피언 ≥ 80%, 최다 특성 ≥ 80%                                                  |
| 고점 폭발형   | 1~2위 ≥ 40%, 1등 ≥ 20%, 등수 분산 ≥ 3                                                                     |
| 안정적 순방형 | TOP4 ≥ 65%, 평균 ≤ 4위, 분산 ≤ 2.5                                                                        |
| 유연한 운영가 | 유연성 ≥ 35, 덱 다양성 ≥ 45, 챔피언·특성 집합 다양성 각각 ≥ 40, TOP4 ≥ 50%                                |
| 공격적 운영가 | 피해량·처치 표본 각각 10경기 이상 및 80% 이상, 평균 피해량 ≥ 100, 평균 처치 ≥ 1, TOP4 ≥ 50%, 평균 ≤ 4.5위 |
| 후반 지향형   | 평균 최종 레벨 ≥ 8.5, 9레벨 이상 ≥ 60%, TOP4 ≥ 50%, 평균 ≤ 4.5위                                          |
| 저점 방어형   | 7~8위 ≤ 10%, 분산 ≤ 2.5, 평균 ≤ 4.5위, TOP4 ≥ 50%                                                         |
| 균형 탐색형   | 충분한 표본이지만 위 조건 어느 것도 만족하지 않음                                                         |

누적 피해량·처치는 생존 시간의 영향을 받습니다. 공격적 운영가도 실제 의사결정을 관찰한 결과가 아닙니다. 표본이 부족하면 `분석 표본 부족`을 사용합니다. 기존 보드 스타일 비율(리롤/Fast 8/Fast 9)은 별도 최종 보드 휴리스틱으로 유지합니다.

## API 호출 보호

- 브라우저 결과 캐시 2분·최대 5계정, 동일 진행 중 검색 공유, 최근 검색 기록 5개.
- 함수 인스턴스 내 결과 2분, 경기 1시간, 최대 500 캐시 항목. ID 중복 제거와 진행 중 경기 요청 공유.
- Match 상세 동시 요청 최대 3, 요청 간 최소 80ms, 인스턴스 내 120초 동안 90요청 이하.
- 경기 API 조회 전체에 35초 deadline 및 개별 요청 7초 제한. 실패하면 새 상세 요청을 시작하지 않습니다.
- 429는 `Retry-After` 대기 시간을 안내하고 즉시 재시도하지 않습니다. 403은 키 만료/권한, 404는 대상 없음, 5xx는 Riot 장애로 안내합니다.
- 일부 상세 실패 시 표본을 조용히 누락해 성적을 왜곡하지 않도록 검색에 오류를 표시합니다.

캐시/요청 제한은 Netlify 인스턴스 사이에 공유되지 않습니다. 방문자가 늘면 키 단위 분산 rate limiter와 공유 캐시가 필요합니다. 무료 플랜의 사용량·응답 시간을 보장하지 않습니다.

## 구조

```text
src/config/analysis.ts          # 기본 50경기 / 25경기 폼 / 10개 목록
src/static-data/catalog.ts      # 순수 한글 매핑과 fallback
src/analytics/preferences.ts    # 챔피언·아이템·특성 TOP 10
src/analytics/profileAnalysis.ts # 다중 지표 성향·집중도·고점/저점
src/analytics/playerScores.ts    # 카드 6개 점수 순수 함수
src/analytics/*.ts              # 등수·폼·스타일·점수·다양성
src/components/*.vue            # 표시 전용 컴포넌트
netlify/functions/tft-player.ts # ACCOUNT → PUUID → 50경기
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

50경기 통계·폼·점수, 호출 개수/중복/동시성/캐시/429, 실제 정적 데이터의 한글 유닛·아이템·특성 매핑, 부족 표본, 누락 피해량·처치, 성향 규칙, 증강 UI 제거, 10경기 초기 렌더링, 서버 정적 데이터 fallback을 fixture로 검증합니다.

**최신 세트 18 ko_kr 정적 데이터는 직접 확인했지만, 이 작업 환경에는 Riot 키와 사용자의 현재 Match 응답이 없어 최신 실제 계정 조회를 직접 검증하지 못했습니다.** Match fixture는 공개된 2023년 과거 응답을 익명화한 것입니다. 새로운 분석·50경기 HTTP 테스트에는 이를 명시적으로 변형한 데이터와 합성 fixture를 사용합니다. Vue 서버 렌더링 테스트는 실제 브라우저의 시각·클릭 검증을 대체하지 않습니다.

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
