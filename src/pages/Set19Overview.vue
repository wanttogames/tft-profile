<script setup lang="ts">
import { SET19_FEATURED_SLUGS, SET19_GUIDES, SET19_TRAITS, SET19_RIOT_SOURCE, findSet19Unlock } from '../content/set19';
const featured=SET19_FEATURED_SLUGS.map(slug=>findSet19Unlock(slug)).filter((value):value is NonNullable<typeof value>=>!!value);
</script>
<template>
<article class="tour-page">
  <nav class="tour-crumb" aria-label="현재 위치"><a href="/">홈</a><span>/</span><span>시즌19</span></nav>
  <header class="tour-hero">
    <p class="eyebrow">SET 19 · PRISMATIC TOUR</p>
    <h1>롤토체스 시즌19 프리즘 투어 총정리</h1>
    <p class="tour-lead">시즌19 출시일, 신규 시스템, 음악 특성과 챔피언 해금 조건을 한 번에 확인하세요. 공개 발표와 테스트 서버 자료를 구분해 안내합니다.</p>
    <div class="tour-facts" aria-label="시즌 핵심 정보">
      <div><small>한국 서버 출시 예정</small><strong>2026.12.02</strong><span>패치 19.1</span></div>
      <div><small>전체 챔피언</small><strong>94종</strong><span>Riot 공식 발표</span></div>
      <div><small>해금 챔피언</small><strong>32종</strong><span>게임 내 조건 달성</span></div>
    </div>
    <div class="tour-cta">
      <a class="tour-main-link" href="/set19/unlocks">32종 해금 조건 확인 →</a>
      <a href="/set19/readiness">시즌19 전환 상태 →</a>
      <a href="#tour-features">시즌19 핵심 변경점</a>
    </div>
  </header>

  <section class="panel" id="tour-features">
    <p class="eyebrow">WHAT'S NEW</p><h2>시즌19 핵심 변경점</h2>
    <div class="tour-feature-grid">
      <div><span class="tour-n">01</span><h3>챔피언 해금 퀘스트</h3><p>일부 유닛은 전투 중 요구 조건을 달성해야 해금됩니다. 해금 성공 후 다음 상점에서 해당 챔피언을 확인할 수 있습니다. 해금하지 않은 유닛은 일반 상점에 나타나지 않습니다.</p></div>
      <div><span class="tour-n">02</span><h3>프리즘 퀘스트</h3><p>희귀한 증강을 통해 특성별 프리즘 퀘스트를 얻고, 조건을 완수하면 프리즘 단계의 시너지를 달성합니다. 세부 과제는 게임에서 확인하도록 설계됐습니다.</p></div>
      <div><span class="tour-n">03</span><h3>음악이 달라지는 전장</h3><p>서로 다른 밴드와 음악 특성을 조합하면 전투 중 배경 음악이 함께 변화합니다. K/DA, 펜타킬, HEARTSTEEL, TRUE DAMAGE 같은 테마가 중심입니다.</p></div>
    </div>
  </section>
  <section class="panel">
    <div class="tour-section-head"><div><p class="eyebrow">MUSIC TRAITS</p><h2>시즌19 주요 특성 미리 보기</h2></div><a href="/set19/unlocks">해금 도감 보기 →</a></div>
    <div class="tour-traits">
      <div v-for="trait in SET19_TRAITS" :key="trait.name" class="tour-trait">
        <strong>{{ trait.name }}</strong><p>{{ trait.summary }}</p>
      </div>
    </div>
    <p class="small muted">주요 음악 특성만 발췌했습니다. 세부 수치와 구성은 정식 출시 패치에서 변경될 수 있습니다.</p>
  </section>
  <section class="panel">
    <div class="tour-section-head"><div><p class="eyebrow">UNLOCK GUIDES</p><h2>먼저 찾아보는 해금 조건</h2></div><a href="/set19/unlocks">전체 32종 보기 →</a></div>
    <div class="tour-guides">
      <a v-for="entry in featured" :key="entry.slug" class="tour-guide" :href="'/set19/unlocks/'+entry.slug">
        <span>{{ entry.cost }}코스트 · {{ entry.status==='official'?'공식 발표':'PBE 임시 정보' }}</span>
        <strong>{{ entry.name }}</strong>
        <small>{{ SET19_GUIDES[entry.slug]?.intent }}</small>
      </a>
    </div>
  </section>
  <section class="tour-editorial">
    <h2>시즌19은 언제 시작하나요?</h2>
    <p>Riot Games는 프리즘 투어가 <strong>2026년 12월 2일</strong> 정식 출시될 예정이라고 발표했습니다. 현재 11월 21일 기준 정식 서버 시즌19이 아니라 PBE 테스트 단계입니다. 시즌19 덱 승률, 평균 등수, 아이템 통계 등 정식 서버 데이터는 아직 확정하거나 제공할 수 없습니다.</p>
    <h2>해금 챔피언은 어떻게 얻나요?</h2>
    <p>32종의 특정 챔피언은 게임마다 고유한 조건을 달성해야 상점에 나옵니다. 예를 들어 티버는 아이템을 장착한 2성 애니, 모데카이저는 펜타킬 유닛들의 별 등급 합계가 조건입니다. 해금이 완료되었다면 바로 다음 상점부터 등장할 수 있습니다. 개별 조건과 PBE 기준 숫자는 도감에서 확인하세요.</p>
    <h2>공식 정보와 PBE 데이터는 무엇이 다른가요?</h2>
    <p>Riot의 시즌19 개요에 직접 제시된 내용에는 '공식 발표'를, 외부 PBE 추적 자료로 확인한 게임 내 조건에는 'PBE 임시 정보'를 표시했습니다. PBE 수치는 출시 직전까지 바뀔 수 있으므로 19.1 패치 노트가 공개되면 다시 확인해야 합니다.</p>
    <p class="tour-source">기준: 2026년 11월 21일 · <a :href="SET19_RIOT_SOURCE" target="_blank" rel="noopener noreferrer">Riot Games 시즌19 공식 발표 전문</a></p>
  </section>
