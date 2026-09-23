# Player Archive Hero Artwork

## 이번 변경

사용자가 제공한 `tft_profile_art_samples.zip`의 8개 PNG만 사용했습니다. 새로운 AI 이미지는 생성하지 않았습니다. 원본 1086×1448 해상도를 유지한 WebP(quality 92)로 변환했고 총 20,296,502 bytes → 2,989,804 bytes로 약 85% 줄였습니다. 첨부 카드 이미지는 레이아웃 참고용이며 카드 전체를 이미지로 만들지 않았습니다.

- `src/components/PlayerCard.vue`: 기존 진입점 유지. 세로형 이름/세트 → Hero → 티어·칭호 → 성적 → DNA → 선호 챔피언·특성 → 설명.
- `src/components/RankFrame.vue`: CSS 프레임과 SVG 코너/상단 크레스트. 기존 티어 팔레트를 사용하며 Gold/Platinum/Master뿐 아니라 기존 모든 티어를 지원합니다.
- `src/components/RankBadge.vue`: Hero 하단 티어 엠블럼·랭크·LP.
- `src/components/HeroArtworkPanel.vue`: cover, 어두운 fade, vignette, 로드 실패 시 기존 SVG fallback.
- `src/profile-card/artwork.ts`: 아트 선택 및 공유 이미지 로딩. 분석 계산에는 영향을 주지 않습니다.
- `src/profile-card/artwork-manifest.json`: 파일 목록으로 자동 생성되는 자산 인덱스.
- `scripts/profile-art-manifest.ts`: predev/pretest/prebuild에서 자산 인덱스 생성.
- `src/profile-card/model.ts`: 최선호 챔피언·대표 스타일을 아트에 연결.
- `src/components/ShareProfileCard.vue`, `src/profile-card/renderShareCard.ts`: 동일 출처 이미지를 기다려 실제 Canvas PNG에 그립니다. 세로형 기본, 가로형도 유지. 이미지 오류/5초 지연 시 벡터 fallback으로 저장 기능 유지. 오래된 비동기 결과가 새 카드에 적용되지 않도록 세대 번호 검사.
- `tests/profile-artwork.test.ts`: 14개 신규 테스트. 기존 2개 카드 테스트는 변경된 헤더 및 아트 표현에 맞게 조정.
- `package.json`: manifest lifecycle 명령 추가. 새 의존성/환경변수 없음.

## 자산

`public/profile-art/{gnar|ahri}/{flexible|aggressive|stable|lategame}.webp`

최선호 챔피언 한 명을 선택합니다. 미지원 최선호 챔피언 대신 2순위 지원 챔피언을 표시하지 않습니다. 아트 선택은 한국어 이름 별칭(나르/아리), 폴더명과 정확히 일치하는 이름/ID 또는 ID의 마지막 `_` 토큰을 사용합니다. 부분 일치는 허용하지 않습니다. 게임 데이터 한글 이름이나 Riot 응답 파싱 로직은 변경하지 않았습니다.

| 대표 스타일 키 | 아트 키 |
| --- | --- |
| flexible-strategist, deck-explorer | flexible |
| peak-mage, bold-adventurer, crown-seeker | aggressive |
| steady-guardian, dedicated-master, resilient-warden, synergy-specialist | stable |
| late-commander, artifact-artisan, carry-specialist | lategame |
| balanced, insufficient | 기존 벡터 fallback |

`aggressive`는 고점 지향의 아트 분류일 뿐 공격성 지표를 추가하거나 전투 데이터를 사용하는 것이 아닙니다. 기존 30경기 계산식, 스타일 분류, API, Supabase 및 Collector는 변경하지 않았습니다.

## 이미지 추가

1. `public/profile-art/{영문 champion key}/{artStyle}.webp`에 파일을 추가합니다. 폴더명은 영문 소문자·숫자·하이픈만 사용합니다.
2. `npm run build`가 manifest를 자동으로 갱신합니다. 개발 서버 실행 중 추가했다면 `npm run dev`를 다시 시작합니다.
3. 기존 Riot character_id의 마지막 토큰과 일치하는 champion key를 쓰면 매핑 코드 수정 없이 적용됩니다. 그렇지 않은 특수 별칭은 `championArtworkKey`의 aliases에 명시합니다.
4. 일부 스타일만 추가한 경우 없는 조합은 벡터 fallback으로 표시합니다. 지원되지 않는 URL을 무작정 요청하지 않습니다.

플레이어 이름·태그·통계·progress bar·선호도는 계속 실제 Vue/HTML로 렌더링됩니다. 중앙 Hero 영역에만 제공 아트를 사용합니다. 모바일은 2열 DNA와 1열 선호도 그룹을 사용합니다.

## 검증 및 반영

- npm test: 24개 파일 / 239개 테스트 통과.
- npm run build: TypeScript 검사·Vite 빌드 및 공개 9개 페이지 prerender 성공.
- WebP 8개가 dist로 원본 bytes 그대로 복사되고 로컬 preview에서 이미지 경로 8개가 HTTP 200으로 반환되는지 확인.
- 브라우저에서 로컬 주소 접근이 ERR_BLOCKED_BY_CLIENT로 차단되어 실제 데스크톱·모바일 스크린샷/다운로드 클릭 검증은 완료하지 못했습니다. 이미지 선택·로드 실패·Canvas drawImage 경로는 자동 테스트로 검증했습니다.
- Git push/Cloudflare 배포는 수행하지 않았습니다. 기존 build=`npm run build`, output=`dist`를 유지합니다. 별도 SQL/환경변수 작업은 없습니다.
- 전체 ZIP은 이전 공개 콘텐츠/공유 URL 개선도 포함하는 현재 프로젝트 소스입니다. `.git`, node_modules, dist, 실제 비밀 환경변수 파일은 포함하지 않습니다.
