<script setup lang="ts">
import { computed,onMounted,ref,watch } from 'vue';
import { SET19_UNLOCKS, SET19_FEATURED_SLUGS, SET19_RIOT_SOURCE,
  SET19_PBE_SOURCE, SET19_PBE_VERIFIED_DATE } from '../content/set19';
const search=ref('');
const cost=ref('all');
const selected=ref<string[]>([]);
const featured=new Set<string>(SET19_FEATURED_SLUGS);
const filtered=computed(()=>SET19_UNLOCKS.filter(entry=>
  (cost.value==='all'||entry.cost===Number(cost.value))&&
  [entry.name,...entry.traits,entry.condition].join(' ').toLocaleLowerCase('ko-KR').includes(search.value.trim().toLocaleLowerCase('ko-KR'))
));
const progress=computed(()=>selected.value.length);
const STORAGE_KEY='tft-profile-set19-unlock-checklist-v1';
onMounted(()=>{
  try{
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]') as unknown;
    if(Array.isArray(stored)) selected.value=stored.filter((slug):slug is string=>
      typeof slug==='string'&&SET19_UNLOCKS.some(e=>e.slug===slug));
  }catch{ /* Private browser mode / malformed saved data: use empty checklist. */ }
});
watch(selected,value=>{
  if(typeof window==='undefined')return;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(value));}catch{/* local storage optional */}
},{deep:true});
function toggle(slug:string,done:boolean){
  selected.value=done ? [...new Set([...selected.value,slug])] : selected.value.filter(s=>s!==slug);
}
</script>
<template>
<article class="unlock-page">
  <nav class="unlock-crumb" aria-label="현재 위치"><a href="/">홈</a><span>/</span><a href="/set19">시즌19</a><span>/</span><span>해금 도감</span></nav>
  <header class="unlock-intro">
    <p class="eyebrow">SET 19 · UNLOCK DATABASE</p>
    <h1>롤토체스 시즌19 챔피언 해금 조건 32종</h1>
    <p>프리즘 투어에서 잠긴 챔피언을 여는 방법을 코스트·특성·이름으로 찾으세요. 세부 규칙은 정식 출시 전 PBE 자료이며, 공식 발표와 구분했습니다.</p>
    <div class="unlock-counts"><strong>32종</strong><span>전체 해금 대상</span><strong>3종</strong><span>공식 발표 조건</span><strong>{{ progress }}/32</strong><span>나의 체크리스트</span></div>
  </header>
  <section class="panel unlock-controls">
    <label>챔피언 또는 조건 검색
      <input v-model="search" type="search" placeholder="예: 티버, 펜타킬, 애니, 3성" autocomplete="off" />
    </label>
    <label>챔피언 코스트
      <select v-model="cost">
        <option value="all">전체 코스트</option>
        <option v-for="n in [1,2,3,4,5,7]" :key="n" :value="String(n)">{{ n }}코스트</option>
      </select>
    </label>
    <div class="unlock-control-note">
      <span>표시 {{ filtered.length }}종 / 전체 32종</span>
      <button type="button" @click="search='';cost='all'">필터 초기화</button>
    </div>
  </section>
  <p class="unlock-caution"><strong>자료 구분:</strong> Riot 공식 발표로 확인된 조건 3종은 '공식 발표', 나머지 29종은 <time datetime="2026-11-20">{{ SET19_PBE_VERIFIED_DATE }}</time> PBE 확인 내용입니다. 정식 출시 전 숫자·최소 레벨 등이 바뀔 수 있습니다. 체크리스트는 이 브라우저에만 저장됩니다.</p>
  <div class="unlock-grid">
    <section v-for="entry in filtered" :key="entry.slug" class="unlock-card" :class="{done:selected.includes(entry.slug)}">
      <div class="unlock-card-top"><span class="unlock-cost">{{ entry.cost }}코스트</span>
        <span class="unlock-status" :class="entry.status">{{ entry.status==='official'?'Riot 공식 발표':'PBE 임시 정보' }}</span>
      </div>
      <h2>{{ entry.name }}</h2>
      <p class="unlock-traits">{{ entry.traits.join(' · ') }}</p>
      <p class="unlock-condition">{{ entry.condition }}</p>
      <p v-if="entry.minLevel" class="unlock-level">PBE 최소 레벨 {{ entry.minLevel }}</p>
      <div class="unlock-card-bottom">
        <label class="unlock-check"><input type="checkbox" :checked="selected.includes(entry.slug)" @change="toggle(entry.slug,($event.target as HTMLInputElement).checked)" /><span>조건 확인했어요</span></label>
        <a v-if="featured.has(entry.slug)" :href="'/set19/unlocks/'+entry.slug">자세한 해금 방법 →</a>
      </div>
    </section>
    <p v-if="filtered.length===0" class="unlock-none">검색 결과가 없습니다. 다른 챔피언 이름이나 코스트로 다시 찾아보세요.</p>
  </div>
  <section class="panel unlock-explain">
    <h2>자주 묻는 질문</h2>
    <h3>챔피언 해금에 성공하면 어떻게 되나요?</h3>
    <p>Riot 공식 설명에 따르면 개인 게임 내 해금 조건을 달성한 유닛은 다음 상점에 등장합니다. 해금 조건을 달성하지 않은 챔피언은 그 전까지 상점에서 찾을 수 없습니다.</p>
    <h3>해금 조건을 달성했는데 상점에 보이지 않으면?</h3>
    <p>먼저 필요한 별 등급·아이템·특성 활성 여부·최소 레벨을 확인하세요. PBE 시험 버전의 해금 설명이나 표시 오류일 가능성도 있어 게임 내 설명과 비교하는 것이 안전합니다.</p>
    <h3>체크리스트가 게임 계정과 연동되나요?</h3>
    <p>아닙니다. 실제 인게임 해금 상태를 읽는 기능이 아니라 개인 메모입니다. 로그인이나 Riot API를 사용하지 않으며 지금 사용하는 브라우저에만 저장됩니다. 각 게임의 실제 해금 상태와 일치한다고 보장하지 않습니다.</p>
    <h3>32개 조건은 모두 정식 확정인가요?</h3>
    <p>아닙니다. Riot이 2026년 11월 17일 소개한 예시 조건 3종 외에는 PBE 정보입니다. 정식 출시일인 2026년 12월 2일의 패치 19.1과 비교해 재검증해야 합니다.</p>
    <p class="unlock-sources">출처: <a :href="SET19_RIOT_SOURCE" target="_blank" rel="noopener noreferrer">Riot 공식 한국어 개요</a> · <a :href="SET19_PBE_SOURCE" target="_blank" rel="noopener noreferrer">PBE 해금 목록(2026-11-20)</a></p>
    <nav class="unlock-links"><a href="/set19">시즌19 소개</a><a href="/tools/reroll-calculator">리롤 계산기</a><a href="/">전적 분석</a></nav>
  </section>
