<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ProfileCardModel } from '../profile-card/model';
import PlayStyleArt from './PlayStyleArt.vue';
const props = defineProps<{ model: ProfileCardModel }>();
const failed = ref(false);
watch(
  () => props.model.artwork.src,
  () => {
    failed.value = false;
  },
);
</script>
<template>
  <div
    class="hero-artwork"
    :data-style="model.profile.key"
    :data-art-style="model.artwork.artStyle ?? 'fallback'"
  >
    <img
      v-if="model.artwork.src && !failed"
      :key="model.artwork.src"
      :src="model.artwork.src"
      :alt="`${model.artwork.name} · ${model.profile.name} 프로필 아트`"
      width="1086"
      height="1448"
      decoding="async"
      @error="failed = true"
    />
    <PlayStyleArt v-else :art="model.art" />
    <div class="hero-shading" aria-hidden="true"></div>
  </div>
</template>
<style scoped>
.hero-artwork {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1.23;
  background: #09121f;
  margin: 8px -13px 0;
  isolation: isolate;
}
.hero-artwork > img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
}
.hero-artwork > :deep(svg) {
  width: 100%;
  height: 100%;
  min-height: 280px;
}
.hero-shading {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(0deg, #09121f 0%, #09121fa6 13%, transparent 36%, #09121f12 80%, #09121f55),
    radial-gradient(ellipse at center, transparent 35%, #09121f99 100%);
  box-shadow: inset 0 0 35px color-mix(in srgb, var(--card-accent) 12%, transparent);
}
@media (max-width: 520px) {
  .hero-artwork {
    aspect-ratio: 1.02;
    margin-inline: -8px;
  }
  .hero-artwork > img {
    object-position: center 34%;
  }
}
</style>
