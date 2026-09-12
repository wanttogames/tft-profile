<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { lookupAsset, type AssetMap } from '../static-data/catalog';
const props = defineProps<{
  entries: { id: string; sample_count: number; rate?: number }[];
  assets: AssetMap;
  kind: 'unit' | 'item';
}>();
const failed = ref(new Set<string>());
watch(
  () => props.entries,
  () => {
    failed.value = new Set();
  },
);
const ranked = computed(() =>
  [...props.entries].sort((a, b) => b.sample_count - a.sample_count || a.id.localeCompare(b.id)),
);
const asset = (id: string) => lookupAsset(props.assets, props.kind, id);
const label = (entry: { id: string; sample_count: number; rate?: number }) =>
  `${asset(entry.id)?.name || entry.id}\n${entry.sample_count.toLocaleString('ko-KR')}회${entry.rate === undefined ? '' : '\n' + (entry.rate * 100).toFixed(1) + '%'}`;
</script>
<template>
  <div class="companions" aria-label="주요 장착 표본">
    <button
      v-for="entry in ranked.slice(0, 4)"
      :key="entry.id"
      type="button"
      class="portrait"
      :title="label(entry)"
      :aria-label="label(entry)"
    >
      <img
        v-if="asset(entry.id)?.image && !failed.has(entry.id)"
        :src="asset(entry.id)?.image"
        alt=""
        loading="lazy"
        @error="failed.add(entry.id)"
      />
      <span v-else aria-hidden="true">{{ (asset(entry.id)?.name || '?').slice(0, 1) }}</span>
    </button>
    <button
      v-if="ranked.length > 4"
      class="more"
      type="button"
      :title="ranked.slice(4).map(label).join('\n\n')"
      :aria-label="ranked.slice(4).map(label).join(', ')"
    >
      +{{ ranked.length - 4 }}
    </button>
  </div>
</template>
<style scoped>
.companions {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 5px;
}
.portrait {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  padding: 0;
  overflow: hidden;
  border: 1px solid #40565e;
  border-radius: 5px;
  background: #24383e;
  color: #d9e9ec;
}
.portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.more {
  padding: 4px;
  border: 0;
  background: transparent;
  color: #a7bfc5;
  font-size: 12px;
  white-space: nowrap;
}
button {
  cursor: help;
}
button:hover,
button:focus-visible {
  outline: 2px solid #7ce3b4;
  outline-offset: 2px;
}
</style>
