# TFT 상위 플레이어 경기 수집 스키마

`migrations/001_tft_meta_schema.sql` 전체를 Supabase **SQL Editor → New query → Run**으로 한 번 실행합니다. 새 프로젝트의 public 스키마를 기준으로 하며 기존 테이블을 삭제하지 않습니다. 같은 이름의 테이블이 있으면 트랜잭션 전체가 실패하도록 했습니다. 성공 후 재실행하는 파일이 아닙니다. Collector를 사용하려면 이어서 `migrations/002_tft_collector_rpc.sql`을 한 번 실행하세요. 집계 API는 아직 추가하지 않았습니다.

## 테이블과 관계

| 테이블 | 한 행의 의미 | 중복 방지 |
| --- | --- | --- |
| tft_players | PUUID별 플레이어 및 최신 래더 관측 | PK puuid |
| tft_matches | Riot 경기 1개 | PK match_id |
| tft_participants | 경기의 참가자 1명 | PK participant_id + UNIQUE(match_id, puuid) |
| tft_units | 참가자 최종 units 배열 원소 1개 | PK unit_id + UNIQUE(participant_id, unit_index) |
| tft_unit_items | 유닛의 itemNames 배열 원소 1개 | PK(unit_id, item_index) |
| tft_traits | 참가자 특성 1개 | PK(participant_id, name) |

`match → participants → units → items`, `participants → traits` 삭제는 CASCADE입니다. 플레이어 삭제는 참가 기록이 있으면 RESTRICT합니다. 수집 대상에서 제외하려면 `is_tracked=false`로 바꾸면 경기 이력을 잃지 않습니다.

- 같은 챔피언 2개, 같은 아이템 중복 장착은 유효합니다. 이름만으로 UNIQUE를 걸지 않습니다.
- 배열 인덱스는 0부터 시작하며 Riot 필드인 척하는 값이 아니라 수집기가 부여하는 원소 위치입니다.
- 피해량·처치는 nullable입니다. 미제공 값을 0으로 바꾸지 않습니다.
- `game_datetime`은 Riot 원본 밀리초 bigint입니다. SQL 날짜 변환은 `to_timestamp(game_datetime / 1000.0)`입니다.
- `patch`는 `game_version`에서 수집기가 확인해 추출한 MAJOR.MINOR입니다. TFT 세트 번호와 혼동하지 마세요. 추출 실패 시 임의의 최신 패치로 저장하지 않습니다. 원문 game_version도 보존합니다.
- 기존 프로젝트에서 확보하는 `info.tft_set_number`는 선택적인 `set_number`로 보관합니다. 확인할 수 없으면 NULL입니다. 패치·세트·queue·platform을 함께 사용하면 다른 모드를 섞지 않고 집계할 수 있습니다.
- 모든 테이블의 `collected_at`은 최초 저장 시각입니다. 재시도 upsert에서 덮어쓰지 않습니다.

## 상위 플레이어 표본의 의미

`current_tier`, `league_points`, `rank_observed_at`, `is_tracked`는 League API/수집기 메타데이터이며 Match 응답에 있는 필드로 가정하지 않습니다. 경기에서 만난 모든 참가자 PUUID는 players에 최소 행을 만들되, 조회한 상위 랭커만 추적 대상으로 표시합니다.

`participants.tier_at_collection` 및 LP는 해당 사람의 티어를 확인한 경우만 기록합니다. 상위 랭커가 발견한 경기의 나머지 7명을 동일 티어로 설정하면 안 됩니다. 또한 이 값은 **수집 당시 관측 티어**이지 경기 시작 당시 티어가 아닙니다. 이후 래더 갱신으로 과거 참가자의 티어를 덮어쓰지 않습니다. `META VS YOU`는 이 관측 기준과 패치·세트·모드가 일치하는 표본을 사용해야 합니다.

## 중복·부분 수집·동시 실행

1. Challenger/Grandmaster League 목록의 PUUID를 upsert하며 최초 collected_at을 보존합니다.
2. 경기 ID를 중복 제거하고 이미 tft_matches에 있는 ID는 상세 조회하지 않습니다.
3. 신규 경기만 `tft_save_match(payload)` RPC로 저장합니다. PK 충돌은 DO NOTHING으로 처리하므로 동시 실행에서도 하나만 저장됩니다.
4. 참가자, 유닛, 아이템, 특성을 하나의 트랜잭션에서 저장한 뒤 완료 표시를 설정합니다. 어떤 자식 행이라도 실패하면 전체가 롤백됩니다.
5. 기존 incomplete 행도 자동 재조회하지 않습니다. 이전 수집기의 부분 저장 데이터가 있다면 별도로 확인 후 해당 경기 트리를 삭제하고 다시 수집해야 합니다. 정상 Collector는 부분 행을 남기지 않습니다.

RPC는 SECURITY INVOKER이며 service_role만 실행할 수 있습니다. 브라우저에 비밀키를 전달하지 않습니다. 통계는 반드시 ingestion_complete=true로 제한하세요. 관측 티어가 없는 상대는 NULL이므로 전체 참가자와 확인된 상위 티어 참가자 집계를 구분하세요.

## 통계 계산 시 중복 주의

챔피언·아이템·특성 성적의 분모는 **그 항목을 사용한 참가자-경기 수**입니다. 아래 item 예시는 같은 아이템 중복 장착으로 등수가 여러 번 집계되지 않도록 먼저 DISTINCT합니다. :patch 같은 바인드 변수 대신 SQL Editor에서도 실행 가능한 예시 값을 사용했습니다.