</article>
</template>
<style scoped>
.tour-page{max-width:1140px;margin:0 auto}
.tour-crumb{display:flex;gap:10px;color:#9eaec2;font-size:12px;margin:4px 0 24px}
.tour-crumb a:hover,.tour-section-head>a,.tour-source a{color:var(--mint)}
.tour-hero{padding:18px 0 35px}
.tour-hero h1{font-size:clamp(30px,4.5vw,45px);letter-spacing:-.05em;margin:6px 0 15px}
.tour-lead{max-width:780px;font-size:15px;color:#bac8d8;line-height:1.9}
.tour-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:26px 0}
.tour-facts>div{border:1px solid #38534e;background:linear-gradient(145deg,#1b3430,#162032);padding:19px;border-radius:12px;display:grid;gap:7px}
.tour-facts small{color:#a9bbc7;font-size:12px}
.tour-facts strong{color:#9ae8ca;font-size:clamp(22px,3.5vw,30px);letter-spacing:-.04em}
.tour-facts span{font-size:12px;color:#aab8cc}
.tour-cta{display:flex;gap:16px;align-items:center;flex-wrap:wrap;font-size:13px}
.tour-cta a{padding:12px 15px;border:1px solid #45685c;border-radius:8px}
.tour-cta .tour-main-link{background:var(--mint);color:#123128;font-weight:700}
.tour-feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.tour-feature-grid>div{padding:16px;border:1px solid #2e4150;border-radius:10px}
.tour-n{color:#8ee2c3;font-size:12px;font-weight:800}
.tour-feature-grid h3{font-size:16px;margin:12px 0}
.tour-feature-grid p,.tour-trait p,.tour-editorial p{font-size:13px;color:#bac8d9;line-height:1.9}
.tour-section-head{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;margin-bottom:16px}
.tour-section-head h2{margin:0}
.tour-section-head>a{font-size:13px}
.tour-traits{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-bottom:18px}
.tour-trait{border-bottom:1px solid #2b3848;padding:13px}
.tour-trait strong{color:#e4f3f4}
.tour-trait p{margin:6px 0 0}
.tour-guides{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.tour-guide{display:grid;gap:8px;border:1px solid #344358;padding:17px;border-radius:9px;background:#192637}
.tour-guide:hover{border-color:#8ee2c3}
.tour-guide span{font-size:11px;color:#9acbb9}
.tour-guide strong{font-size:18px}
.tour-guide small{font-size:12px;color:#b5c4d5;line-height:1.6}
.tour-editorial{max-width:900px;margin:30px 0 42px}
.tour-editorial h2{font-size:19px;margin:26px 0 12px}
.tour-editorial p{font-size:14px}
.tour-source{margin-top:22px;border-top:1px solid #334359;padding-top:18px}
@media(max-width:700px){.tour-feature-grid{grid-template-columns:1fr}.tour-facts{gap:8px}.tour-facts>div{padding:13px}.tour-guides,.tour-traits{grid-template-columns:1fr}}
</style>