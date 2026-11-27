# TFT 패치별 메타 이력 운영

## 최초 적용

1. 운영 Supabase에서 013과 014가 적용되어 있는지 확인합니다.
2. SQL Editor에서 `supabase/migrations/015_tft_meta_trend.sql` 전체를 실행합니다.
3. GitHub Actions의 **Refresh TFT meta**를 한 번 실행하고 완료를 확인합니다. SQL Editor에서 `SELECT public.refresh_tft_meta_stats();`로도 초기화할 수 있습니다.
4. 아래 쿼리로 최근 정상 집계의 세트, 패치, 패치 확인 방식과 실제 저장을 확인합니다.

```sql
SELECT set_number, patch, snapshot_date, snapshot_type, aggregation_generation,
       match_count, participant_count, confidence_status
FROM public.tft_meta_snapshot
ORDER BY aggregation_generation DESC
LIMIT 10;

SELECT s.snapshot_id, e.kind, count(*) AS entity_count
FROM public.tft_meta_snapshot s
JOIN public.tft_meta_snapshot_entity e USING (snapshot_id)
WHERE s.snapshot_id = (
  SELECT snapshot_id FROM public.tft_meta_snapshot ORDER BY aggregation_generation DESC LIMIT 1
)
GROUP BY s.snapshot_id, e.kind;

SELECT current_patch, aggregate_set_number, generation, match_count, scope_ready,
       preview_set_number, patch_source
FROM public.v_tft_meta_current_summary;
```

동일 세트에서 정상 관측치가 두 패치에 걸쳐 확보되면 비교가 열립니다. 한 패치만 남아 있으면 이력 페이지에서 해당 관측치를 확인할 수 있습니다. 미확정 참고 집계나 둘 이상의 세트가 섞인 집계는 저장 대상에서 제외됩니다.

## 저장 및 용량

- `tft_meta_snapshot`에는 집계 세대, 기간, 패치 분류 근거, 경기 수와 참가자 수를 저장합니다.
- `tft_meta_snapshot_entity`에는 종류와 ID, 보드 표본 수, 평균 등수, TOP4·1위율, 집계에서 이미 제공하는 장착·특성 단계 요약을 저장합니다. 사용률은 저장된 표본 수와 참가자 수로 계산합니다. 갱신 작업은 숫자 저장을 완료한 뒤 세대를 다시 확인해 이름, 이미지 URL, 분류, 티어와 점수를 별도로 기록합니다.
- 매 갱신마다 한국 날짜 기준 일별 행을 갱신합니다. 내용이 같은 항목 행은 다시 쓰지 않습니다. 새 패치의 정상 집계가 확보되면 이전 패치의 마지막 정상 관측이 종료 직전 기록으로 보존됩니다.
- 최근 90일의 일별 데이터와 만료 기간이 없는 종료 직전 관측을 보관합니다. 원본의 7일 정책은 기존 RPC를 그대로 사용합니다.
- 예시로 하루 500개 항목과 항목당 힙·인덱스 합산 350~650바이트를 가정하면, 월 작성량은 15,000행(5.25~9.75MB), 최근 90일 보관량은 45,000행(15.75~29.25MB)입니다. 연 24개 패치 종료 관측이라면 장기 증가분은 연 12,000행(4.2~7.8MB)입니다. 실제 크기는 장착 요약 길이, 항목 수, VACUUM 상태에 따라 달라집니다.

```sql
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_statio_user_tables
WHERE relname IN ('tft_meta_snapshot', 'tft_meta_snapshot_entity');
```

## 실패 및 복구

마이그레이션 DDL과 갱신 RPC는 각각 트랜잭션으로 실행됩니다. 스냅샷 저장 실패 시 같은 트랜잭션의 집계 갱신도 롤백됩니다. Collector 로그에서 갱신 실패를 확인한 뒤 원인을 해결하고 Refresh TFT meta를 다시 실행합니다. 이미 삭제된 원본에 해당하는 통계는 역산할 수 없습니다.

이력 저장만 중단해야 한다면 아래 SQL로 갱신 RPC를 013 구현에 연결합니다. 두 이력 테이블에는 기존 기록이 남습니다. 전환 후 신규 이력이 쌓이지 않으므로 운영에서 임시 복구로 사용합니다.

```sql
BEGIN;
SELECT pg_advisory_xact_lock(80421, 8);
CREATE OR REPLACE FUNCTION public.refresh_tft_meta_stats() RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp AS $$
 SELECT public.refresh_tft_meta_stats_without_history();
$$;
NOTIFY pgrst,'reload schema';
COMMIT;
```

이력 저장을 재개하려면 015 파일의 갱신 함수 DDL만 `CREATE OR REPLACE FUNCTION`으로 실행한 뒤 메타 갱신을 실행합니다.

## 비교와 역사 데이터의 한계

동일 세트와 집계 정의의 동일 ID만 비교합니다. 각 7일 관측을 합산하지 않습니다. 사용된 정적 데이터에서 조회할 수 있는 이미지와 이름을 표시하고, 찾지 못한 값은 원본 ID를 표시합니다. 과거 시점의 전체 정적 카탈로그가 보존되어 있지 않으므로 일방에만 관측된 항목은 미관측으로 표시합니다. 보존된 티어·점수를 우선 사용합니다. 정적 데이터 저장이 끝나지 않은 집계는 호환되는 계산 버전과 사용 가능한 카탈로그로 재계산합니다. 수집 작업의 MIN_SAMPLE_SIZE 설정은 Pages와 동일하게 유지합니다. 패치마다 독립적으로 정상화하므로 숫자 티어 점수의 차이는 표시하지 않습니다.
