<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { fetchMeta } from '../api/meta';
import type { MetaData, MetaKind } from '../types/meta';
import { lookupAsset } from '../static-data/catalog';
import AssetBadge from './AssetBadge.vue';
const groups: { kind: MetaKind; title: string; href: string }[] = [
  { kind: 'champion', title: '자주 등장한 챔피언', href: '/champions' },
  { kind: 'item', title: '자주 장착한 아이템', href: '/items' },
  { kind: 'trait', title: '자주 활성화한 특성', href: '/traits' },
];
const results = ref<Partial<Record<MetaKind, MetaData>>>({});
const errors = ref<Partial<Record<MetaKind, string>>>({});
const controller = new AbortController();
onMounted(() =>
  Promise.allSettled(
    groups.map(async (g) => {
      try {
        results.value[g.kind] = await fetchMeta(g.kind, 'sample_count', 0, controller.signal);
      } catch {
        if (!controller.signal.aborted)
          errors.value[g.kind] =
            '통계를 불러오지 못했습니다. 잠시 후 메타 페이지에서 다시 확인해 주세요.';
      }
    }),
  ),
);
onBeforeUnmount(() => controller.abort());
const id = (r: MetaData['rows'][number]) => r.character_id ?? r.item_name ?? r.trait_name ?? '';
</script>
<template>
  <section class="meta-preview">
    <div class="section-head">
      <h2>수집 기록에서 보는 메타</h2>
      <a href="/meta">전체 통계 →</a>
    </div>
    <p class="small muted">
      KR Challenger·Grandmaster 래더에서 찾은 경기의 전체 참가자 기준. 패치 구분 없이 집계하며, 사용
      표본이 많은 순서입니다.
    </p>
    <div class="preview-grid">
      <article v-for="g in groups" :key="g.kind">
        <h3>
          <a :href="g.href">{{ g.title }} ↗</a>
        </h3>
        <p v-if="errors[g.kind]" class="small muted">{{ errors[g.kind] }}</p>
        <p v-else-if="!results[g.kind]" class="small muted">통계를 불러오는 중입니다.</p>
        <template v-else
          ><p class="small muted">
            최소 표본 {{ results[g.kind]!.minSampleSize }} ·
            {{ results[g.kind]!.summary.match_count.toLocaleString() }}경기 수집
          </p>
          <div v-for="r in results[g.kind]!.rows.slice(0, 3)" :key="id(r)" class="preview-row">
            <AssetBadge
              :id="id(r)"
              :asset="
                lookupAsset(results[g.kind]!.assets, g.kind === 'champion' ? 'unit' : g.kind, id(r))
              "
            /><span
              >{{ r.sample_count.toLocaleString() }}회<br />TOP4
              {{ (r.top4_rate * 100).toFixed(1) }}%</span
            >
          </div>
          <p v-if="!results[g.kind]!.rows.length" class="small muted">
            최소 표본을 충족한 항목이 아직 없습니다.
          </p>
        </template>
      </article>
    </div>
  </section>
</template>
<style scoped>
.meta-preview {
  margin: 25px 0;
}
.meta-preview a {
  color: var(--mint);
  font-size: 13px;
}
.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.preview-grid article {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 15px;
  min-width: 0;
}
.preview-grid h3 {
  margin: 0 0 10px;
}
.preview-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 0;
  border-top: 1px solid #ffffff0b;
}
.preview-row > span {
  font-size: 10px;
  text-align: right;
  flex-shrink: 0;
  color: #aebbcd;
}
.preview-row :deep(.asset) {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.preview-row :deep(img) {
  width: 28px;
  height: 28px;
}
@media (max-width: 720px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
  .preview-row {
    padding: 7px 0;
  }
}
</style>
