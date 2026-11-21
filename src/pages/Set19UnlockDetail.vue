<script setup lang="ts">
import { computed } from 'vue';
import { findSet19Unlock, SET19_GUIDES, SET19_RIOT_SOURCE,SET19_PBE_SOURCE } from '../content/set19';
const props=defineProps<{slug:string}>();
const entry=computed(()=>findSet19Unlock(props.slug));
const guide=computed(()=>SET19_GUIDES[props.slug]);
</script>
<template>
<article v-if="entry && guide" class="unlock-detail">
  <nav class="detail-crumb" aria-label="현재 위치"><a href="/">홈</a><span>/</span><a href="/set19">시즌19</a><span>/</span><a href="/set19/unlocks">해금 도감</a><span>/</span><span>{{ entry.name }}</span></nav>
  <header class="detail-hero">
    <p class="eyebrow">SET 19 · CHAMPION UNLOCK GUIDE</p>
    <h1>롤토체스 시즌19 {{ entry.name }} 해금 조건</h1>
    <p>{{ guide.intro }}</p>
    <div class="detail-labels">
      <span>{{ entry.cost }}코스트</span>
      <span>{{ entry.traits.join(' · ') }}</span>
      <span :class="{official:entry.status==='official'}">{{ entry.status==='official'?'Riot 공식 발표':'PBE 임시 정보' }}</span>
    </div>
  </header>
  <section class="panel detail-highlight">
    <p class="eyebrow">UNLOCK REQUIREMENT</p>
    <h2>해금 조건 한눈에 보기</h2>
    <p>{{ entry.condition }}</p>
    <small v-if="entry.minLevel">PBE 기준 최소 레벨 {{ entry.minLevel }} · 출시 시 변경 가능</small>
    <small v-else-if="entry.status==='pbe'">별도 최소 레벨 미기재 · PBE 기준</small>
  </section>
  <div class="detail-columns">
    <section class="panel">
      <h2>진행 순서</h2>
      <ol class="detail-steps"><li v-for="step in guide.steps" :key="step">{{ step }}</li></ol>
    </section>
    <section class="panel">
      <h2>실패하기 쉬운 부분</h2>
      <ul class="detail-checks"><li v-for="check in guide.checks" :key="check">{{ check }}</li></ul>
    </section>
  </div>
  <section class="detail-article">
    <h2>{{ entry.name }}은 왜 상점에 안 나오나요?</h2>
    <p>시즌19에는 해금이 필요한 챔피언과 시작부터 상점에서 등장할 수 있는 챔피언이 섞여 있습니다. {{ entry.name }}은(는) 해금 조건을 충족해야 상점에 등장하는 대상입니다. 조건을 달성한 뒤 다음 상점을 확인하세요.</p>
    <h2>해금하고도 구매를 못 할 수 있나요?</h2>
    <p>해금은 해당 챔피언을 획득하는 것과 구분해야 합니다. 조건을 충족했다는 사실만으로 모든 후속 구매가 무료라는 뜻은 아닙니다. 충분한 골드와 전장 슬롯을 확보하고, 실제 상점 표시 및 게임 내 조건을 확인하세요.</p>
    <h2>정보는 확정인가요?</h2>
    <p v-if="entry.status==='official'">이 페이지의 핵심 해금 조건은 Riot Games가 공개한 시즌19 소개에서 확인했습니다. 단, 비용·효과·세부 작동 방식과 PBE에서 언급된 추가 숫자는 정식 19.1 패치에서 달라질 수 있습니다.</p>
    <p v-else>이 페이지의 해금 조건 및 최소 레벨은 2026년 11월 20일 PBE 자료를 기준으로 작성했습니다. 12월 2일 예정된 정식 출시 전에 변경될 수 있으므로 정식 19.1 패치 정보를 확인해야 합니다.</p>
    <p class="detail-sources">자료: <a :href="SET19_RIOT_SOURCE" target="_blank" rel="noopener noreferrer">Riot 시즌19 공식 발표</a> · <a :href="SET19_PBE_SOURCE" target="_blank" rel="noopener noreferrer">PBE 기록(2026-11-20)</a></p>
  </section>
  <nav class="detail-next" aria-label="관련 페이지">
    <a href="/set19/unlocks">시즌19 해금 32종 전체 보기 →</a>
    <a href="/set19">시즌19 출시일·주요 특성 →</a>
    <a href="/tools/reroll-calculator">리롤 확률 계산기 →</a>
  </nav>
</article>
</template>
<style scoped>
.unlock-detail{max-width:980px;margin:auto}
.detail-crumb{display:flex;gap:9px;flex-wrap:wrap;color:#a5b7c9;font-size:12px;margin:4px 0 28px}
.detail-crumb a:hover{color:var(--mint)}
.detail-hero{margin-bottom:26px}
.detail-hero h1{font-size:clamp(26px,4.3vw,38px);letter-spacing:-.05em;margin:9px 0 14px}
.detail-hero>p:not(.eyebrow){font-size:15px;color:#bdcada;line-height:1.9}
.detail-labels{display:flex;flex-wrap:wrap;gap:9px;margin-top:18px}
.detail-labels span{font-size:12px;color:#cdd9e5;border:1px solid #3a4b60;border-radius:7px;padding:7px 10px}
.detail-labels span.official{border-color:#34725d;color:#9ee9c9}
.detail-highlight{background:linear-gradient(135deg,#1e3930,#162233);border-color:#42665a}
.detail-highlight>p:not(.eyebrow){color:#ddf2e8;font-size:20px;font-weight:700;line-height:1.65;margin:15px 0}
.detail-highlight small{font-size:12px;color:#c4d7ce}
.detail-columns{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.detail-columns .panel{min-width:0}
.detail-steps,.detail-checks{padding-left:22px;font-size:14px;line-height:1.95;color:#c5d3e2}
.detail-steps li,.detail-checks li{margin:10px 0}
.detail-article{padding:6px 0 25px}
.detail-article h2{font-size:19px;margin:25px 0 12px}
.detail-article p{font-size:14px;color:#b8c8d9;line-height:1.95}
.detail-sources a,.detail-next a{color:var(--mint);text-decoration:underline;text-underline-offset:4px}
.detail-next{border-top:1px solid #35475b;padding:22px 0 35px;display:flex;gap:15px 25px;flex-wrap:wrap;font-size:13px}
@media(max-width:700px){.detail-columns{grid-template-columns:1fr}}
</style>