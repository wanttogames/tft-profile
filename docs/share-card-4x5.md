# 비주얼 중심 공유 카드 / ads.txt

## 공유 카드
- 상세 PlayerCard와 분리된 Canvas 전용 레이아웃으로 변경했습니다. 상세 카드의 8개 지표·선호도·분석은 그대로 유지됩니다.
- 1080×1350, 4:5 고정. Hero 영역은 1016×742로 전체 높이의 약 55%입니다. 텍스트가 늘어도 Hero 영역을 줄이지 않습니다.
- 표시: 이름/태그, 티어/LP, 대표 챔피언 아트, 대표 스타일, 평균 등수·TOP4·1등률, 가장 높은 유효 DNA 2개, 브랜딩.
- 제거: 공유용 전체 DNA 그래프, 선호 TOP3 목록, 긴 분석, 최근 경기 설명, 가로형 레이아웃 선택. 가상 데이터는 DEMO 표시를 유지합니다.
- `shareLayout.ts`: 레이아웃, 최고 점수 2개 선택, champion별 크롭 설정. 동점은 기존 지표 순서, null/NaN은 제외합니다.
- 나르 center 35%, 아리 center 25%. Canvas cover 크롭, gradient/bottom fade/vignette를 적용합니다.
- 제공된 8개 아트만 사용하며 새로운 이미지 생성은 없습니다. 미지원·로드 오류는 기존 벡터 fallback입니다.
- 이미지 저장, 링크 복사, Web Share 기능은 유지됩니다.

## 변경 파일
- src/components/ShareProfileCard.vue
- src/profile-card/renderShareCard.ts
- src/profile-card/shareLayout.ts (신규)
- tests/collectible-card.test.ts
- tests/profile-artwork.test.ts
- tests/public-pages.test.ts
- tests/share-layout.test.ts (신규)
- public/ads.txt (신규)

## ads.txt
`public/ads.txt`는 Vite 빌드 시 `dist/ads.txt`로 복사됩니다. 내용:

```
google.com, pub-4341957966658067, DIRECT, f08c47fec0942fa0
```

Cloudflare Pages Functions는 `/api/*`에만 적용되므로 이 파일은 정적 파일로 제공됩니다. 배포 후 https://tft-profile.pages.dev/ads.txt 에서 HTML 대신 위 텍스트가 표시되는지 확인하세요. Google 재확인까지 상태가 즉시 바뀌지 않을 수 있습니다.

## 검증 및 반영
- npm test: 25개 파일, 245개 테스트 통과.
- npm run build: TypeScript / Vite / 공개 HTML 생성 성공.
- 로컬 preview의 /ads.txt: HTTP 200, text/plain, 정확한 Publisher ID 응답 확인.
- 실제 Canvas 렌더러로 나르/아리 아트 크롭을 확인했습니다. 검수 환경에 한글 폰트가 없어 한글 픽셀 렌더링 검증은 미완료입니다. 브라우저 다운로드/클립보드 클릭은 실제 기기 확인이 필요합니다.
- 서버 API, Collector, 분석 계산식 및 상세 프로필 카드는 이번 변경에서 수정하지 않았습니다.
- Git push/배포는 수행하지 않았습니다. 새 환경변수/SQL/패키지는 필요 없습니다.
- 전체 ZIP에는 이전 구현까지 포함됩니다. 기존 로컬 저장소에 적용할 때 .git/비밀 환경변수 파일은 유지하세요.
