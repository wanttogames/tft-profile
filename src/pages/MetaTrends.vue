<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import AssetBadge from '../components/AssetBadge.vue';
import TrendGraph from '../components/TrendGraph.vue';
import { fetchTrend, type TrendData, type TrendHistory, type TrendSeries } from '../api/trends';
import { GROUP_LABELS } from '../meta/tierList';
import {
  confidenceLabel,
  HISTORY_PATH,
  TREND_KINDS,
  TREND_PAGES,
  TREND_PATH,
  trendInsights,
  type Snapshot,
  type TrendRow,
} from '../meta/trends';
import { lookupAsset } from '../static-data/catalog';
import type { MetaKind } from '../types/meta';

const props = defineProps<{ kind?: MetaKind; history?: boolean }>();
const data = ref<TrendData>();
const archive = ref<TrendHistory>();
const knownPatches = ref<Snapshot[]>([]);
const series = ref<TrendSeries>();
const selected = ref<{ id: string; name: string }[]>([]);
const loading = ref(true);
const error = ref('');
const seriesLoading = ref(false);
const seriesError = ref('');
const set = ref('');
const from = ref('');
const to = ref('');
const group = ref('');
const sort = ref('improvement');
const page = ref(0);
const limit = 30;
let request: AbortController | undefined;
let graphRequest: AbortController | undefined;
const headings = computed(() =>
  props.history
    ? 'TFT 패치별 통계 이력'
    : props.kind
      ? `롤토체스 ${TREND_PAGES[props.kind].label} 메타 변화`
      : '롤토체스 패치별 메타 변화',
);
const patches = computed(() => knownPatches.value);
const sets = computed(() =>
  [...new Set(patches.value.map((snapshot) => snapshot.set_number))].sort((a, b) => b - a),
);
const patchChoices = computed(() =>
  patches.value.filter((snapshot) => !set.value || String(snapshot.set_number) === set.value),
);
const total = computed(() => (props.history ? archive.value : data.value)?.total ?? 0);
const state = computed(() => (props.history ? archive.value : data.value)?.status);
const asset = (row: TrendRow) =>
  lookupAsset(data.value?.assets ?? {}, row.kind === 'champion' ? 'unit' : row.kind, row.id);
const name = (row: TrendRow) => asset(row)?.name ?? row.id;
const insights = computed(() => trendInsights(data.value?.rows ?? [], name));
const time = (val: string) => new Date(val).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
const pct = (val: number | null | undefined) => (val == null ? '—' : (val * 100).toFixed(1) + '%');
const avg = (val: number | null | undefined) => (val == null ? '—' : val.toFixed(2));
const delta = (val: number | null, suffix: string) =>
  val === null ? '—' : `${val > 0 ? '+' : ''}${val.toFixed(2)}${suffix}`;
const placementChange = (value: number | null) =>
  value === null
    ? '—'
    : value === 0
      ? '변화 없음'
      : `${Math.abs(value).toFixed(2)}위 ${value > 0 ? '개선' : '악화'}`;
