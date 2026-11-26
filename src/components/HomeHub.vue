<script setup lang="ts">
import {HOME_TOOLS,HOME_ANALYSIS,HOME_LCK,HOME_HISTORY,HOME_SEASON,homeHubData} from '../data/homeHub';
const hub=homeHubData();
const toolMarks=['%','+','G'];
const archiveMetrics=[
 {value:hub.archive.first+'–'+hub.archive.last,label:'로스터 수록 연도'},
 {value:hub.archive.players+'명',label:'선수 이력 ID'},
 {value:hub.archive.events+'개',label:'완료 대회'},
];
</script>
<template>
<div class="home-hub">
 <section class="hub-section tools-section" aria-labelledby="home-tools-title">
  <header class="hub-heading"><div><p class="eyebrow">TFT · TOOLS</p><h2 id="home-tools-title">게임 중 바로 쓰는 계산기</h2></div><span class="hint">로그인 없이 이용</span></header>
  <div class="tool-grid">
   <a v-for="(item,i) in HOME_TOOLS" :key="item.href" class="tool-card" :href="item.href">
    <span class="tool-mark" :class="'mark-'+i" aria-hidden="true">{{toolMarks[i]}}</span>
    <div class="tool-copy"><h3>{{item.label}}</h3><p>{{item.description}}</p></div>
    <span class="arrow" aria-hidden="true">→</span>
   </a>
  </div>
 </section>
 <div class="feature-grid">
  <section class="hub-panel season-panel" aria-labelledby="home-season-title">
   <div class="hub-heading"><div><p class="eyebrow">TFT · SET 19</p><h2 id="home-season-title">시즌19 프리즘 투어</h2></div><span class="set-mark" aria-hidden="true">19</span></div>
   <p class="lead">신규 음악 특성부터 챔피언 해금 조건까지, 다음 시즌을 준비하는 가이드.</p>
   <div class="season-facts">
    <div><span>발표된 출시 예정일</span><strong>{{hub.season.release.replaceAll('-','.')}}</strong></div>
    <div><span>수록 해금 조건</span><strong>{{hub.season.unlockCount}}종</strong></div>
   </div>
   <div class="season-links"><a v-for="(item,i) in HOME_SEASON" :key="item.href" :href="item.href" :class="{main:i===1}">{{item.label}} <span aria-hidden="true">→</span></a></div>
   <p class="source-note">공식 발표·PBE 자료 구분 · PBE 확인 {{hub.season.pbeChecked}}</p>
  </section>
  <section class="hub-panel stove-panel" aria-labelledby="home-stove-title">
   <div class="hub-heading"><div><p class="eyebrow">LCK · OFFSEASON</p><h2 id="home-stove-title">2027 LCK 스토브리그</h2></div><a class="more" href="/esports/lck/2027/stove-league">전체 로스터 →</a></div>
   <div class="roster-stats">
    <div><strong>{{hub.roster.confirmed}}<small>/{{hub.roster.total}}</small></strong><span>확인된 포지션</span></div>
    <div><strong>{{hub.roster.complete}}<small>/{{hub.roster.teams}}</small></strong><span>구성 확인 팀</span></div>
    <div><strong>{{hub.roster.pending}}</strong><span>발표 대기</span></div>
   </div>
   <div class="progress" role="progressbar" aria-label="로스터 포지션 확인율" :aria-valuenow="hub.roster.confirmed" :aria-valuemax="hub.roster.total" :aria-valuemin="0"><span :style="{width:hub.roster.percent+'%'}"></span></div>
   <p class="source-note">구단 발표·계약 확인 기준 {{hub.roster.checked}} · 선발 확정과 다를 수 있습니다.</p>
   <div class="small-links"><a v-for="item in HOME_LCK.filter(i=>i.href!=='/esports/lck/2027/stove-league'&&i.href!=='/esports/lck/2027/timeline')" :key="item.href" :href="item.href">{{item.label}} <span aria-hidden="true">→</span></a></div>
  </section>
 </div>
 <div class="feature-grid news-history">
  <section class="hub-panel moves-panel" aria-labelledby="home-moves-title">
   <div class="hub-heading"><div><p class="eyebrow">LCK · TRANSFERS</p><h2 id="home-moves-title">최근 등록된 이적 소식</h2></div><a class="more" href="/esports/lck/2027/timeline">전체 타임라인 →</a></div>
   <div v-if="hub.moves.items.length" class="moves-list">
    <div v-for="move in hub.moves.items" :key="move.id" class="move-row">
     <time :datetime="move.date">{{move.date.slice(5).replace('-','.')}}</time>
     <div class="move-player"><strong>{{move.player}}</strong><small>{{move.position}}</small></div>
     <div class="move-team"><span v-if="move.kind==='signed'&&move.previousName" class="muted">{{move.previousName}} → </span><a :href="move.teamHref">{{move.teamName}}</a></div>
     <span class="move-kind" :class="move.kind">{{move.label}}</span>
    </div>
   </div>
   <p v-else class="source-note">등록된 이적 기록이 아직 없습니다.</p>
   <p class="source-note">사이트 수록 자료 {{hub.moves.checked}} 기준 · 실시간 뉴스가 아닙니다.</p>
  </section>
  <section class="hub-panel archive-panel" aria-labelledby="home-history-title">
   <div class="hub-heading"><div><p class="eyebrow">ESPORTS · ARCHIVE</p><h2 id="home-history-title">LCK 역사를 탐색하다</h2></div><span class="archive-mark" aria-hidden="true">LCK</span></div>
   <p class="lead">전설적인 팀의 로스터와 선수들의 소속팀 변화, 역대 국내 대회 성적을 찾아보세요.</p>
   <div class="archive-stats"><div v-for="m in archiveMetrics" :key="m.label"><strong>{{m.value}}</strong><span>{{m.label}}</span></div></div>
   <div class="archive-links"><a v-for="item in HOME_HISTORY" :key="item.href" :href="item.href"><div><strong>{{item.label}}</strong><small>{{item.description}}</small></div><span aria-hidden="true">→</span></a></div>
   <p class="source-note">{{hub.archive.rosters}}개 팀·시즌 기록 · 시점별 로스터 및 종료 대회 기준</p>
  </section>
 </div>
 <section class="hub-section analysis-section" aria-labelledby="home-analysis-title">
  <header class="hub-heading"><div><p class="eyebrow">TFT · STATS</p><h2 id="home-analysis-title">상위 랭커 데이터로 보는 메타</h2></div><a class="more" href="/meta">메타 통계 →</a></header>
  <div class="analysis-grid"><a v-for="item in HOME_ANALYSIS" :key="item.href" :href="item.href"><strong>{{item.label}}</strong><small>{{item.description}}</small><span aria-hidden="true">→</span></a></div>
  <p class="source-note">수집된 경기 표본을 기반으로 제공하며, 표본 수 및 집계 기준은 각 통계 페이지에서 확인할 수 있습니다.</p>
 </section>
