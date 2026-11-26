<script setup lang="ts">
import {computed} from 'vue';
import {activeNavigation,navItems} from '../config/navigation';
const props=defineProps<{path:string}>();
const active=computed(()=>activeNavigation(props.path));
const historical=computed(()=>active.value?.group==='history');
const items=computed(()=>navItems(historical.value?'history':'lck'));
const other=computed(()=>historical.value?navItems('lck')[0]:navItems('history')[0]);
</script>
<template>
<nav class="lck-tabs" :aria-label="historical?'e스포츠 역사 메뉴':'LCK 스토브리그 메뉴'">
 <a v-for="item in items" :key="item.href" :href="item.href" :aria-current="active?.href===item.href?(path===item.href?'page':'location'):undefined">{{item.label}}</a>
 <a class="other" :href="other.href">{{historical?'LCK 스토브리그':'e스포츠 역사'}} →</a>
</nav>
</template>
<style scoped>
.lck-tabs{display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border);padding-bottom:12px}
.lck-tabs a{padding:10px 13px;min-height:40px;display:inline-flex;align-items:center;font-size:13px;border:1px solid var(--border);border-radius:8px;color:#bac8d9;background:#141e2b}
.lck-tabs a[aria-current]{color:var(--mint);border-color:var(--mint);background:#19332d}
.lck-tabs a:hover{text-decoration:underline}.lck-tabs a.other{margin-left:auto;color:var(--mint);background:transparent}
@media(max-width:600px){.lck-tabs{gap:6px}.lck-tabs a{padding:8px 10px;font-size:12px}.lck-tabs a.other{margin-left:0}}
</style>