const compareMetrics = (row: TrendRow) => [
  {
    label: '평균 등수',
    before: avg(row.previous?.avg_placement),
    after: avg(row.current?.avg_placement),
    change: placementChange(row.placement),
  },
  {
    label: 'TOP4',
    before: pct(row.previous?.top4_rate),
    after: pct(row.current?.top4_rate),
    change: delta(row.top4, '%p'),
  },
  {
    label: '1위율',
    before: pct(row.previous?.win_rate),
    after: pct(row.current?.win_rate),
    change: delta(row.win, '%p'),
  },
  {
    label: '사용률',
    before: pct(row.previousUsage),
    after: pct(row.currentUsage),
    change: delta(row.usage, '%p'),
  },
  {
    label: '표본',
    before: row.previous?.sample_count ?? '—',
    after: row.current?.sample_count ?? '—',
    change: null,
  },
  {
    label: '티어',
    before: row.previousTier?.tier ?? '—',
    after: row.currentTier?.tier ?? '—',
    change: null,
  },
  {
    label: '티어 점수',
    before: row.previousTier?.score ?? '—',
    after: row.currentTier?.score ?? '—',
    change: null,
  },
];
function details(row: TrendRow, side: 'previous' | 'current') {
  const values = row[side]?.details;
  if (!values) return '—';
  if (row.kind === 'trait')
    return (
      values.tier_samples
        ?.map((stage) => `단계 ${stage.tier_current} ${stage.sample_count}회`)
        .join(' · ') || '—'
    );
  const entries = row.kind === 'champion' ? values.common_items : values.common_champions;
  return (
    entries
      ?.map((entry) => {
        const catalog = lookupAsset(
          data.value?.assets ?? {},
          row.kind === 'champion' ? 'item' : 'unit',
          entry.id,
        );
        return `${catalog?.name ?? entry.id} ${entry.sample_count}회`;
      })
      .join(' · ') || '—'
  );
}
function label(snapshot: Snapshot) {
  return snapshot.snapshot_type === 'final' ? '종료 직전 관측' : '일별 관측';
}
async function load() {
  request?.abort();
  const controller = new AbortController();
  request = controller;
  loading.value = true;
  error.value = '';
  const params = new URLSearchParams({ page: String(page.value), limit: String(limit) });
  if (props.kind) params.set('kind', props.kind);
  if (set.value && !props.history) params.set('set', set.value);
  if (from.value) params.set('fromPatch', from.value);
  if (to.value) params.set('toPatch', to.value);
  if (group.value) params.set('group', group.value);
  if (sort.value) params.set('sort', sort.value);
  try {
    if (props.history) archive.value = await fetchTrend('patch-history', params, controller.signal);
    else {
      const result = await fetchTrend<TrendData>('trends', params, controller.signal);
      if (!controller.signal.aborted) {
        data.value = result;
        if (!params.has('set')) knownPatches.value = result.patches;
        if (!set.value && result.to) set.value = String(result.to.set_number);
        if (!from.value && result.from) from.value = result.from.patch;
        if (!to.value && result.to) to.value = result.to.patch;
      }
    }
  } catch (cause) {
    if (!controller.signal.aborted)
      error.value = cause instanceof Error ? cause.message : '메타 이력 조회 실패';
  } finally {
    if (!controller.signal.aborted) loading.value = false;
  }
}
function selectSet() {
  from.value = '';
  to.value = '';
  selected.value = [];
  graphRequest?.abort();
  series.value = undefined;
  seriesError.value = '';
  seriesLoading.value = false;
  reload();
}
function reload() {
  page.value = 0;
  void load();
}
function changePage(change: number) {
  page.value += change;
  void load();
}
async function toggleGraph(row: TrendRow) {
  if (selected.value.some((entry) => entry.id === row.id))
    selected.value = selected.value.filter((entry) => entry.id !== row.id);
  else if (selected.value.length < 3)
    selected.value = [...selected.value, { id: row.id, name: name(row) }];
  graphRequest?.abort();
  series.value = undefined;
  seriesError.value = '';
  seriesLoading.value = false;
  if (!selected.value.length || !props.kind || !set.value) return;
  const controller = new AbortController();
  graphRequest = controller;
  seriesLoading.value = true;
  const params = new URLSearchParams({ kind: props.kind, set: set.value });
  for (const entry of selected.value) params.append('entityId', entry.id);
  try {
    const result = await fetchTrend<TrendSeries>('trends/entity', params, controller.signal);
    if (!controller.signal.aborted) series.value = result;
  } catch {
    if (!controller.signal.aborted) seriesError.value = '선택한 항목의 추이를 불러오지 못했습니다.';
  } finally {
    if (!controller.signal.aborted) seriesLoading.value = false;
  }
}
onMounted(load);
onBeforeUnmount(() => {
  request?.abort();
  graphRequest?.abort();
});
</script>
<template>
  <section class="meta-trends">
    <h1>{{ headings }}</h1>
    <p class="small muted">한국 랭크 · 저장된 최근 7일 관측 집계끼리 비교합니다.</p>
    <nav class="trend-nav" aria-label="메타 변화 메뉴">
      <a :href="TREND_PATH" :aria-current="!kind && !history ? 'page' : undefined">종합</a>
      <a
        v-for="k in TREND_KINDS"
        :key="k"
        :href="TREND_PAGES[k].path"
        :aria-current="k === kind ? 'page' : undefined"
        >{{ TREND_PAGES[k].label }}</a
      >
      <a :href="HISTORY_PATH" :aria-current="history ? 'page' : undefined">패치 이력</a>
      <a href="/tier-list">현재 티어 ↗</a>
    </nav>
    <div v-if="!history && patches.length" class="trend-controls">
      <label
        >세트<select v-model="set" @change="selectSet">
          <option v-for="s in sets" :key="s" :value="String(s)">{{ s }}</option>
        </select></label
      >
      <label
        >비교할 이전 패치<select v-model="from" @change="reload">
          <option value="">직전 보유 패치</option>
          <option
            v-for="p in patchChoices"
            :key="p.snapshot_id"
            :value="p.patch"
            :disabled="p.patch === to"
          >
            {{ p.patch }}
          </option>
        </select></label
      >
      <label
        >기준 패치<select v-model="to" @change="from === to ? ((from = ''), reload()) : reload()">
          <option value="">최신 보유 패치</option>
          <option v-for="p in patchChoices" :key="p.snapshot_id" :value="p.patch">
            {{ p.patch }}
          </option>
        </select></label
      >
      <label v-if="kind && kind !== 'trait'"
        >비교군<select v-model="group" @change="reload">
          <option value="">전체</option>
          <option v-for="(groupLabel, id) in GROUP_LABELS[kind]" :key="id" :value="id">
            {{ groupLabel }}
          </option>
        </select></label
      >
      <label v-if="kind"
        >정렬<select v-model="sort" @change="reload">
          <option value="improvement">평균 등수 개선</option>
          <option value="decline">평균 등수 하락</option>
          <option value="usage">사용률 상승</option>
          <option value="top4">TOP4 상승</option>
          <option value="win">1위율 상승</option>
        </select></label
      >
    </div>
    <div v-if="loading" class="panel" role="status">저장된 메타 집계를 불러오는 중입니다.</div>
    <div v-else-if="error" class="panel">
      <p role="alert">{{ error }}</p>
      <button type="button" @click="load">다시 시도</button>
    </div>
    <p v-else-if="state === 'setup'" class="panel muted">
      메타 이력 저장 설정을 기다리고 있습니다.
    </p>
    <template v-else-if="history">
      <p v-if="!archive?.snapshots.length" class="panel muted">
        저장된 패치 집계를 기다리고 있습니다.
      </p>
      <div v-else class="history-entries">
        <article v-for="snapshot in archive.snapshots" :key="snapshot.snapshot_id" class="panel">
          <strong>세트 {{ snapshot.set_number }} · 패치 {{ snapshot.patch }}</strong>
          <span>{{ snapshot.snapshot_date }} · {{ label(snapshot) }}</span>
          <span
            >{{ snapshot.match_count.toLocaleString() }}경기 ·
            {{ snapshot.participant_count.toLocaleString() }}보드</span
          >
          <span>{{ confidenceLabel[snapshot.confidence_status] }}</span>
          <small
            >집계창 {{ time(snapshot.window_start) }} ~ {{ time(snapshot.window_end) }} KST</small
          >
        </article>
      </div>
    </template>
    <template v-else-if="data">
      <div v-if="data.to" class="snapshot-summary">
        <article
          v-for="snapshot in [data.to, data.from].filter((s) => s !== null)"
          :key="snapshot.snapshot_id"
          class="panel"
        >
          <strong>세트 {{ snapshot.set_number }} · 패치 {{ snapshot.patch }}</strong>
          <span
            >{{ snapshot.match_count.toLocaleString() }}경기 ·
            {{ snapshot.participant_count.toLocaleString() }}보드</span
          >
          <span>{{ confidenceLabel[snapshot.confidence_status] }} · {{ label(snapshot) }}</span>
          <small>갱신 {{ time(snapshot.snapshot_at) }} KST</small>
          <small
            >집계창 {{ time(snapshot.window_start) }} ~ {{ time(snapshot.window_end) }} KST</small
          >
        </article>
      </div>
      <p v-if="data.status === 'waiting'" class="panel muted">
        동일 세트에서 비교할 수 있는 두 패치의 집계를 기다리고 있습니다.
      </p>
      <template v-else>
        <section v-if="insights.length" class="panel">
          <h2>메타 변화 요약</h2>
          <p v-for="message in insights" :key="message">{{ message }}</p>
        </section>
        <template v-if="!kind">
          <section v-for="k in TREND_KINDS" :key="k" class="panel">
            <div class="section-head">
              <h2>{{ TREND_PAGES[k].label }} 성적 변화</h2>
              <a :href="TREND_PAGES[k].path">전체 비교 →</a>
            </div>
            <p v-if="!data.highlights?.some((entry) => entry.kind === k)" class="small muted">
              비교 기준을 충족한 뚜렷한 변화가 없습니다.
            </p>
            <div
              v-for="entry in data.highlights?.filter((entry) => entry.kind === k)"
              :key="entry.group"
              class="highlight-group"
            >
              <h3>{{ GROUP_LABELS[k][entry.group] }}</h3>
              <div v-for="(rows, i) in [entry.up, entry.down]" :key="i">
                <h4>{{ i === 0 ? '상승 TOP 10' : '하락 TOP 10' }}</h4>
                <ol v-if="rows.length">
                  <li v-for="row in rows" :key="row.id">
                    {{ name(row) }} ·
                    <strong :class="i === 0 ? 'better' : 'worse'">{{
                      placementChange(row.placement)
                    }}</strong>
                  </li>
                </ol>
                <p v-else class="small muted">해당 항목 없음</p>
              </div>
            </div>
          </section>
          <section class="panel">
            <h2>티어 상승·하락</h2>
            <ul v-if="data.movements?.length">
              <li v-for="row in data.movements" :key="row.kind + row.id">
                {{ name(row) }} · {{ row.previousTier?.tier }} → {{ row.currentTier?.tier }}
              </li>
            </ul>
            <p v-else class="small muted">비교 가능한 티어 이동이 없습니다.</p>
          </section>
          <a :href="HISTORY_PATH">패치별 집계 이력 보기 →</a>
        </template>
        <template v-else>
          <section v-if="selected.length" class="panel">
            <h2>패치별 추이</h2>
            <div class="trend-nav">
              <button
                v-for="entry in selected"
                :key="entry.id"
                type="button"
                @click="toggleGraph({ id: entry.id } as TrendRow)"
              >
                {{ entry.name }} ✕
              </button>
            </div>
            <p v-if="seriesLoading" role="status">추이를 불러오는 중입니다.</p>
            <p v-else-if="seriesError" role="alert">{{ seriesError }}</p>
            <TrendGraph v-else-if="series" :data="series" :selected="selected" />
          </section>
          <p class="small muted">
            양쪽 최소 {{ data.minimum }}회 사용 표본 기준. 최대 3개 항목의 추이를 함께 볼 수
            있습니다.
          </p>
          <p v-if="!data.rows.length" class="panel muted">이 비교군에는 표시할 항목이 없습니다.</p>
          <article v-for="row in data.rows" :key="row.id" class="panel trend-row">
            <header>
              <AssetBadge :id="row.id" :asset="asset(row)" />
              <span v-if="GROUP_LABELS[kind][row.group]" class="small muted">{{
                GROUP_LABELS[kind][row.group]
              }}</span>
              <strong
                :class="
                  (row.placement ?? 0) >= 0.15
                    ? 'better'
                    : (row.placement ?? 0) <= -0.15
                      ? 'worse'
                      : 'muted'
                "
                >{{ row.status }}</strong
              >
              <span v-if="row.popularity" class="small muted">인기 · {{ row.popularity }}</span>
              <button
                type="button"
                :aria-pressed="selected.some((entry) => entry.id === row.id)"
                :disabled="selected.length >= 3 && !selected.some((entry) => entry.id === row.id)"
                @click="toggleGraph(row)"
              >
                추이 비교
              </button>
            </header>
            <dl class="metrics">
              <div v-for="metric in compareMetrics(row)" :key="metric.label">
                <dt>{{ metric.label }}</dt>
                <dd>{{ metric.before }} → {{ metric.after }}</dd>
                <dd v-if="metric.change" class="small muted">{{ metric.change }}</dd>
              </div>
            </dl>
            <details>
              <summary>
                {{
                  kind === 'champion'
                    ? '장착 아이템'
                    : kind === 'item'
                      ? '장착 챔피언'
                      : '활성 단계별 표본'
                }}
                변화
              </summary>
              <p class="small muted">이전 · {{ details(row, 'previous') }}</p>
              <p class="small muted">기준 · {{ details(row, 'current') }}</p>
            </details>
          </article>
        </template>
      </template>
    </template>
    <div v-if="!loading && !error && (history || kind) && total > limit" class="trend-nav">
      <button type="button" :disabled="page === 0" @click="changePage(-1)">이전</button>
      <span>{{ page + 1 }} / {{ Math.ceil(total / limit) }}</span>
      <button type="button" :disabled="(page + 1) * limit >= total" @click="changePage(1)">
        다음
      </button>
    </div>
    <section class="panel methodology">
      <h2>패치 변화 읽는 법</h2>
      <p>
        일별 관측은 최근 7일 이동 집계입니다. 패치 종료 직전 기록도 그 시점의 관측치입니다. 날짜별
        집계에는 같은 경기가 포함될 수 있으므로 합산하지 않습니다.
      </p>
      <p>
        평균 등수가 0.15위부터 개선되면 상승, 0.50위부터 급상승으로 표시합니다. 사용률은 사용 보드
        수를 전체 참가자 보드 수로 나누며 변화는 %p 단위입니다. 표본 규모와 기간이 다른 집계의 관측
        차이입니다.
      </p>
      <p>
        세트와 항목 ID가 같을 때 비교합니다. 미관측은 해당 집계에서 관측되지 않았음을 뜻합니다. 티어
        점수는 각 패치 내에서 정규화한 참고값으로 점수 차이는 표시하지 않습니다. 최종 보드 통계는
        생존 시간과 레벨의 영향을 받습니다.
      </p>
    </section>
  </section>
