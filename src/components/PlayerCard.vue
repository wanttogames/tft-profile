<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerData } from '../types/riot';
import { playerScores, scoreHelp } from '../analytics/playerScores';
const props = defineProps<{ data: PlayerData }>();
const scores = computed(() => playerScores(props.data.games));
const names = {
  ceiling: '고점력',
  stability: '안정성',
  flexibility: '유연성',
  diversity: '덱 다양성',
  form: '최근 폼',
  risk: '리스크 성향',
};
</script>
<template>
  <section class="panel player-card">
    <div class="section-head">
      <span class="eyebrow">TFT PLAYER CARD</span><span class="pill">자체 분석</span>
    </div>
    <h2>나의 플레이 지문</h2>
    <p class="muted small">최근 결과를 0–100으로 요약한 기록 지표</p>
    <div v-if="scores" class="score-list">
      <div v-for="(name, key) in names" :key="key" class="score-row" :title="scoreHelp[key]">
        <span>{{ name }}</span>
        <div class="score-track"><i :style="{ width: (scores[key] ?? 0) + '%' }"></i></div>
        <strong>{{ scores[key] ?? '—' }}</strong>
      </div>
    </div>
    <p v-else class="empty-note">5경기 이상 모이면 플레이어 카드를 생성합니다.</p>
    <details class="method">
      <summary>점수 계산 기준</summary>
      <p v-for="(help, key) in scoreHelp" :key="key">{{ help }}</p>
      <p>
        점수는 공식 실력 지표나 백분위가 아닙니다. 다양성·유연성은 특성 데이터가 부족하면, 최근 폼은
        20경기 미만이면 표시하지 않습니다.
      </p>
    </details>
  </section>
</template>
