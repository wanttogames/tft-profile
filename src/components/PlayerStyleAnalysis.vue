<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerData } from '../types/riot';
import { playerScores, playerStyle, scoreHelp, scoreLabels } from '../analytics/playerScores';

const props = defineProps<{ data: PlayerData }>();
const style = computed(() => playerStyle(props.data.games, props.data.assets));
const scores = computed(() => playerScores(props.data.games, props.data.assets));
</script>

<template>
  <section class="panel player-style-analysis">
    <div class="section-head">
      <h2>플레이 스타일과 PLAY DNA</h2>
      <span class="small muted">{{ style.sampleCount }}경기 · 자체 분석</span>
    </div>
    <h3>{{ style.name }}</h3>
    <p>{{ style.reason }}</p>
    <p v-if="style.tags.length" class="small muted">보조 성향 · {{ style.tags.join(' · ') }}</p>
    <div v-if="scores" class="dna-bars">
      <div v-for="(label, key) in scoreLabels" :key="key">
        <div class="dna-value">
          <span>{{ label }}</span>
          <strong>{{ scores[key] ?? '표본 부족' }}</strong>
        </div>
        <progress v-if="scores[key] !== null" :value="scores[key]" max="100" :aria-label="label" />
      </div>
    </div>
    <p v-else class="empty-note">PLAY DNA는 5경기 이상 필요합니다.</p>
    <details class="method">
      <summary>PLAY DNA 계산 및 표본 기준</summary>
      <p>
        최근 최대 30경기의 경기 결과와 최종 보드로 계산한 0~100점 지표입니다. 항목별로 필요한 표본
        수가 다릅니다.
      </p>
      <p v-for="help in scoreHelp" :key="help">{{ help }}</p>
    </details>
  </section>
</template>

<style scoped>
.player-style-analysis h3 {
  margin: 0 0 6px;
  color: var(--mint);
}
.player-style-analysis p {
  margin: 6px 0;
}
.dna-bars {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 28px;
  margin: 16px 0;
}
.dna-value {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}
progress {
  display: block;
  width: 100%;
  height: 7px;
  margin-top: 5px;
  accent-color: var(--mint);
}
@media (max-width: 600px) {
  .dna-bars {
    grid-template-columns: 1fr;
  }
}
</style>
