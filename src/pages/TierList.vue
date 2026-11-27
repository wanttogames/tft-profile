<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import AssetBadge from '../components/AssetBadge.vue';
import MetaCompanions from '../components/MetaCompanions.vue';
import { fetchTierList } from '../api/tierList';
import { lookupAsset } from '../static-data/catalog';
import {
  GROUP_LABELS,
  TIERS,
  tierMinimum,
  tierScope,
  type TierData,
  type TierRow,
} from '../meta/tierList';
import { TIER_LIST_PATH, TIER_PAGES } from '../meta/tierPages';
import type { MetaKind } from '../types/meta';

const props = defineProps<{ kind: MetaKind; overview: boolean }>();
const data = ref<TierData>();
const group = ref('all');
const loading = ref(true);
const error = ref('');
const kindPage = computed(() => TIER_PAGES[props.kind]);
const heading = computed(() =>
  props.overview ? 'TFT 메타 티어리스트' : `롤토체스 ${kindPage.value.name} 티어리스트`,
);
const labels = computed(() => GROUP_LABELS[props.kind]);
const summary = computed(() => data.value?.summary);
const visible = computed(() =>
  (data.value?.rows ?? []).filter((row) => group.value === 'all' || row.group === group.value),
);
const sections = computed(() =>
  TIERS.map((tier) => ({ tier, rows: visible.value.filter((row) => row.tier === tier) })),
);
const unranked = computed(() => visible.value.filter((row) => row.tier === null));
const statusText = {
  confirmed: '경기 버전 기반 확인 패치',
  estimated: '공식 일정·적용 기준에 따른 추정 집계',
  transition: '패치 전환 대기 · 신규 범위 검증 중',
  unconfirmed: '패치 또는 집계 세트 미확정 · 참고 통계만 제공',
  collecting: '데이터 수집 중',
  insufficient: '티어를 비교할 수 있는 표본 부족',
};
const confidence = {
  insufficient: '표본 부족',
  low: '낮은 신뢰도',
  medium: '보통 신뢰도',
  high: '높은 신뢰도',
};
const date = computed(() => {
  const time = summary.value?.refreshed_at ?? summary.value?.latest_collected_at;
  return time ? new Date(time).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '—';
});
const percent = (value: number) => (value * 100).toFixed(1) + '%';
const asset = (row: TierRow) =>
  lookupAsset(data.value?.assets ?? {}, props.kind === 'champion' ? 'unit' : props.kind, row.id);
