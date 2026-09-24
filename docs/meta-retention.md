# 현재 패치 + 최근 7일 운영 (009)

## 핵심 제약

실제 Match API가 `TFT Unreal Version ?.?.?.?`를 반환하면 패치를 판별할 수 없습니다. 숫자를 임의로 채우거나 Data Dragon 버전을 대신 사용하지 않습니다. 기존 `scripts/collector/saveMatch.ts`의 `patchFromVersion()` 결과를 사용합니다. 외부 버전 API는 이번 기능에 사용하지 않습니다.

확인된 패치가 없으면 **메타는 빈 통계/패치 확인 대기**이고, cleanup 활성화 이후 원본은 **7일 보관만** 적용됩니다. 이미 current_patch가 있으면 이를 유지하되, patch=NULL은 집계에서 제외합니다. 즉 현재 응답이 계속 불명확하다면 “현재 패치 메타 제공”까지 자동 해결할 수는 없습니다. 이 경우 API 응답이 개선되거나 별도로 검증 가능한 1차 데이터가 필요합니다.

## 상태 및 확인 기준

`tft_meta_state` 한 행에서 관리합니다. 기본값은 최근 최대 100개의 서로 다른 완료 KR 랭크 경기, 최소 30경기, 동일 패치 90% 이상입니다. null 패치도 분모에 포함하므로 숫자를 읽을 수 있는 1경기만으로 전환되지 않습니다. 최신 경기 시각 순서이며 최근 7일 밖의 관측은 제외합니다. 현재보다 숫자상 높은 MAJOR.MINOR로만 전환합니다. 설정 컬럼 `confirm_sample_size`, `confirm_min_samples`, `confirm_ratio`에는 안전 범위 CHECK가 있습니다.

`observations`는 최신 100개 match_id / patch / game_datetime만 담는 JSON 배열입니다. 참가자/보드/PUUID/과거 통계를 저장하지 않습니다. 비현재 패치 원본을 삭제해도 후보를 여러 batch에 걸쳐 확인할 수 있게 하는 작은 판별 기록입니다. 동일 ID는 중복 가중하지 않습니다. 삭제된 후보를 바로 다시 가져오지 않도록 기존 ID batch 조회 RPC도 이 기록을 확인합니다.

## 집계/삭제 순서

1. 기존 Collector 수집 및 저장. 7일보다 오래된 경기 상세는 저장 전에 skip합니다.
2. 수집/플레이어 scan 실패가 하나라도 있으면 refresh와 cleanup을 모두 건너뜁니다. 이미 저장한 경기는 보존됩니다.
3. `refresh_tft_meta_stats()` 한 번: patch 판별 + 고정 window_end 설정 + 4개 MV 갱신 + summary 경기 수 및 참가자 8배 검증. 하나의 트랜잭션으로 실패 시 상태와 MV 변경도 롤백됩니다.
4. `cleanup_tft_meta_data(expected_generation, 200)`: 성공한 최신 generation 및 1시간 이내 refresh 확인. 최초에는 disabled. RPC마다 최대 200경기를 root에서 삭제하며 기존 CASCADE로 child를 정리합니다. 별도 트랜잭션이므로 실패해도 이전 저장/집계는 유지합니다. 최대 100회 이후 나머지는 다음 batch에서 처리합니다.
5. 시작/종료 DB bytes 및 350MiB warning, 400MiB critical 로그. 오류/cleanup disabled/busy 상태도 구분합니다.

모든 유지관리 함수는 PUBLIC/anon/authenticated EXECUTE를 취소하고 service_role만 허용합니다. DB 관리자 권한은 예외입니다. refresh/cleanup은 동일 advisory lock을 공유합니다. 중복 실행의 busy 결과로 cleanup을 시작하지 않으며, 다른 refresh가 진행되면 이전 generation cleanup을 거절합니다.

현재 patch가 확인되면 `patch IS DISTINCT FROM current_patch` (null 포함) 원본을 삭제합니다. 아직 확정되지 않은 새 패치 보드도 대상이지만 위의 100경기 판별 기록은 남습니다. 후보 경기의 과거 보드를 복구하지 않으며 확정 후 새로 들어오는 경기로 표본이 늘어납니다.

7일 조건은 `collected_at`과 실제 `game_datetime` 둘 다 적용합니다. 늦게 가져온 과거 경기가 최신 메타로 섞이거나 cleanup 뒤 무한 재저장되지 않습니다. 같은 scope를 `v_tft_meta_participants`와 summary가 공유합니다. 4개 MV는 매번 현재 scope로 교체되므로 이전 패치 aggregate가 누적되지 않습니다. API는 계속 작은 MV만 읽습니다.

window_end는 batch 시각입니다. 스케줄 사이에 초 단위로 다시 집계하지 않습니다. `summary.as_of/refreshed_at`으로 실제 갱신 시각을 확인하세요. 현재 Actions는 6시간 주기이므로 raw 정리/통계 창도 그 주기로 전진합니다. Collector가 실패하거나 멈추면 정리도 멈추므로 Actions 실패 알림을 확인해야 합니다. 무중단 최신성이나 500MB 이하를 절대 보장하는 구조는 아닙니다.

## 최초 기존 5,421경기 적용 순서

