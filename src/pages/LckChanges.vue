<script setup lang="ts">
import { computed, ref } from 'vue';
import { TEAMS, LCK_STOVE_PATH, teamPath } from '../data/lck2027';
import { LCK_COMPARE_PATH, LCK_TIMELINE_PATH, CHANGES_CHECKED, BASELINE_SOURCE, TIMELINE_SOURCE, CHANGE_LABEL, MOVE_LABEL, compareTeam, changeCounts, filterMoves, groupMoves, teamBySlug, MOVES, type Change } from '../data/lckChanges';
import LckChangesNav from '../components/LckChangesNav.vue';
const props=defineProps<{path:string}>();
const timeline=computed(()=>props.path===LCK_TIMELINE_PATH);
const selected=ref('all'), query=ref(''), kind=ref('all'), change=ref<'all'|Change>('all');
const counts=changeCounts();
const showReports=ref(true);
const compared=computed(()=>TEAMS.filter(t=>selected.value==='all'||selected.value===t.slug).map(team=>({
  team, counts:changeCounts([team]), rows:compareTeam(team).filter(r=>(change.value==='all'||r.change===change.value)&&(!query.value.trim()||[team.name,team.code,r.before,r.slot.player,r.slot.report?.player,r.position].some(v=>v?.toLowerCase().includes(query.value.trim().toLowerCase())))),
})).filter(t=>t.rows.length));
const moves=computed(()=>filterMoves(selected.value,kind.value,query.value));
const days=computed(()=>groupMoves(moves.value));
const totalByKind=(k:string)=>MOVES.filter(m=>m.kind===k).length;
const name=(slug:string)=>teamBySlug(slug)?.code??slug;
function reset(){selected.value='all';query.value='';kind.value='all';change.value='all';showReports.value=true;}
</script>
<template>
<article class="changes">
  <nav class="crumb" aria-label="현재 위치"><a href="/">홈</a> / <a :href="LCK_STOVE_PATH">LCK 스토브리그</a> / {{timeline?'이적 타임라인':'시즌 비교'}}</nav>
  <header class="hero">
    <p class="eyebrow">LCK · OFFSEASON 2027</p>
    <h1>{{timeline?'2027 LCK 이적 타임라인':'2026 → 2027 LCK 로스터 비교'}}</h1>
    <p>{{timeline?'1군 선수의 날짜가 확인된 영입, 재계약, 결별 발표를 시간순으로 살펴보세요.':'2026년 마지막 공식 경기 출전 선수와 2027년 발표·계약 확인 선수를 포지션별로 비교합니다.'}}</p>
    <span class="small muted">{{CHANGES_CHECKED}} KST 확인 · 수동 갱신 자료</span>
  </header>
  <LckChangesNav :path="path"/>
  <div class="overview" v-if="timeline">
    <div><span>선정 발표</span><b>{{MOVES.length}}건</b></div>
    <div><span>영입</span><b>{{totalByKind('signed')}}건</b></div>
    <div><span>재계약</span><b>{{totalByKind('renewed')}}건</b></div>
    <div><span>결별·계약 종료</span><b>{{totalByKind('departed')}}건</b></div>
  </div>
  <div class="overview" v-else>
    <div><span>비교 포지션</span><b>50</b></div>
    <div><span>기존 선수 유지</span><b>{{counts.retained}}</b></div>
    <div><span>신규 구성 확인</span><b>{{counts.changed}}</b></div>
    <div><span>발표 대기</span><b>{{counts.pending}}</b></div>
  </div>
  <p class="small muted note">{{timeline?'선정한 발표의 기록이며 전체 시장의 발표 건수가 아닙니다. 한 선수의 결별과 영입은 별개의 발표입니다. 동일 날짜 내 순서는 정확한 시각 순서가 아닙니다.':'신규 구성은 대표 선수의 변경을 뜻하며 기존 선수의 계약 종료나 주전 확정을 의미하지 않습니다. 발표 대기는 교체 수에 포함하지 않습니다. 복수 선수 계약은 기존 로스터의 부가 정보로 표시합니다.'}}</p>
  <section class="panel filters" aria-label="검색 조건">
    <label>팀<select v-model="selected"><option value="all">전체 팀</option><option v-for="t in TEAMS" :key="t.slug" :value="t.slug">{{t.name}}</option></select></label>
    <label v-if="timeline">발표 종류<select v-model="kind"><option value="all">전체 발표</option><option v-for="(label,k) in MOVE_LABEL" :key="k" :value="k">{{label}}</option></select></label>
    <label v-else>변화 상태<select v-model="change"><option value="all">전체 포지션</option><option v-for="(label,k) in CHANGE_LABEL" :key="k" :value="k">{{label}}</option></select></label>
    <label>선수·팀·포지션 검색<input v-model="query" type="search" placeholder="Doran, T1, 정글…" /></label>
    <button type="button" class="secondary" @click="reset">초기화</button>
  </section>
  <template v-if="timeline">
    <p class="small muted" aria-live="polite">{{moves.length}}건 표시 · 팀 필터는 영입팀 또는 확인된 직전 소속팀 포함</p>
    <section v-for="day in days" :key="day.date" class="day">
      <h2>{{day.date}} <small>{{day.moves.length}}건</small></h2>
      <div class="panel event-list">
        <article v-for="m in day.moves" :key="m.id" class="event">
          <span class="mark" :class="m.kind">{{MOVE_LABEL[m.kind]}}</span>
          <div><strong>{{m.player}}</strong> <span class="small muted">{{m.position}}</span>
            <div class="flow">
              <template v-if="m.previousTeam"><a :href="teamPath(teamBySlug(m.previousTeam)!)">{{name(m.previousTeam)}}</a><span aria-hidden="true">→</span></template>
              <a v-if="teamBySlug(m.team)" :href="teamPath(teamBySlug(m.team)!)">{{name(m.team)}}</a>
              <span v-if="m.kind==='departed'" class="muted">· 계약 종료 / 결별</span>
              <span v-else-if="m.kind==='signed'&&!m.previousTeam" class="muted">· 합류</span>
            </div>
          </div>
          <a class="source" :href="m.source" target="_blank" rel="noopener noreferrer">발표 취합 출처 ↗</a>
        </article>
      </div>
    </section>
    <p v-if="!days.length" class="panel muted" role="status">조건에 맞는 발표가 없습니다.</p>
  </template>
  <template v-else>
    <div class="section-head"><h2>팀별 포지션 비교</h2><label class="small muted"><input v-model="showReports" type="checkbox"/> 미확정 전망 표시</label></div>
    <div class="comparison">
      <section v-for="c in compared" :key="c.team.slug" class="panel compare-card" :style="{'--accent':c.team.accent}">
        <header><h3><a :href="teamPath(c.team)">{{c.team.name}} ↗</a></h3><span class="small muted">유지 {{c.counts.retained}} · 신규 {{c.counts.changed}} · 대기 {{c.counts.pending}}</span></header>
        <div class="bar" aria-hidden="true"><i class="retained" :style="{width:c.counts.retained*20+'%'}"/><i class="changed" :style="{width:c.counts.changed*20+'%'}"/><i class="pending" :style="{width:c.counts.pending*20+'%'}"/></div>
        <table><thead><tr><th scope="col">포지션</th><th scope="col">2026</th><th scope="col">2027</th><th scope="col">변화</th></tr></thead>
          <tbody><tr v-for="r in c.rows" :key="r.position"><th scope="row">{{r.position}}</th><td>{{r.before}}</td><td><strong>{{r.slot.player??'미정'}}</strong><small v-if="r.slot.extra">{{r.slot.extra}}</small><a class="report" v-if="showReports&&r.slot.report" :href="r.slot.report.url" target="_blank" rel="noopener noreferrer">{{r.slot.report.player}} · {{r.slot.report.level==='reported'?'보도':'전망'}} ↗</a></td><td><span class="mark" :class="r.change">{{CHANGE_LABEL[r.change]}}</span></td></tr></tbody>
        </table>
        <a :href="teamPath(c.team)" class="detail">2027 상세 로스터 →</a>
      </section>
    </div>
    <p v-if="!compared.length" class="panel muted" role="status">조건에 맞는 포지션이 없습니다.</p>
  </template>
  <section class="panel methodology">
    <h2>데이터 기준 및 출처</h2>
    <p>2026년 비교 기준은 각 팀의 마지막 공식 시리즈 마지막 경기 출전 선수입니다. 시즌 개막 명단이나 모든 등록 선수가 아닙니다. 2027년 로스터는 영입 발표 및 계약 확인 기준이며, 실제 선발을 예측하지 않습니다.</p>
    <p>타임라인에는 1군 선수의 날짜가 확인된 발표 중 선정된 항목만 수록하며, 이적설은 넣지 않습니다. 이전 팀이 확인되지 않은 영입은 출발 팀을 표시하지 않습니다. 수동 갱신 자료로 최신 발표와 다를 수 있습니다.</p>
    <p><a :href="BASELINE_SOURCE" target="_blank" rel="noopener noreferrer">2026 마지막 경기 로스터 및 계약 자료 ↗</a> · <a :href="TIMELINE_SOURCE" target="_blank" rel="noopener noreferrer">구단 공식 발표 취합 및 원문 링크 ↗</a></p>
    <a :href="timeline?LCK_COMPARE_PATH:LCK_TIMELINE_PATH" class="detail">{{timeline?'2026 → 2027 로스터 비교':'이적 타임라인'}} →</a>
  </section>
