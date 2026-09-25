# 분석 카드와 공유 카드 분리

- 메인 PlayerCard: 최대 1180px, 0.9fr/1.1fr CSS Grid. 왼쪽 이름·아트·랭크·칭호, 오른쪽 표본·3개 통계·8개 DNA. 선호 챔피언/특성과 설명은 두 열 아래 배치합니다. 760px 이하에서는 한 열로 전환하고 높이는 콘텐츠에 따라 늘어납니다.
- 공유 카드: 1080×1512(5:7). 같은 Canvas를 화면 미리보기와 PNG 저장에 사용합니다. 독립 name bar, 아트 프레임, 통계 패널, 짧은 flavor 영역으로 구성했습니다.
- 아트 영역: 964×720, 전체 높이의 47.6%. 기존 나르/아리 이미지, 티어 프레임, focal point(나르35%, 아리25%), fallback을 유지합니다.
- 공유 내용: 이름/태그, 티어/LP, edition, 아트, 스타일/최대3개 태그, 평균/TOP4/1등률, 유효 점수 상위2개, 짧은 flavor, 브랜딩. 긴 문자열은 측정 후 글자 크기 조절·말줄임합니다.
- 분석 모듈, API, Collector, DB는 이번 UI 작업에서 변경하지 않습니다. 새 패키지/환경변수/SQL은 필요 없습니다.

## 변경 파일
src/components/PlayerCard.vue, src/components/ShareProfileCard.vue,
src/profile-card/shareLayout.ts, src/profile-card/renderShareCard.ts,
tests/share-layout.test.ts, tests/collectible-card.test.ts,
tests/profile-artwork.test.ts, tests/public-pages.test.ts,
tests/card-purpose-layout.test.ts, 이 문서 및 기존 공유 카드 문서.

## 검증 범위
단위 테스트로 5:7 비율, 아트 비중, champion별 크롭 경계, 상위2개 점수, SSR 영역 순서 및 Canvas 크기를 검증합니다.
현재 실행 환경에서 Chromium은 socket 권한 오류로 실행되지 않았습니다. 따라서 1440/1280/1024/430/390/360px 실화면, 실제 PNG 다운로드·클립보드·Web Share 클릭 검증은 미완료입니다. 해당 검증을 완료한 것으로 간주하지 마세요.

최종 검증: npm test 30개 파일 / 298개 테스트 통과. npm run build의 vue-tsc, Vite build, 공개 페이지 9개 prerender 성공. Git push 또는 배포는 수행하지 않았습니다.
