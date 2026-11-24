<script setup lang="ts">
import { computed, ref } from 'vue';
import { BASE_INCOME_PRESETS, LEVELS, TOTAL_XP_FOR_LEVEL, XP_TO_REACH_LEVEL, calculateLevelPlan, calculateRoundIncome, type CombatResult, type StreakType } from '../utils/economy';
const gold=ref(50), level=ref(7), currentXp=ref(0), targetLevel=ref(8);
const waitRounds=ref(2), passiveXpPerRound=ref(2);
const basePreset=ref('standard'), customBaseIncome=ref(5), plannedSpend=ref(0);
const streakType=ref<StreakType>('win'), streakLength=ref(5), nextCombat=ref<CombatResult>('win');
const interestEnabled=ref(true), interestCap=ref(5);
const baseIncome=computed(()=>BASE_INCOME_PRESETS.find(p=>p.value===basePreset.value)?.income??5);
const effectiveBaseIncome=computed(()=>basePreset.value==='custom'?Math.max(0,Math.min(20,customBaseIncome.value||0)):baseIncome.value);
const maxCurrentXp=computed(()=>level.value<10?XP_TO_REACH_LEVEL[level.value+1]-1:0);
const progress=computed(()=>level.value<10?Math.min(100,currentXp.value/XP_TO_REACH_LEVEL[level.value+1]*100):100);
const plan=computed(()=>calculateLevelPlan({gold:gold.value,level:level.value,currentXp:currentXp.value,targetLevel:targetLevel.value,waitRounds:waitRounds.value,passiveXpPerRound:passiveXpPerRound.value}));
const income=computed(()=>calculateRoundIncome({currentGold:gold.value,plannedSpend:plannedSpend.value,baseIncome:effectiveBaseIncome.value,streakType:streakType.value,streakLength:streakLength.value,nextCombat:nextCombat.value,interestEnabled:interestEnabled.value,interestCap:interestCap.value}));
const rows=computed(()=>LEVELS.map(l=>({level:l,xp:XP_TO_REACH_LEVEL[l],total:TOTAL_XP_FOR_LEVEL[l],cost:Math.ceil(XP_TO_REACH_LEVEL[l]/4)*4})));
const interestBands=computed(()=>Array.from({length:Math.floor(Math.min(10,Math.max(0,interestCap.value)))+1},(_,i)=>i*10));
const streakLabel=computed(()=>income.value.streakType==='none'?'연속 기록 없음':(income.value.streakType==='win'?'연승 ':'연패 ')+income.value.streakLength+'회');
const fmt=(n:number)=>Math.round(n).toLocaleString('ko-KR')+'G';
function reset(){gold.value=50;level.value=7;currentXp.value=0;targetLevel.value=8;waitRounds.value=2;passiveXpPerRound.value=2;basePreset.value='standard';customBaseIncome.value=5;plannedSpend.value=0;streakType.value='win';streakLength.value=5;nextCombat.value='win';interestEnabled.value=true;interestCap.value=5;}
function levelChanged(){if(targetLevel.value<level.value)targetLevel.value=level.value;currentXp.value=Math.min(currentXp.value,maxCurrentXp.value);}
</script>
<template>
<article class="econ-page">
  <header class="econ-hero">
    <p class="eyebrow">TFT TOOLS · SET 18 · ECONOMY</p>
    <h1>롤토체스 골드·레벨업 계산기</h1>
    <p>현재 골드와 경험치, 연승·연패, 예정 지출을 입력해 다음 라운드 수입과 목표 레벨까지 필요한 경험치 구매 비용을 계산하세요.</p>
    <span class="pill">시즌 18 · 18.7 기준 · 증강체·특수 보상 별도 조정</span>
  </header>
  <div class="econ-grid">
    <section class="panel">
      <div class="heading"><h2>현재 게임 상태</h2><button type="button" @click="reset">초기화</button></div>
      <div class="fields">
        <label>현재 보유 골드<div class="unit"><input v-model.number="gold" type="number" min="0" max="999"><span>G</span></div></label>
        <label>현재 레벨<select v-model.number="level" @change="levelChanged"><option v-for="l in [1,...LEVELS]" :key="l" :value="l">{{l}}레벨</option></select></label>
        <label>현재 레벨 경험치<div class="unit"><input v-model.number="currentXp" type="number" min="0" :max="maxCurrentXp" :disabled="level===10" @change="currentXp=Math.max(0,Math.min(maxCurrentXp,currentXp))"><span>XP</span></div><small v-if="level<10">다음 레벨까지 {{Math.max(0,XP_TO_REACH_LEVEL[level+1]-currentXp)}} XP</small><small v-else>최대 레벨</small></label>
        <label>목표 레벨<select v-model.number="targetLevel"><option v-for="l in LEVELS" :key="l" :value="l" :disabled="l<level">{{l}}레벨</option></select></label>
        <label>자연 경험치를 받을 라운드 수<input v-model.number="waitRounds" type="number" min="0" max="20"></label>
        <label>라운드당 자연 경험치<div class="unit"><input v-model.number="passiveXpPerRound" type="number" min="0" max="10"><span>XP</span></div></label>
      </div>
      <div v-if="level<10" class="progress"><span>현재 레벨 진행도</span><b>{{currentXp}} / {{XP_TO_REACH_LEVEL[level+1]}} XP</b><div class="track"><i :style="{width:progress+'%'}"></i></div></div>
      <p class="hint">자연 경험치는 기본 2XP/라운드로 설정했어. 이 값은 참고용 기본값이며, 증강체·특수 이벤트·세트 변경으로 달라지면 직접 수정해.</p>
    </section>
    <section class="panel result" aria-live="polite">
      <p class="eyebrow">LEVEL-UP PLANNER</p>
      <h2>{{plan.targetLevel}}레벨까지 필요한 XP 구매 비용</h2>
      <strong class="big">{{fmt(plan.afterWaitGoldCost)}}</strong>
      <p class="muted">{{waitRounds}}라운드 자연 경험치 반영 후 · {{plan.remainingXpAfterWait}}XP 부족</p>
      <div class="kpis">
        <div><span>지금 바로 레벨업</span><b>{{fmt(plan.immediateGoldCost)}}</b><small>{{plan.immediatePurchases}}회 구매</small></div>
        <div><span>기다리면 절약</span><b>{{fmt(plan.savedGoldByWaiting)}}</b><small>자연 경험치 반영</small></div>
        <div><span>필요한 XP 구매</span><b>{{plan.afterWaitPurchaseXp}} XP</b><small>{{plan.afterWaitPurchases}}회 · 4XP 단위</small></div>
        <div><span>구매 후 남는 경험치</span><b>{{plan.afterWaitSurplusXp}} XP</b><small>목표 레벨 초과분</small></div>
      </div>
      <p v-if="targetLevel<=level" class="good">이미 목표 레벨에 도달했어. 더 높은 목표 레벨을 선택해.</p>
      <p v-else-if="plan.afterWaitGoldShortfall>0" class="warn">현재 골드 기준으로 {{fmt(plan.afterWaitGoldShortfall)}}이 더 필요해.</p>
      <p v-else class="good">현재 골드로 구매할 수 있어. 구매 후 {{fmt(plan.afterWaitGoldAfter)}}이 남아.</p>
      <p class="hint">경험치 구매는 4골드로 4XP를 얻는 단위야. 필요한 XP가 4의 배수가 아니면 초과 경험치까지 구매 비용에 포함해.</p><p class="hint">레벨업 비용 비교는 현재 보유 골드를 기준으로 해. 기다리는 동안 얻는 라운드 골드 수입은 아래 수입 예측에서 별도로 확인해.</p>
    </section>
  </div>
  <section class="panel">
    <p class="eyebrow">ROUND INCOME FORECAST</p><div class="heading"><h2>다음 라운드 골드 수입 예측</h2><span class="pill">1라운드 기준</span></div>
    <div class="fields">
      <label>라운드 기본 수입<select v-model="basePreset"><option v-for="p in BASE_INCOME_PRESETS" :key="p.value" :value="p.value">{{p.label}} · +{{p.income}}G</option></select></label>
      <label v-if="basePreset==='custom'">직접 입력한 기본 수입<div class="unit"><input v-model.number="customBaseIncome" type="number" min="0" max="20"><span>G</span></div></label>
      <label>현재 연승·연패<select v-model="streakType"><option value="none">없음</option><option value="win">연승</option><option value="loss">연패</option></select></label>
      <label>현재 연속 횟수<input v-model.number="streakLength" type="number" min="0" max="20" :disabled="streakType==='none'"></label>
      <label>다음 전투 예상 결과<select v-model="nextCombat"><option value="win">플레이어 전투 승리</option><option value="loss">플레이어 전투 패배</option><option value="pve">몬스터 전투</option></select></label>
      <label>이번 라운드 예정 지출<div class="unit"><input v-model.number="plannedSpend" type="number" min="0" max="999"><span>G</span></div><small>리롤·구매·레벨업 등에 쓸 골드</small></label>
      <label>이자 상한<div class="unit"><input v-model.number="interestCap" type="number" min="0" max="10" :disabled="!interestEnabled"><span>G</span></div><small>일반 5G · 증강체 적용 시 조정</small></label>
      <label class="toggle"><input v-model="interestEnabled" type="checkbox">이자 획득 활성화<small>허슬러 등 이자 비활성화 효과가 있으면 해제</small></label>
    </div>
    <div class="income-result">
      <div class="income-total"><span>예상 다음 라운드 총수입</span><strong>+{{income.totalIncome}}G</strong><small>지출 반영 후 예상 보유 골드 {{income.projectedGold}}G</small></div>
      <div class="breakdown">
        <div><span>기본 수입</span><b>+{{income.baseIncome}}G</b></div>
        <div><span>이자 수입</span><b>+{{income.interest}}G</b></div>
        <div><span>{{streakLabel}} 보너스</span><b>+{{income.streakBonus}}G</b></div>
        <div><span>전투 승리 보너스</span><b>+{{income.winBonus}}G</b></div>
      </div>
    </div>
    <p v-if="income.spendShortfall>0" class="warn">예정 지출이 현재 골드보다 {{fmt(income.spendShortfall)}} 많아. 실제 구매 가능 금액을 확인해.</p>
    <p v-if="income.interestLost>0" class="warn">예정 지출로 이자 구간이 낮아져 {{income.interestLost}}G의 이자를 잃게 돼.</p>
    <p v-else-if="income.interestEnabled&&income.interest>0" class="good">지출 후 {{income.bankForInterest}}G를 보유해 {{income.interest}}G의 이자를 받아.</p>
    <p v-if="income.nextInterestThreshold!==null" class="hint">다음 이자 {{income.interest+1}}G까지 {{income.goldToNextInterest}}G 더 필요해 ({{income.nextInterestThreshold}}G 보유 기준).</p>
    <p class="hint">예정 지출을 먼저 차감한 잔액으로 이자를 계산해. 예상 전투 결과 반영: {{streakLabel}}. {{nextCombat==='pve'?'몬스터 전투는 승리 골드 보너스를 지급하지 않으며 연속 기록을 유지하는 것으로 계산해.':'플레이어 전투 승리 시 +1G, 패배 시 +0G로 계산해.'}}</p>
  </section>
  <section class="panel">
    <h2>시즌18 레벨별 경험치표</h2><p class="small muted">각 레벨 진입에 필요한 XP와 해당 구간만 4XP 구매 단위로 채울 때의 골드 비용이야.</p>
    <div class="table-scroll"><table><thead><tr><th>목표 레벨</th><th>필요 XP</th><th>레벨 1부터 누적 XP</th><th>해당 구간 구매 비용</th></tr></thead>
      <tbody><tr v-for="r in rows" :key="r.level" :class="{active:r.level===targetLevel}"><th>{{r.level}}레벨</th><td>{{r.xp}} XP</td><td>{{r.total}} XP</td><td>{{r.cost}}G</td></tr></tbody></table></div>
  </section>
  <section class="panel">
    <h2>이자 구간표</h2><p class="small muted">일반 이자 구간은 10골드마다 +1G, 기본 최대 +5G야. 예정 지출 후 보유 골드 기준으로 강조해. 상한 증가 증강체는 위의 상한 입력값에 반영해.</p>
    <div class="bands"><div v-for="band in interestBands" :key="band" :class="{active:interestEnabled&&Math.min(interestCap*10,Math.floor(income.bankForInterest/10)*10)===band}"><span>{{band}}G</span><b>+{{interestEnabled?Math.min(interestCap,band/10):0}}G</b></div></div>
    <p class="hint">50G 이상은 일반 이자 상한에 도달해. 특수 증강체로 상한이 바뀌면 위의 이자 상한을 조정해.</p>
  </section>
  <section class="guide">
    <h2>롤토체스 골드 운영 가이드</h2>
    <h3>이자 50골드를 유지해야 하나요?</h3><p>일반 규칙에서 보유 골드 10·20·30·40·50G 구간마다 이자가 1G씩 늘고, 50G부터 최대 5G를 받아. 49G와 50G는 다음 라운드 이자 1G 차이가 나므로, 구매나 리롤 전에 이자 손실과 전력 강화를 비교해.</p>
    <h3>연승과 연패 보너스는 얼마인가요?</h3><p>시즌18 기준 2~4연속은 1G, 5연속은 2G, 6연속 이상은 3G야. 승리와 패배 모두 같은 연속 보너스 표를 사용해. 다만 연패 운영은 체력 손실을 동반하므로 골드만 보고 결정하면 안 돼.</p>
    <h3>언제 레벨업하는 게 좋을까요?</h3><p>레벨업 타이밍은 조합, 현재 체력, 연승 여부, 다음 상점 확률에 따라 달라져. 이 계산기는 목표 레벨까지 필요한 XP와 자연 경험치를 반영한 구매 비용을 보여주지만, 특정 라운드의 레벨업을 정답으로 단정하지 않아.</p>
    <p class="hint">18.7은 2026년 11월 17일 적용된 시즌18 최신 패치야. 공식 패치 노트에는 XP 비용 조정이 없어, 18.6까지 확인된 레벨별 XP 표를 그대로 사용해.</p>
    <h3>계산에 포함되지 않는 항목</h3><p>증강체의 즉시 골드·XP 지급, 위습·조우·PvE 전리품, 판매 수익, 특수 이자 효과, 라운드별 추가 보상은 자동으로 추정하지 않아. 기본 수입과 자연 경험치는 직접 수정할 수 있으니 실제 게임 화면과 다른 경우 입력값을 맞춰 사용해.</p>
    <nav class="links"><a href="/tools/reroll-calculator">리롤 확률 계산기 →</a><a href="/tools/item-calculator">아이템 조합 계산기 →</a><a href="/meta">메타 통계 →</a><a href="/set19">시즌19 정보 →</a></nav>
    <div class="sources"><span>데이터 참고</span><a href="https://senseos.gg/guides/tft/xp-per-level/" target="_blank" rel="noopener noreferrer">레벨별 XP 기준</a><a href="https://senseos.gg/guides/tft/gold-interest-and-streaks/" target="_blank" rel="noopener noreferrer">이자·연승·연패 규칙</a><a href="https://topmeta.gg/en/tables/economy/" target="_blank" rel="noopener noreferrer">라운드 기본 수입 참고</a><a href="https://www.tftclimb.com/cheatsheet/tft-shop-odds" target="_blank" rel="noopener noreferrer">라운드당 자연 XP 참고</a><a href="https://teamfighttactics.leagueoflegends.com/en-sg/news/game-updates/teamfight-tactics-patch-18-7/" target="_blank" rel="noopener noreferrer">Riot 18.7 공식 패치 노트</a><a href="https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-18-2/" target="_blank" rel="noopener noreferrer">Riot 18.2 패치 노트</a></div>
    <p class="disclaimer">TFT Profile은 Riot Games와 제휴하거나 후원·승인받은 공식 서비스가 아니야. 수치는 시즌18 일반 규칙을 기준으로 한 참고값이며, 패치·증강체·특수 모드에 따라 실제 게임과 다를 수 있어.</p>
  </section>
