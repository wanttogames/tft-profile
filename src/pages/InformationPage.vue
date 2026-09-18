<script setup lang="ts">
import { guideSections, aboutSections } from '../content/publicContent';
defineProps<{ kind: 'guide' | 'about' }>();
</script>
<template>
  <article class="info-page">
    <p class="eyebrow">{{ kind === 'guide' ? 'READ YOUR GAME' : 'ABOUT TFT PROFILE' }}</p>
    <h1>{{ kind === 'guide' ? 'TFT Profile 사용 가이드' : 'TFT Profile 소개' }}</h1>
    <section v-for="s in kind === 'guide' ? guideSections : aboutSections" :key="s.title">
      <h2>{{ s.title }}</h2>
      <p>{{ s.text }}</p>
    </section>
    <nav class="info-links">
      <a href="/">Riot ID 분석 →</a><a href="/meta">공개 메타 통계 →</a
      ><a :href="kind === 'guide' ? '/about' : '/guide'"
        >{{ kind === 'guide' ? '서비스 소개' : '사용 가이드' }} →</a
      >
    </nav>
  </article>
</template>
<style scoped>
.info-page {
  max-width: 860px;
  margin: 36px auto;
}
.info-page h1 {
  font-size: clamp(26px, 5vw, 36px);
}
.info-page section {
  margin: 30px 0;
}
.info-page h2 {
  font-size: 19px;
  margin-bottom: 10px;
}
.info-page p {
  line-height: 1.95;
  color: #b9c6d8;
}
.info-links {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  border-top: 1px solid var(--border);
  padding-top: 22px;
  color: var(--mint);
}
</style>
