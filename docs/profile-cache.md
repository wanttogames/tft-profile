# 프로필 캐시 운영

Vue → GET /api/tft/profile?riotId=게임이름%23KR1 단일 요청.
서버에서 ACCOUNT-V1 PUUID를 확인하고 League, count=30 Match IDs, 캐시 미보유 상세를 조회합니다.
start 파라미터는 사용하지 않습니다. 최신 플레이 랭크 세트 및 queue_id=1100 필터와 개인 분석 DTO는 유지합니다.

| 캐시                         | 저장소                           | TTL   |
| ---------------------------- | -------------------------------- | ----- |
| 정규화 Riot ID별 최종 프로필 | Cloudflare Cache API             | 120초 |
| Riot ID → Account            | Cloudflare Cache API             | 7일   |
| PUUID → League               | Cloudflare Cache API             | 5분   |
| PUUID → Match IDs            | Cloudflare Cache API             | 120초 |
| Match ID → 분석용 경기 JSON  | Supabase tft_profile_match_cache | 7일   |

메모리는 최대 500개 항목 및 동일 isolate 진행 중 요청 공유용 보조 수단입니다.
Cloudflare Cache API는 같은 데이터센터에서 isolate를 넘어 재사용하지만 지역 간 복제나 전역 잠금을 보장하지 않습니다. 퇴거 시 TTL 이전에도 miss가 가능합니다.
로컬 Node에는 Cache API가 없으므로 메모리 보조 캐시와 Supabase를 사용합니다.
Riot ID 변경 후 새 ID는 새 키로 조회됩니다. 이전 ID는 최대 7일간 과거 PUUID를 가리킬 수 있습니다.

Supabase는 30개 ID를 한 번의 IN 조회로 가져오고 expires_at을 서버와 앱 양쪽에서 검사합니다.
신규 응답은 한 번의 batch upsert로 저장합니다. 실패 중 성공한 상세도 저장해 다음 조회에 재사용합니다.
metadata의 match_id/participants, info의 시간·버전·세트·큐, 모든 참가자의 PUUID·등수·레벨·라운드·생존 시간·units/itemNames/traits를 보존합니다. 기존 파서가 쓰는 legacy items와 trait style도 유지합니다. 계정 표시명·장식·missions·미사용 전투 수치는 신규 저장 payload에서 제외합니다. 보드 분석에는 피해량·처치를 사용하지 않습니다. 응답은 기존 개인 DTO로 변환하며 원본 전체를 브라우저에 보내지 않습니다.
캐시 읽기/쓰기 장애는 민감 정보 없이 경고하고 Riot 직접 조회를 계속합니다. Collector 테이블과 메타 View는 사용하지 않습니다.

## 배포 전

1. Supabase SQL Editor에서 `supabase/migrations/007_tft_profile_match_cache.sql` 실행.
2. Supabase Cron에 매일 실행할 SQL로 `supabase/maintenance/profile-cache-cleanup.sql`의 DELETE 등록. pg_cron 등록 예시도 파일에 있습니다. migration 자체는 확장 설치나 작업 등록을 하지 않습니다.
3. Cloudflare Production/Preview의 기존 RIOT_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY 확인. 새 환경변수나 바인딩은 없습니다. Supabase Secret은 서버 전용입니다.
4. 단일 신규 조회의 Riot 호출은 최대 33회입니다. 일반 경로는 Cache API 최대 8회와 Supabase 2회까지 총 43회이며, 정적 데이터 원격 갱신·fallback 최대 5회를 포함하면 48회입니다. Workers Free의 50 subrequest 한도 안에 들어오도록 상세별 Edge Cache 조회는 하지 않습니다. 외부 redirect도 한도를 소비하므로 실제 로그를 확인하세요. Paid 플랜은 필수가 아니지만 CPU/트래픽 한도와 집중 유입은 별도로 모니터링해야 합니다.
5. Git 배포 후 2분 내 재검색 및 새 경기 추가 후 Cloudflare `[profile]` 로그 확인.

공식 한도: https://developers.cloudflare.com/workers/platform/limits/

## 호출량과 한계

- 최초 완전 신규: Account 1 + League 1 + IDs 1 + 상세 30 = 최대 33 Riot 요청.
- 2분 이후/5분 이내, 기존 29경기 cache hit + 새 경기 1: IDs 1 + 상세 1 = 2회.
- 120초 내 최종 프로필 hit: Riot 0회.
- Rank/Account TTL 만료, 지역 이동, 캐시 퇴거, DB 장애 시 추가 호출이 발생합니다.

한 프로필 상세 동시 3개, isolate 전체 Riot 동시 4개, 요청 시작 간격 80ms로 제한합니다. 429 시 새 fan-out을 중단하고 같은 요청의 진행 중 Riot fetch를 취소합니다. 실제 Retry-After(초 또는 HTTP date)를 기준으로 isolate 내 cooldown을 적용하며, 이 상태에서도 캐시 조회는 가능합니다. 임의 90회/120초 차단은 제거했습니다. 다른 isolate/Collector의 동시 호출까지 전역 직렬화하지 않습니다.
일 1,000명은 분산 방문 및 캐시 적중 조건의 목표이며 보장된 처리량이 아닙니다. 최초 방문 집중 시 Production Key 한도에 도달할 수 있습니다. Collector와 동일 키를 쓰면 한도를 공유합니다. 429를 기록해 실제 빈도에 맞게 향후 공유 조정기를 검토하세요.

`[profile]` 로그는 analysisMatches=30, 전체 실제 Riot 호출 수, ID 개수, DB cache hit/miss, 실제 detail 호출 수, 최종 cache HIT/MISS만 남깁니다. 키/전체 PUUID/원본 응답은 로깅하지 않습니다.

## 30경기 표본

ANALYSIS_MATCH_COUNT=30, FORM_WINDOW=15. 15 대 15 비교로 조회 표본 전체를 사용합니다. 카드 최근 폼은 최근 10경기와 앞선 10~20경기를 비교하는 기존 수식을 유지합니다. 칭호 최소 20경기 및 보드 기록 80%, 선호 항목 최소 3회는 낮추지 않았습니다. 캐시 키에 표본 수를 포함해 이전 배포의 결과를 재사용하지 않습니다.