1. Collector 스케줄을 잠시 정지하고 Supabase SQL Editor에서 **008까지 적용된 DB에 009_tft_meta_retention.sql 전체**를 실행합니다. 과거 migration 수정/재실행은 하지 않습니다. 이 migration은 함수 안에 DELETE 정의만 있으며 직접 호출하지 않습니다. 기존 raw와 기존 MV 데이터는 그대로입니다.
2. 새 소스를 배포합니다. Secret/환경변수 변경 없음. 기존 endpoint/rows/summary/minSampleSize/hasMore/page/assets를 유지하며 summary에 metadata만 추가합니다.
3. SQL Editor에서 `select public.refresh_tft_meta_stats();`를 실행하거나 새 Collector를 한 번 실행합니다. cleanup_enabled=false이므로 자동 삭제하지 않습니다. 기존 patch는 기존 parser로 저장된 값이며, 오래된 비정상 문자열을 추측해 backfill하지 않습니다.
4. 다음과 실제 `/api/meta/summary`, `/api/meta/items`, `/api/meta/champions`, `/api/meta/traits`를 확인합니다. patch 확인 불가능 시 빈 결과가 올바른 결과입니다. 최소 표본 50 때문에 rows만 비어 있을 수도 있습니다.

```sql
select current_patch, detected_patch, refreshed_at, generation, cleanup_enabled
from public.tft_meta_state;
select * from public.v_tft_meta_current_summary;
select count(*) as scope_matches from public.v_tft_meta_scope;
select item_name, sample_count from public.mv_tft_item_stats order by sample_count desc limit 5;
select public.tft_meta_db_size();
```

5. API/집계를 확인한 다음에만 SQL Editor에서 다음을 실행합니다. **이 설정부터 다음 성공 Collector에서 삭제가 시작됩니다.** 패치를 모르는 경우에는 7일 초과만 정리하며 최근 null 원본은 유지됩니다.

```sql
update public.tft_meta_state set cleanup_enabled=true where singleton;
```

6. Collector를 실행/재개합니다. 최초 정리를 수동 실행하려면 먼저 다시 refresh하고 반환된 generation을 아래 인자로 사용하세요. 최대 200개를 삭제하며 deletedMatches가 0이 될 때까지 각 호출을 별도로 실행합니다. 번호를 추측하지 마세요.

```sql
-- 현재 검증된 generation을 직접 읽습니다.
select public.cleanup_tft_meta_data(generation, 200) from public.tft_meta_state;
```

cleanup 중단은 `update public.tft_meta_state set cleanup_enabled=false where singleton;`입니다. 이미 삭제된 데이터 복구 기능은 아닙니다.

## 용량/인덱스

기존 FK/UNIQUE의 왼쪽 prefix가 participant→match, units→participant, items→unit, traits→participant를 커버합니다. 새 인덱스는 root의 `(collected_at,match_id)`와 완료 KR ranked 범위 `(patch,collected_at)` 두 개뿐입니다. MV 결과가 작으므로 별도의 대형 cover index를 추가하지 않습니다.

7일 기본값은 고정합니다. 400MiB에서도 자동 5일 변경은 하지 않습니다. pg_database_size는 할당된 공간이므로 정상 삭제 후에도 그대로일 수 있기 때문입니다. 일반 autovacuum이 삭제 page를 재사용 가능하게 합니다. `VACUUM FULL`은 사용하지 않습니다. 필요 시 운영자가 트랜잭션 밖에서 일반 `VACUUM (ANALYZE)`를 검토할 수 있습니다.

- https://www.postgresql.org/docs/15/routine-vacuuming.html
- https://www.postgresql.org/docs/18/sql-refreshmaterializedview.html

452경기/일이면 7일은 약 3,164경기입니다. 현재 284MB/5,421경기를 단순 비례하면 약 166MB이지만 인덱스·고정 데이터·개인 캐시·MV 작업공간·dead tuples 때문에 실제 크기는 다릅니다. 전체 DB의 개인 프로필 캐시는 007의 별도 cleanup, 기타 테이블과 DB 사용량도 계속 확인해야 합니다. tft_players는 참가자 FK 공유 및 추적 래더 보존을 위해 삭제하지 않습니다.

## 검증 및 파일

`npm test`는 PGlite의 실제 PostgreSQL 엔진에서 001~009(존재하는 번호) migration, patch 전환/보존/미확인, scope, cascade, batch, generation, 권한을 실행합니다. 테스트 fixture는 합성 데이터이며 운영 Riot 응답을 관측했다고 주장하지 않습니다. PGlite는 devDependency이며 클라이언트/Functions 번들에 포함하지 않습니다.

Collector: run.ts / metaRetention.ts / collectMatches.ts / supabase.ts.
API: tft-meta.ts가 v_tft_meta_current_summary를 조회하고 최초 refresh 전에는 rows를 비웁니다.
UI: MetaDashboard metadata label 및 공개 가이드 설명을 현재 scope로 수정합니다.

## 이번 작업 결과

- npm test: 28개 파일, 283개 테스트 통과.
- npm run build: TypeScript 검사 + Vite + 공개 페이지 9개 prerender 성공.
- npm run build:functions: Cloudflare Worker 컴파일 성공.
- 운영 Supabase SQL 실행 / Git push / Cloudflare 배포는 수행하지 않았습니다.
- 추가 환경변수 및 GitHub Actions Secret 변경 없음.

신규 파일: `supabase/migrations/009_tft_meta_retention.sql`, `scripts/collector/metaRetention.ts`, `tests/meta-retention.test.ts`, `tests/meta-retention-sql.test.ts`, 이 문서.

수정 파일: `scripts/collector/run.ts`, `scripts/collector/refreshMeta.ts`, `scripts/collector/collectMatches.ts`, `scripts/collector/supabase.ts`, `server/handlers/tft-meta.ts`, `src/types/meta.ts`, `src/components/MetaDashboard.vue`, `src/content/publicContent.ts`, `README.md`, `package.json`, `package-lock.json`, `tests/cloudflare.test.ts`, `tests/collector.test.ts`, `tests/collector-patch.test.ts`, `tests/collector-skips.test.ts`, `tests/meta-api.test.ts`, `tests/meta-performance.test.ts`.