</article>
</template>
<style scoped>
.econ-page{max-width:1100px;margin:0 auto;display:grid;gap:20px}.econ-hero{padding:16px 0 8px}.econ-hero h1{font-size:clamp(26px,4vw,38px);letter-spacing:-.05em;margin:10px 0}.econ-hero>p:not(.eyebrow){color:#bfcbda;font-size:14px;max-width:850px}.econ-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}.econ-grid>*{min-width:0}.heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}.heading h2{margin:0}.heading button{background:#243344;border:1px solid #405365;color:#e2f4ee;border-radius:7px;padding:8px 12px;font-size:12px}.fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.fields label{display:grid;align-content:start;gap:8px;color:#cfdaea;font-size:13px;font-weight:600;min-width:0}.fields input:not([type=checkbox]),.fields select{width:100%;min-height:43px;border:1px solid #3b4a5e;border-radius:8px;background:#0e1622;color:#ecf2f8;padding:9px 11px}.fields input:disabled{opacity:.5}.fields small{color:#9eafc4;font-size:11px;font-weight:400;line-height:1.5}.unit{display:flex;align-items:center;border:1px solid #3b4a5e;border-radius:8px;background:#0e1622;padding-right:11px}.unit input{border:0!important;background:transparent!important}.unit span{color:#9eafc4;font-size:12px}.toggle{border:1px solid var(--border);border-radius:8px;padding:10px;display:grid!important;grid-template-columns:18px 1fr;align-items:center;column-gap:8px}.toggle input{grid-row:span 2;accent-color:var(--mint);width:16px;height:16px}.toggle small{grid-column:2}.progress{margin-top:20px;font-size:12px;color:#b9c7d8}.progress span{margin-right:12px}.progress b{color:var(--mint)}.track{height:9px;border-radius:99px;overflow:hidden;background:#29394b;margin-top:8px}.track i{display:block;height:100%;background:var(--mint);border-radius:inherit}.hint{color:#9eafc4;font-size:12px;line-height:1.7;margin:14px 0 0}.result{background:linear-gradient(135deg,#19302d,#151c29 78%);border-color:#3d625a}.big{display:block;color:#8ee2c3;font-size:clamp(36px,5vw,54px);font-weight:800;letter-spacing:-.05em;line-height:1.15;margin:20px 0 8px}.result>.muted{font-size:13px}.kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:22px 0}.kpis div{border:1px solid #36534e;border-radius:9px;padding:11px;min-width:0}.kpis span,.kpis small{display:block;color:#b1c2ce;font-size:11px;line-height:1.5}.kpis b{display:block;font-size:20px;margin:6px 0 3px;overflow-wrap:anywhere}.good,.warn{border-radius:8px;padding:10px 12px;font-size:13px;line-height:1.6;margin:12px 0}.good{background:#19332d;color:#a5e6cd}.warn{background:#3a2a25;color:#ffd1b0}.income-result{display:grid;grid-template-columns:.85fr 1.15fr;gap:14px;margin-top:18px}.income-total{background:#19302d;border:1px solid #36534e;border-radius:10px;padding:16px;display:flex;flex-direction:column;justify-content:center;gap:7px}.income-total span,.income-total small{color:#b5c8c3;font-size:12px}.income-total strong{color:var(--mint);font-size:34px;letter-spacing:-.04em}.breakdown{display:grid;grid-template-columns:1fr 1fr;gap:8px}.breakdown div{display:flex;justify-content:space-between;gap:6px;align-items:center;background:#111b29;border:1px solid var(--border);border-radius:8px;padding:11px;font-size:12px}.breakdown span{color:#aebdd0}.breakdown b{white-space:nowrap;color:#e5edf6}.table-scroll{overflow-x:auto}table{width:100%;min-width:520px;border-collapse:collapse;font-size:13px}th,td{padding:11px 10px;border-bottom:1px solid var(--border);text-align:center}th{color:#b8c7d8;font-weight:600}tbody tr.active{background:#1a3833;color:var(--mint)}.bands{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px;margin-top:16px}.bands div{border:1px solid var(--border);background:#111b29;border-radius:8px;padding:11px 5px;display:grid;gap:5px;text-align:center}.bands span{font-size:11px;color:#aebdd0}.bands b{font-size:16px}.bands .active{border-color:var(--mint);background:#19332d;color:var(--mint)}.guide{max-width:900px;padding:8px 0 32px}.guide h2{font-size:22px}.guide h3{font-size:15px;margin:22px 0 8px}.guide p{font-size:13px;color:#b8c8da;line-height:1.9}.links,.sources{display:flex;flex-wrap:wrap;gap:10px 20px;margin-top:20px;font-size:12px}.links a,.sources a{color:var(--mint);text-decoration:underline;text-underline-offset:4px}.sources{border-top:1px solid var(--border);padding-top:16px}.sources span{color:var(--muted)}.disclaimer{font-size:11px!important;color:var(--muted)!important}@media(max-width:820px){.econ-grid{grid-template-columns:1fr}}@media(max-width:560px){.econ-grid>.panel,.econ-income,.econ-reference{padding:18px}.fields{gap:12px}.income-result{grid-template-columns:1fr}.bands{grid-template-columns:repeat(3,minmax(0,1fr))}.big{font-size:40px}}
</style>