# 메타 테이블 밀도 개선

- 주요 장착 챔피언/아이템: 표본 순 상위 4개를 34px 가로 아이콘으로 표시. 남은 TOP 5 항목은 +1에 툴팁으로 표시.
- 툴팁: 한글명, 표본 수. 챔피언은 해당 아이템 전체 participant 표본 대비 비율도 표시.
- 아이템 아이콘 38px, 행 목표 60px, 숫자 오른쪽 정렬/고정 폭/동일 자릿수 간격, 행 hover 강조.
- 모바일에서도 아이콘 가로 배치를 유지하고 테이블은 가로 스크롤.
- MIN_SAMPLE_SIZE 미설정 시 기본 50. API의 실제 적용 값을 화면에 표시. 저장 데이터/View는 필터링하거나 삭제하지 않음.
- common_champions.rate는 기존 005 SQL의 distinct participant 집계를 이용해 API에서 sample_count / item.sample_count로 계산. 여러 챔피언에게 같은 아이템을 준 참가자는 각 챔피언에 포함되므로 챔피언 비율의 합이 100%를 넘을 수 있음.

## 배포

기존 Cloudflare 환경변수 또는 wrangler 설정에 MIN_SAMPLE_SIZE=10이 있으면 50으로 변경한 후 재배포하세요. 명시적인 환경변수는 코드 기본값보다 우선합니다. 새 SQL migration은 필요하지 않습니다.

## 변경 파일

- src/components/MetaDashboard.vue: 메타 테이블 배치/간격/정렬
- src/components/MetaCompanions.vue: 아이콘 목록, 툴팁, 이미지 실패 대체 표시
- src/types/meta.ts: common_champions.rate 타입
- server/handlers/tft-meta.ts: 최소 표본 기본값 50, 비율 제공
- tests/meta-api.test.ts: 기본값/비율/아이콘 렌더링 테스트
- .env.example, .dev.vars.example: 기본 환경변수 예시
- README.md, docs/cloudflare-migration.md: 기본값 안내
- docs/meta-density-update.md: 변경 및 적용 안내

## 검증

npm test: 16개 파일, 157개 테스트 통과.
npm run build: 성공.
개인 분석 및 Collector/워크플로 소스 변경 없음.
