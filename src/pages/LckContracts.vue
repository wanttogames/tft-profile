<script setup lang="ts">
import { computed, ref } from 'vue';
import LckGcdPanel from '../components/LckGcdPanel.vue';
import { TEAMS, POSITIONS, LCK_STOVE_PATH, teamPath, STATUS_LABEL } from '../data/lck2027';
import { LCK_FA_PATH, LCK_CONTRACTS_PATH, CONTRACTS_CHECKED, GCD_SNAPSHOT, CONTRACT_SOURCES, PRECISION_LABEL, CONTRACT_YEARS, MARKET_ROWS, filterContracts, filterMarket, contractSummary, termLabel, teamForContract } from '../data/lckContracts';
import LckChangesNav from '../components/LckChangesNav.vue';
const props=defineProps<{path:string}>();
const isMarket=computed(()=>props.path===LCK_FA_PATH);
const query=ref(''),team=ref('all'),position=ref('all'),period=ref('all'),status=ref('all');
const showReports=ref(true);
const contracts=computed(()=>filterContracts(query.value,team.value,position.value,period.value));
const market=computed(()=>filterMarket(query.value,team.value,position.value,status.value));
const summary=contractSummary();
const departures=MARKET_ROWS.filter(r=>r.status==='departed').length;
const yearCounts=CONTRACT_YEARS.map(year=>({year,count:filterContracts('','all','all',year).length}));
function teamHref(slug:string){const t=teamForContract(slug);return t?teamPath(t):LCK_STOVE_PATH;}
function teamName(slug:string){return teamForContract(slug)?.name??slug;}
function reset(){query.value='';team.value='all';position.value='all';period.value='all';status.value='all';showReports.value=true;}
</script>
<template>
<article class="contracts">
  <nav class="crumb" aria-label="현재 위치"><a href="/">홈</a> / <a :href="LCK_STOVE_PATH">LCK 스토브리그</a> / {{isMarket?'FA 시장':'계약 만료일'}}</nav>
  <header class="hero">
    <p class="eyebrow">LCK · OFFSEASON 2027</p>
    <h1>{{isMarket?'2027 LCK FA 선수 현황':'LCK 선수 계약 만료일 도감'}}</h1>
    <p>{{isMarket?'결별을 발표한 선수와 차기 소속이 확인되지 않은 선수의 포지션, 이전 팀, 미확정 이적 보도를 확인하세요.':'현재 확인된 1군 선수의 계약 기간을 2027·2028·2029년 및 미확인으로 검색하세요.'}}</p>
    <span class="small muted">{{CONTRACTS_CHECKED}} KST 수동 명단 기준 · GCD 별도 동기화</span>
  </header>
  <LckChangesNav :path="path"/>
  <LckGcdPanel :compact="isMarket"/>
  <div class="overview" v-if="isMarket">
    <div><span>추적 대상</span><b>{{MARKET_ROWS.length}}명</b></div>
    <div><span>결별 발표 확인</span><b>{{departures}}명</b></div>
    <div><span>거취 발표 대기</span><b>{{MARKET_ROWS.length-departures}}명</b></div>
  </div>
  <div class="overview" v-else>
    <div><span>확인된 1군 선수</span><b>{{summary.total}}명</b></div>
    <div><span>정확한 종료일</span><b>{{summary.exact}}명</b></div>
    <div><span>연도·월·시즌 확인</span><b>{{summary.partial}}명</b></div>
    <div><span>기간 미확인</span><b>{{summary.unknown}}명</b></div>
  </div>
  <p class="small muted note">{{isMarket?'이 명단은 확인한 LCK 1군 시장 자료의 일부입니다. 결별 발표는 전 소속과의 계약 종료를 뜻하며 다른 리그·팀과 미계약 상태임을 보장하지 않습니다. 보도는 영입 확정이 아닙니다.':'계약 종료일은 GCD '+GCD_SNAPSHOT+' 및 기존 수동 자료를 사용합니다. 수동 기준보다 오래된 GCD는 기존 계약 정보를 덮어쓰지 않으며, 동일 소속·선수의 유효한 종료일만 자동 반영합니다. 시즌 계약도 정확한 종료일과 구분합니다.'}}</p>
  <section v-if="!isMarket" class="panel years" aria-label="계약 연도별 조회">
    <h2>연도별 확인 현황</h2>
    <div class="year-buttons">
      <button v-for="y in yearCounts" :key="y.year" type="button" :aria-pressed="period===y.year" @click="period=period===y.year?'all':y.year"><b>{{y.year}}</b><span>{{y.count}}명</span></button>
      <button type="button" :aria-pressed="period==='unknown'" @click="period=period==='unknown'?'all':'unknown'"><b>미확인</b><span>{{summary.unknown}}명</span></button>
    </div>
    <p class="small muted">표시 연도는 계약 종료일·공개 기간 또는 시즌 기준입니다. 해당 연도에 FA가 된다는 의미는 아닙니다.</p>
  </section>
  <section class="panel filters" aria-label="선수 검색 및 필터">
    <label>선수·팀 검색<input v-model="query" type="search" placeholder="Faker, 페이커, T1…"/></label>
    <label>{{isMarket?'이전 팀':'소속팀'}}<select v-model="team"><option value="all">전체 팀</option><option v-for="t in TEAMS" :key="t.slug" :value="t.slug">{{t.name}}</option></select></label>
    <label>포지션<select v-model="position"><option value="all">전체 포지션</option><option v-for="p in POSITIONS" :key="p" :value="p">{{p}}</option></select></label>
    <label v-if="isMarket">확인 상태<select v-model="status"><option value="all">전체</option><option value="departed">결별 발표</option><option value="awaiting">거취 발표 대기</option></select></label>
    <label v-else>계약 연도·시즌<select v-model="period"><option value="all">전체</option><option v-for="y in CONTRACT_YEARS" :key="y" :value="y">{{y}}년</option><option value="unknown">기간 미확인</option></select></label>
    <button type="button" class="secondary" @click="reset">초기화</button>
  </section>
  <div class="results-head"><p class="small muted" aria-live="polite">{{isMarket?market.length:contracts.length}}명 표시</p><label v-if="isMarket" class="small muted"><input type="checkbox" v-model="showReports"/> 미확정 전망 표시</label></div>
  <section v-if="isMarket" class="market-grid">
    <section v-for="r in market" :key="r.player" class="panel market-card">
      <header><strong>{{r.player}}</strong><span class="small muted">{{r.position}}</span></header>
      <p><a :href="teamHref(r.team)">{{teamName(r.team)}}</a> <span class="muted">이전 소속</span></p>
      <span class="tag" :class="r.status">{{r.status==='departed'?'결별 확인':'거취 발표 대기'}}</span>
      <div v-if="showReports&&r.reports.length" class="reports">
        <p v-for="item in r.reports" :key="item.team"><a :href="item.report.url" target="_blank" rel="noopener noreferrer">{{teamName(item.team)}} · {{item.report.level==='reported'?'이적 보도':'미확정 전망'}} ↗</a></p>
      </div>
      <a class="source" :href="CONTRACT_SOURCES[r.source].url" target="_blank" rel="noopener noreferrer">확인 출처 ↗</a>
    </section>
  </section>
  <div v-else class="panel table-wrap">
    <table><thead><tr><th scope="col">선수</th><th scope="col">소속·포지션</th><th scope="col">확인된 기간</th><th scope="col">확인 기준</th></tr></thead>
      <tbody><tr v-for="r in contracts" :key="r.team+':'+r.player"><th scope="row"><strong>{{r.player}}</strong><small>{{STATUS_LABEL[r.status]}}</small></th><td><a :href="teamHref(r.team)">{{teamName(r.team)}}</a><small>{{r.position}}</small></td><td><strong>{{termLabel(r.term)}}</strong></td><td><span class="tag" :class="r.term?'known':'unknown'">{{PRECISION_LABEL[r.term?.precision??'unknown']}}</span><a v-if="r.term" class="source" :href="CONTRACT_SOURCES[r.term.source].url" target="_blank" rel="noopener noreferrer">출처 ↗</a><a v-else class="source" :href="CONTRACT_SOURCES.roster.url" target="_blank" rel="noopener noreferrer">로스터 확인 ↗</a></td></tr></tbody>
    </table>
  </div>
  <p v-if="isMarket?!market.length:!contracts.length" class="panel muted" role="status">검색 조건과 일치하는 선수가 없습니다.</p>
  <section class="panel method">
    <h2>FA 및 계약 기간 확인 기준</h2>
    <p>FA는 자유계약 신분을 의미하지만, 계약 종료 발표 후 다음 소속을 확인하지 못했다고 해서 실제로 모든 팀과 미계약인 것은 아닙니다. 이 페이지에서는 확인된 계약 종료와 다음 소속 미확인을 구분하며, 이적 보도는 참고용입니다.</p>
    <p>GCD는 Riot의 공식 등록 계약 명부입니다. 이 페이지에서는 날짜가 확인된 GCD 스냅샷을 사용하며, 이후 구단 발표 및 계약 기간 보조 자료와 교차 확인합니다. 2027 시즌 계약 발표만 있는 경우 정확한 종료일을 추정하지 않습니다. 기존 팀의 종료일을 신규 소속에 옮겨 사용하지 않습니다.</p>
    <p>로스터 도감은 50개 포지션 중 발표·계약 확인 선수와 별도로 확인된 복수 포지션 선수를 포함한 정적 1군 자료입니다. 전체 등록 명단이나 모든 FA 선수를 실시간으로 집계하지 않습니다.</p>
    <h3>원문 및 확인 자료</h3>
    <ul><li v-for="s in CONTRACT_SOURCES" :key="s.url"><a :href="s.url" target="_blank" rel="noopener noreferrer">{{s.label}} ↗</a></li></ul>
    <a class="source" :href="isMarket?LCK_CONTRACTS_PATH:LCK_FA_PATH">{{isMarket?'선수 계약 만료일 도감':'FA 선수 현황'}} →</a>
  </section>