```sql
WITH usage AS (
  SELECT DISTINCT p.participant_id, p.placement, i.item_name
  FROM public.tft_matches m
  JOIN public.tft_participants p USING (match_id)
  JOIN public.tft_units u USING (participant_id)
  JOIN public.tft_unit_items i USING (unit_id)
  WHERE m.ingestion_complete
    AND m.platform = 'kr' AND m.queue_id = 1100
    AND m.patch = '16.18' -- 실제 저장된 patch로 변경
    AND m.set_number = 18 -- 실제 분석 대상 set으로 변경
    AND p.tier_at_collection IN ('CHALLENGER', 'GRANDMASTER')
)
SELECT item_name, count(*) AS games_used,
       avg(placement) AS avg_placement,
       avg((placement <= 4)::integer) AS top4_rate,
       avg((placement = 1)::integer) AS win_rate
FROM usage GROUP BY item_name ORDER BY games_used DESC;
```

챔피언은 DISTINCT(participant_id, character_id), 특성은 tier_current>0 조건을 적용합니다. 사용률의 분모는 해당 패치/세트/티어 조건에 맞는 전체 참가자-경기 수입니다. 아이템 장착 개수는 별도 count(*)로 구분합니다. 사용자당 경기 수가 많은 표본의 가중치, 같은 로비 여러 참가자의 상관관계와 상위 유저 수집 편향도 해석에 명시해야 합니다.

## 인덱스와 확장

경기 완료+platform/queue/patch/set/time 필터, 참가자 PUUID 이력, 상위 티어 관측, 챔피언/아이템/활성 특성 역방향 조회 인덱스를 추가했습니다. FK 접두사가 이미 PK/UNIQUE로 인덱싱된 경우 중복 인덱스를 만들지 않습니다.

현재는 원본 사실 테이블을 정규화해 보관합니다. 조합 서명은 유닛·특성에서 재계산할 수 있으므로 나중에 별도 버전 있는 조합 정의/집계 테이블을 추가합니다. 대량 트래픽 시 매번 전체 JOIN을 하지 말고 patch/queue/set/platform/cohort/분석 알고리즘 버전별 집계 테이블이나 materialized view를 둡니다. 이때 UNIQUE 키로 재집계 중복을 막아야 합니다. 현재 단계에서 월별 partition을 적용하면 전역 match_id UNIQUE 설계가 달라지므로 파티셔닝은 실제 규모와 실행계획을 확인한 뒤 도입합니다.

## Supabase 접근

6개 원본 테이블에 RLS를 켜고 anon/authenticated/PUBLIC의 직접 접근을 차단했습니다. service_role에 테이블 DML과 identity 시퀀스 사용 권한을 부여합니다. Supabase에서는 이 역할이 RLS를 우회하므로 수집기와 서버에서만 사용합니다. GitHub Actions Secrets에 서버 자격증명을 보관하고 VITE_ 환경변수에는 넣지 마세요. 향후 사용자 화면에는 원본 PUUID 테이블을 직접 공개하기보다 집계 결과만 서버 API로 제공하는 방향입니다.

일반 PostgreSQL에서도 실행되도록 Supabase 역할이 없으면 해당 역할의 권한 설정을 건너뜁니다. SQL Editor 실행은 Supabase postgres 관리자 역할을 사용하세요. SQL Editor 수동 실행은 CLI migration 이력을 자동 등록하는 절차가 아니므로, 나중에 CLI를 도입할 때 이미 적용된 파일을 중복 적용하지 않도록 이력을 맞춰야 합니다.

공식 참고: https://www.postgresql.org/docs/current/ddl-constraints.html · https://supabase.com/docs/guides/api/securing-your-api

## 검증

`tests/001_schema.test.sql`은 개발 DB에서 마이그레이션 적용 후 별도로 실행하는 회귀 테스트입니다. 테스트 행은 ROLLBACK되며 실제 데이터 변경을 남기지 않습니다(identity 시퀀스 번호는 증가할 수 있습니다).

이 작업에서는 임베디드 PostgreSQL 엔진 PGlite에서 일반 PostgreSQL 역할 구성과 Supabase 역할을 모사한 구성 모두로 마이그레이션을 실행했습니다. 6개 테이블 생성, PK/UNIQUE/FK/CHECK, 아이템 중복 장착 보존, NULL 전투 지표, CASCADE/RESTRICT, RLS 활성화/권한, 반복 실행 시 원자적 실패, 예시 통계 SQL을 검증했습니다. 실제 사용자의 Supabase 프로젝트에는 실행하지 않았습니다. 기존 Vue 코드와 의존성에는 변경이 없습니다.

## Collector 저장 검증

001 → 002 적용 후 `tests/002_collector.test.sql` 전체를 SQL Editor에서 실행하면 저장/중복 스킵/오류 롤백/권한/삭제 전파를 확인합니다. 테스트는 트랜잭션을 ROLLBACK하므로 fixture 행을 남기지 않습니다. TypeScript 수집 테스트는 루트 `npm test`에 포함됩니다. SQL 회귀 검증은 PostgreSQL 호환 PGlite에서도 역할 유무 두 환경으로 실행했습니다.

기본 Collector는 양쪽 래더 상단을 교대로 선택합니다. 처음에는 10명 × 최근 5경기로 시작하며 실제 조회·저장 수는 중복과 비랭크 경기 제외로 줄어듭니다. 설치/Secrets/예약 실행 방법은 루트 README의 GitHub Actions 메타 Collector 절을 참고하세요.
