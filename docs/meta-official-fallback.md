# 010: 공식 TFT 패치 fallback

## 수정 내용

009에서 `patch = current_patch`만 사용해 NULL 버전 경기의 scope가 영구적으로 비는 문제를 보완합니다. 001~009 migration은 수정하지 않습니다. 새 `010_tft_meta_official_patch.sql`을 적용합니다.

1. 기존 `patchFromVersion(game_version)` 결과가 우선입니다. 최근 최대 100경기에 하나라도 읽을 수 있는 patch가 있으면 외부 확인으로 덮어쓰지 않습니다. Match 기반 확정 조건은 기존 최소 30경기/90%를 유지합니다.
2. 최근 완료 KR 랭크 경기들의 patch가 모두 NULL이면 Collector가 Riot 공식 TFT 패치 목록을 조회합니다.
3. 실제 페이지의 `__NEXT_DATA__`에서 TFT 제품, game_updates 분류, patch_notes 태그, 제목, 공식 article URL, 게시 시각을 함께 검증합니다. Data Dragon/LoL 버전은 사용하지 않습니다. 현재 번호 하드코딩은 없습니다.
4. `register_tft_external_patch()`가 detected_patch, 출처 URL, 게시 시각, 검증 시각을 기록합니다. 원본 patch를 UPDATE하지 않습니다.
5. 공식 정보를 처음 검증한 이후 시작한 경기 중 최소 30개가 모두 동일한 유효 set_number이고, 최신 판별 기록에 parseable patch가 없으면 외부 패치를 확정합니다. 세트 혼합, 세트 누락, 표본 부족, 오래된 공식 확인으로는 확정하지 않습니다.
6. 게시 시각을 KR 적용 완료 시각으로 취급하지 않습니다. 실제 배포 완료 시각을 제공하지 않는 출처이므로 **최종 confirmed_at을 scope 시작 경계**로 사용합니다. 그 이전 NULL 경기는 현재 패치로 소급 포함하지 않습니다. 이는 공식 정보를 이용한 보수적인 scope 분류이며 개별 경기의 원본 버전 확인과는 다릅니다.
7. NULL 경기 포함 조건은 현재 공식 패치와 동일한 external_patch, 확인된 set_number, confirmed_at 이후 경기 시각, 최근 7일, 최근 24시간 내 공식 source 재확인입니다. 원본에 patch가 있으면 기존 `patch=current_patch` 조건을 사용합니다.
8. cleanup은 포함된 NULL 경기를 보존합니다. 외부 확정 직후 scope가 아직 0이면 `awaiting-matches`로 삭제를 보류합니다. 원본 데이터가 필요 이상 삭제되는 것을 막기 위한 조건입니다.

## 첫 적용에서 즉시 모든 과거 경기가 나오지 않는 이유

공식 패치 노트 게시 시각은 실제 KR 적용 완료 시각이 아닙니다. 외부 source를 처음 조회한 직후 과거 7일의 NULL 경기를 전부 현재 패치로 간주하지 않습니다.

- 첫 실행: 공식 정보 등록. detected_patch는 채워지고 current_patch는 표본을 기다릴 수 있습니다.
- 첫 확인 이후 새 동일 세트 경기 최소 30개를 수집: current_patch 확정, confirmed_at 경계 설정.
- 확정 시각 이후 시작한 경기가 수집된 다음 refresh: scope/통계 생성.

따라서 수집 주기에 따라 두 번 이상의 batch가 필요할 수 있습니다. source 조회가 성공해도 표본/세트 검증은 생략하지 않습니다. 이는 “과거 경계를 추측하지 말 것” 요구를 우선한 동작입니다. 공식 적용 완료 시각이 별도로 검증되지 않은 상황에서 즉시 과거 경기까지 포함시키는 것은 안전하게 구현할 수 없습니다.

같은 패치 재조회는 확정 경계를 이동시키지 않습니다. 새 공식 패치가 발견되면 새 경계/새 표본으로 확인합니다. 기존 확정은 일시적인 외부 조회 실패로 임의 삭제하지 않지만 24시간 재검증이 끊기면 NULL 경기 scope는 다음 refresh에서 비워집니다. 다음 정상 수집/refresh로 복구됩니다.

## 적용 순서