async function load() {
  loading.value = true;
  error.value = '';
  try {
    data.value = await fetchTierList(props.kind);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '티어리스트를 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>

<template>
  <section class="tier-page">
    <h1>{{ heading }}</h1>
    <p class="small muted">
      최근 7일 · 한국 랭크 · Challenger·Grandmaster 래더에서 수집한 경기의 전체 참가자 기준
    </p>
    <nav class="tier-navigation" aria-label="티어리스트 종류">
      <a :href="TIER_LIST_PATH" :aria-current="overview ? 'page' : undefined">통합</a>
      <a
        v-for="(tab, key) in TIER_PAGES"
        :key="key"
        :href="tab.path"
        :aria-current="!overview && kind === key ? 'page' : undefined"
        >{{ tab.name }}</a
      >
      <a class="stat-link" :href="kindPage.stats">{{ kindPage.name }} 상세 통계 ↗</a>
    </nav>

    <div v-if="summary" class="tier-summary">
      <span
        >집계 패치
        <strong>{{ summary.preview_set_number ? '—' : summary.current_patch || '—' }}</strong></span
      >
      <span
        >세트
        <strong>{{
          summary.aggregate_set_number ?? summary.preview_set_number ?? '—'
        }}</strong></span
      >
      <span
        >집계 <strong>{{ summary.match_count.toLocaleString() }}경기</strong></span
      >
      <span
        >참가자 <strong>{{ summary.participant_count.toLocaleString() }}건</strong></span
      >
      <span
        >갱신 <strong>{{ date }} KST</strong></span
      >
    </div>
    <p v-if="data" class="tier-status" role="status">
      {{ statusText[data.status] }}
      <template v-if="data.status === 'insufficient' && tierScope(data.summary) === 'estimated'">
        · {{ statusText.estimated }}</template
      >
      <template v-if="data.status === 'transition'">
        · 전환 대상
        {{
          summary?.preview_patch || summary?.external_patch || summary?.detected_patch || '확인 중'
        }}
      </template>
    </p>
    <p v-if="data && !summary?.generation" class="small muted">
      세트 단위 집계 검증을 기다리고 있습니다.
    </p>
    <div v-if="loading" class="tier-skeleton" role="status" aria-label="티어리스트 불러오는 중">
      <div v-for="tier in TIERS" :key="tier"></div>
    </div>
    <div v-else-if="error" class="panel">
      <p role="alert">{{ error }}</p>
      <button type="button" class="tier-retry" @click="load">다시 시도</button>
    </div>
    <template v-else-if="data && data.rows.length">
      <label v-if="kind !== 'trait'" class="tier-filter">
        {{ kind === 'champion' ? '챔피언 비용' : '아이템 종류' }}
        <select v-model="group">
          <option value="all">전체</option>
          <option v-for="(label, id) in labels" :key="id" :value="id">{{ label }}</option>
        </select>
      </label>
      <p class="small muted">
        {{
          kind === 'champion'
            ? '전체 보기에도 비용별 점수를 표시합니다.'
            : kind === 'item'
              ? '같은 종류의 아이템끼리 성적을 비교합니다.'
              : '활성 특성 전체 성적입니다. 상세에는 단계별 표본 수를 표시합니다.'
        }}
      </p>
      <p v-if="!visible.length" class="panel muted">이 분류에는 집계된 항목이 없습니다.</p>
      <div v-else class="tier-board">
        <section
          v-for="section in sections"
          :key="section.tier"
          class="tier-rank"
          :aria-label="`${section.tier} 티어`"
        >
          <h2 :class="'rank-' + section.tier">{{ section.tier }}</h2>
          <ul v-if="section.rows.length" class="tier-cards">
            <li
              v-for="row in section.rows"
              :key="row.id"
              :class="{ provisional: row.confidence === 'low' }"
            >
              <details>
                <summary :title="`1위 ${percent(row.win_rate)} · ${confidence[row.confidence]}`">
                  <AssetBadge :id="row.id" :asset="asset(row)" />
                  <span
                    >평균 {{ row.avg_placement.toFixed(2) }}위 · TOP4
                    {{ percent(row.top4_rate) }}</span
                  >
                  <span
                    >{{ row.sample_count.toLocaleString() }}회 · {{ row.score?.toFixed(1) }}점</span
                  >
                  <span v-if="row.confidence === 'low'" class="provisional-label">임시 티어</span>
                </summary>
                <div class="tier-detail">
                  <p>
                    {{ labels[row.group] }} · {{ confidence[row.confidence] }} · 1위
                    {{ percent(row.win_rate) }}
                  </p>
                  <p v-if="row.avg_star_level != null">
                    평균 별 등급 {{ row.avg_star_level.toFixed(2) }}
                  </p>
                  <p v-if="asset(row)?.description">{{ asset(row)?.description }}</p>
                  <template v-if="row.common_items?.length">
                    <p>주요 장착 아이템</p>
                    <MetaCompanions :entries="row.common_items" :assets="data.assets" kind="item" />
                  </template>
                  <template v-if="row.common_champions?.length">
                    <p>주요 장착 챔피언</p>
                    <MetaCompanions
                      :entries="row.common_champions"
                      :assets="data.assets"
                      kind="unit"
                    />
                  </template>
                  <ul v-if="row.tier_samples?.length">
                    <li v-for="stage in row.tier_samples" :key="stage.tier_current">
                      활성 단계 {{ stage.tier_current }} ·
                      {{ stage.sample_count.toLocaleString() }}회
                    </li>
                  </ul>
                  <a :href="kindPage.stats">{{ kindPage.name }} 상세 통계 ↗</a>
                </div>
              </details>
            </li>
          </ul>
          <p v-else class="tier-empty small muted">이 등급에 배정된 항목이 없습니다.</p>
        </section>
      </div>
      <details v-if="unranked.length" class="panel unranked">
        <summary>티어 미산정 {{ unranked.length.toLocaleString() }}개</summary>
        <ul>
          <li v-for="row in unranked" :key="row.id">
            <AssetBadge :id="row.id" :asset="asset(row)" />
            <span class="small muted"
              >{{ row.sample_count.toLocaleString() }}회 ·
              {{
                row.confidence === 'insufficient' ? '표본 부족' : '비교군 또는 분류 정보 부족'
              }}</span
            >
          </li>
        </ul>
      </details>
    </template>
    <p v-else-if="!loading" class="panel muted">
      표시할 티어가 없습니다. <a :href="kindPage.stats">상세 통계 보기 ↗</a>
    </p>

    <section class="panel tier-method">
      <h2>티어 산정 기준</h2>
      <p>
        평균 등수 45%, TOP4 35%, 1위율 20%를 같은 비교군에서 0~100으로 환산합니다. 각 성적은 표본이
        적을수록 비교군의 표본 가중 평균에 가깝게 보정됩니다. S는 85점, A는 70점, B는 55점, C는
        40점부터이며 40점 미만은 D입니다.
      </p>
      <p>
        최소 {{ data ? tierMinimum(data.minSampleSize) : 50 }}회부터 산정하며 50~99회는 임시
        티어입니다. 100~299회는 보통, 300회 이상은 높은 표본 신뢰도로 표시합니다. 최소 표본을 채운
        비교 대상이 두 개 이상 필요합니다.
      </p>
      <p>
        챔피언은 비용별, 아이템은 분류별, 특성은 활성 특성끼리 비교합니다. 비용 정보가 없거나
        비교하기 어려운 특수·소모성 아이템은 미산정으로 표시합니다. 최종 보드 통계에는 생존 시간과
        덱 선택의 영향이 함께 포함됩니다.
      </p>
    </section>
  </section>
</template>

<style scoped>
.tier-page {
  max-width: 1120px;
  margin: auto;
  min-width: 0;
}
h1 {
  margin-bottom: 8px;
  font-size: clamp(23px, 4vw, 36px);
}
.tier-navigation,
.tier-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
}
.tier-navigation a,
.tier-retry,
select {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #172332;
  color: #e8edf5;
}
.tier-navigation a[aria-current] {
  border-color: #5c9e8c;
  color: var(--mint);
}
.tier-navigation .stat-link {
  color: var(--mint);
}
.tier-summary {
  gap: 6px 16px;
  font-size: 13px;
  color: var(--muted);
}
.tier-summary strong {
  color: #e8edf5;
}
.tier-status {
  border-left: 3px solid var(--mint);
  padding-left: 9px;
  font-size: 13px;
}
.tier-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  font-size: 13px;
}
select {
  max-width: 100%;
  font: inherit;
}
.tier-rank {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 7px;
  margin-bottom: 8px;
}
.tier-rank h2 {
  display: grid;
  place-items: center;
  align-self: stretch;
  min-height: 44px;
  margin: 0;
  border-radius: 7px;
  color: #131b25;
  font-size: 17px;
}
.rank-S {
  background: #f48787;
}
.rank-A {
  background: #ffc090;
}
.rank-B {
  background: #f4dc87;
}
.rank-C {
  background: #9cd8a7;
}
.rank-D {
  background: #a3bbd7;
}
.tier-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 154px), 1fr));
  align-items: start;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.tier-cards > li {
  min-width: 0;
  background: #131e2c;
  border: 1px solid var(--border);
  border-radius: 7px;
  overflow-wrap: anywhere;
}
.tier-cards > li.provisional {
  border: 1px dashed #c3996e;
}
.tier-cards summary,
.unranked summary {
  min-height: 44px;
  cursor: pointer;
}
.tier-cards summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  font-size: 12px;
}
.tier-cards summary:hover,
.tier-cards summary:focus-visible {
  background: #1e3042;
}
.tier-cards .asset,
.unranked .asset {
  white-space: normal;
  min-width: 0;
}
.provisional-label {
  color: #ffcd9d;
}
.tier-detail {
  padding: 8px;
  font-size: 12px;
  border-top: 1px solid var(--border);
}
.tier-detail :deep(.companions) {
  flex-wrap: wrap;
}
.tier-detail p,
.tier-detail ul {
  margin: 0 0 5px;
}
.tier-detail ul {
  padding-left: 15px;
}
.tier-detail a,
p a {
  color: var(--mint);
}
.tier-empty,
.tier-skeleton div {
  margin: 0;
  padding: 10px;
  border-radius: 7px;
  background: #142031;
}
.tier-skeleton {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}
.tier-skeleton div {
  height: 52px;
}
.unranked {
  margin-top: 15px;
}
.unranked ul {
  display: grid;
  gap: 8px;
  list-style: none;
  padding: 0;
}
.unranked li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  overflow-wrap: anywhere;
}
.tier-method {
  margin-top: 18px;
  font-size: 14px;
}
</style>
