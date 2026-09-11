# TFT PROFILE

**“무엇이 강한가”보다 “나는 어떻게 플레이하고 있는가”.** 최근 **50경기 조회 범위**에서 완료된 TFT 랭크 경기를 분석하는 Vue 3 개인 대시보드입니다.

## 제공 기능

- Riot ID(`게임이름#태그`) → ACCOUNT-V1 PUUID → 한국 서버 TFT 리그 / 경기 조회.
- 최대 50경기를 표본으로 평균 등수·TOP4·1등률, 스타일 비율, 플레이어 카드, 강점/살펴볼 점, 덱 다양성, 고점/저점, 순방 실패 보드 분석.
- 최근 폼은 **최근 25경기 vs 이전 25경기** 비교. 50경기 미만일 때 비교와 폼 점수는 표시하지 않습니다. 최근 5경기 평균은 보조 지표입니다.
- 선호 증강체 / 활성 특성·시너지 TOP 5: 사용 경기 수, 사용 비율, 평균 등수, TOP4 비율. 관측 성과·저성적 반복·특성 집중에 대한 규칙 기반 문구.
- 유닛·아이템·증강체·특성의 한글 이름. 내부 ID와 정적 데이터의 명시적인 식별자로 연결하며 접두사 추측/수동 이름 사전은 사용하지 않습니다.
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
| 증강체 | items: isAugment=true, apiName, name                     | augment:*:ID  |

현재 데이터의 `DA_18_Sejuani`는 그 자체로 세주아니의 apiName입니다. 이를 `TFT18_Sejuani` 등으로 고쳐 추측하지 않습니다. 세트별 키로 이름 충돌을 막고, UI 전체는 `lookupAsset` / `displayName`을 사용합니다.

- `netlify/data/tft-ko-snapshot.json`: 서버 전용 압축 인덱스. 이름·이미지 경로 등 필요한 필드만 보관하며 클라이언트 번들에 전체 데이터를 넣지 않습니다.
- `netlify/lib/staticData.ts`: 24시간 캐시/스냅샷 사용, 오래된 경우 런타임 갱신, 실패 시 기존 사본 사용. 갱신 실패 후 1시간 재시도 대기.
- 기본 소스에 없는 ID는 최근 경기 패치의 공식 Data Dragon `ko_KR` 유닛·아이템·증강체·특성 데이터로 한 번 더 조회합니다. 지원되지 않는 과거 패치/ID는 원본 ID로 표시하고 누락 수를 안내합니다.
- 응답에는 해당 분석에서 사용하는 이름만 넣습니다. 게임마다 전체 정적 데이터를 다시 내려받지 않습니다.

수동 갱신:

```bash
npm run update:static
npm test
npm run build
```

갱신된 snapshot JSON도 커밋하고 배포하세요. 기본 버전은 `latest`입니다. 특정 버전을 고정하려면 서버 환경변수 `TFT_STATIC_VERSION`에 CommunityDragon의 `major.minor` 값을 지정할 수 있습니다. 실제 지원 버전이어야 합니다. 로컬 갱신 스크립트에도 같은 환경변수를 지정하세요. 오래된 이름 사본을 사용할 수 있으므로 과거 경기의 표시 이름이 그 경기 패치 당시 명칭과 항상 일치하는 것은 아닙니다.

## 증강체 / 특성 분석 기준

Match-V1의 `info.participants`에서 대상 PUUID를 직접 찾습니다. 과거 실제 응답에 존재하는 `augments: string[]`를 선택 필드로 읽습니다. 최신 공식 DTO 표는 이 필드를 보장하지 않으므로 **응답에 없으면 생성하지 않습니다**. 잘못된 선택 필드 역시 미제공으로 처리하고 경기 등수는 유지합니다.

