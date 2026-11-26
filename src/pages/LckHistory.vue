<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TEAMS, POSITIONS, LCK_STOVE_PATH, teamPath } from '../data/lck2027';
import { LCK_HISTORY_PATH, HISTORY_PLAYERS_PATH, HISTORY_YEARS, HISTORY_TEAMS, HISTORY_PERIODS, HISTORY_ROSTERS, HISTORY_PLAYERS, HISTORY_ENTRIES, historyRoute, historyYearPath, historyTeamPath, historyPlayerPath, hasHistoryDetail, playerHistory, historyPlayerId, historyKoreanName, filterHistoryRosters, filterHistoryPlayers } from '../data/lckHistory';
import LckChangesNav from '../components/LckChangesNav.vue';
import { LCK_RESULTS_PATH, teamResults, finalsAwards, resultPath, resultTitle, rankLabel, filterResults } from '../data/lckResults';
const props=defineProps<{path:string}>();
const route=computed(()=>historyRoute(props.path));
const year=ref(route.value.year?String(route.value.year):route.value.team?'all':'2027');
const team=ref(route.value.team?.slug??'all');
const selectableTeams=computed(()=>HISTORY_TEAMS.filter(t=>year.value==='all'||HISTORY_ROSTERS.some(r=>r.team===t.slug&&String(r.year)===year.value)));
watch(year,()=>{if(team.value!=='all'&&!selectableTeams.value.some(t=>t.slug===team.value))team.value='all';});
const query=ref(''),position=ref('all');
const rosters=computed(()=>filterHistoryRosters(year.value,team.value,query.value).sort((a,b)=>b.year-a.year));
const players=computed(()=>filterHistoryPlayers(query.value,position.value));
const entries=computed(()=>route.value.player?playerHistory(route.value.player.id):[]);
const awards=computed(()=>route.value.player?finalsAwards(route.value.player.id):[]);
const teamPlacements=computed(()=>route.value.team?teamResults(route.value.team.slug):[]);
const yearEvents=computed(()=>route.value.year?filterResults(String(route.value.year)):[]);
const playerYears=computed(()=>new Set(entries.value.map(e=>e.year)).size);
const playerTeams=computed(()=>new Set(entries.value.map(e=>e.team)).size);
const heading=computed(()=>route.value.player?route.value.player.name+' 선수 소속팀 기록':route.value.directory?'LCK 선수 이력 도감':route.value.team?route.value.team.name+' 역대 로스터':route.value.year?route.value.year+' LCK 로스터':'역대 LCK 로스터 아카이브');
const selectedPeriods=computed(()=>HISTORY_YEARS.filter(y=>route.value.player?entries.value.some(e=>e.year===y):route.value.directory||year.value==='all'||String(y)===year.value));
function reset(){year.value=route.value.year?String(route.value.year):route.value.team?'all':'2027';team.value=route.value.team?.slug??'all';query.value='';position.value='all';}
function playerLink(name:string){return historyPlayerPath(historyPlayerId(name));}
function currentTeamLink(slug:string){const t=TEAMS.find(t=>t.slug===slug);return t?teamPath(t):LCK_STOVE_PATH;}
</script>
<template>
<article class="history">
  <nav class="crumb" aria-label="현재 위치"><a href="/">홈</a> / <a :href="LCK_HISTORY_PATH">LCK 아카이브</a><template v-if="path!==LCK_HISTORY_PATH"> / {{heading}}</template></nav>
  <header class="hero"><p class="eyebrow">LCK · ROSTER ARCHIVE</p><h1>{{heading}}</h1><p>2015~2027년 LCK 팀 구성과 선수의 소속팀 기록을 시즌별로 탐색하세요. 자료마다 확인 시점이 다르며 전체 계약 이력을 뜻하지 않습니다.</p></header>
  <LckChangesNav :path="path"/>
  <nav class="history-tabs" aria-label="아카이브 메뉴"><a :href="LCK_HISTORY_PATH" :aria-current="path===LCK_HISTORY_PATH?'page':undefined">전체 아카이브</a><a :href="HISTORY_PLAYERS_PATH" :aria-current="route.directory||route.player?'page':undefined">선수 이력</a><a v-for="y in HISTORY_YEARS" :key="y" :href="historyYearPath(y)" :aria-current="route.year===y?'page':undefined">{{y}}</a></nav>
  <section class="panel" v-if="route.team||route.year||route.player"><h2>{{route.player?'파이널 MVP 수상 기록':'대회 최종 성적'}}</h2><template v-if="route.player"><p class="small muted">개인 수상 확인 기록만 표시합니다. 로스터 소속만으로 개인 우승을 추정하지 않습니다.</p><div v-for="r in awards" :key="r.id" class="entry"><a :href="resultPath(r.id)">{{resultTitle(r)}}</a><strong>파이널 MVP</strong></div><p v-if="!awards.length" class="small muted">수록 범위에서 확인된 파이널 MVP 기록 없음</p></template><template v-else-if="route.team"><div v-for="item in teamPlacements" :key="item.result.id" class="entry"><a :href="resultPath(item.result.id)">{{resultTitle(item.result)}}</a><strong>{{rankLabel(item.placement)}}</strong></div><p v-if="!teamPlacements.length" class="small muted">수록 대회 성적 없음</p></template><template v-else><p v-for="r in yearEvents" :key="r.id"><a :href="resultPath(r.id)">{{resultTitle(r)}} 최종 순위 →</a></p><p v-if="!yearEvents.length" class="small muted">종료된 수록 대회 없음</p></template><a class="detail" :href="LCK_RESULTS_PATH">역대 우승팀·최종 순위 →</a></section>
  <div class="overview" v-if="!route.player"><div><span>수록 연도</span><b>{{HISTORY_YEARS.length}}</b></div><div><span>팀·시즌 기록</span><b>{{HISTORY_ROSTERS.length}}</b></div><div><span>선수 ID</span><b>{{HISTORY_PLAYERS.length}}</b></div><div><span>선수·포지션 기록</span><b>{{HISTORY_ENTRIES.length}}</b></div></div>
  <template v-if="route.player">
    <div class="overview"><div><span>수록 연도 수</span><b>{{playerYears}}</b></div><div><span>수록 소속팀 수</span><b>{{playerTeams}}</b></div></div>
    <section class="panel"><h2>시즌별 소속팀 기록</h2><p class="small muted">명단 사이의 공백은 해당 시점 자료에 없다는 의미입니다. 해외 이적, 휴식, 은퇴 여부를 추정하지 않습니다.</p><div v-for="e in entries" :key="e.year+'-'+e.team+'-'+e.position" class="entry"><a :href="historyYearPath(e.year)" class="year">{{e.year}}</a><div><strong><a :href="historyTeamPath(e.team)">{{e.name}}</a></strong><small>{{e.position}} · {{e.player}} · {{HISTORY_PERIODS[e.year].label}}</small></div><a :href="historyTeamPath(e.team)" class="detail">팀 기록 →</a></div><a :href="HISTORY_PLAYERS_PATH" class="detail">← 선수 이력 검색</a></section>
  </template>
  <template v-else-if="route.directory">
    <section class="panel filters"><label>선수·팀 검색<input v-model="query" type="search" placeholder="페이커, Doran, 담원…"/></label><label>포지션<select v-model="position"><option value="all">전체</option><option v-for="p in POSITIONS" :key="p">{{p}}</option></select></label><button class="secondary" type="button" @click="reset">초기화</button></section>
    <p class="small muted" aria-live="polite">{{players.length}}명 표시 · 두 연도 이상 수록된 선수는 독립 상세 페이지 제공</p>
    <div class="directory"><section v-for="p in players" :key="p.id" class="panel person"><h3><a v-if="hasHistoryDetail(p.id)" :href="historyPlayerPath(p.id)">{{p.name}} ↗</a><template v-else>{{p.name}}</template></h3><p v-if="historyKoreanName(p.name)" class="small muted">{{historyKoreanName(p.name)}}</p><div v-for="e in playerHistory(p.id)" :key="e.year+'-'+e.team+'-'+e.position" class="small person-row"><a :href="historyYearPath(e.year)">{{e.year}}</a><a :href="historyTeamPath(e.team)">{{e.name}}</a><span>{{e.position}}</span></div></section></div>
    <p v-if="!players.length" class="panel muted">검색 조건과 일치하는 선수가 없습니다.</p>
  </template>
  <template v-else>
    <section class="panel filters"><label>연도<select v-model="year"><option value="all">전체 연도</option><option v-for="y in HISTORY_YEARS" :key="y" :value="String(y)">{{y}} · {{HISTORY_PERIODS[y].label}}</option></select></label><label>팀<select v-model="team"><option value="all">전체 팀</option><option v-for="t in selectableTeams" :key="t.slug" :value="t.slug">{{t.name}}</option></select></label><label>팀·선수 검색<input v-model="query" type="search" placeholder="Faker, 페이커, 광동…"/></label><button type="button" class="secondary" @click="reset">초기화</button></section>
    <p class="small muted" aria-live="polite">{{rosters.length}}개 팀·시즌 기록 표시</p>
    <div class="roster-grid">
      <section v-for="r in rosters" :key="r.year+'-'+r.team" class="panel roster">
        <header><div><a class="year" :href="historyYearPath(r.year)">{{r.year}}</a><h2><a :href="historyTeamPath(r.team)">{{r.name}} ↗</a></h2><small>{{HISTORY_PERIODS[r.year].label}}</small></div><a v-if="TEAMS.some(t=>t.slug===r.team)" class="detail" :href="currentTeamLink(r.team)">2027 현황 →</a><span v-else class="small muted">과거 참가 팀</span></header>
        <div v-for="(names,i) in r.roles" :key="i" class="role"><span>{{POSITIONS[i]}}</span><div v-if="names.length" class="names"><template v-for="n in names" :key="n"><a v-if="hasHistoryDetail(historyPlayerId(n))" :href="playerLink(n)">{{n}}</a><strong v-else>{{n}}</strong></template></div><span v-else class="muted">발표 대기 / 확인되지 않음</span></div>
      </section>
    </div>
    <p v-if="!rosters.length" class="panel muted">검색 조건과 일치하는 기록이 없습니다.</p>
    <section class="panel"><h2>팀별 역대 로스터</h2><nav class="team-links" aria-label="팀별 아카이브"><a v-for="t in HISTORY_TEAMS" :key="t.slug" :href="historyTeamPath(t.slug)">{{t.name}}{{t.current?'':' (과거 팀)'}} ↗</a></nav></section>
  </template>
  <section class="panel guide"><h2>자료 기준 및 출처</h2><p>연도별 기준이 다릅니다. 2015~2021년은 스프링 대표 로스터와 일부 교체 선수를 수록하며, 개막 당일 전체 명단은 아닙니다. 2015년에는 8개 팀이 참가했습니다. 2022~2025년의 공개 명단은 복수 포지션 선수를 포함할 수 있으며, 한 시즌에 참여한 모든 선수를 수록한 것이 아닙니다. 2026년은 마지막 공식 경기, 2027년은 기존 스토브리그의 확인 자료만 사용합니다. 구단명 변경 및 참가권 승계는 탐색 편의를 위한 계열 분류입니다. 동일 법인 또는 모든 선수의 연속 소속을 뜻하지 않습니다. 나진·콩두는 과거 참가권 승계 기준으로 묶고, 현재 브리온과는 별도 기록으로 표시합니다. 선수 기록은 닉네임 기준이며 전체 커리어나 계약 기간을 뜻하지 않습니다.</p><div v-for="y in selectedPeriods" :key="y" class="period"><strong>{{y}} · {{HISTORY_PERIODS[y].label}}</strong><p>{{HISTORY_PERIODS[y].description}}</p><a v-for="s in HISTORY_PERIODS[y].sources" :key="s.url" :href="s.url" :target="s.url.startsWith('https:')?'_blank':undefined" rel="noopener noreferrer">{{s.label}} ↗</a></div><p class="small muted">비공식 팬 콘텐츠 · 선수 사진 및 구단 로고는 사용하지 않습니다.</p></section>
