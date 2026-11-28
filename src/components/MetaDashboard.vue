<script setup lang="ts">
import { TREND_PAGES } from '../meta/trends';
import { TIER_PAGES } from '../meta/tierPages';
import { ref, watch, onBeforeUnmount, onMounted } from 'vue';
import { fetchMeta } from '../api/meta';
import type { MetaData, MetaKind, MetaSort, MetaRow } from '../types/meta';
import { lookupAsset } from '../static-data/catalog';
import AssetBadge from './AssetBadge.vue';
import MetaCompanions from './MetaCompanions.vue';
const props = withDefaults(defineProps<{ initialKind?: MetaKind }>(), { initialKind: 'item' });
const kind = ref<MetaKind>(props.initialKind),
  sort = ref<MetaSort>('sample_count'),
  page = ref(0);
const data = ref<MetaData | null>(null),
  busy = ref(false),
  error = ref('');
let controller: AbortController | undefined;
async function load() {
  controller?.abort();
  const current = new AbortController();
  controller = current;
  busy.value = true;
  error.value = '';
  data.value = null;
  try {
    const result = await fetchMeta(kind.value, sort.value, page.value, current.signal);
    if (!current.signal.aborted) data.value = result;
  } catch (e) {
    if (!current.signal.aborted) error.value = e instanceof Error ? e.message : '조회 실패';
  } finally {
    if (controller === current) busy.value = false;
  }
}
watch([kind, sort], () => {
  if (page.value !== 0) page.value = 0;
  else void load();
});
watch(page, load);
onMounted(load);
onBeforeUnmount(() => controller?.abort());
const tabs: { id: MetaKind; name: string }[] = [
  { id: 'item', name: '아이템' },
  { id: 'champion', name: '챔피언' },
  { id: 'trait', name: '특성' },
];
const rowId = (r: MetaRow) => r.item_name ?? r.character_id ?? r.trait_name ?? '';
const asset = (id: string, type: 'unit' | 'item' | 'trait') =>
  lookupAsset(data.value?.assets ?? {}, type, id);