</article>
</template>
<style scoped>
.changes{max-width:1120px;margin:auto;display:grid;gap:16px}.crumb{font-size:12px;color:var(--muted)}.hero{padding:clamp(20px,4vw,36px);border:1px solid var(--border);border-radius:14px;background:linear-gradient(120deg,#192e32,#141b29)}.hero h1{font-size:clamp(25px,4vw,40px);margin:8px 0 12px;letter-spacing:-.05em}.hero p:not(.eyebrow){color:#bdc8d7;font-size:14px}.overview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.overview>div{padding:15px;border:1px solid var(--border);border-radius:10px;background:#141e2b}.overview span{font-size:12px;color:var(--muted);display:block}.overview b{font-size:28px;color:var(--mint);display:block;margin-top:6px}.note{margin:0;line-height:1.8}.filters{margin:0;display:flex;flex-wrap:wrap;gap:12px;align-items:end}.filters label{flex:1;min-width:140px;display:grid;gap:6px;font-size:12px;color:var(--muted)}.filters select,.filters input{min-height:44px;width:100%;padding:10px;border:1px solid #405165;border-radius:8px;background:#101a27;color:#ecf2f8;font:inherit}.section-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}.section-head h2{margin:0}.comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.compare-card{margin:0;min-width:0;border-top:3px solid var(--accent)}.compare-card header h3{margin:0 0 5px;font-size:17px}.bar{display:flex;height:6px;border-radius:4px;overflow:hidden;background:#293548;margin:12px 0}.bar i.retained{background:#50b996}.bar i.changed{background:#7099ed}.bar i.pending{background:#b49365}.compare-card table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;text-align:left}.compare-card th,.compare-card td{padding:10px 4px;border-bottom:1px solid var(--border);vertical-align:top;overflow-wrap:anywhere}.compare-card th{font-weight:500;color:var(--muted)}.compare-card th:first-child{width:15%}.compare-card th:last-child{width:22%}.compare-card td small,.report{display:block;font-size:10px;color:#aebed1;margin-top:5px;line-height:1.5}.report{color:#f2ca8f;text-decoration:underline}.mark{display:inline-block;font-size:10px;white-space:normal;padding:5px 7px;border-radius:5px;background:#283548;color:#c4d2df}.mark.retained,.mark.renewed{background:#183c33;color:#a0e1c7}.mark.changed,.mark.signed{background:#213652;color:#bed6ff}.mark.pending,.mark.departed{background:#3b3027;color:#f3d2a0}.detail,.source,.methodology a{color:var(--mint);font-size:12px;text-decoration:underline;text-underline-offset:3px}.detail{display:inline-block;margin-top:14px}.day h2{font-size:18px;margin:6px 0 10px}.day h2 small{font-size:12px;color:var(--muted);font-weight:400}.event-list{margin:0;padding:0 16px}.event{display:grid;grid-template-columns:100px minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid var(--border)}.event:last-child{border:0}.event .mark{justify-self:start}.flow{display:flex;align-items:center;flex-wrap:wrap;gap:8px;font-size:12px;margin-top:5px}.flow a{font-weight:700;color:var(--mint)}.methodology{margin:0}.methodology p{font-size:13px;line-height:1.8;color:#afbed0}@media(max-width:760px){.comparison{grid-template-columns:1fr}.overview{grid-template-columns:repeat(2,minmax(0,1fr))}.event{grid-template-columns:75px minmax(0,1fr);gap:7px}.event .source{grid-column:2}.compare-card{padding:12px}}
</style>
