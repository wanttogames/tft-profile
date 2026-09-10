<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Asset } from '../types/riot';
const props = defineProps<{ id: string; asset?: Asset; stars?: number }>();
const failed = ref(false);
watch(
  () => props.id,
  () => (failed.value = false),
);
</script>
<template>
  <span class="asset" :title="asset?.name || id"
    ><img
      v-if="asset?.image && !failed"
      :src="asset.image"
      alt=""
      loading="lazy"
      @error="failed = true"
    /><span v-else class="asset-letter" aria-hidden="true">{{
      (asset?.name || id).slice(0, 1)
    }}</span
    ><span
      >{{ asset?.name || id
      }}<small v-if="stars" class="stars">{{ '★'.repeat(stars) }}</small></span
    ></span
  >
</template>
