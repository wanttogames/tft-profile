<script setup lang="ts">
import { computed } from 'vue';
import { cardTheme } from '../profile-card/model';
const props = defineProps<{ tier?: string }>();
const theme = computed(() => cardTheme(props.tier));
</script>
<template>
  <article
    class="rank-frame"
    :data-tier="theme.tier"
    :style="{ '--card-accent': theme.accent, '--card-secondary': theme.secondary }"
  >
    <div class="frame-inlay" aria-hidden="true"></div>
    <svg
      v-for="corner in ['tl', 'tr', 'bl', 'br']"
      :key="corner"
      :class="['corner', corner]"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path
        d="M3 96V18L18 3H96L72 13H28L13 28V72Z"
        fill="#14283a"
        stroke="currentColor"
        stroke-width="2"
      />
      <path d="M5 69 15 24 53 7 32 29Z" fill="var(--card-secondary)" stroke="#dceffa" />
      <path d="m15 24 17 5-27 40Zm17 5L53 7 25 16Z" fill="currentColor" opacity=".7" />
      <path d="M18 86V33L33 18H86" fill="none" stroke="currentColor" opacity=".45" />
    </svg>
    <svg class="top-crest" viewBox="0 0 240 90" aria-hidden="true">
      <path
        d="m120 87-27-42-72-27 46 3L44 2l59 24 17-22 17 22 59-24-23 19 46-3-72 27Z"
        fill="#142435"
        stroke="currentColor"
      />
      <path d="m120 9 18 29-18 37-18-37Z" fill="var(--card-secondary)" stroke="#edffff" />
      <path d="m120 9-4 30 4 36 11-37Z" fill="currentColor" />
      <path
        d="m51 16 39 26 17 22-12-32Zm138 0-39 26-17 22 12-32Z"
        fill="currentColor"
        opacity=".7"
      />
    </svg>
    <div class="frame-content"><slot /></div>
  </article>
</template>
<style scoped>
.rank-frame {
  position: relative;
  isolation: isolate;
  max-width: 760px;
  margin: auto;
  padding: 36px 28px 25px;
  background: radial-gradient(
    ellipse at 50% 0%,
    color-mix(in srgb, var(--card-secondary) 22%, #09111f),
    #09121f 65%
  );
  border: 2px solid var(--card-accent);
  border-radius: 3px;
  box-shadow:
    0 16px 55px #0007,
    inset 0 0 35px color-mix(in srgb, var(--card-accent) 12%, transparent);
  color: #e6f0fc;
}
.frame-inlay {
  position: absolute;
  inset: 8px;
  border: 1px solid color-mix(in srgb, var(--card-accent) 55%, transparent);
  pointer-events: none;
  box-shadow:
    inset 0 0 0 3px #020712,
    inset 0 0 0 4px color-mix(in srgb, var(--card-secondary) 35%, transparent);
}
.corner {
  position: absolute;
  width: 94px;
  height: 94px;
  color: var(--card-accent);
  pointer-events: none;
  z-index: 3;
  filter: drop-shadow(0 0 5px color-mix(in srgb, var(--card-accent) 35%, transparent));
}
.tl {
  top: -7px;
  left: -7px;
}
.tr {
  top: -7px;
  right: -7px;
  transform: scaleX(-1);
}
.bl {
  bottom: -7px;
  left: -7px;
  transform: scaleY(-1);
}
.br {
  bottom: -7px;
  right: -7px;
  transform: scale(-1);
}
.top-crest {
  position: absolute;
  top: -19px;
  left: 50%;
  transform: translateX(-50%);
  width: 190px;
  height: 76px;
  color: var(--card-accent);
  z-index: 3;
  pointer-events: none;
  filter: drop-shadow(0 0 9px var(--card-secondary));
}
.frame-content {
  position: relative;
  z-index: 1;
  min-width: 0;
}
@media (max-width: 520px) {
  .rank-frame {
    padding: 36px 18px 24px;
  }
  .corner {
    width: 62px;
    height: 62px;
  }
  .top-crest {
    width: 135px;
    height: 62px;
    top: -19px;
  }
}
</style>
