<script setup lang="ts">
import { computed,ref } from 'vue';
import { GCD,GCD_BASELINE,syncedExpiry } from '../data/lckGcd';
import { TEAMS } from '../data/lck2027';
import { CONTRACT_ROWS,LCK_CONTRACTS_PATH } from '../data/lckContracts';
defineProps<{compact?:boolean}>();
const query=ref(''),team=ref('all');
const rows=computed(()=>GCD.rows.filter(r=>(team.value==='all'||r.team===team.value)&&(!query.value.trim()||[r.player,r.team,TEAMS.find(t=>t.slug===r.team)?.name??''].some(v=>v.toLowerCase().includes(query.value.trim().toLowerCase())))));
const matched=computed(()=>CONTRACT_ROWS.filter(r=>syncedExpiry(r.team,r.player)).length);
const name=(slug:string)=>TEAMS.find(t=>t.slug===slug)?.code??slug;
const label={added:'등록 추가',removed:'등록 제외',expiry:'종료일 변경'};
</script>
<template>
<section class="panel gcd-panel">
  <h2>Riot 공식 계약 DB 동기화</h2>
  <p v-if="!GCD.capturedAt" class="small muted">첫 수집 성공 전입니다. 기존 수동 명단을 유지합니다.</p>
  <template v-else>
    <p class="small muted">원본 갱신일: {{GCD.sourceDate??'확인 불가'}} · 마지막 변경 수집: {{GCD.capturedAt.slice(0,16).replace('T',' ')}} UTC</p>
    <p class="small muted">LCK 등록 기록 {{GCD.rows.length}}건 · 기존 명단 계약 기간 자동 반영 {{matched}}명</p>
    <p v-if="!GCD.sourceDate||GCD.sourceDate<GCD_BASELINE" class="small muted">수동 명단보다 오래되었거나 원본 갱신일을 확인할 수 없어 계약 자동 덮어쓰기를 보류합니다.</p>
  </template>
  <p class="small muted">GCD에는 포지션이 없고 선수·코치가 함께 등록될 수 있습니다. 등록 추가/제외는 영입·FA 확정이 아닙니다. 기존 로스터 및 발표 타임라인은 별도 검토가 필요합니다.</p>
  <a :href="GCD.source" target="_blank" rel="noopener noreferrer">공식 계약 DB 원문 ↗</a>
  <a v-if="compact" :href="LCK_CONTRACTS_PATH">계약 동기화 상세 →</a>
  <template v-else-if="GCD.capturedAt">
    <h3>마지막 변경 감지</h3>
    <p v-if="!GCD.changes.length" class="small muted">첫 스냅샷 또는 변경 없음</p>
    <div v-for="r in GCD.changes" :key="r.kind+r.team+r.player" class="gcd-row"><span>{{label[r.kind]}}</span><strong>{{r.player}} · {{name(r.team)}}</strong><span>{{r.previousExpires? r.previousExpires+' → ':''}}{{r.expires}}</span></div>
    <h3>공식 등록 명부 (포지션 미확인 포함)</h3>
    <div class="gcd-controls"><input v-model="query" aria-label="등록 닉네임 검색" placeholder="선수·팀 검색"/><select v-model="team" aria-label="팀 필터"><option value="all">전체 팀</option><option v-for="t in TEAMS" :key="t.slug" :value="t.slug">{{t.name}}</option></select></div>
    <p class="small muted">{{rows.length}}건 표시</p>
    <div v-for="r in rows" :key="r.team+r.player" class="gcd-row"><span>{{name(r.team)}}</span><strong>{{r.player}}</strong><span>{{r.expires}}</span></div>
  </template>
</section>
</template>
<style scoped>
.gcd-panel{margin:0}.gcd-panel h2{font-size:18px}.gcd-panel a{display:inline-block;margin-right:16px;color:var(--mint);font-size:13px}.gcd-row{display:grid;grid-template-columns:minmax(75px,1fr) minmax(85px,1fr) minmax(100px,1.3fr);gap:8px;font-size:12px;overflow-wrap:anywhere;padding:9px 0;border-bottom:1px solid var(--border)}.gcd-controls{display:flex;flex-wrap:wrap;gap:8px}.gcd-controls input,.gcd-controls select{min-width:100px;flex:1;min-height:40px;padding:8px;background:#101a27;color:#e4ebf4;border:1px solid var(--border);border-radius:7px}
</style>