const percent = (v: number) => (v * 100).toFixed(1) + '%';
</script>
<template>
  <section class="meta-area">
    <p class="eyebrow">COLLECTED BOARDS / META</p>
    <h1>상위 래더의 최종 보드<span>.</span></h1>
    <p class="muted">
      {{
        data?.summary.preview_patch
          ? `참고 패치 ${data.summary.preview_patch} (전환 대기)`
          : data?.summary.preview_set_number
          ? `패치 미확정 참고 통계 · 세트 ${data.summary.preview_set_number}`
          : data?.summary.current_patch
          ? `집계 패치 ${data.summary.current_patch}${data.summary.patch_source === 'official' && data.summary.boundary_basis === 'schedule-estimate' ? ' (일정 기반 추정)' : ''}`
          : '현재 패치 확인 대기'
      }}
      · 최근 7일 · KR 랭크 경기
    </p>
    <p class="small muted">
      사용 빈도와 성적은 다른 지표입니다. 표본이 많은 항목부터 비교한 뒤 평균 등수(낮을수록 좋음),
      TOP4, 1위율을 함께 확인하세요. 최종 보드에서 관찰한 통계이며 특정 선택이 성적의 원인임을
      뜻하지 않습니다. <a href="/guide">통계 읽는 방법 →</a>
    </p>
    <nav class="meta-tabs" aria-label="메타 통계 종류">
      <a
        v-for="tab in tabs"
        :key="tab.id"
        :aria-current="kind === tab.id ? 'page' : undefined"
        :href="{ item: '/items', champion: '/champions', trait: '/traits' }[tab.id]"
      >
        {{ tab.name }}
      </a>
      <a :href="TIER_PAGES[kind].path">{{ TIER_PAGES[kind].name }} 티어리스트 →</a>
      <a :href="TREND_PAGES[kind].path">패치 변화 →</a>
      <a href="/set19/readiness">시즌19 전환 상태 →</a>
    </nav>
    <p v-if="data?.summary.preview_set_number" class="notice" role="status">
      {{ data.summary.preview_patch ? '공식 패치 적용 기준과 세트 번호에 따른 전환 대기 참고 통계입니다. 실제 경기 버전은 확인되지 않았습니다.' : '패치 미확정 참고 통계입니다. 동일 세트의 최근 7일 경기이며 여러 패치가 포함될 수 있습니다.' }}
      확정 패치 성적으로 해석하지 마세요.
    </p>
    <p v-else-if="data && !data.summary.current_patch" class="muted">
      패치가 충분히 확인되면 확정 통계가 표시됩니다.
    </p>
    <p v-if="data?.summary.external_patch && data.summary.external_patch !== data.summary.current_patch" class="muted">
      감지 패치 {{ data.summary.external_patch }} · 전환 검증 표본
      {{ data.summary.external_eligible_count ?? 0 }} / {{ data.summary.confirm_min_samples ?? 30 }} 경기
    </p>
    <p v-if="data?.summary.patch_source === 'official' && !data.summary.preview_set_number" class="muted">
      {{ data.summary.boundary_basis === 'schedule-estimate' ? '공식 패치노트·일정과 48시간 유예 구간, 동일 세트 표본으로 추정한 집계입니다. 한국 서버 실제 적용 시각이나 개별 경기 버전을 직접 확인한 것은 아닙니다.' : data.summary.boundary_basis === 'verified' ? '관리자가 검증 근거를 등록한 적용 기준과 동일 세트로 분류한 표본입니다.' : '공식 패치 최초 관측 시각과 동일 세트로 분류한 표본입니다. 개별 경기 버전은 확인되지 않았습니다.' }}
    </p>
    <div class="stats-grid meta-summary" aria-live="polite">
      <section class="stat">
        <span>집계 Match</span
        ><strong>{{ data?.summary.match_count.toLocaleString() ?? '—' }}</strong>
      </section>
      <section v-if="data?.summary.stored_match_count !== undefined" class="stat">
        <span>저장 경기 (7일)</span>
        <strong>{{ data.summary.stored_match_count.toLocaleString() }}</strong>
        <p class="small muted">패치 미확정 {{ data.summary.unresolved_match_count ?? 0 }}건</p>
      </section>
      <section class="stat">
        <span>Participant</span
        ><strong>{{ data?.summary.participant_count.toLocaleString() ?? '—' }}</strong>
      </section>
      <section class="stat">
        <span>마지막 수집</span>
        <p>
          {{
            (data?.summary.latest_stored_at ?? data?.summary.latest_collected_at)
              ? new Date((data?.summary.latest_stored_at ?? data?.summary.latest_collected_at)!).toLocaleString('ko-KR')
              : '—'
          }}
        </p>
      </section>
      <section class="stat">
        <span>수집 대상 Tier</span>
        <p>Challenger · Grandmaster</p>
      </section>
    </div>
    <p class="small muted meta-context">
      해당 래더에서 수집한 경기의 전체 참가자를 집계합니다. 모든 참가자가 Challenger·Grandmaster라는
      뜻은 아닙니다. 패치 미확정 참고 통계는 패치가 섞일 수 있으며 공식 티어 순위가 아닙니다.
    </p>
    <div class="meta-toolbar">
      <button class="secondary" :disabled="busy" @click="load" aria-label="메타 통계 새로고침">
        {{ busy ? '불러오는 중…' : '↻ 새로고침' }}
      </button>
      <label
        >정렬
        <select v-model="sort">
          <option value="sample_count">표본 수 높은 순</option>
          <option value="avg_placement">평균 등수 낮은 순</option>
          <option value="top4_rate">TOP4% 높은 순</option>
          <option value="win_rate">1위% 높은 순</option>
        </select></label
      >
      <span class="small muted"
        >최소 표본 {{ data?.minSampleSize ?? '—' }} · 평균 등수는 낮을수록 좋습니다</span
      >
    </div>
    <div v-if="busy" class="panel" role="status">수집된 메타 통계를 불러오는 중…</div>
    <div v-else-if="error" class="notice error" role="alert">
      {{ error }} <button class="secondary" @click="load">다시 시도</button>
    </div>
    <div v-else-if="data && !data.rows.length" class="panel">
      {{
        data.summary.match_count === 0
          ? (data.summary.stored_match_count ?? 0) > 0
            ? '저장된 경기가 있지만 패치 또는 세트 검증 조건을 충족하지 못했습니다.'
            : '아직 집계 가능한 랭크 경기가 없습니다.'
          : '최소 표본 조건을 충족하는 데이터가 없습니다.'
      }}
    </div>
    <div v-else-if="data" class="panel meta-table-wrap">
      <table class="meta-table">
        <thead>
          <tr>
            <th scope="col">{{ tabs.find((t) => t.id === kind)?.name }}</th>
            <th scope="col">표본 수</th>
            <th scope="col">평균 등수 ↓</th>
            <th scope="col">TOP4%</th>
            <th scope="col">1위%</th>
            <th v-if="kind !== 'item'" scope="col">
              {{ kind === 'champion' ? '평균 별 등급' : '평균 활성 단계' }}
            </th>
            <th scope="col">
              {{
                kind === 'item'
                  ? '주요 장착 챔피언'
                  : kind === 'champion'
                    ? '주요 장착 아이템'
                    : '활성 단계별 표본'
              }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in data.rows" :key="rowId(r)">
            <th scope="row">
              <AssetBadge
                :id="rowId(r)"
                :asset="asset(rowId(r), kind === 'champion' ? 'unit' : kind)"
              />
            </th>
            <td>{{ r.sample_count.toLocaleString() }}</td>
            <td class="mint">{{ r.avg_placement.toFixed(2) }}</td>
            <td>{{ percent(r.top4_rate) }}</td>
            <td>{{ percent(r.win_rate) }}</td>
            <td v-if="kind !== 'item'">
              {{ (r.avg_star_level ?? r.avg_tier_current)?.toFixed(2) ?? '—' }}
            </td>
            <td>
              <MetaCompanions
                v-if="kind !== 'trait'"
                :entries="r.common_champions ?? r.common_items ?? []"
                :assets="data.assets"
                :kind="kind === 'item' ? 'unit' : 'item'"
              />
              <span v-for="t in r.tier_samples ?? []" :key="t.tier_current" class="pill"
                >{{ t.tier_current }}단계 · {{ t.sample_count }}회</span
              >
              <span
                v-if="kind !== 'trait' && !(r.common_champions ?? r.common_items)?.length"
                class="muted"
                >관측 없음</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="data" class="meta-pagination">
      <button class="secondary" :disabled="page === 0" @click="page--">이전</button
      ><span>{{ page + 1 }} 페이지 · 최대 50개씩</span
      ><button class="secondary" :disabled="!data.hasMore" @click="page++">다음</button>
    </div>
    <p class="small muted">
      표본 단위는 참가자별 경기입니다. 동일 아이템·챔피언 중복 보유는 1회로 집계합니다. 챔피언 평균
      별 등급은 한 보드 내 같은 챔피언의 평균을 낸 뒤 보드별로 평균합니다. 특성은 활성 단계가 1
      이상인 경우만 집계합니다. 장착·사용 성적은 인과관계나 추천을 뜻하지 않습니다.
    </p>
  </section>
</template>
<style scoped>
.meta-area {
  padding: 24px 0;
}
.meta-tabs,
.meta-toolbar,
.meta-pagination {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin: 16px 0;
}
.meta-tabs button {
  padding: 12px 24px;
  border: 1px solid #344449;
  border-radius: 10px;
  background: #152126;
  color: #b9c8cb;
}
.meta-tabs button[aria-pressed='true'] {
  background: #25493e;
  color: #7ce3b4;
  border-color: #7ce3b4;
}
.meta-toolbar {
  justify-content: space-between;
}
.meta-toolbar select {
  padding: 10px;
  background: #18272b;
  color: #e3eded;
  border: 1px solid #425457;
  border-radius: 8px;
}
.meta-summary .stat p {
  font-size: 14px;
  line-height: 1.6;
}
.meta-table-wrap {
  overflow-x: auto;
  padding: 0;
}
.meta-table {
  width: 100%;
  min-width: 780px;
  border-collapse: collapse;
  text-align: left;
}
.meta-table th,
.meta-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #27383d;
}
.meta-table thead {
  background: #18282e;
  color: #a4b9be;
  font-size: 12px;
}
.meta-table tbody th {
  font-weight: 500;
  min-width: 160px;
}
.meta-table tbody tr {
  height: 60px;
}
.meta-table tbody tr:hover {
  background: #1b3035;
}
.meta-table th:not(:first-child):not(:last-child),
.meta-table td:not(:last-child) {
  width: 92px;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.meta-table th,
.meta-table td {
  vertical-align: middle;
}
.meta-table tbody th :deep(.asset) {
  display: flex;
  align-items: center;
  gap: 10px;
  line-height: 1.3;
}
.meta-table tbody th :deep(.asset img),
.meta-table tbody th :deep(.asset-letter) {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  object-fit: cover;
}
.meta-table th:last-child,
.meta-table td:last-child {
  width: 202px;
}
.meta-pagination {
  justify-content: center;
}
.meta-table .pill {
  display: inline-block;
  margin: 3px;
}
.meta-area h1 {
  font-size: clamp(26px, 4vw, 44px);
}
@media (max-width: 600px) {
  .meta-tabs button {
    flex: 1;
    padding: 12px;
  }
  .meta-toolbar label {
    width: 100%;
  }
  .meta-toolbar select {
    max-width: 100%;
  }
}
</style>
