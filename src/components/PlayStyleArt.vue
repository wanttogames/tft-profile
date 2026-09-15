<script setup lang="ts">
import { computed } from 'vue';
import type { StyleIllustration } from '../analytics/playStyleIllustration';
import { styleArtPaths } from '../profile-card/styleArt';
const props = defineProps<{ art: StyleIllustration }>();
const paths = computed(() => styleArtPaths(props.art));
</script>
<template>
  <svg viewBox="0 0 600 240" role="img" :aria-label="art.illustrationTheme" class="style-art">
    <path
      v-for="(p, i) in paths"
      :key="i"
      :d="p.d"
      :fill="p.fill"
      :stroke="p.stroke"
      :opacity="p.opacity"
      stroke-width="1.6"
      stroke-linejoin="round"
    />
  </svg>
</template>
<style scoped>
.style-art {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
