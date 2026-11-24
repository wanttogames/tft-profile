<script setup lang="ts">
import { LCK_STOVE_PATH } from '../data/lck2027';
import { LCK_HISTORY_PATH } from '../data/lckHistory';
import { LCK_DREAM_PATH } from '../data/lckDream';
import { LCK_FA_PATH, LCK_CONTRACTS_PATH } from '../data/lckContracts';
import { LCK_COMPARE_PATH, LCK_TIMELINE_PATH } from '../data/lckChanges';
defineProps<{path:string}>();
</script>
<template>
<nav class="lck-tabs" aria-label="LCK 스토브리그 메뉴">
  <a :href="LCK_STOVE_PATH" :aria-current="path!==LCK_COMPARE_PATH && path!==LCK_TIMELINE_PATH && path!==LCK_FA_PATH && path!==LCK_CONTRACTS_PATH && path!==LCK_DREAM_PATH && !path.startsWith(LCK_HISTORY_PATH)?'page':undefined">2027 로스터</a>
  <a :href="LCK_COMPARE_PATH" :aria-current="path===LCK_COMPARE_PATH?'page':undefined">2026 → 2027 비교</a>
  <a :href="LCK_TIMELINE_PATH" :aria-current="path===LCK_TIMELINE_PATH?'page':undefined">이적 타임라인</a>
  <a :href="LCK_FA_PATH" :aria-current="path===LCK_FA_PATH?'page':undefined">FA 선수</a>
  <a :href="LCK_CONTRACTS_PATH" :aria-current="path===LCK_CONTRACTS_PATH?'page':undefined">계약 만료일</a>
  <a :href="LCK_DREAM_PATH" :aria-current="path===LCK_DREAM_PATH?'page':undefined">드림팀 만들기</a>
  <a :href="LCK_HISTORY_PATH" :aria-current="path.startsWith(LCK_HISTORY_PATH)?'page':undefined">역대 로스터</a>
</nav>
</template>
<style scoped>
.lck-tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:12px}.lck-tabs a{padding:11px 15px;font-size:13px;border:1px solid var(--border);border-radius:8px;color:#bac8d9;background:#141e2b}.lck-tabs a[aria-current=page]{color:var(--mint);border-color:var(--mint);background:#19332d}.lck-tabs a:hover{text-decoration:underline}
</style>
