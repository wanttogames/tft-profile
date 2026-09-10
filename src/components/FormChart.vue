<script setup lang="ts">
import { computed } from 'vue';
import type { Game } from '../types/riot';
const props = defineProps<{ games: Game[] }>();
const chronological = computed(() => [...props.games].reverse());
const x = (i: number) => 48 + (i * 650) / Math.max(1, props.games.length - 1);
const y = (p: number) => 24 + (p - 1) * 23;
const points = computed(() =>
  chronological.value.map((g, i) => `${x(i)},${y(g.player.placement)}`).join(' '),
);
</script>
<template>
  <div class="chart">
    <svg
      viewBox="0 0 730 220"
      role="img"
      :aria-label="`오래된 경기부터 최근 경기 등수: ${chronological.map((g) => g.player.placement).join(', ')}`"
    >
      <rect x="40" y="16" width="670" height="90" rx="8" fill="#13342c" opacity="0.38" />
      <g v-for="rank in [1, 4, 8]" :key="rank">
        <line
          x1="40"
          x2="710"
          :y1="y(rank)"
          :y2="y(rank)"
          stroke="#293344"
          stroke-dasharray="4 5"
        />
        <text x="9" :y="y(rank) + 5" fill="#98a6bc" font-size="14">{{ rank }}위</text>
      </g>
      <polyline
        :points="points"
        fill="none"
        stroke="#8ee2c3"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <g v-for="(g, i) in chronological" :key="g.id">
        <circle
          :cx="x(i)"
          :cy="y(g.player.placement)"
          r="5"
          :fill="g.player.placement <= 4 ? '#8ee2c3' : '#e0a08e'"
          stroke="#121925"
          stroke-width="2"
        >
          <title>{{ i + 1 }}번째 경기 · {{ g.player.placement }}위</title>
        </circle>
      </g>
      <text x="40" y="214" fill="#98a6bc" font-size="14">{{ games.length }}경기 전</text>
      <text x="671" y="214" fill="#98a6bc" font-size="14">최근</text>
    </svg>
  </div>
</template>
