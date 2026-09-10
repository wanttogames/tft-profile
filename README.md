# TFT PROFILE

**“무엇이 강한가”보다 “나는 어떻게 플레이하고 있는가”.** 완료된 TFT 랭크 경기에서 개인의 플레이 습관을 읽는 Vue 3 대시보드입니다. 기존 프로젝트를 사용하지 않고 `wanttogames/tft-profile`용으로 새로 생성했습니다.

## 구현 범위

- **1차 MVP:** Riot ID 검색, 현재 티어·LP·랭크 W/L, 최근 경기, 평균 등수·TOP4·1등률, 최근 폼 그래프, 최종 보드 기반 플레이 스타일 비율, 플레이어 카드, 강점/살펴볼 점, 규칙 기반 한줄 분석.
- **2차 일부:** 고점/저점 비교, 5–8위 보드 요약, 주요 특성 조합 기반 덱 다양성.
- **후속 작업:** 친구 비교, PNG 카드 저장, 정식 RSO 인증. 현재 카드 UI는 제공하지만 이미지 내보내기 버튼은 없습니다.
- **증강체:** 2026-09-10 확인한 공식 TFT-MATCH-V1 ParticipantDto에는 `augments` 필드가 없습니다. 필드를 추측하거나 임의의 증강 선택을 생성하지 않습니다. 화면에 미제공 상태를 표시합니다. 공식 지원이 확인되면 타입/어댑터와 버전별 분류 매핑을 추가할 수 있습니다.

## 기술 스택

Vue 3 Composition API / `<script setup>` / TypeScript / Vite / Netlify Functions / Vitest. 차트는 접근성 설명이 포함된 SVG이며 차트 라이브러리를 사용하지 않습니다. 공식 Data Dragon으로 유닛·특성·아이템 이름과 유닛 이미지를 연결하고, 불러오기 실패 시 식별자로 대체합니다.

## 로컬 실행

Node.js 22 이상, npm 사용. Windows PowerShell 예시:

```powershell
git clone https://github.com/wanttogames/tft-profile.git
cd tft-profile
npm ci
Copy-Item .env.example .env
```

`.env` 파일을 직접 편집합니다. 키를 채팅, 소스, 스크린샷에 넣지 마세요.

```dotenv
RIOT_API_KEY=발급받은_키
```

터미널 두 개에서 각각 실행:

```bash
npm run dev:api
```

```bash
npm run dev
```

Vite에 표시된 로컬 주소(기본 `http://localhost:5173`)로 접속합니다. `dev:api`는 배포용 Netlify 함수와 동일한 handler를 사용하는 가벼운 로컬 서버입니다. Netlify의 실행 환경을 그대로 확인하려면 Netlify CLI의 `netlify dev`를 사용할 수 있습니다. `npm run preview`는 정적 빌드 확인용으로 실제 API 서버를 포함하지 않습니다.

키 없이도 ‘샘플 분석 둘러보기’에서 대시보드를 확인할 수 있습니다. 샘플은 합성 fixture이며 실제 전적으로 가장하지 않습니다. 실제 검색에서 키가 없으면 **“Riot API Key가 설정되지 않았습니다.”**라고 표시합니다.

## Riot 키 발급

