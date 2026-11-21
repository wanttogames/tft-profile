# 시즌19 검색 콘텐츠 관리

2026-11-21 기준. 공식 출시일은 2026-12-02 (패치 19.1).

## 구현 구조

- `/set19`: 시즌 소개, 출시 일정, 신규 음악 특성, 주요 해금 링크.
- `/set19/unlocks`: 32종 이름·코스트 검색, 브라우저에만 저장되는 개인 체크리스트.
- `/set19/unlocks/:slug`: 검증 근거와 사용자 질문이 분명한 10개의 개별 가이드.
- `src/content/set19.ts`: 조건, PBE 표기 및 원고의 단일 진실 공급원.
- `src/seo/pages.ts`: SSR 사전 렌더링 대상 URL과 페이지별 고유 메타데이터.
- `public/sitemap.xml`: 공개 URL 12개 추가.

## 주의

- Riot 공식 2026-11-17 한국어 발표: 94종 / 32종, 티버(2성 애니+아이템), 모데카이저(펜타킬 별레벨 10), 내셔 남작(악기 5종 + 말자하 피해량).
- 기타 조건은 2026-11-20 PBE 추적 정보에 기반하며 출시 전 변경될 수 있습니다.
- 공식 https://teamfighttactics.leagueoflegends.com/ko-kr/news/media/tft-set-19-prismatic-tour-overview/
- PBE https://senseos.gg/guides/tft/set-19-unlocks/
- PBE 숫자 수정 이력이 있어 출시 전 19.1 패치 노트 및 실제 게임과 대조해야 합니다. 특히 잔나·쓰레쉬·야스오·TRUE DAMAGE 아칼리.
- 출시 전까지 'PBE 임시 정보' 표시를 제거하지 마세요. 확인하지 않은 통계, 승률 및 실제 유저 랭크 데이터는 작성하지 마세요.
- 정식 출시 후 콘텐츠 상태를 갱신하면서 페이지 제목·메타·사이트맵·내부 링크를 유지하세요.
- 실제 검색 유입 평가는 Search Console 노출수·CTR·클릭·색인 데이터를 기준으로 확인하세요.

## 검증

`npm test` 및 `npm run build`. 렌더링된 `dist/set19/index.html`, `dist/set19/unlocks/index.html`, 10개 챔피언별 `index.html`에 본문, title, description, canonical을 확인하세요.