</template>
<style scoped>
.meta-trends {
  max-width: 1120px;
  margin: auto;
  min-width: 0;
}
h1 {
  font-size: clamp(22px, 4vw, 36px);
  margin-bottom: 8px;
}
.trend-nav,
.trend-controls,
.trend-row header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 12px 0;
}
a {
  color: var(--mint);
}
.trend-nav a,
button,
select {
  min-height: 44px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #182334;
  color: #e8edf5;
  max-width: 100%;
}
.trend-nav a {
  display: inline-flex;
  align-items: center;
}
.trend-nav a[aria-current],
button[aria-pressed='true'] {
  border-color: var(--mint);
  color: var(--mint);
}
label {
  display: grid;
  gap: 3px;
  font-size: 12px;
  min-width: 100px;
  max-width: 100%;
}
.snapshot-summary,
.history-entries,
.highlight-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: 8px;
}
.snapshot-summary article,
.history-entries article {
  display: grid;
  gap: 5px;
  font-size: 13px;
}
.highlight-group {
  border-top: 1px solid var(--border);
}
.highlight-group h3 {
  grid-column: 1/-1;
}
.highlight-group h4 {
  margin: 4px 0;
}
.highlight-group ol {
  padding-left: 21px;
}
.trend-row {
  overflow-wrap: anywhere;
}
.trend-row header {
  margin-top: 0;
}
.trend-row .asset {
  white-space: normal;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 120px), 1fr));
  gap: 8px;
  margin: 8px 0;
}
dt {
  font-size: 12px;
  color: var(--muted);
}
dd {
  margin: 0;
  font-size: 13px;
}
summary {
  cursor: pointer;
  min-height: 44px;
  align-content: center;
}
.better {
  color: var(--mint);
}
.worse {
  color: #ff9d9d;
}
.methodology {
  margin-top: 16px;
  font-size: 14px;
}
</style>
