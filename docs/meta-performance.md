# 메타 진단과 사전 집계

## 원인 판정 범위

이번 작업에서는 운영 Supabase/Cloudflare의 실제 HTTP 500 본문이나 실행계획에 접근하지 않았습니다. 따라서 **statement timeout이 실제 원인이라고 확정하지 않습니다**. 이전 핸들러가 오류 본문을 버렸기 때문에 기존 화면만으로는 PostgreSQL·PostgREST·권한·SQL 오류를 구분할 수 없었습니다.

코드상 병목은 확인했습니다. 005의 아이템/챔피언 View는 `v_tft_meta_equipment`의 전체 참가자 장비 DISTINCT를 사용 통계와 조합 순위에서 반복 참조합니다. 특성 View도 사용 집계·단계별 집계를 수행하고, 모든 API 요청은 전체 참가자 수·distinct PUUID 요약까지 조회했습니다. 원본 전체 집계 비용이 HTTP 요청 경로에 포함되어 있었습니다.

## 새 구조

`Collector batch → refresh_tft_meta_stats RPC 한 번 → materialized results → /api/meta/* SELECT`

- 새 migration: `supabase/migrations/008_tft_meta_performance.sql`. 기존 번호는 001~005,007이라 다음 번호 008을 사용했습니다. 과거 migration은 수정하지 않았습니다.
- `mv_tft_item_stats`, `mv_tft_champion_stats`, `mv_tft_trait_stats`, `mv_tft_meta_summary`를 추가합니다.
- 기존 005 View를 집계 정의로 사용하므로 distinct 참가자 단위·활성 trait·KR queue 1100·ingestion_complete·patch 무관 조건을 유지합니다. 기존 View는 삭제하지 않습니다.
- migration 시 초기 데이터를 채웁니다. 이 최초 작업과 이후 refresh만 raw 집계를 수행합니다. API는 `mv_`만 조회하며 `v_`로 fallback하지 않습니다.
- 각 MV의 column-only unique index가 concurrent refresh를 지원합니다. raw 테이블에는 중복 인덱스를 추가하지 않았습니다. 001의 PK/UNIQUE/FK prefix와 complete match/character/item/active trait index가 이미 존재합니다.
- RPC는 SECURITY DEFINER + 제한된 search_path, 고정 객체명만 사용합니다. PUBLIC/anon/authenticated 실행 권한을 회수하고 service_role만 허용합니다.
- advisory transaction lock으로 중복 refresh를 막습니다. 다른 refresh가 진행 중이면 `busy`를 명시적으로 반환합니다.
- 4개 refresh는 한 트랜잭션으로 완료됩니다. 실패하면 이전 MV 결과가 유지됩니다. CONCURRENTLY로 기존 결과 SELECT를 계속 허용합니다.
- 전체 재집계 비용 자체가 사라지는 것은 아닙니다. 요청마다 계산하던 비용을 수집 배치당 한 번으로 옮깁니다.

## Collector

`run.ts`에서 수집 summary 뒤에 한 번 호출합니다. 개별 match 저장 과정에서는 호출하지 않습니다. 0개 저장 배치도 갱신하여 이전 실행의 refresh 실패를 재시도할 수 있습니다. batch 안에 개별 match 실패가 있어도 정상 저장된 경기까지 갱신합니다. 수집 초기화/기존 match 조회 자체가 중단된 경우에는 호출하지 않습니다.

갱신 실패는 상세 diagnostics 및 exit code 1로 표시합니다. 이미 저장된 경기 데이터는 rollback하지 않습니다. 비용이 큰 RPC는 HTTP 자동 재시도를 하지 않습니다(타임아웃된 서버 작업이 아직 실행 중일 수 있음). 다음 batch나 SQL Editor에서 `SELECT public.refresh_tft_meta_stats();`로 재시도할 수 있습니다.

기존 30초 Collector HTTP 제한 및 DB 제한은 늘리지 않았습니다. 데이터가 매우 커져 refresh 자체가 PostgREST 제한을 넘으면 API를 다시 raw 집계로 되돌리거나 단순 timeout만 올리지 말고, Supabase Cron에서 동일 RPC 함수를 DB 내부 작업으로 실행하거나 증분 집계로 전환해야 합니다. `busy`/refresh 실패 로그를 운영 중 감시하세요.

## 안전한 진단 로그

