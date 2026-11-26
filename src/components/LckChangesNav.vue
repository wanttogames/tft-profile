<script setup lang="ts">
import {computed} from 'vue';
import {activeNavigation,activeNavSection,navSections,navItems} from '../config/navigation';
const props=defineProps<{path:string}>();
const active=computed(()=>activeNavigation(props.path));
const historical=computed(()=>active.value?.group==='history');
const sections=computed(()=>navSections(historical.value?'history':'lck'));
const selected=computed(()=>activeNavSection(props.path)??sections.value[0]);
const other=computed(()=>historical.value?navItems('lck')[0]:navItems('history')[0]);
</script>
<template>
<nav class="lck-section-nav" :aria-label="historical?'e스포츠 역사 메뉴':'LCK 기능 메뉴'">
 <div class="section-nav-top">
  <div class="section-categories">
   <a v-for="sub in sections" :key="sub.id" :href="sub.href" :class="{'category-active':selected?.id===sub.id}" :aria-current="selected?.id===sub.id?'location':undefined">{{sub.shortLabel}}</a>
  </div>
  <a class="switch-area" :href="other.href">{{historical?'LCK 스토브리그':'e스포츠 역사'}} <span aria-hidden="true">→</span></a>
 </div>
 <div v-if="selected&&selected.items.length>1" class="section-children" :aria-label="selected.label+' 하위 메뉴'">
  <a v-for="item in selected.items" :key="item.href" :href="item.href" :aria-current="active?.href===item.href?(path===item.href?'page':'location'):undefined">{{item.label}}</a>
 </div>
 <div v-else-if="selected" class="section-current-label">{{selected.items[0]?.label}}</div>
</nav>
</template>
<style scoped>
.lck-section-nav{min-width:0;border:1px solid #303f50;border-radius:12px;background:#121c29}
.section-nav-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 10px 0;min-width:0}
.section-categories{display:flex;align-items:center;gap:4px;min-width:0}
.section-categories a{display:flex;align-items:center;justify-content:center;min-height:44px;padding:10px 17px;border-radius:8px 8px 0 0;color:#aab9ca;font-size:14px;font-weight:600;border-bottom:2px solid transparent;white-space:nowrap}
.section-categories a.category-active{color:var(--mint);background:#1c3433;border-bottom-color:var(--mint)}
.switch-area{font-size:12px;color:var(--mint);white-space:nowrap;padding:8px 6px}
.section-children,.section-current-label{display:flex;flex-wrap:wrap;align-items:center;gap:4px 16px;padding:6px 13px;border-top:1px solid #2c3c4c;min-height:46px}
.section-children a{display:flex;align-items:center;min-height:38px;padding:5px 8px;border-bottom:2px solid transparent;font-size:13px;color:#aab9cb}
.section-children a[aria-current]{border-bottom-color:var(--mint);color:var(--mint);font-weight:700}
.section-current-label{color:#a9bbce;font-size:12px;padding-left:20px}.lck-section-nav a:hover{color:var(--mint)}.switch-area:hover{text-decoration:underline}
@media(max-width:600px){.section-nav-top{flex-direction:column;align-items:stretch;padding:7px 8px 0;gap:0}.section-categories{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr);gap:4px}.section-categories a{font-size:12px;white-space:normal;text-align:center;padding:9px 5px}.switch-area{align-self:flex-end;font-size:11px;padding:7px 5px}.section-children{gap:2px 8px;padding:4px 7px}.section-children a{font-size:12px;padding:5px 6px;min-height:42px}}
</style>