</article>
</template>
<style scoped>
.unlock-page{max-width:1120px;margin:0 auto}
.unlock-crumb{display:flex;gap:10px;font-size:12px;color:#a8b9cb;margin:5px 0 25px}
.unlock-crumb a:hover{color:var(--mint)}
.unlock-intro{margin:0 0 30px}
.unlock-intro h1{font-size:clamp(27px,4vw,38px);letter-spacing:-.05em;margin:7px 0}
.unlock-intro>p:not(.eyebrow){color:#bac8da;font-size:14px;line-height:1.9;max-width:850px}
.unlock-counts{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:22px 0}
.unlock-counts strong{font-size:26px;color:#9ae7ca}
.unlock-counts span{font-size:12px;color:#b0c0d3;margin-right:16px}
.unlock-controls{display:grid;grid-template-columns:minmax(0,1fr) 190px;gap:15px;align-items:end}
.unlock-controls>label{display:grid;gap:8px;font-size:13px;color:#cbd8e4}
.unlock-controls input,.unlock-controls select{width:100%;min-height:44px;background:#101824;border:1px solid #384b60;color:#edf3f7;padding:10px;border-radius:8px}
.unlock-control-note{grid-column:1/-1;display:flex;justify-content:space-between;gap:12px;font-size:12px;color:#9eafc0}
.unlock-control-note button{background:transparent;border:0;color:#a7e9d0}
.unlock-caution{padding:14px 18px;border:1px solid #4c4e44;border-radius:8px;background:#292823;font-size:12px;color:#e1d3b4;line-height:1.85}
.unlock-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:20px 0 28px}
.unlock-card{border:1px solid #304457;background:#131e2d;border-radius:12px;padding:19px;min-width:0}
.unlock-card.done{border-color:#559684;background:#192e2c}
.unlock-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.unlock-cost{font-size:12px;font-weight:700;color:#d4e3f2}
.unlock-status{font-size:11px;color:#d1c39e}
.unlock-status.official{color:#9ee9c9}
.unlock-card h2{font-size:19px;margin:17px 0 6px}
.unlock-traits{color:#98bfb7;font-size:12px}
.unlock-condition{font-size:14px;line-height:1.8;color:#d0dbeb;min-height:48px}
.unlock-level{font-size:12px;color:#b4c5dc}
.unlock-card-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid #304154;padding-top:13px;margin-top:17px}
.unlock-check{display:flex;gap:9px;align-items:center;color:#c7d3e1;font-size:12px;cursor:pointer}
.unlock-check input{accent-color:#8ee2c3;width:17px;height:17px}
.unlock-card-bottom>a{font-size:12px;color:var(--mint)}
.unlock-none{color:#b5c5d7}
.unlock-explain{max-width:970px}
.unlock-explain h3{font-size:16px;margin:24px 0 10px}
.unlock-explain p{font-size:14px;line-height:1.95;color:#bbc9d9}
.unlock-sources a,.unlock-links a{color:var(--mint);text-decoration:underline;text-underline-offset:4px}
.unlock-links{display:flex;gap:20px;flex-wrap:wrap;padding-top:10px;font-size:13px}
@media(max-width:700px){.unlock-grid{grid-template-columns:1fr}}
@media(max-width:480px){.unlock-controls{grid-template-columns:1fr}.unlock-control-note{grid-column:1}.unlock-card{padding:16px}}
</style>