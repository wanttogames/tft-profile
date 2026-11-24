<script setup lang="ts">
import { computed, ref } from 'vue';
import LckChangesNav from '../components/LckChangesNav.vue';
import { lookupTerm, termLabel, LCK_CONTRACTS_PATH } from '../data/lckContracts';
import { compareTeam, CHANGE_LABEL } from '../data/lckChanges';
import { TEAMS, POSITIONS, SOURCES, STATUS_LABEL, LCK_STOVE_PATH, LCK_CHECKED, teamPath, findTeam, countConfirmed, rosterSummary, type Team } from '../data/lck2027';
const props = defineProps<{ path: string }>();
const team = computed(() => findTeam(props.path));
const search = ref('');
const filter = ref<'all' | 'complete' | 'pending' | 'reports'>('all');
const showReports = ref(true);
const summary = rosterSummary();
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  return TEAMS.filter(t => {
    if (filter.value === 'complete' && countConfirmed(t) !== 5) return false;
    if (filter.value === 'pending' && countConfirmed(t) === 5) return false;
    if (filter.value === 'reports' && !t.slots.some(s => s.report)) return false;
    return !query || [t.code,t.name,t.slug,...t.slots.flatMap(s=>[s.player||'',s.extra||'',s.report?.player||''])].some(v=>v.toLowerCase().includes(query));
  });
});
const cards = computed(() => team.value ? [team.value] : filtered.value);
const sources = computed(() => [...(team.value?.sources ?? []), ...SOURCES]);
function reset(){search.value='';filter.value='all';showReports.value=true;}
function progress(t: Team){return countConfirmed(t) * 20 + '%';}
</script>
<template>
<article class="stove">
  <nav class="crumb" aria-label="현재 위치"><a href="/">홈</a><span>/</span><a :href="LCK_STOVE_PATH">LCK 스토브리그</a><template v-if="team"><span>/</span><span>{{team.code}}</span></template></nav>
  <header class="hero">
    <div><p class="eyebrow">LEAGUE OF LEGENDS · OFFSEASON 2027</p>
      <h1>{{team ? '2027 '+team.name+' 로스터' : '2027 LCK 스토브리그'}}</h1>
      <p>{{team ? team.note : 'LCK 10개 팀의 2027 시즌 선수 구성과 공식 발표, 계약 유지 및 미확정 이적 전망을 한눈에 비교하세요.'}}</p>
      <div class="snapshot"><span class="dot"></span> {{LCK_CHECKED}} KST 확인 · 수동 갱신</div>
    </div>
    <div class="hero-mark" aria-hidden="true">{{team?.code ?? 'LCK'}}<small>2027</small></div>
  </header>
  <LckChangesNav :path="path"/>
  <div class="stove-stats" v-if="!team">
    <div><span>참가 팀</span><b>{{summary.teams}}<small>팀</small></b></div>
    <div><span>공식 발표·계약 확인</span><b>{{summary.confirmed}}<small>/ {{summary.total}}자리</small></b></div>
    <div><span>5개 포지션 확인</span><b>{{summary.complete}}<small>팀</small></b></div>
    <div><span>공식 확인 대기</span><b>{{summary.total-summary.confirmed}}<small>자리</small></b></div>
  </div>
  <p class="notice small">계약이 남아 있는 선수도 이적할 수 있습니다. 포지션 확인 수는 등록 또는 발표·계약 확인 기준이며, 시즌 개막 선발 확정이나 스토브리그 종료를 뜻하지 않습니다.</p>
  <nav class="team-nav" aria-label="팀별 로스터">
    <a :href="LCK_STOVE_PATH" :aria-current="!team?'page':undefined">전체</a>
    <a v-for="t in TEAMS" :key="t.slug" :href="teamPath(t)" :aria-current="team?.slug===t.slug?'page':undefined">{{t.code}}</a>
  </nav>
  <section class="panel controls" v-if="!team" aria-label="로스터 검색 및 필터">
    <div class="control-row">
      <label>팀·선수 검색<input v-model="search" type="search" placeholder="T1, Faker, 젠지..." /></label>
      <label>확인 상태<select v-model="filter"><option value="all">전체 팀</option><option value="complete">5개 포지션 확인</option><option value="pending">발표 대기 포함</option><option value="reports">미확정 전망 포함</option></select></label>
      <button class="secondary" type="button" @click="reset">초기화</button>
    </div>
    <p class="small muted" aria-live="polite">{{filtered.length}}개 팀 표시</p>
  </section>
  <div class="section-head"><h2>{{team?'포지션별 구성':'팀별 로스터'}}</h2><label class="report-toggle"><input type="checkbox" v-model="showReports" /> 미확정 전망 표시</label></div>
  <div class="roster-grid" :class="{single:team}">
    <section v-for="t in cards" :key="t.slug" class="panel team-card" :style="{'--team-accent':t.accent}">
      <header class="team-head">
        <div class="team-mark" aria-hidden="true">{{t.code}}</div>
        <div class="team-title"><h2><a v-if="!team" :href="teamPath(t)">{{t.name}} <span aria-hidden="true">↗</span></a><template v-else>{{t.name}}</template></h2><span class="small muted">발표·계약 확인 {{countConfirmed(t)}} / 5</span></div>
      </header>
      <div class="progress" aria-hidden="true"><i :style="{width:progress(t)}"></i></div>
      <div class="slots">
        <div v-for="(s,i) in t.slots" :key="POSITIONS[i]" class="slot">
          <span class="role">{{POSITIONS[i]}}</span>
          <div class="player">
            <strong>{{s.player ?? '미정'}}</strong>
            <small v-if="s.extra" class="muted">{{s.extra}}</small>
            <small v-if="s.player" class="muted">계약: {{termLabel(lookupTerm(t.slug,s.player))}}</small>
            <a v-if="showReports && s.report" :href="s.report.url" target="_blank" rel="noopener noreferrer" class="report">{{s.report.level==='reported'?'이적 보도':'미확정 전망'}} · {{s.report.player}} ↗</a>
          </div>
          <span class="status" :class="s.status">{{STATUS_LABEL[s.status]}}</span>
        </div>
      </div>
      <section v-if="team" class="team-note"><h3>2026 → 2027 포지션 변화</h3><p v-for="r in compareTeam(t)" :key="r.position">{{r.position}} · {{r.before}} → {{r.slot.player ?? '미정'}} ({{CHANGE_LABEL[r.change]}})</p></section>
      <p class="team-note">{{t.note}}</p>
      <a v-if="team" class="detail" :href="LCK_CONTRACTS_PATH">계약 만료일 도감 →</a>
      <a v-if="!team" class="detail" :href="teamPath(t)">팀 상세 로스터 →</a>
    </section>
  </div>
  <p v-if="!cards.length" class="panel muted" role="status">검색 조건과 일치하는 팀이 없습니다. 검색어를 변경하거나 초기화해 주세요.</p>
  <section class="panel guide">
    <h2>2027 LCK 로스터는 어떻게 확인하나요?</h2>
    <dl><dt>영입·재계약 발표</dt><dd>구단 발표를 취합한 자료나 발표 보도에서 확인한 선수입니다.</dd><dt>계약 유지</dt><dd>차기 시즌까지 계약이 남아 있는 선수입니다. 이적이나 선발 변경 가능성이 있습니다.</dd><dt>이적 보도 / 미확정 전망</dt><dd>전문 매체의 합류 보도 또는 이적 전망입니다. 구단 발표와 다르며 공식 확인 수에 포함하지 않습니다.</dd><dt>발표 대기</dt><dd>이 페이지의 확인 시점까지 공식 영입 또는 계약을 확인하지 못한 포지션입니다.</dd></dl>
    <h3>2027 LCK 스토브리그가 끝났나요?</h3><p>아직 확인 대기인 포지션이 있습니다. 로스터 발표 이후에도 계약 변동과 대회 등록에 따라 구성이 달라질 수 있습니다. 이 페이지는 {{LCK_CHECKED}} 기준 수동 확인 자료이며 실시간 자동 갱신이나 공식 등록 명단이 아닙니다.</p>
    <h3>데이터 출처</h3><p>공식 발표 취합 자료를 교차 확인하고 이적 보도는 별도로 표시했습니다. 팀별 정보는 원문 링크에서 추가 확인할 수 있습니다.</p>
    <ul class="sources"><li v-for="s in sources" :key="s.url"><a :href="s.url" target="_blank" rel="noopener noreferrer">{{s.label}} ↗</a></li></ul>
    <p class="small muted">팀명·선수명은 식별 목적으로 사용합니다. TFT Profile은 Riot Games 또는 LCK 및 참가 팀의 공식 서비스가 아닙니다.</p>
    <a v-if="team" :href="LCK_STOVE_PATH" class="detail">← 전체 스토브리그 현황</a>
  </section>
