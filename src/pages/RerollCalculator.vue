<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  CHAMPIONS_PER_COST, LEVELS, POOL_COPIES, SHOP_ODDS,
  normalizeRerollInput, oneShopHitChance, reachGoalChance,
} from '../utils/rerollOdds';

const level=ref(7), cost=ref(3), gold=ref(40), owned=ref(1);
const contested=ref(0), otherCopiesOut=ref(0), goal=ref(3);
const input=computed(()=>normalizeRerollInput({
  level:level.value,cost:cost.value,gold:gold.value,owned:owned.value,
  contested:contested.value,otherCopiesOut:otherCopiesOut.value,goal:goal.value,
}));
const chance=computed(()=>reachGoalChance(input.value));
const oneShop=computed(()=>oneShopHitChance(input.value));
const remaining=computed(()=>Math.max(0,input.value.goal-input.value.owned));
const impossible=computed(()=>POOL_COPIES[input.value.cost]-input.value.contested<input.value.goal);
const compare=computed(()=>[5,6,7,8,9,10].map(l=>({
  level:l,percent:reachGoalChance({...input.value,level:l}),
  tierChance:SHOP_ODDS[l][input.value.cost-1],
})));
const pct=(p:number)=>p>0&&p<0.001?(p*100).toFixed(3)+'%':(p*100).toFixed(1)+'%';
function reset(){
  level.value=7;cost.value=3;gold.value=40;owned.value=1;
  contested.value=0;otherCopiesOut.value=0;goal.value=3;
}
</script>

