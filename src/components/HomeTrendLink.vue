<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { fetchTrend, type TrendData } from '../api/trends';
import { TREND_PATH, type TrendRow } from '../meta/trends';
import { lookupAsset } from '../static-data/catalog';
const host = ref<HTMLElement>();
const data = ref<TrendData>();
let observer: IntersectionObserver | undefined;
const controller = new AbortController();
onMounted(() => {
  if (!host.value || typeof IntersectionObserver === 'undefined') return;
  observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer?.disconnect();
      void fetchTrend<TrendData>('trends', new URLSearchParams(), controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) data.value = value;
        })
        .catch(() => {});
    },
    { rootMargin: '240px' },
  );
  observer.observe(host.value);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  controller.abort();
});
function names(kind: TrendRow['kind'], limit: number) {
  return (data.value?.highlights ?? [])
    .filter((group) => group.kind === kind)
    .flatMap((group) => group.up)
    .sort((a, b) => (b.placement ?? 0) - (a.placement ?? 0))
    .slice(0, limit)
    .map(
      (row) =>
        lookupAsset(data.value?.assets ?? {}, kind === 'champion' ? 'unit' : kind, row.id)?.name ??
        row.id,
    )
    .join(' · ');
}
</script>
<template>
  <section ref="host" class="panel">
    <div class="section-head">
      <h2>패치별 메타 변화</h2>
      <a :href="TREND_PATH">전체 분석 →</a>
    </div>
    <template v-if="data?.status === 'ready'">
      <p v-if="names('champion', 3)" class="small">성적 개선 챔피언 · {{ names('champion', 3) }}</p>
      <p v-if="names('item', 3)" class="small">성적 개선 아이템 · {{ names('item', 3) }}</p>
      <p v-if="names('trait', 1)" class="small">성적 개선 특성 · {{ names('trait', 1) }}</p>
    </template>
    <p v-else class="small muted">동일 세트에서 두 패치의 기록이 쌓이면 비교를 제공합니다.</p>
  </section>
</template>