- 증강체 비율 = 해당 증강체 사용 경기 수 / 증강체 배열이 확인된 경기 수. 누락은 분모에서 제외하고, 명시적인 빈 배열은 기록이 있는 경기로 포함합니다.
- 특성 비율 = 해당 특성이 활성화(`tier_current > 0`)된 경기 수 / 전체 분석 경기 수.
- 같은 ID가 한 경기에서 반복되어도 사용 횟수는 1회로 셉니다. 여러 항목을 동시에 선택/활성화하므로 합계 비율은 100%를 넘을 수 있습니다.
- 3회 미만 사용한 항목은 `표본 부족`; 평균 등수·TOP4 표시와 성과 비교에서 제외합니다.
- 성과 해석에는 전체 유효 경기 10개 이상, 항목별 3회 이상이 필요합니다. “관측 성적이 좋은 항목”은 해당 표본에서 평균 등수가 가장 낮은 항목이며 동률을 표시합니다. TOP 5 밖의 항목도 비교 대상입니다.
- “자주 쓰지만 성적이 낮은 항목”: 최소 max(5회, 유효 경기의 15%), 평균 ≥ 4.5위, 본인 기준 평균보다 0.5위 이상 나쁜 성적, TOP4 < 50%.
- 특성 사용 집중: 유효 경기 20개 이상, 사용 10회 이상, 활성 비율 ≥ 60%. 흔한 보조 특성일 수도 있으므로 과도한 의존이라고 단정하지 않습니다.

Riot 정책에서 전설/전설 기반 증강체의 승률 공개를 금지하므로, 전설 제공 선택 여부를 구별할 수 없는 과거 **세트 9 전체의 증강 성과**는 보수적으로 숨깁니다. 사용 횟수와 비율만 표시합니다. 현재 세트 18의 일반 완료 경기 증강 기록에는 위 개인 분석 규칙을 적용합니다.

## 자체 점수와 부족 표본

| 지표         | 계산                                                      |
| ------------ | --------------------------------------------------------- |
| 평균 등수    | 분석 경기 등수 합 / 경기 수                               |
| TOP4 / 1등률 | 조건을 만족한 경기 수 / 경기 수                           |
| 폼 변화      | 이전 25경기 평균 − 최근 25경기 평균. 양수는 개선          |
| 고점력       | 1~2등 비율 × 100                                          |
| 안정성       | TOP4 비율 × 100                                           |
| 유연성       | 인접 경기의 주요 특성 조합 변경 비율 × 100                |
| 덱 다양성    | 주요 특성 조합의 Shannon entropy / ln(유효 경기 수) × 100 |
| 폼 점수      | 50 + 폼 변화 / 7 × 50, 0~100 제한                         |
| 리스크 성향  | 1~~2등 또는 7~~8등 비율 × 100                             |

점수는 **Riot 공식 지표·실력 순위·백분위가 아닙니다.** 주요 특성 조합은 유닛 수 상위 활성 특성 2개의 서명입니다. 실제 덱 종류와 다를 수 있습니다. 유연성은 경기 사이의 차이이며 경기 중 전환 능력이 아닙니다. 리스크는 실제 선택이 아닌 결과의 극단성입니다.

스타일은 최종 보드 기반 휴리스틱입니다: 3성 유닛이 있고 최종 레벨 ≤ 8이면 리롤형 → 그 외 레벨 ≥ 9이면 Fast 9형 → 레벨 8이면 Fast 8형 → 기타. 실제 레벨업 속도·연승·연패는 알 수 없습니다. 5경기 미만은 카드·스타일을, 10경기 미만은 강점/약점 해석을, 50경기 미만은 폼 변화·폼 점수를 숨깁니다.

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
src/analytics/preferences.ts    # 증강체·특성 집계 / 해석 규칙
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

50경기 통계·폼·점수, 호출 개수/중복/동시성/캐시/429, 실제 정적 데이터의 한글 유닛·아이템·증강체·특성 매핑, 부족 표본, 미제공 증강체, 10경기 초기 렌더링, 서버 정적 데이터 fallback을 fixture로 검증합니다.

**최신 세트 18 ko_kr 정적 데이터는 직접 확인했지만, 이 작업 환경에는 Riot 키와 사용자의 현재 Match 응답이 없어 최신 실제 계정 조회를 직접 검증하지 못했습니다.** Match fixture는 공개된 2023년 과거 응답을 익명화한 것입니다. 새로운 분석·50경기 HTTP 테스트에는 이를 명시적으로 변형한 데이터와 합성 fixture를 사용합니다. Vue 서버 렌더링 테스트는 실제 브라우저의 시각·클릭 검증을 대체하지 않습니다.

공식 경로 및 fixture 출처: [docs/API.md](docs/API.md), [tests/fixtures/README.md](tests/fixtures/README.md).
