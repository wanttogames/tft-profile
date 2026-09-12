# Cloudflare Pages 전환

원인: Vue가 `/.netlify/functions/tft-player`, `/.netlify/functions/tft-meta`를 호출했지만 Cloudflare에 해당 Function route가 없어 정적 HTML 응답을 받았습니다. `dev:api` 스크립트가 package.json에 남아 있는 것 자체가 원인은 아닙니다.

## 참조 조사와 변경

| 위치 | 이전 | 현재 |
| --- | --- | --- |
| src/api/player.ts | /.netlify/functions/tft-player | /api/tft/profile?start=0 및 start=25 |
| src/api/meta.ts | /.netlify/functions/tft-meta | /api/meta/items, champions, traits |
| vite.config.ts | Netlify 경로 → 127.0.0.1:8889 | 로컬 Vite에서만 /api → 127.0.0.1:8889 |
| scripts/dev-server.ts | Netlify handler를 localhost:8889로 실행 | 로컬에서 Pages onRequest와 env를 호출 |
| server/handlers, server/lib | Netlify 안의 실제 처리 코드 | 런타임 독립 코드, env를 인자로 받음 |
| netlify/functions | 실제 처리 구현 | 과거 테스트 호환용 얇은 어댑터만 유지 |
| VITE_API_BASE_URL / API_BASE_URL | 사용하지 않았음 | 추가하지 않음 |

localhost / 127.0.0.1 / 포트 8889는 로컬 개발 설정에만 남아 있습니다. Production Vue는 같은 도메인의 /api 상대경로만 사용하며, build에서 로컬 실행 안내는 제거되고 Cloudflare 연결 안내로 바뀝니다. Netlify용 폴더와 netlify.toml은 과거 호환용이며 Cloudflare 배포 시 실행하지 않습니다. GitHub Actions collector 및 workflow는 수정하지 않았습니다.

## 배포

Cloudflare Pages 프로젝트의 Git 저장소 루트에 functions/와 wrangler.toml이 있어야 합니다. Build command는 `npm run build`, output directory는 `dist`, 빌드 Node 버전은 22 이상을 사용하세요. Pages Git 배포가 functions/를 자동 번들합니다. dist 파일만 정적 업로드하면 Functions가 누락될 수 있으므로 Git 배포 또는 Wrangler Pages 배포를 사용합니다.

Pages → Settings → Variables and Secrets에서 Production에 다음을 설정하고 재배포합니다. Preview 배포를 사용한다면 Preview에도 별도로 설정합니다.

- Secret: RIOT_API_KEY, SUPABASE_SECRET_KEY
- Text: SUPABASE_URL, MIN_SAMPLE_SIZE=10, TFT_STATIC_VERSION=latest(선택)

Functions는 context.env로만 읽습니다. process.env에 bindings를 복사하거나 Vue의 VITE_ 변수로 키를 넣지 않습니다. GitHub Actions Secrets/Netlify 변수는 Cloudflare로 자동 이전되지 않습니다. 기존 Supabase SQL 001~005는 그대로 사용하며 새로운 DB migration은 필요하지 않습니다.

## API routes

- GET /api/tft/profile?gameName=...&tagLine=...&start=0 (또는 riotId=게임이름%23KR1)
- GET /api/tft/profile?...&start=25
- GET /api/meta/items?sort=sample_count&page=0
- GET /api/meta/champions?sort=avg_placement&page=0
- GET /api/meta/traits?sort=top4_rate&page=0
- GET /api/meta/summary

잘못된 /api 경로는 HTML 대신 JSON 404를 반환합니다. 존재하는 route의 GET 이외 메서드는 JSON 405입니다. 메타 종류별 API는 기존처럼 rows/summary/assets/minSampleSize/hasMore/page를 반환하고 summary route는 요약 View만 조회합니다.

## 최근 50경기 유지와 요청 한도

Workers Free의 외부 subrequest 한도는 invocation당 50입니다. 계정+리그+목록+50 details+정적 데이터 조회를 한 번에 처리하면 초과하므로 Pages profile은 한 요청당 25개의 경기 ID를 처리합니다. Vue가 start=0,25를 순차 조회한 뒤 ID 중복 제거, 날짜순 정렬, 최신 플레이 세트 필터를 적용해 최대 50경기를 분석합니다. raw Match 응답 대신 기존 정규화된 개인 분석 DTO를 반환합니다. 두 번째 요청 실패 시 불완전한 25경기 결과를 50경기로 표시하지 않습니다. 각 요청은 ACCOUNT-V1의 PUUID로 참가자를 선택하며, 상위 25개에서 지원하지 않는 모드가 있으면 최종 분석 표본은 줄어들 수 있습니다.

캐시 및 rate-limit 상태는 isolate 메모리 범위입니다. 여러 지역/isolate와 Collector가 같은 Riot Key를 쓰면 공유 한도가 적용되므로 Riot의 429 응답을 계속 처리합니다. 각 detail 병렬 수는 기존 3개로 유지합니다.

## 로컬 검증

Node 22 이상:

```sh
npm ci
npm test
npm run build
npm run build:functions
```

Pages 런타임 검증은 `.dev.vars.example`을 `.dev.vars`로 복사하고 실제 값을 로컬에만 설정한 뒤 실행합니다.

```sh
npm run dev:pages
```

http://localhost:8788 에서 사이트와 /api를 함께 실행합니다. 키가 없으면 /api는 JSON 503 설정 안내를 반환하므로 route 배포 여부를 확인할 수 있습니다. .dev.vars는 Git에서 제외합니다.

기존 빠른 로컬 Vue 개발도 가능합니다. `.env`에 서버 값을 넣고 두 터미널에서 `npm run dev:api`, `npm run dev`를 실행하세요. 이 포트/서버는 Production에서 사용하지 않습니다. Wrangler 버전은 lockfile에 기록합니다. build:functions 출력은 .wrangler/에만 생성합니다.

공식 문서:
- https://developers.cloudflare.com/pages/functions/routing/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/pages/functions/local-development/
- https://developers.cloudflare.com/workers/platform/limits/

이번 실행 환경 검증 결과: npm test 155개 및 npm run build 성공, Wrangler Pages Functions 번들 성공. Wrangler 로컬 서버는 uv_interface_addresses 시스템 오류로 시작하지 못했습니다(명시적 127.0.0.1 지정도 동일). 따라서 이 환경에서 workerd HTTP 실행이나 실제 Riot/Supabase 자격 증명으로 Production 조회 성공을 주장하지 않습니다. route onRequest를 직접 호출하는 테스트에서 context.env/50경기 분할/메타 경로를 검증했습니다.

추가로 로컬 Node 어댑터를 실제 실행해 /api/tft/profile 및 모든 메타 route의 잘못된 입력이 JSON 400, 알 수 없는 /api 경로가 JSON 404로 응답함을 HTTP로 확인했습니다. 이는 Pages workerd 런타임 실서버 검증과는 별도입니다.