1. Supabase SQL Editor에서 `supabase/migrations/010_tft_meta_official_patch.sql` 전체 실행. 009까지 적용된 DB 기준. 함수/상태/뷰만 변경하고 직접 refresh나 원본 삭제는 하지 않습니다.
2. 새 소스를 GitHub에 반영합니다. 환경변수 및 Secret 이름 변경 없음.
3. GitHub Actions의 **Refresh TFT meta** → Run workflow. 기존 `SUPABASE_URL`, `SUPABASE_SECRET_KEY` Secrets 사용. Riot API 호출/원본 수집/cleanup은 하지 않습니다. 공식 source 등록과 aggregate refresh만 합니다.
4. 이후 정상 Collector가 새 경기 수집 → 공식 source 확인 → refresh → 안전 cleanup을 수행합니다. 이미 활성화한 cleanup_enabled 설정은 유지됩니다.
5. 아래 SQL로 진행 상태를 확인합니다.

```sql
select current_patch, detected_patch, patch_source,
       confirmed_at, external_patch, external_set_number,
       external_boundary_at, external_checked_at, external_source_url
from public.tft_meta_state;

-- 공식 source 등록 후 사용. SQL 함수 자체는 외부 HTTP를 호출하지 않습니다.
select public.refresh_tft_meta_stats();

select
  (select current_patch from public.tft_meta_state) as current_patch,
  (select count(*) from public.v_tft_meta_scope) as scope_match_count,
  (select max(sample_count) from public.mv_tft_item_stats) as item_max_sample,
  (select max(sample_count) from public.mv_tft_champion_stats) as champion_max_sample,
  (select max(sample_count) from public.mv_tft_trait_stats) as trait_max_sample;
```

로컬에서도 서버 환경변수를 설정한 뒤 `npm run refresh:meta`를 사용할 수 있습니다. Secret을 커밋하거나 브라우저 코드에 넣지 마세요. `refresh_tft_meta_stats()`만 최초 실행하면 공식 source를 가져오지 못하므로 최초 등록은 Action/명령을 거쳐야 합니다.

## 권한 및 API

새 RPC `tft_meta_patch_probe()`와 `register_tft_external_patch(...)`는 service_role만 실행 가능합니다. 기존 refresh/cleanup 권한도 유지합니다. 공식 URL은 고정된 Riot 도메인/경로만 허용하며 secret/body를 로그에 출력하지 않습니다.

기존 `/api/meta/items`, `/champions`, `/traits`, `/summary` 및 rows/summary/minSampleSize/hasMore/page/assets는 그대로입니다. summary에 patch_source/경계/출처를 추가하고 UI에 공식 기준 분류임을 표시합니다. API 요청마다 raw 집계를 실행하지 않습니다.

## 검증 범위

- 공식 웹 페이지를 실제 조회하여 article metadata fixture를 저장했습니다: `tests/fixtures/riot-official-patch-list.json`.
- 이 fixture는 source 구조 검증용이며 운영 경기 fixture가 아닙니다. 18.3 숫자는 테스트 데이터일 뿐 운영 코드에는 없습니다.
- PGlite PostgreSQL 엔진에서 010까지 migration 실행 및 실제 refresh/cleanup을 검증합니다.
- NULL patch 합성 fixture에서 최종 current_patch=18.3, scope=30, item/champion/trait max_sample 각각 240. 원본 patch는 모두 NULL 유지.
- 운영 Supabase 자격 증명이 현재 작업 환경에 없어 운영 DB에 migration/refresh를 실행하지 않았습니다. 운영 수치는 위 SQL 또는 `[meta-verification]` 로그로 확인해야 합니다.

## 파일

추가: 010 migration, `scripts/collector/officialPatch.ts`, `refreshMetaOnly.ts`, `.github/workflows/refresh-tft-meta.yml`, 공식 metadata fixture, `tests/official-patch.test.ts`, 이 문서.
수정: refreshMeta/metaRetention, package.json, SQL/오케스트레이션 테스트, summary 타입, MetaDashboard 설명, 공개 가이드/README/009 운영 문서.

공식 출처: https://teamfighttactics.leagueoflegends.com/en-us/news/tags/patch-notes/


검증 결과: `npm test` 29개 파일/295개 테스트 통과, `npm run build` 성공(TypeScript + Vite + 9개 prerender), Cloudflare Functions 컴파일 성공. 실운영 DB는 변경하지 않았습니다. 별도 조회 파일: `supabase/diagnostics/meta_patch_status.sql`.