- `[meta][supabase-error]`: path(쿼리 문자열 제외), HTTP status, elapsed(ms), category, 본문(비밀값 제거 후 최대 8KB).
- code=57014: 쿼리 취소/statement timeout 후보. message로 실제 취소 이유를 확인합니다.
- code=42501: 권한. security_invoker의 underlying table 권한도 확인합니다.
- code=PGRST003: connection pool timeout.
- code=42703/42P01/42883/22P02/42804: 컬럼·relation·함수·타입 문제.
- `[meta][query-error]`: fetch timeout/네트워크/JSON 문제를 구분합니다.
- `[meta] item|champion|trait db-query / summary-query / asset-load / total Nms`.
- 캐시 HIT은 DB 호출 없이 `[meta] ... cache-hit`로 표시합니다.
- 비밀 API 값은 로그에서 제거하고 브라우저에는 DB 본문을 전달하지 않습니다.

`supabase/diagnostics/meta_performance.sql`은 권한·인덱스·timeout 설정과 실행계획을 조회하는 읽기 전용 SQL입니다. SQL Editor 세션의 timeout과 PostgREST 역할의 timeout은 같다고 가정하지 않습니다.

## 프런트 및 캐시

endpoint와 `rows,summary,minSampleSize,hasMore,page,assets` 계약은 유지합니다. 50개 페이지, 최소 표본 50(기존 설정 변경 가능), 평균 등수 오름차순 등도 그대로입니다.

클라이언트는 15초 timeout이며 본문 JSON 처리까지 포함됩니다. unmount/검색 변경의 외부 abort는 AbortError로 유지하고 timeout만 별도 한국어 메시지를 표시합니다. 타이머와 이벤트 리스너는 finally에서 정리됩니다. MetaDashboard의 기존 finally가 성공·실패·timeout·abort에서 busy를 해제하며 이전 요청이 새 요청의 busy를 끄지 않습니다.

서버 메모리와 HTTP 캐시는 60초를 유지합니다. 메모리 HIT 때 Cache-Control은 남은 TTL만 반환해 60초 캐시를 다시 60초 연장하지 않습니다. refresh 직후 일부 사용자에게는 최대 약 60초간 이전 결과가 보일 수 있습니다.

## 적용 순서 / 환경

1. **Supabase SQL Editor에서 008 파일 전체를 postgres로 실행**합니다. 최초 전체 집계 시간이 필요합니다. 실패하면 트랜잭션 전체가 취소되며 기존 facts는 유지됩니다.
2. 소스를 반영하고 Cloudflare Pages와 GitHub Actions를 기존 방식으로 갱신합니다.
3. Collector를 workflow_dispatch로 한 번 실행하고 `[meta-refresh] status=refreshed`를 확인합니다.
4. `/api/meta/items`, `/champions`, `/traits`, `/summary` 응답 및 Cloudflare 단계별 시간을 확인합니다. 500이 계속되면 code/message가 기록된 로그로 판단합니다.

추가 환경변수나 GitHub Actions Secret 변경은 없습니다. 기존 SUPABASE_URL / SUPABASE_SECRET_KEY / RIOT_API_KEY 등을 그대로 사용합니다. `DROP TABLE`, `TRUNCATE`, facts 삭제는 없습니다. 코드에서 운영 migration/배포/push를 자동 실행하지 않았습니다.

## 검증

- npm test: 26개 파일, 258개 테스트 통과.
- npm run build: TypeScript 및 Vue build 성공.
- npm run build:functions: Worker 컴파일 성공.
- 별도 임시 PGlite(PostgreSQL 호환 엔진)에서 001~005 및 008을 실행. 중복 아이템/챔피언 참가자 집계, 활성 trait, 서비스 전용 ACL, 실제 concurrent refresh, 기존 raw count 보존 확인. 프로젝트 의존성은 추가하지 않았습니다.
- 운영 PostgREST/Cloudflare에서 migration 및 실측 latency는 아직 검증하지 않았습니다. 성능 개선은 'API에서 raw 재집계를 제거했다'는 구조적 결과이며 실제 몇 ms 빨라졌는지는 배포 후 로그로 비교해야 합니다.

## 주요 변경 파일

server/handlers/tft-meta.ts, server/lib/metaDiagnostics.ts(신규), src/api/meta.ts,
scripts/collector/run.ts, scripts/collector/supabase.ts, scripts/collector/refreshMeta.ts(신규),
supabase/migrations/008_tft_meta_performance.sql(신규), supabase/diagnostics/meta_performance.sql(신규),
tests/meta-api.test.ts, tests/meta-performance.test.ts(신규).
