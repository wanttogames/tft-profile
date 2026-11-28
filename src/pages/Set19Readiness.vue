<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { hasTargetPatch, readinessStatus, type ReadinessData } from '../meta/readiness';

const data = ref<ReadinessData>();
const busy = ref(true);
const error = ref('');
const validation = computed(() => {
  const s = data.value?.summary;
  if (
    !s ||
    !hasTargetPatch(s.external_patch) ||
    s.external_eligible_count == null ||
    !s.confirm_min_samples
  )
    return '—';
  return `${s.external_eligible_count} / ${s.confirm_min_samples}경기`;
});
const time = (value?: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' KST' : '—';

async function load() {
  busy.value = true;
  error.value = '';
  try {
    const response = await fetch('/api/meta/readiness', { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw Error();
    data.value = await response.json();
  } catch {
    error.value = '점검 데이터를 불러오지 못했습니다.';
  } finally {
    busy.value = false;
  }
}
onMounted(load);
</script>

<template>
  <article class="readiness">
    <a href="/set19">← 시즌19 가이드</a>
    <h1>시즌19 메타 전환 점검</h1>
    <p class="muted">한국 랭크 경기 수집, 패치 집계, 챔피언 데이터 준비 상태를 확인합니다.</p>
    <p v-if="busy" role="status">확인 중입니다.</p>
    <p v-else-if="error" role="alert">{{ error }}</p>
    <p v-else-if="data" class="state" role="status">{{ readinessStatus(data) }}</p>
    <button class="secondary" type="button" :disabled="busy" @click="load">
      {{ error ? '다시 시도' : '다시 확인' }}
    </button>
    <div v-if="data && !error" class="checks">
      <section class="panel">
        <h2>패치 전환</h2>
        <dl>
          <dt>감지된 패치</dt>
          <dd>{{ data.summary.detected_patch ?? data.summary.external_patch ?? '—' }}</dd>
          <dt>현재 집계 패치 · 세트</dt>
          <dd>
            {{
              data.summary.preview_set_number
                ? '참고 집계 중'
                : (data.summary.current_patch ?? '—') +
                  ' · ' +
                  (data.summary.aggregate_set_number ?? '—')
            }}
          </dd>
          <dt>참고 집계</dt>
          <dd>
            {{
              data.summary.preview_set_number
                ? `세트 ${data.summary.preview_set_number} · ${data.summary.preview_patch ?? '패치 미확정'}`
                : '—'
            }}
          </dd>
          <dt>공식 기준 검증 표본</dt>
          <dd>{{ validation }}</dd>
          <dt>마지막 집계</dt>
          <dd>{{ time(data.summary.refreshed_at) }}</dd>
        </dl>
        <p class="small muted">검증 표본 외에도 패치 적용 시각과 같은 세트인지 확인합니다.</p>
      </section>
      <section class="panel">
        <h2>시즌19 경기 수집</h2>
        <dl>
          <dt>최근 7일 저장 완료</dt>
          <dd>{{ data.collection?.count ?? '—' }}경기</dd>
          <dt>패치 번호 미확인</dt>
          <dd>{{ data.collection?.unknownVersion ?? '—' }}경기</dd>
          <dt>시즌19 마지막 수집</dt>
          <dd>{{ time(data.collection?.latest) }}</dd>
          <dt>전체 세트 마지막 저장</dt>
          <dd>{{ time(data.summary.latest_stored_at) }}</dd>
        </dl>
        <p class="small muted">
          수집 시각은 저장된 경기 기준입니다. Collector 실행 기록은
          <a href="https://github.com/wanttogames/tft-profile/actions/workflows/collect-tft.yml"
            >GitHub Actions</a
          >에서 확인할 수 있습니다.
        </p>
      </section>
      <section class="panel">
        <h2>시즌19 챔피언 데이터</h2>
        <dl>
          <dt>한글 이름</dt>
          <dd>{{ data.catalog?.champions ?? '—' }}개</dd>
          <dt>아이콘 경로</dt>
          <dd>{{ data.catalog?.icons ?? '—' }}개</dd>
          <dt>코스트 정보</dt>
          <dd>{{ data.catalog?.costs ?? '—' }}개</dd>
          <dt>카탈로그 갱신</dt>
          <dd>{{ time(data.catalog?.fetchedAt) }}</dd>
        </dl>
        <p class="small muted">
          적용 중인 CommunityDragon 카탈로그에 등록된 값입니다. 아이콘 경로 등록 수는 이미지 응답
          검증 수와 다릅니다.
        </p>
      </section>
    </div>
    <nav aria-label="메타 바로가기">
      <a href="/meta">메타 통계 →</a><a href="/tier-list">티어리스트 →</a
      ><a href="/meta/patch-history">패치별 이력 →</a>
    </nav>
  </article>
</template>

<style scoped>
.readiness {
  max-width: 1120px;
  margin: auto;
}
h1 {
  margin: 12px 0 8px;
}
.state {
  color: var(--mint);
}
button {
  min-height: 44px;
  margin-bottom: 10px;
}
.checks {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 290px), 1fr));
}
.checks .panel {
  min-width: 0;
  margin-bottom: 0;
}
dl {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  gap: 9px 8px;
  font-size: 13px;
}
dt {
  color: var(--muted);
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
}
a {
  color: var(--mint);
}
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 15px;
}
nav a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
</style>
