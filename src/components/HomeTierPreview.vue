<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { fetchTierList } from '../api/tierList';
import { TIER_LIST_PATH, TIER_PAGES } from '../meta/tierPages';
import type { TierData } from '../meta/tierList';
import type { MetaKind } from '../types/meta';
import { lookupAsset } from '../static-data/catalog';
import AssetBadge from './AssetBadge.vue';

const host = ref<HTMLElement>();
const data = ref<Partial<Record<MetaKind, TierData>>>({});
const kinds = Object.keys(TIER_PAGES) as MetaKind[];
let observer: IntersectionObserver | undefined;
let mounted = false;
async function load() {
  await Promise.allSettled(
    kinds.map(async (kind) => {
      const result = await fetchTierList(kind);
      if (mounted && (result.status === 'confirmed' || result.status === 'estimated'))
        data.value[kind] = result;
    }),
  );
}
const representatives = (kind: MetaKind) =>
  (data.value[kind]?.rows ?? [])
    .filter((row) => (row.tier === 'S' || row.tier === 'A') && row.sample_count >= 100)
    .slice(0, 5);
onMounted(() => {
  mounted = true;
  if (typeof IntersectionObserver === 'undefined' || !host.value) {
    void load();
    return;
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer?.disconnect();
        void load();
      }
    },
    { rootMargin: '240px' },
  );
  observer.observe(host.value);
});
onBeforeUnmount(() => {
  mounted = false;
  observer?.disconnect();
});
</script>

<template>
  <section ref="host" class="panel home-tier">
    <div class="section-head">
      <h2>메타 티어리스트</h2>
      <a :href="TIER_LIST_PATH">전체 티어 보기 →</a>
    </div>
    <div class="tier-links">
      <div v-for="kind in kinds" :key="kind">
        <a :href="TIER_PAGES[kind].path">{{ TIER_PAGES[kind].name }} 티어 →</a>
        <template v-if="representatives(kind).length">
          <p class="small muted">
            패치 {{ data[kind]!.summary.current_patch }} · 세트
            {{ data[kind]!.summary.aggregate_set_number }}
            <template v-if="data[kind]!.status === 'estimated'"> · 추정 집계</template>
          </p>
          <ul>
            <li v-for="row in representatives(kind)" :key="row.id">
              <strong>{{ row.tier }}</strong>
              <AssetBadge
                :id="row.id"
                :asset="
                  lookupAsset(data[kind]!.assets, kind === 'champion' ? 'unit' : kind, row.id)
                "
              />
            </li>
          </ul>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-tier a {
  color: var(--mint);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.tier-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 8px;
}
.tier-links ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.tier-links li {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  overflow-wrap: anywhere;
}
.tier-links strong {
  color: #ffd29a;
}
.tier-links .asset {
  white-space: normal;
}
</style>