<template>
<article class="roll-page">
  <header class="roll-hero">
    <p class="eyebrow">TFT TOOLS · SET 18</p>
    <h1>롤토체스 리롤 확률 계산기</h1>
    <p>레벨, 골드, 경쟁자 보유 장수를 입력하고 원하는 챔피언의 2성·3성 달성 확률을 확인하세요. 골드 구매 비용과 공유 챔피언 풀을 고려합니다.</p>
    <span class="pill">시즌 18 · 일반 상점 기준 · 2026년 11월</span>
  </header>
  <div class="roll-grid">
    <section class="panel roll-controls" aria-labelledby="roll-title">
      <div class="roll-head"><h2 id="roll-title">조건 입력</h2><button type="button" @click="reset">초기화</button></div>
      <div class="roll-fields">
        <label>플레이어 레벨
          <select v-model.number="level"><option v-for="l in LEVELS" :key="l" :value="l">{{ l }}레벨</option></select>
        </label>
        <label>목표 챔피언 코스트
          <select v-model.number="cost"><option v-for="n in 5" :key="n" :value="n">{{ n }}코스트</option></select>
        </label>
        <label>사용할 골드
          <input v-model.number="gold" type="number" min="0" max="200" step="1" />
        </label>
        <label>목표
          <select v-model.number="goal">
            <option :value="1">1장 확보</option>
            <option :value="3">2성 (총 3장)</option>
            <option :value="9">3성 (총 9장)</option>
          </select>
        </label>
        <label>내가 이미 보유한 같은 챔피언
          <input v-model.number="owned" type="number" min="0" :max="POOL_COPIES[input.cost]" step="1" />
        </label>
        <label>상대가 보유한 같은 챔피언
          <input v-model.number="contested" type="number" min="0" :max="POOL_COPIES[input.cost]-input.owned" step="1" />
        </label>
        <label class="roll-wide">다른 같은 코스트 챔피언이 풀에서 빠진 장수 <small>선택 · 모르면 0</small>
          <input v-model.number="otherCopiesOut" type="number" min="0" :max="(CHAMPIONS_PER_COST[input.cost]-1)*POOL_COPIES[input.cost]-5" step="1" />
        </label>
      </div>
      <p class="muted small">다른 플레이어의 보드·대기석에 있는 동일 챔피언도 공유 풀에서 제외됩니다. 입력값은 허용 범위로 제한해 계산하며, 모르는 풀 수량은 0으로 가정합니다.</p>
    </section>
    <section class="panel roll-result" aria-live="polite">
      <p class="eyebrow">TARGET HIT PROBABILITY</p>
      <h2>{{ input.cost }}코스트 · {{ input.goal===9?'3성':input.goal===3?'2성':'1장' }} 목표</h2>
      <p class="roll-number">{{ pct(chance) }}</p>
      <p class="roll-caption">내 보유 {{ input.owned }}장 → 추가 {{ remaining }}장 · 예산 {{ input.gold }}골드</p>
      <div class="roll-meter" role="img" :aria-label="'목표 달성 확률 '+pct(chance)"><span :style="{width:(chance*100)+'%'}"></span></div>
      <p v-if="impossible" class="roll-warning">경쟁자가 보유한 장수 때문에 풀에 남은 수량으로는 목표 달성이 불가능합니다.</p>
      <div class="roll-kpis">
        <div><span>상점 1회에서 한 장 이상 발견</span><strong>{{ pct(oneShop) }}</strong></div>
        <div><span>상점 한 칸의 코스트 확률</span><strong>{{ SHOP_ODDS[input.level][input.cost-1] }}%</strong></div>
        <div><span>최대 유료 리롤 횟수</span><strong>{{ Math.floor(input.gold/2) }}회</strong></div>
        <div><span>동일 챔피언 남은 장수</span><strong>{{ POOL_COPIES[input.cost]-input.owned-input.contested }}장</strong></div>
      </div>
      <p class="muted small">리롤 1회 2골드와 발견한 챔피언 구매 골드를 모두 차감합니다. 현재 열려 있는 상점은 포함하지 않습니다.</p>
    </section>
  </div>

  <section class="panel roll-comparison">
    <h2>같은 골드로 레벨별 리롤 비교</h2>
    <p class="small muted">현재 예산과 경쟁 조건을 고정해 레벨별 확률을 비교합니다. 레벨업에 필요한 골드는 포함하지 않습니다.</p>
    <div v-for="row in compare" :key="row.level" class="roll-row" :class="{selected:row.level===input.level}">
      <span>{{ row.level }}레벨</span>
      <div class="roll-row-meter"><span :style="{width:(row.percent*100)+'%'}"></span></div>
      <strong>{{ pct(row.percent) }}</strong>
      <small class="muted">코스트 {{ row.tierChance }}%</small>
    </div>
  </section>

  <section class="panel roll-table">
    <h2>롤토체스 레벨별 상점 확률표</h2>
    <p class="small muted">코스트별 등장률은 상점 한 칸 기준입니다. 특정 챔피언의 등장 확률과 다릅니다.</p>
    <div class="table-scroll">
      <table>
        <thead><tr><th>레벨</th><th v-for="n in 5" :key="n">{{ n }}코스트</th></tr></thead>
        <tbody>
          <tr v-for="l in LEVELS" :key="l" :class="{active:l===input.level}">
            <th scope="row">{{ l }}</th>
            <td v-for="(rate,i) in SHOP_ODDS[l]" :key="i" :class="{chosen:i+1===input.cost}">{{ rate }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
    <h3>시즌18 공유 챔피언 풀</h3>
    <div class="table-scroll">
      <table>
        <thead><tr><th>코스트</th><th>한 챔피언당</th><th>종류</th><th>총 장수</th></tr></thead>
        <tbody><tr v-for="n in 5" :key="n">
          <th scope="row">{{ n }}</th><td>{{ POOL_COPIES[n] }}장</td>
          <td>{{ CHAMPIONS_PER_COST[n] }}종</td><td>{{ POOL_COPIES[n]*CHAMPIONS_PER_COST[n] }}장</td>
        </tr></tbody>
      </table>
    </div>
  </section>

  <section class="roll-guide" aria-labelledby="roll-faq">
    <h2 id="roll-faq">리롤 확률 계산기 사용 가이드</h2>
    <h3>2성, 3성에 챔피언이 몇 장 필요한가요?</h3>
    <p>동일 챔피언 3장으로 2성, 총 9장으로 3성을 만들 수 있습니다. 이미 보유한 장수는 목표 장수에서 제외해 추가로 필요한 챔피언을 계산합니다.</p>
    <h3>3코스트 확률 40%인데 원하는 챔피언은 왜 잘 안 나오나요?</h3>
    <p>상점에서 3코스트가 등장할 확률과 특정 3코스트 챔피언이 등장할 확률은 다릅니다. 같은 코스트의 여러 챔피언이 공유 풀을 나누어 사용하기 때문입니다. 상대가 원하는 챔피언을 이미 확보했다면 내 상점에 나올 확률도 낮아집니다.</p>
    <h3>계산기는 무엇을 반영하나요?</h3>
    <p>레벨별 코스트 등장률, 공유 풀의 잔여 장수, 상점 다섯 칸의 비복원 추출, 목표 챔피언 구매 비용과 유료 리롤 비용을 확률 모델에 반영합니다. 난수로 추정하지 않고 가능한 상점 결과를 누적 계산합니다.</p>
    <h3>실제 게임과 확률이 달라질 수 있나요?</h3>
    <p>특수 상점, 정령/위습 슬롯, 증강체의 무료 리롤, 현재 보이는 상점, 외부에서 지급된 챔피언, 상대방의 이후 구매·판매, 레벨업 및 이자 비용은 반영하지 않습니다. 상대 보유량을 모르는 경우 실제 확률과 차이가 발생할 수 있습니다. 게임 패치나 세트 변경으로 수치가 바뀌면 데이터 갱신이 필요합니다.</p>
    <h3>확률 데이터 출처</h3>
    <p>시즌18 일반 상점 기준이며, 7레벨의 19/30/40/10/1%는 Riot Games 17.1 패치에서 조정된 수치입니다.</p>
    <nav class="roll-links">
      <a href="https://teamfighttactics.leagueoflegends.com/ko-kr/news/game-updates/teamfight-tactics-patch-17-1/" target="_blank" rel="noopener noreferrer">Riot 공식 패치 노트</a>
      <a href="https://www.tftraits.com/pool-sizes" target="_blank" rel="noopener noreferrer">시즌18 풀 수량표</a>
      <a href="/">내 전적 분석</a><a href="/meta">메타 통계</a>
    </nav>
  </section>
</article>
</template>

<style scoped>
.roll-page{max-width:1100px;margin:auto}
.roll-hero{padding:16px 0 28px}
.roll-hero h1{font-size:clamp(26px,4vw,38px);letter-spacing:-.05em;margin:10px 0}
.roll-hero>p:not(.eyebrow){color:#bfcbda;font-size:14px;max-width:800px}
.roll-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:20px}
.roll-grid .panel{min-width:0}
.roll-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.roll-head h2{margin:0}
.roll-head button{background:#243344;color:#e2f4ee;border:1px solid #405365;padding:8px 12px;border-radius:7px;font-size:12px}
.roll-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.roll-fields label{display:grid;gap:9px;color:#cfdaea;font-size:13px;font-weight:600}
.roll-fields small{color:#9eafc4;font-weight:400}
.roll-fields select,.roll-fields input{background:#0e1622;border:1px solid #3b4a5e;color:#ecf2f8;border-radius:8px;padding:10px 11px;min-height:44px;width:100%}
.roll-wide{grid-column:1/-1}
.roll-controls>p{margin:18px 0 0}
.roll-result{background:linear-gradient(135deg,#19302d,#151c29 78%);border-color:#3d625a}
.roll-result h2{margin-bottom:6px}
.roll-number{font-size:clamp(38px,5vw,60px);font-weight:800;letter-spacing:-.06em;line-height:1.2;color:#8ee2c3;margin:20px 0 12px}
.roll-caption{font-size:13px;color:#bbcad9}
.roll-meter,.roll-row-meter{border-radius:999px;height:10px;background:#28394a;overflow:hidden}
.roll-meter span,.roll-row-meter span{display:block;border-radius:inherit;background:#8ee2c3;height:100%}
.roll-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:25px 0}
.roll-kpis div{border:1px solid #36534e;border-radius:9px;padding:12px}
.roll-kpis span{display:block;color:#b1c2ce;font-size:11px;line-height:1.5}
.roll-kpis strong{display:block;font-size:21px;margin-top:7px}
.roll-warning{color:#ffd4aa;font-size:13px;margin:14px 0}
.roll-row{display:grid;grid-template-columns:65px 1fr 85px 102px;align-items:center;gap:13px;border-radius:8px;padding:10px 12px;font-size:13px}
.roll-row.selected{background:#203831}
.roll-row strong,.roll-row small{text-align:right}
.roll-table tr.active{background:#1a3833}
.roll-table td.chosen{font-weight:700;color:#8ee2c3}
.roll-table h3{margin:27px 0 8px}
.roll-guide{max-width:850px;margin:30px 0 40px}
.roll-guide h2{font-size:22px}
.roll-guide h3{font-size:16px;margin:23px 0 10px}
.roll-guide p{font-size:14px;color:#b8c8da;line-height:1.95}
.roll-links{display:flex;flex-wrap:wrap;gap:12px 22px;padding-top:20px;color:var(--mint);font-size:13px}
.roll-links a{text-decoration:underline;text-underline-offset:4px}
@media(max-width:820px){.roll-grid{grid-template-columns:1fr}}
@media(max-width:520px){
.roll-grid .panel{padding:18px}
.roll-fields{gap:12px}
.roll-row{grid-template-columns:45px 1fr 75px;padding:9px 0;gap:8px}
.roll-row small{display:none}
}
</style>