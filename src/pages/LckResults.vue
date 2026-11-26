<script setup lang="ts">
import { computed,ref } from 'vue';
import { LCK_HISTORY_PATH,historyYearPath,historyPlayerId,historyPlayerPath,hasHistoryDetail } from '../data/lckHistory';
import { LCK_RESULTS_PATH,LCK_RESULTS,RESULT_TEAMS,RESULTS_YEARS,RESULTS_CHECKED,RESULTS_SOURCES,findResult,resultPath,resultTitle,resultTeamName,resultTeamLink,rankLabel,filterResults,titleTable } from '../data/lckResults';
import LckChangesNav from '../components/LckChangesNav.vue';
const props=defineProps<{path:string}>();
const event=computed(()=>findResult(props.path));
const year=ref('all'),kind=ref('all'),team=ref('all'),tableKind=ref<'league'|'cup'>('league');
const events=computed(()=>event.value?[event.value]:filterResults(year.value,kind.value,team.value));
const titles=computed(()=>titleTable(tableKind.value));
const leagueCount=LCK_RESULTS.filter(r=>r.kind!=='cup').length;
const cupCount=LCK_RESULTS.length-leagueCount;
const title=computed(()=>event.value?resultTitle(event.value)+' LCK 최종 순위':'역대 LCK 우승팀·최종 순위');
function reset(){year.value='all';kind.value='all';team.value='all';}
</script>
<template>
<article class="results">
  <nav class="crumb" aria-label="현재 위치"><a href="/">홈</a> / <a :href="LCK_HISTORY_PATH">LCK 아카이브</a> / <a :href="LCK_RESULTS_PATH">대회 성적</a><template v-if="event"> / {{resultTitle(event)}}</template></nav>
  <header class="hero"><p class="eyebrow">LCK · CHAMPIONS & RESULTS</p><h1>{{title}}</h1><p>2015~2026 시즌별 최종 순위, 우승·준우승, 결승 스코어와 파이널 MVP를 확인하세요. LCK 컵과 리그 우승은 별도로 집계합니다.</p><span class="small muted">{{RESULTS_CHECKED}} 자료 확인 · 종료 대회만 수록</span></header>
  <LckChangesNav :path="path"/>
  <div class="overview" v-if="!event"><div><span>수록 대회</span><b>{{LCK_RESULTS.length}}</b></div><div><span>리그 우승 대회</span><b>{{leagueCount}}</b></div><div><span>LCK 컵</span><b>{{cupCount}}</b></div></div>
  <section v-if="!event" class="panel title-board">
    <div class="section-head"><h2>팀별 우승 횟수</h2><div class="toggle"><button type="button" :aria-pressed="tableKind==='league'" @click="tableKind='league'">리그</button><button type="button" :aria-pressed="tableKind==='cup'" @click="tableKind='cup'">LCK 컵</button></div></div>
    <p class="small muted">2015년 이후 집계 · 과거 팀명은 아카이브 계열 기준으로 합산 · 2012~2014 OGN 제외</p>
    <div v-for="t in titles" :key="t.team" class="title-row">
      <div><a v-if="resultTeamLink(t.team)" :href="resultTeamLink(t.team)??undefined">{{t.name}}</a><span v-else>{{t.name}}</span></div>
      <div class="bar" :aria-label="'우승 '+t.wins+'회'"><i :style="{width:(t.wins/Math.max(1,titles[0].wins)*100)+'%'}"></i></div><strong>{{t.wins}}회</strong><small>준우승 {{t.runners}}회</small>
    </div>
  </section>
  <section v-if="!event" class="panel filters"><label>연도<select v-model="year"><option value="all">전체</option><option v-for="y in RESULTS_YEARS" :key="y" :value="String(y)">{{y}}</option></select></label><label>대회<select v-model="kind"><option value="all">전체</option><option value="league">리그 전체</option><option value="spring">스프링</option><option value="summer">서머</option><option value="season">단일 시즌</option><option value="cup">LCK 컵</option></select></label><label>참가 팀<select v-model="team"><option value="all">전체</option><option v-for="t in RESULT_TEAMS" :key="t.slug" :value="t.slug">{{t.name}}</option></select></label><button class="secondary" type="button" @click="reset">초기화</button></section>
  <p v-if="!event" class="small muted" aria-live="polite">{{events.length}}개 대회 표시</p>
  <div class="event-grid" :class="{single:!!event}">
    <section v-for="r in events" :key="r.id" class="panel event">
      <header class="section-head"><h2><a :href="resultPath(r.id)">{{resultTitle(r)}} <span v-if="!event">↗</span></a></h2><a class="detail" :href="historyYearPath(r.year)">연도 로스터 →</a></header>
      <div class="final"><div><small>우승</small><strong>{{resultTeamName(r,r.placements[0].team)}}</strong></div><b>{{r.score}}</b><div><small>준우승</small><strong>{{resultTeamName(r,r.placements[1].team)}}</strong></div></div>
      <p class="mvp">파이널 MVP · <a v-if="hasHistoryDetail(historyPlayerId(r.mvp))" :href="historyPlayerPath(historyPlayerId(r.mvp))">{{r.mvp}} ↗</a><strong v-else>{{r.mvp}}</strong></p>
      <table><thead><tr><th scope="col">최종 순위</th><th scope="col">당시 팀명</th></tr></thead><tbody><tr v-for="p in r.placements" :key="p.team" :class="{winner:p.rank===1,chosen:team===p.team}"><td>{{rankLabel(p)}}</td><td><a v-if="resultTeamLink(p.team)" :href="resultTeamLink(p.team)??undefined">{{resultTeamName(r,p.team)}}</a><span v-else>{{resultTeamName(r,p.team)}}</span></td></tr></tbody></table>
      <a :href="r.source" target="_blank" rel="noopener noreferrer" class="detail">대회 결과·경기 기록 출처 ↗</a>
    </section>
  </div>
  <p v-if="!events.length" class="panel muted">조건에 해당하는 대회가 없습니다.</p>
  <section class="panel guide"><h2>집계 기준 및 출처</h2><p>2015~2024년 스프링·서머와 2025~2026년 단일 시즌, 별도 LCK 컵을 수록합니다. 순위는 정규리그 중간 순위가 아닌 포스트시즌 종료 이후의 국내 최종 순위입니다. 2021~2024년 동일 라운드 탈락 팀의 순위는 국내 시즌별 최종 순위 기록에 따르며, 컵의 공동 순위는 범위로 표시합니다.</p><p>리그 우승 횟수에는 LCK 컵, MSI, 월즈, KeSPA 컵, 2012~2014 OGN 대회를 포함하지 않습니다. 팀명 승계는 아카이브의 탐색 분류이며 법인 동일성을 보장하지 않습니다. 연도별 로스터는 별도 시점의 스냅샷이므로 해당 명단 선수 전체의 우승이나 실제 결승 출전을 의미하지 않습니다.</p><p>파이널 MVP는 결승 수상자로 수록하며 시즌 MVP와 구분합니다. Ever8 Winners는 서머 대회 성적만 수록되며 현재 로스터 상세 기록은 없습니다.</p><a v-for="s in RESULTS_SOURCES" :key="s.url" :href="s.url" target="_blank" rel="noopener noreferrer">{{s.label}} ↗</a><a v-if="event" :href="LCK_RESULTS_PATH">← 전체 대회 성적</a></section>