</article>
</template>
<style scoped>
.contracts{max-width:1120px;margin:auto;display:grid;gap:16px}.crumb{font-size:12px;color:var(--muted)}.hero{padding:clamp(20px,4vw,36px);border:1px solid var(--border);border-radius:14px;background:linear-gradient(120deg,#192e32,#141b29)}.hero h1{font-size:clamp(25px,4vw,40px);margin:8px 0 12px;letter-spacing:-.05em}.hero p:not(.eyebrow){color:#bdc8d7;font-size:14px}.overview{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}.overview>div{padding:15px;border:1px solid var(--border);border-radius:10px;background:#141e2b}.overview span{font-size:12px;color:var(--muted);display:block}.overview b{font-size:28px;color:var(--mint);display:block;margin-top:6px}.note{margin:0;line-height:1.8}.years,.filters,.method{margin:0}.year-buttons{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.year-buttons button{display:grid;gap:5px;min-height:64px;background:#101a27;border:1px solid #405165;border-radius:8px;color:#e4ebf4;cursor:pointer}.year-buttons button[aria-pressed=true]{border-color:var(--mint);background:#19332d;color:var(--mint)}.year-buttons span{font-size:12px;color:var(--muted)}.filters{display:flex;flex-wrap:wrap;gap:12px;align-items:end}.filters label{flex:1;min-width:125px;display:grid;gap:6px;font-size:12px;color:var(--muted)}.filters select,.filters input{min-height:44px;width:100%;padding:10px;border:1px solid #405165;border-radius:8px;background:#101a27;color:#ecf2f8;font:inherit}.results-head{display:flex;justify-content:space-between;align-items:center;gap:10px}.results-head p{margin:0}.market-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.market-card{margin:0;min-width:0}.market-card header{display:flex;align-items:center;justify-content:space-between;gap:8px}.market-card header strong{font-size:18px}.market-card p{font-size:13px;margin:10px 0;overflow-wrap:anywhere}.market-card a,.table-wrap td a,.method a{color:var(--mint)}.reports{color:#f2ca8f;margin:8px 0}.reports a{color:#f2ca8f;text-decoration:underline}.tag{display:inline-block;padding:5px 8px;background:#263548;color:#bfccda;border-radius:5px;font-size:11px}.tag.departed{background:#3b3027;color:#f3d2a0}.tag.known{background:#183c33;color:#a0e1c7}.source{font-size:11px;display:block;color:var(--mint);margin-top:9px;text-decoration:underline}.table-wrap{margin:0;overflow:auto}.table-wrap table{border-collapse:collapse;width:100%;text-align:left;font-size:13px;min-width:440px}.table-wrap th,.table-wrap td{padding:12px 8px;border-bottom:1px solid var(--border);vertical-align:top}.table-wrap thead{color:var(--muted)}.table-wrap small{display:block;font-size:11px;color:var(--muted);margin-top:5px}.method p,.method li{font-size:13px;line-height:1.8;color:#afbed0}.method a{text-decoration:underline}@media(max-width:760px){.market-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.overview{grid-template-columns:repeat(2,minmax(0,1fr))}.year-buttons{grid-template-columns:repeat(2,minmax(0,1fr))}.table-wrap{padding:8px}}@media(max-width:400px){.market-grid{grid-template-columns:1fr}}
</style>