1. [Riot Developer Portal](https://developer.riotgames.com/)에서 Riot 계정으로 로그인합니다.
2. Development API Key를 발급/재생성합니다. **TFT API를 사용할 수 있는 권한**을 확인하세요.
3. Development Key는 일반적으로 24시간 후 만료됩니다. 403이 발생하면 만료와 API 권한을 확인합니다.
4. 개인 테스트를 넘어 공개 서비스로 운영하기 전에는 Portal에 제품을 등록하고 적합한 Production Key 및 승인 조건을 확인합니다.

현재 TFT 정책은 개인 기록/자기 분석의 Production 사용 사례에 RSO 통합을 요구하는 것으로 안내합니다. 이 프로젝트는 개발용 키를 사용하는 MVP이며, RSO 없이 상용 공개 운영이 승인됐다는 뜻이 아닙니다. 공개 전 최신 정책과 Riot의 승인 조건을 확인해야 합니다. 실시간 scouting, 진행 중 경기 조회, MMR/ELO 추정, 대체 랭킹 기능은 포함하지 않습니다.

## Netlify 배포

1. Netlify에서 기존 Git 저장소 가져오기를 선택하고 `wanttogames/tft-profile`을 연결합니다.
2. 배포 브랜치 `main`, Build command `npm run build`, Publish directory `dist`, Functions directory `netlify/functions`를 사용합니다. `netlify.toml`에 포함되어 있습니다.
3. Netlify 프로젝트의 환경변수 설정에 **`RIOT_API_KEY`**를 추가합니다. Functions 실행 환경에 적용되도록 설정하세요. 값은 Git에 저장하지 않습니다.
4. 배포 또는 재배포를 실행합니다.
5. 배포 사이트에서 한국 서버 Riot ID를 검색해 실제 응답을 확인합니다. 태그가 KR1이 아니어도 한국 서버 계정이라면 해당 태그를 입력합니다.

API 키를 `VITE_` 접두사 환경변수로 만들면 안 됩니다. 클라이언트는 `/.netlify/functions/tft-player`만 호출하며 Riot 요청은 서버의 `X-Riot-Token` 헤더로 보냅니다. 프론트엔드 빌드에는 키 값이 포함되지 않습니다.

## 데이터 범위 / 정확성

- 한국 서버 MVP: ACCOUNT/MATCH는 `asia`, LEAGUE는 `kr` 호스트를 사용합니다.
- 최근 **30개의 경기 ID**를 조회하고 그중 **최신 플레이 세트의 랭크(queue_id 1100) 최대 20경기**를 분석합니다. 다른 모드와 이전 세트는 제외합니다. 따라서 보유 랭크 경기가 많더라도 조회 범위에 섞인 일반 게임 때문에 20개 미만일 수 있습니다. 결과에 조회 범위를 표시합니다.
- 최신 플레이 세트는 조회한 랭크 기록 중 가장 최근 경기의 세트입니다. 현재 운영 세트를 자동 판별했다는 뜻은 아닙니다. 같은 세트 내 여러 패치의 경기가 포함될 수 있습니다.
- 최신 경기 패치의 공식 정적 데이터로 이름을 연결합니다. 그 패치에 없는 과거 식별자는 원본으로 표시합니다.
- 최종 보드는 생존 시간에 영향을 받습니다. 레벨이 높은 경기의 성적이 좋다고 해서 레벨이 원인이라고 단정하지 않습니다.
- 마지막 라운드는 오해를 피하기 위해 API의 정수 번호를 그대로 표시합니다. 임의의 stage-round 변환은 하지 않습니다.
- UnitDto의 `rarity`는 비용이 아닙니다. 4코스트 캐리라는 추정 문구는 생성하지 않습니다.
- `items`와 `itemNames`를 합산하지 않습니다. 같은 장비의 두 표현일 수 있으므로 이름 배열 우선, 없으면 ID 배열을 사용합니다.

## 자체 분석 공식

점수는 **관찰된 기록의 요약**으로, 공식 Riot 지표·실력 순위·백분위가 아닙니다.

| 지표         | 계산                                                           |
| ------------ | -------------------------------------------------------------- |
| 평균 등수    | 등수 합 / 경기 수                                              |
| TOP4 / 1등률 | 조건을 만족한 경기 수 / 경기 수                                |
| 최근 폼 변화 | 이전 10경기 평균 − 최근 10경기 평균; 양수는 개선               |
| 고점력       | 1~2등 비율 × 100                                               |
| 안정성       | TOP4 비율 × 100                                                |
| 유연성       | 인접 경기의 주요 특성 조합 변경 비율 × 100                     |
| 덱 다양성    | 주요 특성 조합 분포의 Shannon entropy / ln(유효 경기 수) × 100 |
| 최근 폼 점수 | 50 + 폼 변화 / 7 × 50, 0~100으로 제한                          |
| 리스크 성향  | 1~~2등 또는 7~~8등 비율 × 100; 실제 선택이 아닌 결과의 극단성  |

주요 특성 조합은 활성 특성 중 유닛 수가 많은 상위 2개(동률은 이름 정렬)로 식별합니다. 따라서 서로 다른 실제 덱을 합치거나 유사 덱을 나눌 수 있습니다. 유연성은 경기 사이의 차이이며 경기 중 전환 능력은 아닙니다.

스타일 분류는 상호 배타적으로 적용합니다: 3성 유닛이 있고 최종 레벨 ≤ 8이면 리롤형 → 그 외 레벨 ≥ 9이면 Fast 9형 → 레벨 8이면 Fast 8형 → 기타. 레벨업 시점, 골드 운용, 연승·연패 과정이 없으므로 **휴리스틱 추정**입니다.

5경기 미만에서는 카드/스타일을 숨기고, 10경기 미만에서는 강점·약점 문구를 생성하지 않으며, 20경기 미만에서는 이전 10경기 비교/폼 점수를 계산하지 않습니다. 강점·약점의 부분 집단 비교는 각 집단 최소 3경기를 요구합니다. 고점·저점/순방 실패 표는 원인 추론 없이 표본 수와 기술 통계만 보여줍니다.

## API 최적화 / 오류

- 브라우저 결과 캐시 2분·최대 5계정, 같은 검색의 진행 중 요청 공유, 최근 검색 localStorage 5개.
- 함수 인스턴스 내 결과 2분, 완료 경기 1시간, 정적 데이터 1시간 캐시. 전체 캐시 최대 500항목.
- 경기 조회 동시성 최대 3. 함수 인스턴스 내 호출을 최소 80ms 간격으로 제한하고 120초 내 90회까지 사용합니다.
- 429 응답은 `Retry-After`에 맞춰 다음 검색을 제한하고 즉시 재시도 폭주를 방지합니다. 요청 실패 이후 새로운 경기 요청은 시작하지 않습니다.
- 403: 키 만료/권한, 404: 계정 또는 경기 없음, 429: 요청 제한, 5xx: Riot 장애, timeout: 재시도 안내.
- 일부 상세 조회가 실패하면 누락된 경기로 평균을 왜곡하지 않도록 검색 전체에 오류를 표시합니다.
- 캐시는 Netlify 인스턴스 재사용 범위에서만 유효하며, cold start/여러 인스턴스 사이에 공유되지 않습니다. 트래픽이 커지면 공유 캐시와 키 단위 분산 rate limiter가 필요합니다. 무료 플랜 이용량/응답 시간을 보장하지는 않습니다.

## 구조

```text
src/
  api/player.ts
  analytics/
    formAnalysis.ts
    playStyle.ts
    playerScores.ts
    strengthWeakness.ts
    deckDiversity.ts
    patterns.ts
  components/
    AssetBadge.vue
    FormChart.vue
    PlayerCard.vue
    MatchList.vue
  data/demo.ts
  types/riot.ts
  App.vue
  style.css
netlify/functions/tft-player.ts
scripts/dev-server.ts
tests/analytics.test.ts
tests/api.test.ts
docs/API.md
```

## 테스트 / 검증 상태

```bash
npm test
npm run build
npm run format:check
```

- 분석/API fixture 테스트 **27개 통과**. 평균·TOP4·1등률·폼·다양성·고점력·안정성·스타일·부족 표본·동시성·HTTP 오류·공식 경로를 사용하는 모의 전체 조회를 검증했습니다.
- TypeScript 검사 및 Vite 프로덕션 빌드 통과.
- **실제 Riot API 키는 제공되지 않아 실제 계정 end-to-end 조회는 미검증**입니다. 테스트는 실응답을 채집한 fixture가 아니라 공식 DTO에 맞춘 합성 fixture와 모의 HTTP 응답을 사용합니다.
- **브라우저 실행 화면 검증은 환경의 접근 차단으로 완료하지 못했습니다.** 미리보기 서버는 정상 실행됐으나 연결된 브라우저가 접근을 거부했습니다. 배포 후 데스크톱·모바일에서 검색, 샘플, 전적 펼치기 및 데이터 없는 계정을 확인하세요.

## 공식 문서

- [TFT API / DTO](https://developer.riotgames.com/apis#tft-match-v1)
- [TFT League API](https://developer.riotgames.com/apis#tft-league-v1)
- [Account API](https://developer.riotgames.com/apis#account-v1)
- [TFT 정책·Data Dragon](https://developer.riotgames.com/docs/tft)

필드 및 엔드포인트 확인 기록은 [docs/API.md](docs/API.md)에 있습니다.