</article>
</template>
<style scoped>
.stove{max-width:1120px;margin:0 auto;display:grid;gap:18px}.crumb{display:flex;flex-wrap:wrap;gap:8px;color:var(--muted);font-size:12px}.crumb a:hover,.detail:hover{text-decoration:underline}.hero{display:flex;align-items:center;justify-content:space-between;gap:24px;border:1px solid var(--border);border-radius:16px;padding:clamp(20px,4vw,36px);background:linear-gradient(120deg,#192e32,#141b29 70%)}.hero h1{font-size:clamp(26px,4.2vw,42px);letter-spacing:-.055em;margin:8px 0 12px}.hero p:not(.eyebrow){color:#bdc8d7;max-width:720px;font-size:14px;margin-bottom:18px}.snapshot{display:flex;gap:8px;align-items:center;color:#b5d9ca;font-size:12px}.dot{width:8px;height:8px;background:var(--mint);border-radius:50%;display:inline-block}.hero-mark{font-size:clamp(36px,7vw,80px);font-weight:800;letter-spacing:-.08em;text-align:center;color:#91b9af;min-width:100px;line-height:1}.hero-mark small{display:block;font-size:17px;letter-spacing:.2em;margin-top:12px;color:#8396a8}.stove-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.stove-stats>div{border:1px solid var(--border);background:#141e2b;border-radius:10px;padding:16px}.stove-stats span{display:block;color:var(--muted);font-size:12px}.stove-stats b{display:block;color:var(--mint);font-size:clamp(24px,3vw,32px);margin-top:8px}.stove-stats small{font-size:12px;margin-left:5px;color:#bac6d6}.notice{margin:0;line-height:1.8}.team-nav{display:flex;gap:6px;flex-wrap:wrap}.team-nav a{border:1px solid var(--border);border-radius:7px;padding:10px 14px;font-size:12px;font-weight:700;color:#b5c5d5}.team-nav a[aria-current=page]{color:var(--mint);border-color:var(--mint);background:#19332d}.controls{margin:0}.control-row{display:flex;gap:12px;align-items:end;flex-wrap:wrap}.control-row label{display:grid;gap:6px;flex:1;min-width:140px;font-size:12px;color:var(--muted)}.control-row input,.control-row select{width:100%;background:#101a27;color:#ecf2f8;border:1px solid #405165;border-radius:8px;padding:11px;min-height:44px;font:inherit}.controls p{margin:10px 0 0}.section-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin:0}.section-head h2{margin:0}.report-toggle{font-size:12px;color:#b6c4d5;display:flex;align-items:center;gap:6px}.report-toggle input{accent-color:var(--mint)}.roster-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.roster-grid.single{grid-template-columns:1fr}.team-card{margin:0;min-width:0;border-top:3px solid var(--team-accent)}.team-head{display:flex;gap:12px;align-items:center}.team-mark{background:#101a28;border:1px solid var(--team-accent);color:var(--team-accent);border-radius:9px;min-width:52px;height:48px;display:grid;place-items:center;font-weight:800;font-size:16px;padding:5px}.team-title{min-width:0}.team-title h2{margin:0 0 4px;font-size:18px}.team-title h2 span{font-size:12px;color:var(--muted)}.progress{height:5px;background:#293548;border-radius:8px;overflow:hidden;margin:14px 0}.progress i{display:block;background:var(--team-accent);height:100%}.slot{display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:start;gap:8px;border-bottom:1px solid var(--border);padding:11px 0;min-height:48px}.role{color:var(--muted);font-size:12px;padding-top:3px}.player{display:grid;gap:4px;min-width:0;overflow-wrap:anywhere}.player strong{font-size:15px}.player small{font-size:11px;line-height:1.5}.status{font-size:10px;white-space:nowrap;padding:5px 7px;border-radius:5px;background:#263548;color:#bccad7}.status.signed,.status.renewed{background:#183c33;color:#a0e1c7}.status.pending{background:#3b3027;color:#f3d2a0}.report{font-size:11px;color:#f2ca8f;line-height:1.5;text-decoration:underline;text-underline-offset:3px}.team-note{font-size:13px;color:#aebed1;margin:14px 0 8px;line-height:1.8}.detail{display:inline-block;color:var(--mint);font-size:13px;padding:6px 0}.guide{margin:0}.guide dt{font-weight:700;font-size:13px;margin:12px 0 4px}.guide dd{margin:0;color:#afbed0;font-size:13px;line-height:1.7}.guide p{color:#afbed0;font-size:13px}.sources{padding-left:18px;font-size:13px;line-height:1.9;color:var(--mint)}.sources a{text-decoration:underline;text-underline-offset:3px}@media(max-width:760px){.roster-grid{grid-template-columns:1fr}.stove-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.hero-mark{display:none}.team-nav a{padding:9px 12px}.team-card{padding:16px}.section-head{flex-wrap:wrap}}
</style>
