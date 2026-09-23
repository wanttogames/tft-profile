<script setup lang="ts">
defineProps<{ rank: string; lp: string }>();
</script>
<template>
  <div class="rank-badge">
    <svg viewBox="0 0 200 100" aria-hidden="true">
      <path
        d="m100 95-32-29-45-7L5 17l51 23 44-34 44 34 51-23-18 42-45 7Z"
        fill="#122236"
        stroke="currentColor"
        stroke-width="2"
      />
      <path d="m100 8 22 32-22 42-22-42Z" fill="var(--card-secondary)" stroke="#e6f6ff" />
      <path d="m100 8-4 33 4 41 14-42Z" fill="currentColor" />
      <path
        d="m17 30 46 20 15 20-21-12Zm166 0-46 20-15 20 21-12Z"
        fill="currentColor"
        opacity=".7"
      /></svg
    ><strong>{{ rank }} / {{ lp }} LP</strong>
  </div>
</template>
<style scoped>
.rank-badge {
  text-align: center;
  color: var(--card-accent);
  position: relative;
  margin: -58px auto 0;
  z-index: 2;
}
.rank-badge svg {
  display: block;
  width: 180px;
  height: 90px;
  margin: auto;
  filter: drop-shadow(0 0 13px color-mix(in srgb, var(--card-secondary) 55%, transparent));
}
.rank-badge strong {
  display: block;
  font-size: clamp(20px, 4vw, 30px);
  letter-spacing: 0.035em;
  overflow-wrap: anywhere;
  text-shadow: 0 0 16px color-mix(in srgb, var(--card-accent) 40%, transparent);
}
</style>
