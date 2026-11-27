<script setup lang="ts">
import { computed } from 'vue';
import type { TrendSeries } from '../api/trends';
import { TIERS } from '../meta/tierList';
import { usageRate } from '../meta/trends';
const props = defineProps<{ data: TrendSeries; selected: { id: string; name: string }[] }>();
const definitions = [
  { label: '평균 등수 (낮을수록 좋음)', low: 1, high: 8, value: 'avg_placement' },
  { label: 'TOP4 비율', low: 0, high: 100, value: 'top4_rate' },
  { label: '사용률', low: 0, high: 100, value: 'usage' },
  { label: '티어 등급', low: 0, high: 4, value: 'tier' },
] as const;
const colors = ['#8ee2c3', '#e5b584', '#c2a9ee'];
const index = computed(
  () => new Map(props.data.rows.map((row) => [row.snapshot_id + ':' + row.entity_id, row])),
);
const format = (metric: string, value: number) =>
  metric === 'tier' ? TIERS[4 - value] : value.toFixed(2);
const charts = computed(() =>
  definitions.map((metric) => ({
    ...metric,
    series: props.selected.map(({ id, name }, i) => {
      const values = props.data.patches.map((snapshot) => {
        const row = index.value.get(snapshot.snapshot_id + ':' + id);
        if (!row || row.sample_count < props.data.minimum) return null;
        if (metric.value === 'usage') {
          const rate = usageRate(row, snapshot);
          return rate === null ? null : rate * 100;
        }
        if (metric.value === 'tier') {
          if (
            snapshot.metadata_generation !== snapshot.aggregation_generation ||
            row.catalog?.minimum !== props.data.minimum
          )
            return null;
          return row.catalog.tier ? 4 - TIERS.indexOf(row.catalog.tier) : null;
        }
        return row[metric.value] * (metric.value === 'top4_rate' ? 100 : 1);
      });
      const points = values.map((value, i) =>
        value === null
          ? null
          : {
              x: 15 + (350 * i) / Math.max(1, values.length - 1),
              y: 14 + (106 * (metric.high - value)) / (metric.high - metric.low),
              value,
              patch: props.data.patches[i]!.patch,
            },
      );
      const path = points
        .map((point, i) =>
          point ? `${i > 0 && points[i - 1] ? 'L' : 'M'} ${point.x} ${point.y}` : '',
        )
        .join(' ');
      return { name, color: colors[i], points, path };
    }),
  })),
);
</script>
<template>
  <div class="trend-charts">
    <figure v-for="chart in charts" :key="chart.label">
      <figcaption>{{ chart.label }}</figcaption>
      <svg viewBox="0 0 380 134" role="img" :aria-label="chart.label + ' 패치별 추이'">
        <path d="M15 14 V120 H365" stroke="#44556a" fill="none" />
        <g v-for="series in chart.series" :key="series.name">
          <path :d="series.path" :stroke="series.color" stroke-width="2" fill="none" />
          <circle
            v-for="point in series.points.filter((p) => p !== null)"
            :key="point.patch"
            :cx="point.x"
            :cy="point.y"
            r="3"
            :fill="series.color"
          >
            <title>
              {{ series.name }} · {{ point.patch }} · {{ format(chart.value, point.value) }}
            </title>
          </circle>
        </g>
      </svg>
      <p class="small muted">{{ data.patches[0]?.patch }} → {{ data.patches.at(-1)?.patch }}</p>
      <details>
        <summary>패치별 값 보기</summary>
        <div v-for="series in chart.series" :key="series.name" class="small chart-values">
          <strong :style="{ color: series.color }">{{ series.name }}</strong>
          <span v-for="(snapshot, i) in data.patches" :key="snapshot.snapshot_id">
            {{ snapshot.patch }} ·
            {{ series.points[i] ? format(chart.value, series.points[i]!.value) : '데이터 없음' }}
          </span>
        </div>
      </details>
    </figure>
  </div>
</template>
<style scoped>
.trend-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 245px), 1fr));
  gap: 10px;
}
figure {
  min-width: 0;
  margin: 0;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
}
svg {
  width: 100%;
  display: block;
}
figure p {
  margin: 0;
}
summary {
  cursor: pointer;
  min-height: 44px;
  align-content: center;
}
.chart-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-wrap: anywhere;
}
</style>