</article>
</template>
<style scoped>
.history{max-width:1120px;margin:auto;display:grid;gap:16px}.crumb{font-size:12px;color:var(--muted)}.hero{padding:clamp(20px,4vw,36px);border:1px solid var(--border);border-radius:14px;background:linear-gradient(120deg,#192e32,#141b29)}.hero h1{font-size:clamp(25px,4vw,40px);margin:8px 0 12px;letter-spacing:-.05em}.hero p:not(.eyebrow){font-size:14px;color:#bdc8d7}.history-tabs,.team-links{display:flex;flex-wrap:wrap;gap:8px}.history-tabs a,.team-links a{border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:#c4d1de;font-size:12px}.history-tabs a[aria-current=page]{border-color:var(--mint);color:var(--mint);background:#19332d}.overview{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}.overview>div{background:#141e2b;border:1px solid var(--border);border-radius:10px;padding:15px}.overview span{display:block;font-size:12px;color:var(--muted)}.overview b{display:block;font-size:28px;color:var(--mint);margin-top:6px}.filters{margin:0;display:flex;flex-wrap:wrap;gap:12px;align-items:end}.filters label{flex:1;min-width:140px;display:grid;gap:6px;font-size:12px;color:var(--muted)}.filters input,.filters select{width:100%;min-height:44px;background:#101a27;color:#ecf2f8;border:1px solid #405165;border-radius:8px;padding:10px;font:inherit;box-sizing:border-box}.roster-grid,.directory{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.roster,.person,.guide{margin:0;min-width:0}.roster header{display:flex;justify-content:space-between;align-items:start;gap:8px;padding-bottom:12px;border-bottom:1px solid var(--border)}.roster h2,.person h3{font-size:18px;margin:5px 0}.roster small,.entry small{font-size:11px;color:var(--muted);display:block}.year{color:var(--mint);font-size:13px;font-weight:700}.detail{font-size:12px;color:var(--mint)}.role{display:grid;grid-template-columns:60px minmax(0,1fr);gap:8px;padding:12px 0;border-bottom:1px solid var(--border);font-size:13px;align-items:start}.role>span:first-child{color:var(--muted);font-size:12px}.names{display:flex;gap:6px;flex-wrap:wrap}.names a,.names strong{border:1px solid #35475b;background:#182536;padding:5px 8px;border-radius:6px;font-weight:600;overflow-wrap:anywhere}.names a:hover,.detail:hover,.guide a:hover{text-decoration:underline}.directory{grid-template-columns:repeat(3,minmax(0,1fr))}.person-row{display:grid;grid-template-columns:42px minmax(0,1fr) 48px;gap:7px;padding:7px 0;border-top:1px solid var(--border)}.person-row span{color:var(--muted)}.entry{display:grid;grid-template-columns:65px minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--border)}.entry small{margin-top:4px}.guide p,.period a{font-size:13px;line-height:1.8;color:#afbed0}.period{border-top:1px solid var(--border);padding:12px 0}.period p{margin:5px 0}.period a{display:block;color:var(--mint);text-decoration:underline}@media(max-width:760px){.roster-grid,.directory{grid-template-columns:1fr}.overview{grid-template-columns:repeat(2,minmax(0,1fr))}.role{grid-template-columns:48px minmax(0,1fr)}}
</style>
