<script setup lang="ts">
import { computed, ref } from 'vue';
import { COMPONENTS, RECIPES, type ItemRecipe } from '../data/itemRecipes';
import { craftItem, findRecipe, missingParts } from '../utils/itemRecipes';
const inventory = ref(COMPONENTS.map(() => 0));
const crafted = ref<ItemRecipe[]>([]);
const role = ref('전체');
const search = ref('');
const roles = ['전체','AD','AP','탱커','지원','공용','상징'];
const total = computed(() => inventory.value.reduce((a,b) => a+b,0));
const filtered = computed(() => RECIPES.filter(r =>
  (role.value === '전체' || r.role === role.value || (['AD','AP'].includes(role.value) && r.role === '공용')) &&
  [r.name,r.note,...r.parts.map(i => COMPONENTS[i].name)].join(' ').toLowerCase().includes(search.value.trim().toLowerCase())
));
const available = computed(() => filtered.value.filter(r => missingParts(r,inventory.value).length === 0));
const almost = computed(() => total.value ? filtered.value.filter(r => missingParts(r,inventory.value).length === 1) : []);
const selected = ref<ItemRecipe | undefined>();
function adjust(i:number, delta:number) { inventory.value[i] = Math.max(0,Math.min(99,inventory.value[i]+delta)); }
function craft(r:ItemRecipe) { const next = craftItem(r,inventory.value); if(next) { inventory.value=next; crafted.value.push(r); } }
function reset() { inventory.value=COMPONENTS.map(() => 0); crafted.value=[]; role.value='전체'; search.value=''; selected.value=undefined; }
function choose(a:number,b:number) { selected.value=findRecipe(a,b); }
</script>
<template>
<article class="item-tool">
  <header class="item-hero">
    <p class="eyebrow">TFT TOOLS · SET 18</p>
    <h1>롤토체스 아이템 조합 계산기</h1>
    <p class="muted">보유한 재료를 선택하고 제작 가능한 아이템, 필요한 다음 재료, 전체 조합표를 확인하세요.</p>
    <span class="pill">시즌 18 · 일반 조합 36종 + 상징·전략가 19종</span>
  </header>
  <div class="item-columns">
    <section class="panel">
      <div class="item-head"><h2>보유 재료 <small>{{ total }}개</small></h2><button type="button" @click="reset">초기화</button></div>
      <p class="small muted">아이콘 또는 + 버튼으로 추가하고 − 버튼으로 제거하세요.</p>
      <div class="components">
        <div v-for="(c,i) in COMPONENTS" :key="c.id" class="component" :class="{owned:inventory[i]>0}">
          <button type="button" class="component-add" :aria-label="c.name+' 추가'" @click="adjust(i,1)">
            <img :src="c.image" alt="" width="44" height="44"><span>{{ c.name }}</span>
          </button>
          <div class="stepper"><button type="button" :aria-label="c.name+' 제거'" :disabled="!inventory[i]" @click="adjust(i,-1)">−</button><b>{{ inventory[i] }}</b><button type="button" :aria-label="c.name+' 1개 추가'" :disabled="inventory[i]>=99" @click="adjust(i,1)">+</button></div>
        </div>
      </div>
      <div v-if="crafted.length" class="crafted"><h3>제작 기록</h3><div><span v-for="(r,i) in crafted" :key="i"><img :src="r.image" alt="" width="26" height="26">{{ r.name }}</span></div></div>
    </section>
    <section class="panel" aria-labelledby="possible-title">
      <div class="item-head"><h2 id="possible-title">제작 가능 <small aria-live="polite">{{ available.length }}종</small></h2></div>
      <p class="small muted">역할별 추천은 아이템 용도에 따른 분류이며 실시간 메타 순위가 아닙니다.</p>
      <div class="role-filter" aria-label="아이템 역할 필터"><button v-for="r in roles" :key="r" type="button" :aria-pressed="role===r" @click="role=r">{{ r }}</button></div>
      <label class="item-search">아이템 검색<input v-model="search" type="search" placeholder="완성 아이템 또는 재료 이름"></label>
      <p v-if="!available.length" class="empty-note">{{ total<2?'재료를 2개 이상 선택하세요.':'조건에 맞는 조합이 없습니다.' }}</p>
      <div class="results">
        <div v-for="r in available" :key="r.id" class="item-result">
          <img :src="r.image" alt="" width="44" height="44">
          <div><b>{{ r.name }}</b><small>{{ r.role }} · {{ r.note }}</small><small>{{ r.parts.map(i=>COMPONENTS[i].name).join(' + ') }}</small></div>
          <button type="button" @click="craft(r)">제작</button>
        </div>
      </div>
      <p class="small muted">제작을 누르면 재료 2개를 차감합니다. 같은 재료를 두 조합에서 동시에 사용할 수 없습니다.</p>
    </section>
  </div>
  <section v-if="almost.length" class="panel">
    <h2>재료 하나만 더 있으면</h2><p class="small muted">공동 선택이나 모루에서 고려할 다음 재료입니다.</p>
    <div class="next-items"><div v-for="r in almost" :key="r.id" class="item-result"><img :src="r.image" alt="" width="36" height="36"><div><b>{{ r.name }}</b><small>필요: {{ missingParts(r,inventory).map(i=>COMPONENTS[i].name).join(', ') }}</small></div></div></div>
  </section>
  <section class="panel">
    <h2>시즌18 전체 아이템 조합표</h2><p class="small muted">가로와 세로 재료가 만나는 칸을 선택하면 조합 정보를 확인할 수 있습니다. 테두리 강조는 현재 제작 가능한 조합입니다.</p>
    <div v-if="selected" class="item-result selected-recipe" aria-live="polite"><img :src="selected.image" alt="" width="48" height="48"><div><b>{{ selected.name }}</b><small>{{ selected.parts.map(i=>COMPONENTS[i].name).join(' + ') }}</small><small>{{ selected.role }} · {{ selected.note }}</small></div><button v-if="!missingParts(selected,inventory).length" type="button" @click="craft(selected)">제작</button></div>
    <div class="matrix-scroll" tabindex="0" aria-label="아이템 조합표, 가로로 스크롤 가능">
      <table class="matrix"><thead><tr><th scope="col">재료</th><th v-for="c in COMPONENTS" :key="c.id" scope="col"><img :src="c.image" alt="" width="30" height="30"><span>{{ c.name }}</span></th></tr></thead>
        <tbody><tr v-for="(c,i) in COMPONENTS" :key="c.id"><th scope="row"><img :src="c.image" alt="" width="30" height="30"><span>{{ c.name }}</span></th><td v-for="(d,j) in COMPONENTS" :key="d.id"><button v-if="findRecipe(i,j)" type="button" :class="{possible:!missingParts(findRecipe(i,j)!,inventory).length}" :aria-label="c.name+' + '+d.name+' = '+findRecipe(i,j)!.name" @click="choose(i,j)"><img :src="findRecipe(i,j)!.image" alt="" width="30" height="30"><span>{{ findRecipe(i,j)!.name }}</span></button></td></tr></tbody>
      </table>
    </div>
  </section>
  <section class="panel item-guide">
    <h2>롤체 아이템 조합 방법</h2>
    <p>일반 조합 아이템 8종은 두 개씩 결합해 36가지 완성 아이템을 만듭니다. 뒤집개와 프라이팬은 시즌별 상징 및 전략가 아이템을 만들 수 있습니다. 같은 재료 두 개도 하나의 조합으로 계산됩니다.</p>
    <h3>어떤 아이템을 먼저 만들면 좋을까요?</h3><p>물리 딜러는 공격력·공격 속도, 주문력 딜러는 주문력·마나, 탱커는 체력·방어력·마법 저항력을 우선 비교하세요. 회복 감소나 방어력 감소가 없다면 지원 역할 아이템도 고려하세요. 추천 용도는 정성적 분류이며 챔피언별 최적 장비나 승률 순위가 아닙니다.</p>
    <h3>데이터 범위</h3><p>2026년 11월 24일 확인한 시즌18 일반 조합 기준입니다. 찬란한 아이템, 유물, 지원 전용 아이템, 비조합 상징은 제외합니다. 시즌19 변경 사항은 아직 반영하지 않았습니다. 한글 이름과 아이콘은 <a href="https://raw.communitydragon.org/latest/cdragon/tft/ko_kr.json">CommunityDragon</a> 스냅샷, 조합은 <a href="https://noxutft.com/tft-cheat-sheet">시즌18 조합 데이터</a>를 참고했습니다.</p>
    <nav><a href="/tools/reroll-calculator">리롤 확률 계산기 →</a> · <a href="/items">아이템 메타 통계 →</a> · <a href="/set19">시즌19 정보 →</a></nav>
  </section>