</div>
</template>
<style scoped>
.home-hub{display:grid;gap:24px;margin:0 0 26px;min-width:0}
.hub-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.hub-heading h2{font-size:19px;letter-spacing:-.04em;margin:0;line-height:1.4}.hub-heading .eyebrow{margin:0 0 6px;color:#92bfb2;font-size:10px}
.hint,.source-note{font-size:11px;color:var(--muted);line-height:1.7}.hint{text-align:right;flex-shrink:0}.source-note{margin:12px 0 0}
.more{font-size:12px;color:var(--mint);text-align:right;flex:0 1 auto;overflow-wrap:anywhere;line-height:1.5}.hub-heading>div{min-width:0}
.tool-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.tool-card{display:flex;align-items:center;gap:13px;padding:17px 15px;min-height:95px;min-width:0;background:#141e2b;border:1px solid #303e50;border-radius:12px}
.tool-mark{width:46px;height:46px;flex:none;display:grid;place-items:center;border-radius:10px;background:#213d36;color:#a8ead0;font-size:25px;font-weight:800;letter-spacing:-.04em}
.mark-1{background:#352d45;color:#c9b6f3}.mark-2{background:#403927;color:#eed28d}
.tool-copy{min-width:0;flex:1}.tool-copy h3{margin:0 0 6px;font-size:15px;letter-spacing:-.03em;line-height:1.4}.tool-copy p{margin:0;color:#a7b5c9;font-size:12px;line-height:1.5}.arrow{color:#8da3b9;flex:none}
.feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:stretch}
.hub-panel{min-width:0;padding:22px;border:1px solid #303e50;border-radius:14px;background:#131c29}
.season-panel{background:radial-gradient(ellipse at 100% 0,#384064 0,transparent 60%),linear-gradient(135deg,#202e40,#141d2a)}
.stove-panel{background:linear-gradient(140deg,#1c3335,#141d2a 70%)}
.set-mark{display:grid;place-items:center;font-size:26px;font-weight:800;width:52px;height:52px;flex:none;border:1px solid #696b99;border-radius:12px;color:#dbd2ff;background:#33324e;letter-spacing:-.08em}
.lead{font-size:13px;color:#b8c6d8;margin:0 0 15px;line-height:1.8}
.season-facts,.roster-stats,.archive-stats{display:grid;gap:9px;grid-template-columns:repeat(2,minmax(0,1fr));margin:10px 0 15px}
.season-facts>div,.roster-stats>div,.archive-stats>div{min-width:0;padding:11px 12px;background:#111a27b0;border:1px solid #344354;border-radius:8px;display:flex;flex-direction:column;gap:5px}
.season-facts span,.roster-stats span,.archive-stats span{color:#a6b5c8;font-size:11px;line-height:1.5}
.season-facts strong,.roster-stats strong,.archive-stats strong{color:#e7eff8;font-size:clamp(17px,2vw,25px);letter-spacing:-.04em;line-height:1.3;overflow-wrap:anywhere}
.roster-stats,.archive-stats{grid-template-columns:repeat(3,minmax(0,1fr))}
.roster-stats strong{color:#a3e9d1}.roster-stats small{font-size:13px;color:#aabacb}
.progress{height:7px;background:#263b43;border-radius:10px;overflow:hidden}.progress span{display:block;height:100%;background:var(--mint);border-radius:10px}
.season-links,.small-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.season-links a,.small-links a{display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:8px 12px;border:1px solid #40536a;border-radius:8px;font-size:12px;color:#d2dce8}
.season-links a.main{background:#8ee2c3;color:#14332a;border-color:#8ee2c3;font-weight:700}
.moves-list{margin-top:8px}.move-row{display:grid;grid-template-columns:38px minmax(74px,1fr) minmax(70px,1fr) auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #293644;font-size:12px}
.move-row time{color:#93a4b9;font-variant-numeric:tabular-nums}.move-player{min-width:0}.move-player strong{display:block;overflow-wrap:anywhere;font-size:13px}.move-player small{display:block;color:var(--muted);font-size:11px}.move-team{min-width:0;overflow-wrap:anywhere}.move-team a{color:#c9e8e1;font-weight:600}
.move-kind{font-size:10px;border:1px solid #3c4658;border-radius:5px;padding:4px 6px;color:#c3cddd;max-width:100%;overflow-wrap:anywhere;text-align:center}.move-kind.signed{border-color:#365b4d;color:#a5e4ca}.move-kind.renewed{border-color:#45627d;color:#bad7f4}.move-kind.departed{border-color:#5a4942;color:#e4b6a5}
.archive-panel{background:linear-gradient(150deg,#222b3d,#141d2a 70%)}.archive-mark{font-size:12px;font-weight:800;color:#d6c28f;border:1px solid #5d5541;border-radius:8px;padding:10px}
.archive-stats strong{font-size:clamp(16px,1.7vw,22px);color:#e9d9ab;overflow-wrap:anywhere}.archive-stats>div:first-child strong{font-size:clamp(12px,1.6vw,19px)}
.archive-links{display:grid;gap:6px}.archive-links a{min-height:47px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;background:#111b29;border:1px solid #324053;border-radius:7px}.archive-links strong,.archive-links small{display:block}.archive-links strong{font-size:13px}.archive-links small{font-size:11px;color:#9fadc1;margin-top:3px}.archive-links a>span{color:var(--mint)}
.analysis-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.analysis-grid a{min-height:82px;min-width:0;position:relative;padding:13px 26px 13px 13px;border:1px solid #303e50;border-radius:10px;background:#141e2b;display:flex;flex-direction:column;gap:7px}.analysis-grid strong{font-size:14px}.analysis-grid small{font-size:11px;color:#a6b5c8;line-height:1.5}.analysis-grid a>span{position:absolute;right:10px;top:13px;color:var(--mint)}
.home-hub a:hover{border-color:#719e90;color:var(--mint)}.season-links a.main:hover{color:#14332a;background:#b5f1da}.more:hover,.move-team a:hover{text-decoration:underline}
@media(max-width:1000px){.tool-card{gap:9px;padding:13px}.tool-mark{width:40px;height:40px}.hub-panel{padding:17px}.move-row{gap:6px}}
@media(max-width:760px){.home-hub{gap:20px}.feature-grid{grid-template-columns:1fr;gap:12px}.tool-grid{grid-template-columns:1fr;gap:8px}.tool-card{min-height:70px;padding:12px}.tool-mark{width:42px;height:42px}.tool-copy h3{font-size:14px;margin-bottom:4px}.analysis-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hub-heading h2{font-size:17px}.hub-panel{padding:16px}.move-row{grid-template-columns:34px minmax(0,1fr) minmax(0,1fr) minmax(32px,64px)}.roster-stats>div,.archive-stats>div,.season-facts>div{padding:10px 8px}.more{font-size:11px}}
@media(max-width:340px){.hint{display:none}.hub-heading{align-items:flex-start}.move-row{gap:4px;font-size:11px}.move-kind{padding:3px;font-size:9px}.hub-panel{padding:12px}}
</style>
