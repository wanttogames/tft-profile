# 최근 30경기 프로필 배포 안내

## 결과

ANALYSIS_MATCH_COUNT=30, FORM_WINDOW=15. 단일 프로필 호출과 다층 캐시를 유지했습니다. 모든 개인 분석은 최대 30경기입니다. 폼 변화·과거의 나 비교는 15 대 15, 카드 폼 점수는 최근 10 대 이전 10~20으로 기존 의도를 유지합니다. 표본 축소로 점수와 다양성 정규화 결과가 이전 배포와 달라질 수 있습니다. 최소 선호 표본 3회, 칭호 최소 20경기·보드 기록 80%는 유지했습니다.

완전 신규 Riot 요청은 33회로 기존 약 53~56회 대비 약 38~41% 줄었습니다. 재조회 시 기존 Account/Rank 및 29경기 캐시가 유효하면 약 2회, 120초 내 동일 프로필은 0회입니다. 브라우저 캐시 적중 시 프로필 API 자체도 0회입니다.

테스트 20파일 187개 통과. npm run build의 TypeScript 검사 및 Vite 빌드 성공. Pages Functions 번들 성공. 실제 서비스 자격 증명 조회나 1,000명 부하 테스트는 수행하지 않았습니다.

## 배포 전 수행

1. ZIP 내부 tft-profile 폴더의 내용을 기존 C:\work\tft-profile 에 반영합니다. .git은 기존 것을 유지하세요.
2. 아래 명령으로 이름이 변경된 옛 테스트 파일을 삭제합니다. ZIP 덮어쓰기는 파일 삭제를 적용하지 않으므로 필요합니다.
3. 아직 실행하지 않았다면 Supabase SQL Editor에서 supabase/migrations/007_tft_profile_match_cache.sql을 실행합니다. 이전 배포에서 이미 적용했다면 추가 DB 변경은 없습니다.
4. Supabase Cron에 매일 `delete from public.tft_profile_match_cache where expires_at <= now();`를 실행하도록 등록합니다. maintenance/profile-cache-cleanup.sql에 pg_cron 등록 예시가 있습니다. 이미 같은 작업이 있으면 중복 등록하지 않습니다.
5. Cloudflare Production/Preview의 기존 RIOT_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, 선택 TFT_STATIC_VERSION을 유지합니다. 새 환경변수·바인딩은 없습니다.
6. 신규 30경기 경로의 예상 subrequest는 정적 데이터 fallback 포함 최대 48회입니다. 이전 Paid 필수 조건은 해소됐으나 외부 redirect/실제 리소스 한도/집중 유입은 로그로 확인하세요.
7. Git 배포 후 `[profile]`의 analysisMatches=30, riotRequests 및 cache hit/miss를 확인합니다.

```powershell
cd C:\work\tft-profile
Remove-Item .\tests\api-fifty.test.ts, .\tests\fifty-games.test.ts -ErrorAction SilentlyContinue
npm test
npm run build
git add -A
git commit -m "Use 30-match TFT profiles with production caching"
git pull --rebase origin main
git push origin main
```

## 수정 파일

- `README.md`
- `docs/cloudflare-migration.md`
- `docs/profile-cache.md`
- `server/handlers/tft-player.ts`
- `server/lib/profileMatchCache.ts`
- `src/App.vue`
- `src/analytics/formAnalysis.ts`
- `src/analytics/game/playerComparison.ts`
- `src/analytics/game/sample.ts`
- `src/analytics/strengthWeakness.ts`
- `src/components/BoardInsights.vue`
- `src/components/MatchList.vue`
- `src/components/PlayerCard.vue`
- `src/components/PlayerGameProfile.vue`
- `src/components/PreferencePanel.vue`
- `src/config/analysis.ts`
- `src/data/demo.ts`
- `src/types/riot.ts`
- `tests/analytics.test.ts`
- `tests/api.test.ts`
- `tests/cloudflare.test.ts`
- `tests/fixtures/README.md`
- `tests/gamification.test.ts`
- `tests/player-profile-scores.test.ts`
- `tests/profile-cache.test.ts`
- `tests/profile.test.ts`
- `tests/ui-render.test.ts`

## 신규 파일

- `tests/api-thirty.test.ts`
- `tests/player-client-cache.test.ts`
- `tests/thirty-games.test.ts`
- `docs/profile-30-release.md` (이 문서)

## 제거 또는 이름 변경

- `tests/api-fifty.test.ts`
- `tests/fifty-games.test.ts`

위 두 테스트는 각각 api-thirty.test.ts, thirty-games.test.ts로 대체했습니다. 2회 호출·mergePlayerChunks·임의 90회 차단은 앞선 캐시 리팩터링에서 제거된 상태를 유지합니다. Collector·메타 테이블·View·workflow는 이번 변경에 포함되지 않습니다. 캐시 테이블과 cleanup SQL은 ZIP에 그대로 포함되어 있습니다.
