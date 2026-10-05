<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerData } from '../types/riot';
import { recordHighlights } from '../analytics/recordHighlights';
const props = defineProps<{ data: PlayerData }>();
const result = computed(() => recordHighlights(props.data.games, props.data.assets));
</script>
<template>
  <section class="panel record-highlights" aria-labelledby="record-highlights-title">
    <header>
      <div>
        <p class="eyebrow">RECORD HIGHLIGHTS</p>
        <h2 id="record-highlights-title">
          이번 기록에서 눈여겨볼 {{ result.highlights.length === 3 ? '3가지' : '내용' }}
        </h2>
      </div>
      <span class="small muted">최근 {{ result.count }}경기 · 자체 분석</span>
    </header>
    <ol v-if="result.highlights.length">
      <li v-for="(item, index) in result.highlights" :key="item.key">
        <span class="highlight-number">0{{ index + 1 }}</span>
        <div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.detail }}</p>
        </div>
      </li>
    </ol>
    <p v-else class="muted">
      분석 표본이 부족합니다. 최소 5경기가 확보되면 확인 가능한 특징을 표시합니다.
    </p>
    <p v-if="result.highlights.length && result.highlights.length < 3" class="small muted">
      표본으로 확인 가능한 {{ result.highlights.length }}가지만 표시합니다.
    </p>
  </section>
</template>
<style scoped>
.record-highlights header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
h2 {
  font-size: 20px;
  margin: 5px 0 18px;
}
ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
li {
  display: flex;
  gap: 12px;
  min-width: 0;
}
.highlight-number {
  color: #71d5c4;
  font-size: 13px;
  font-weight: 700;
  padding-top: 3px;
}
h3 {
  font-size: 15px;
  margin: 0 0 8px;
  overflow-wrap: anywhere;
}
li p {
  color: #adbbce;
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
  overflow-wrap: anywhere;
}
@media (max-width: 900px) {
  ol {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}
</style>
