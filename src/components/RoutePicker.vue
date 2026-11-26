<script setup lang="ts">
import {computed,ref,onMounted,onBeforeUnmount} from 'vue';
const props=defineProps<{label:string;path:string;items:readonly {href:string;label:string}[];fallback:string}>();
const root=ref<HTMLDetailsElement|null>(null);
const summary=ref<HTMLElement|null>(null);
const current=computed(()=>props.items.find(item=>item.href===props.path)?.label??props.fallback);
function close(){if(root.value)root.value.open=false;}
function outside(e:PointerEvent){if(e.target instanceof Node&&!root.value?.contains(e.target))close();}
function key(e:KeyboardEvent){if(e.key==='Escape'&&root.value?.open){e.preventDefault();close();summary.value?.focus();}}
onMounted(()=>document.addEventListener('pointerdown',outside));
onBeforeUnmount(()=>document.removeEventListener('pointerdown',outside));
</script>
<template>
<details ref="root" class="route-picker" @keydown="key">
 <summary ref="summary"><span class="picker-copy"><small>{{label}}</small><strong>{{current}}</strong></span><span class="picker-chevron" aria-hidden="true"></span></summary>
 <nav class="picker-list" :aria-label="label">
  <a v-for="item in items" :key="item.href" :href="item.href" :aria-current="path===item.href?'page':undefined">{{item.label}}</a>
 </nav>
</details>
</template>
<style scoped>
.route-picker{position:relative;min-width:0;width:100%;max-width:360px}
summary{display:flex;align-items:center;justify-content:space-between;gap:12px;list-style:none;min-height:52px;padding:9px 13px;border:1px solid #405165;background:#142030;border-radius:9px;cursor:pointer}
summary::-webkit-details-marker{display:none}
.picker-copy{display:grid;gap:3px;min-width:0}.picker-copy small{color:var(--muted);font-size:11px}.picker-copy strong{font-size:14px;overflow-wrap:anywhere}
.picker-chevron{width:8px;height:8px;flex:none;border-bottom:1.5px solid currentColor;border-right:1.5px solid currentColor;transform:rotate(45deg);margin-right:4px}.route-picker[open] .picker-chevron{transform:rotate(225deg)}
.picker-list{position:absolute;top:calc(100% + 6px);left:0;right:0;max-height:280px;overflow:auto;overscroll-behavior:contain;padding:6px;background:#152131;border:1px solid #405165;border-radius:9px;box-shadow:0 10px 28px #0009;z-index:10}
.picker-list a{display:flex;align-items:center;min-height:44px;padding:9px 11px;border-radius:6px;font-size:13px;overflow-wrap:anywhere}.picker-list a:hover,.picker-list a[aria-current]{background:#203a37;color:var(--mint)}.picker-list a:focus-visible{outline-offset:-2px}
@media(max-width:600px){.route-picker{max-width:none}}
</style>
