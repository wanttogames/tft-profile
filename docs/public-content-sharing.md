# 공유 카드 및 공개 콘텐츠 개선 결과

> 최신 공유 카드 규격은 [4:5 공유 카드 변경](share-card-4x5.md)을 따릅니다. 이전 가로/세로 선택 기능은 1080×1350 전용 레이아웃으로 변경되었습니다.

## 구현
- 기존 공유 카드 렌더러를 확장했습니다. 기본 1200×630 Canvas PNG와 기존 세로 카드를 선택할 수 있습니다. 폰트 로딩 후 다시 렌더링합니다.
- 실측 분석 결과로 스타일, 태그, 8개 능력치, 대표 챔피언/아이템/특성, 요약 문구를 표시합니다. 이미지 저장, 링크 복사, 지원 브라우저에서 Web Share를 제공합니다.
- `/profile?gameName=...&tagLine=...` URL을 안전하게 인코딩하고 기존 API로 결과를 다시 조회합니다. 고정된 과거 결과 스냅샷은 아닙니다. Riot ID가 링크에 포함되며 서버 비밀정보는 포함하지 않습니다.
- 홈에 서비스 설명, 사용 방법, 기존 메타 API를 사용하는 요약 및 지표 안내를 추가했습니다.
- `/guide`, `/about`에 실제 서비스 구조와 분석의 한계를 설명합니다. `/meta`, `/champions`, `/items`, `/traits`는 기존 메타 컴포넌트와 API를 재사용합니다.
- 기존 개인정보처리방침, 이용약관 및 Riot 고지는 유지했습니다. 개인정보처리방침의 광고 플랫폼 미사용 문구는 실제 AdSense 스크립트 사용에 맞춰 수정했습니다.

## 라우트 및 SEO
- 공개 경로: `/`, `/guide`, `/meta`, `/champions`, `/items`, `/traits`, `/about`, `/privacy`, `/terms`.
- 빌드 시 9개 공개 페이지를 사전 렌더링합니다. 페이지별 title, description, canonical, 기본 Open Graph를 제공합니다. 빌드 중 Riot/메타 API 호출은 하지 않습니다.
- 프로필 URL은 검색엔진용 고정 콘텐츠가 아니므로 클라이언트 메타에 noindex를 적용합니다. 동적 OG 이미지 서버는 추가하지 않았습니다.
- `public/robots.txt`는 검색을 허용하고 sitemap을 참조합니다. sitemap에는 공개 URL 9개를 포함합니다.
- AdSense 계정 메타와 공통 스크립트는 각각 1개만 유지했습니다. 광고 슬롯은 추가하지 않았습니다. 콘텐츠 보강은 AdSense 승인 보장이 아닙니다.

## 검증
- npm install 성공.
- npm test: 23개 파일, 225개 테스트 통과.
- npm run build: TypeScript 검사 및 Vite 빌드 성공, 9개 공개 HTML 생성.
- npm run build:functions: Cloudflare Worker 컴파일 성공.
- 로컬 preview에서 공개 9개 URL, robots.txt, sitemap.xml, profile URL의 HTTP 200 확인.
- 각 생성 HTML의 h1 및 AdSense 메타/스크립트 중복 없음 확인.
- git diff --check 통과.
- 실제 Riot 계정으로 운영 API 호출 및 모바일 픽셀 검수는 수행하지 못했습니다. 브라우저 로컬 접근이 차단되어 다운로드/클립보드/Web Share 실제 클릭 검증도 미완료입니다. 관련 URL·렌더링·오류 처리 로직은 자동 테스트로 확인했습니다.

## 재배포
- Git push 및 Cloudflare 배포는 수행하지 않았습니다.
- 변경 소스를 검토한 뒤 기존 Cloudflare Pages 설정으로 재배포합니다. Build command는 `npm run build`, output directory는 `dist`입니다.
- 새 환경변수, SQL migration, 외부 이미지 생성 서버는 필요하지 않습니다. 기존 서버 환경변수는 그대로 유지합니다.
- Collector, Supabase View, Cloudflare API 및 개인 분석 계산식은 변경하지 않았습니다.
- 배포 후 공개 URL 직접 진입/새로고침, 실제 계정 검색, 공유 PNG 저장, 링크 복사, 모바일 공유를 확인하세요. AdSense 자동 광고를 켰다면 광고 노출 위치도 관리 화면에서 확인하세요.

## 변경 파일
- `README.md`
- `index.html`
- `package.json`
- `src/App.vue`
- `src/components/MetaDashboard.vue`
- `src/components/PlayerCard.vue`
- `src/components/ShareProfileCard.vue`
- `src/components/SiteFooter.vue`
- `src/pages/PrivacyPolicy.vue`
- `src/profile-card/model.ts`
- `src/profile-card/renderShareCard.ts`
- `src/style.css`
- `tests/collectible-card.test.ts`

## 새 파일
- `public/robots.txt`
- `public/sitemap.xml`
- `scripts/prerender.ts`
- `src/components/HomeContent.vue`
- `src/components/MetaPreview.vue`
- `src/content/publicContent.ts`
- `src/pages/InformationPage.vue`
- `src/seo/pages.ts`
- `src/seo/render.ts`
- `src/utils/profileLink.ts`
- `tests/public-pages.test.ts`
- `docs/public-content-sharing.md` (이 문서)