</article>
</template>
<style scoped>
.item-tool{display:grid;gap:20px}.item-hero h1{margin:8px 0}.item-hero p{line-height:1.7}.item-columns{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}.item-columns>*{min-width:0}.item-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.item-head h2{margin:0}.item-head small{color:var(--mint);font-size:.75em}.components{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.component{min-width:0;border:1px solid var(--border);border-radius:10px;padding:5px;text-align:center}.component.owned{border-color:var(--mint)}.component-add{width:100%;display:flex;flex-direction:column;align-items:center;gap:5px;background:none;border:0;color:inherit;padding:5px 0;cursor:pointer}.component-add span{font-size:11px;line-height:1.25;min-height:28px;overflow-wrap:anywhere}.component img,.item-result img,.matrix img,.crafted img{border-radius:5px;object-fit:contain;background:#1c2636;flex-shrink:0}.stepper{display:flex;align-items:center;justify-content:space-between;gap:2px}.stepper button{padding:0;min-width:26px;min-height:30px}.item-tool button{cursor:pointer;color:inherit;border:1px solid var(--border);border-radius:6px;background:#162233;padding:7px 9px}.item-tool button:disabled{opacity:.4;cursor:default}.item-tool button:focus-visible{outline:2px solid var(--mint);outline-offset:2px}.item-tool .component-add{background:transparent;border:0;padding:5px 0}.item-tool .stepper button{padding:0}.role-filter{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0}.role-filter button[aria-pressed=true]{border-color:var(--mint);color:var(--mint)}.item-search{display:grid;gap:5px;font-size:12px;margin:12px 0}.item-search input{width:100%;padding:10px;background:#101a28;color:inherit;border:1px solid var(--border);border-radius:7px}.results{display:grid;gap:7px;max-height:480px;overflow:auto}.item-result{display:flex;align-items:center;gap:10px;padding:9px;border:1px solid var(--border);border-radius:8px;min-width:0}.item-result div{flex:1;min-width:0;overflow-wrap:anywhere}.item-result small{display:block;color:var(--muted);font-size:11px;margin-top:4px}.item-result button{flex-shrink:0}.next-items{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.crafted>div{display:flex;flex-wrap:wrap;gap:8px}.crafted span{display:flex;align-items:center;gap:4px;font-size:12px}.matrix-scroll{overflow:auto;max-width:100%;margin-top:12px}.matrix{width:100%;min-width:880px;border-collapse:separate;border-spacing:3px;table-layout:fixed}.matrix th,.matrix td{padding:2px;text-align:center;vertical-align:middle;white-space:normal}.matrix th span,.matrix button span{display:block;font-size:10px;line-height:1.3;overflow-wrap:anywhere}.matrix th:first-child{position:sticky;left:0;background:#131c2a;z-index:1}.matrix button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:100%;min-height:72px;padding:4px}.matrix button.possible{border-color:var(--mint)}.selected-recipe{margin-top:10px}.item-guide p{line-height:1.8}.item-guide a{color:var(--mint);text-decoration:underline}@media(max-width:760px){.item-columns{grid-template-columns:1fr}.components{grid-template-columns:repeat(5,minmax(0,1fr))}}@media(max-width:420px){.components{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>