</article>
</template>
<style scoped>
.results{max-width:1120px;margin:auto;display:grid;gap:16px}.crumb{font-size:12px;color:var(--muted)}.hero{padding:clamp(20px,4vw,36px);border:1px solid var(--border);border-radius:14px;background:linear-gradient(120deg,#192e32,#141b29)}.hero h1{font-size:clamp(25px,4vw,40px);margin:8px 0 12px;letter-spacing:-.05em}.hero p:not(.eyebrow){font-size:14px;color:#bdc8d7}.overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.overview>div{padding:15px;border:1px solid var(--border);border-radius:10px;background:#141e2b}.overview span{font-size:12px;color:var(--muted);display:block}.overview b{font-size:28px;color:var(--mint);display:block;margin-top:6px}.section-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.section-head h2{font-size:18px;margin:4px 0}.toggle{display:flex;gap:6px}.toggle button{padding:8px 12px;background:#101a27;color:#c4d1de;border:1px solid var(--border);border-radius:7px;cursor:pointer}.toggle button[aria-pressed=true]{border-color:var(--mint);color:var(--mint)}.title-row{display:grid;grid-template-columns:minmax(88px,1fr) minmax(40px,2fr) 40px 76px;gap:10px;align-items:center;padding:9px 0;font-size:13px}.title-row small{color:var(--muted);font-size:11px}.bar{height:10px;background:#253141;border-radius:5px;overflow:hidden}.bar i{height:100%;display:block;background:var(--mint);border-radius:5px}.filters{display:flex;flex-wrap:wrap;gap:10px;align-items:end}.filters label{flex:1;min-width:115px;display:grid;gap:6px;font-size:12px;color:var(--muted)}.filters select{width:100%;min-height:44px;background:#101a27;color:#ecf2f8;border:1px solid #405165;border-radius:8px;padding:8px}.event-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.event-grid.single{grid-template-columns:1fr}.event,.title-board,.filters,.guide{margin:0;min-width:0}.final{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:10px;align-items:center;text-align:center;background:#192632;border:1px solid #35475b;border-radius:9px;padding:14px 8px;margin:12px 0}.final small,.final strong{display:block}.final small{font-size:11px;color:var(--muted);margin-bottom:5px}.final>div:first-child strong{color:#f1cd78}.final strong{font-size:15px;overflow-wrap:anywhere}.final>b{font-size:23px;white-space:nowrap}.mvp{font-size:13px;color:#bfcbd8}.event table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}.event th,.event td{padding:9px 6px;border-bottom:1px solid var(--border)}.event th{color:var(--muted)}.event tr.winner{color:#f1cd78;font-weight:700}.event tr.chosen{background:#19332d}.detail,.guide a,.mvp a{color:var(--mint);font-size:12px}.event>.detail{display:inline-block;margin-top:14px}.guide p{font-size:13px;line-height:1.8;color:#afbed0}.guide a{display:block;margin:8px 0;text-decoration:underline}@media(max-width:760px){.event-grid{grid-template-columns:1fr}.overview>div{padding:10px}.overview b{font-size:23px}.title-row{gap:6px;grid-template-columns:minmax(80px,1fr) minmax(30px,1fr) 35px 65px}}
</style>
