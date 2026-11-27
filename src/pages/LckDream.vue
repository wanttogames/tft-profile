<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { TEAMS, POSITIONS, LCK_STOVE_PATH } from '../data/lck2027';
import { LCK_DREAM_PATH, DREAM_CHECKED, DREAM_PLAYERS, ROLE_CODES, DREAM_STATUS, DREAM_THEMES, dreamPlayer, emptyDream, normalizeDream, encodeDream, decodeDream, filterDreamPlayers, selectDreamPlayer, randomDream, dreamStats, type DreamTheme } from '../data/lckDream';
import { dreamCardBlob } from '../utils/lckDreamCard';
import LckChangesNav from '../components/LckChangesNav.vue';
const props=defineProps<{query?:string}>();
const STORAGE='lck-dream-v1';
const dream=ref(emptyDream()), nameInput=ref(dream.value.name), ready=ref(false), active=ref(0), query=ref(''), status=ref('all'), team=ref('all'), message=ref(''), busy=ref(false);
const shareUrl=ref('');
const stats=computed(()=>dreamStats(dream.value));
const complete=computed(()=>stats.value.filled===5);
const selected=computed(()=>dream.value.picks.map(id=>dreamPlayer(id)));
const options=computed(()=>filterDreamPlayers(ROLE_CODES[active.value],query.value,status.value,team.value));
const colors=computed(()=>DREAM_THEMES[dream.value.theme]);
const styleVars=computed(()=>({'--dream-accent':colors.value.accent,'--dream-bg':colors.value.background,'--dream-panel':colors.value.panel}));
const origin='https://tft-profile.pages.dev';
function refreshLink(){shareUrl.value=origin+LCK_DREAM_PATH+'?'+encodeDream({...dream.value,name:nameInput.value});}
onMounted(()=>{
  const q=props.query??window.location.search;
  const incoming=decodeDream(q);
  if(incoming){dream.value=incoming;message.value='공유받은 드림팀을 불러왔습니다.';}
  else {try{const local=localStorage.getItem(STORAGE);if(local)dream.value=normalizeDream(JSON.parse(local));}catch{/* optional storage */}}
  nameInput.value=dream.value.name;
  ready.value=true;refreshLink();
});
watch([dream,nameInput],()=>{
  if(!ready.value)return;
  refreshLink();
  try{localStorage.setItem(STORAGE,JSON.stringify(normalizeDream({...dream.value,name:nameInput.value})));}catch{/* storage unavailable */}
},{deep:true});
function setRole(i:number){active.value=i;query.value='';}
function pick(id:string){dream.value=selectDreamPlayer(dream.value,active.value,id);message.value='';const i=dream.value.picks.findIndex(p=>!p);if(i!==-1)setRole(i);}
function clearRole(i:number){dream.value=selectDreamPlayer(dream.value,i,'');setRole(i);}
function setTheme(theme:DreamTheme){dream.value={...dream.value,theme};}
function randomize(){dream.value=randomDream(dream.value,status.value==='confirmed');message.value='랜덤 드림팀을 구성했습니다.';}
function reset(){dream.value=emptyDream();nameInput.value=dream.value.name;active.value=0;query.value='';status.value='all';team.value='all';message.value='초기화했습니다.';}
function snapshot(){return normalizeDream({...dream.value,name:nameInput.value});}
async function copyLink(){
  refreshLink();
  try{await navigator.clipboard.writeText(shareUrl.value);message.value='공유 링크를 복사했습니다.';}catch{message.value='자동 복사가 지원되지 않습니다. 아래 링크를 직접 복사해 주세요.';}
}
async function share(){
  refreshLink();
  if(typeof navigator.share!=='function'){await copyLink();return;}
  try{await navigator.share({title:snapshot().name+' · LCK 드림팀',text:'나만의 LCK 드림팀을 확인하세요.',url:shareUrl.value});message.value='공유를 완료했습니다.';}
  catch(e){if(!(e instanceof Error&&e.name==='AbortError'))await copyLink();}
}
async function savePng(){
  if(!complete.value||busy.value)return;
  busy.value=true;message.value='';
  try{const blob=await dreamCardBlob(snapshot());const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='lck-dream-team.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);message.value='PNG 카드 저장을 요청했습니다.';}
  catch{message.value='카드 생성에 실패했습니다. 다른 브라우저에서 다시 시도해 주세요.';}
  finally{busy.value=false;}
}
</script>
<template>
<article class="dream">
  <nav class="crumb" aria-label="현재 위치"><a href="/">홈</a> / <a :href="LCK_STOVE_PATH">LCK 스토브리그</a> / 드림팀</nav>
  <header class="hero"><p class="eyebrow">LCK · FAN TEAM BUILDER</p><h1>나만의 LCK 드림팀 만들기</h1><p>탑부터 서포터까지 원하는 선수 다섯 명을 골라 가상 로스터를 만들고 친구에게 공유하세요.</p><span class="small muted">2027 스토브리그 데이터 · {{DREAM_CHECKED}} 기준 · {{DREAM_PLAYERS.length}}명 선택 가능</span></header>
  <LckChangesNav :path="LCK_DREAM_PATH"/>
  <div class="builder">
    <section class="panel edit">
      <h2>1. 팀 이름과 카드 스타일</h2>
      <label class="field">팀 이름 (최대 24자)<input v-model="nameInput" type="text" maxlength="24" placeholder="MY DREAM TEAM"/></label>
      <div class="themes" aria-label="카드 테마"><button v-for="(t,key) in DREAM_THEMES" :key="key" type="button" :aria-pressed="dream.theme===key" @click="setTheme(key)"><i :style="{background:t.accent}"></i>{{t.label}}</button></div>
      <h2>2. 포지션별 선수 선택</h2>
      <div class="roles" aria-label="포지션 선택"><button v-for="(role,i) in ROLE_CODES" :key="role" type="button" :aria-pressed="active===i" @click="setRole(i)"><span>{{role}}</span><small>{{selected[i]?.player??POSITIONS[i]}}</small></button></div>
      <div class="filters"><label class="field">선수 검색<input v-model="query" type="search" placeholder="Faker, 페이커, T1…"/></label>
      <label class="field">선수 상태<select v-model="status"><option value="all">전체</option><option value="confirmed">발표·계약 확인</option><option value="market">거취 미확정</option><option value="reported">보도·전망</option></select></label>
      <label class="field">소속·이전 팀<select v-model="team"><option value="all">전체 팀</option><option v-for="t in TEAMS" :key="t.slug" :value="t.slug">{{t.name}}</option></select></label></div>
      <p class="small muted" aria-live="polite">{{POSITIONS[active]}} · {{options.length}}명</p>
      <div class="player-list">
        <button v-for="p in options" :key="p.id" type="button" :aria-pressed="dream.picks[active]===p.id" @click="pick(p.id)"><div><strong>{{p.player}}</strong><small>{{p.context}}</small></div><span class="tag" :class="p.status">{{DREAM_STATUS[p.status]}}</span></button>
        <p v-if="!options.length" class="small muted">조건에 맞는 선수가 없습니다. 검색어나 필터를 변경하세요.</p>
      </div>
      <div class="actions"><button type="button" class="secondary" @click="randomize">랜덤 팀 구성</button><button type="button" class="secondary" @click="reset">초기화</button></div>
      <p class="small muted">랜덤 구성은 ‘발표·계약 확인’ 필터를 선택하면 확인된 선수만 사용하며, 그 외에는 전체 풀에서 선택합니다. 능력치·승률을 예측하지 않습니다.</p>
    </section>
    <section class="preview">
      <div class="panel preview-panel">
        <div class="section-head"><h2>3. 드림팀 미리보기</h2><span class="small muted">{{stats.filled}} / 5</span></div>
        <div class="card-preview" :style="styleVars">
          <p class="kicker">LCK 2027 / FAN DREAM TEAM</p>
          <h3>{{nameInput.trim()||'MY DREAM TEAM'}}</h3><p class="subtitle">나만의 LCK 드림팀 · 가상 로스터</p>
          <div v-for="(p,i) in selected" :key="ROLE_CODES[i]" class="preview-row">
            <div class="role-label">{{ROLE_CODES[i]}}<small>{{POSITIONS[i]}}</small></div>
            <button class="pick-label" type="button" @click="setRole(i)"><strong>{{p?.player??'선수 선택'}}</strong><small>{{p?.context??'클릭하여 선택'}}</small></button>
            <div class="pick-right"><span v-if="p" class="tag" :class="p.status">{{DREAM_STATUS[p.status]}}</span><button v-if="p" type="button" class="clear" :aria-label="POSITIONS[i]+' 선수 제거'" @click="clearRole(i)">×</button></div>
          </div>
          <footer>TFT PROFILE <span>비공식 팬 콘텐츠</span></footer>
        </div>
        <div class="metrics"><div><b>{{stats.confirmed}}</b><small>확인 선수</small></div><div><b>{{stats.unconfirmed}}</b><small>거취 미확정</small></div><div><b>{{stats.teams}}</b><small>확인 소속팀 수</small></div></div>
        <h2>4. 결과 공유하기</h2>
        <p class="small muted">5개 포지션을 채우면 공유 및 PNG 카드 저장이 가능합니다.</p>
        <div class="actions share-actions"><button type="button" class="png-save" :disabled="!ready||!complete||busy" @click="savePng">{{busy?'생성 중…':'PNG 카드 저장'}}</button><button type="button" class="secondary" :disabled="!ready||!complete" @click="copyLink">링크 복사</button><button type="button" class="secondary" :disabled="!ready||!complete" @click="share">공유</button></div>
        <label v-if="ready&&complete" class="field">공유 URL<input :value="shareUrl" readonly @focus="($event.target as HTMLInputElement).select()"/></label>
        <p v-if="message" role="status" class="message">{{message}}</p>
        <p class="small muted">구성은 브라우저에 자동 저장됩니다. 링크에는 팀 이름·선수 선택·테마가 포함되며 서버에 개인 로스터를 저장하지 않습니다. 브라우저 데이터를 삭제하면 저장 내용도 사라집니다.</p>
      </div>
    </section>
  </div>
  <section class="panel guide"><h2>LCK 드림팀 구성 방법</h2><p>팀 이름과 테마를 설정하고 탑, 정글, 미드, 원딜, 서포터를 한 명씩 선택하세요. 포지션은 기존 로스터 및 FA 자료 기준으로 제한되며 동일 선수를 중복 선택할 수 없습니다. 확인되지 않은 선수도 가상의 드림팀에 사용할 수 있습니다.</p><p>선수 풀은 2027 로스터, FA 추적 대상, 기존에 수록된 이적 보도·전망을 중복 제거한 정적 자료입니다. 공식 로스터나 실제 영입 가능성을 뜻하지 않습니다. 구단 로고·선수 사진 없이 이름 중심의 자체 카드 디자인을 사용합니다.</p><p><a :href="LCK_STOVE_PATH">2027 LCK 실제 로스터 확인 →</a></p></section>
</article>
</template>
<style scoped>
.dream{max-width:1120px;margin:auto;display:grid;gap:16px}.crumb{font-size:12px;color:var(--muted)}.hero{padding:clamp(20px,4vw,36px);border:1px solid var(--border);border-radius:14px;background:linear-gradient(120deg,#192e32,#141b29)}.hero h1{font-size:clamp(25px,4vw,40px);margin:8px 0 12px;letter-spacing:-.05em}.hero p:not(.eyebrow){font-size:14px;color:#bdc8d7}.builder{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}.edit,.preview-panel,.guide{margin:0;min-width:0}.edit h2,.preview-panel h2{font-size:17px;margin:14px 0 12px}.edit h2:first-child{margin-top:0}.field{display:grid;gap:6px;font-size:12px;color:var(--muted);min-width:0}.field input,.field select{width:100%;min-width:0;box-sizing:border-box;min-height:44px;padding:10px;border:1px solid #405165;border-radius:8px;background:#101a27;color:#ecf2f8;font:inherit}.themes,.actions,.roles{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.themes button,.roles button{background:#101a27;border:1px solid var(--border);border-radius:8px;color:#ccd9e6;padding:10px;cursor:pointer;font:inherit;font-size:12px;min-height:44px}.themes button i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px}.themes button[aria-pressed=true],.roles button[aria-pressed=true]{border-color:var(--mint);color:var(--mint);background:#19332d}.roles button{flex:1;min-width:65px;display:grid;gap:5px;text-align:center}.roles button span{font-weight:700}.roles small{font-size:10px;overflow-wrap:anywhere}.filters{display:grid;grid-template-columns:1fr 1fr;gap:8px}.filters label:first-child{grid-column:1/-1}.player-list{display:grid;gap:7px;max-height:365px;overflow:auto;padding-right:4px}.player-list button{display:flex;justify-content:space-between;align-items:center;text-align:left;gap:8px;background:#141f2d;border:1px solid var(--border);border-radius:8px;color:#e9eff6;min-height:56px;padding:10px;cursor:pointer}.player-list button[aria-pressed=true]{border-color:var(--mint)}.player-list strong,.player-list small{display:block}.player-list small{font-size:11px;color:#b5c4d4;margin-top:4px}.tag{font-size:10px;color:#f1cb8a;background:#3b3027;border-radius:5px;padding:5px 7px;white-space:normal}.tag.confirmed{color:#a0e1c7;background:#183c33}.section-head{display:flex;justify-content:space-between;align-items:center}.card-preview{border-top:5px solid var(--dream-accent);background:var(--dream-bg);border-radius:12px;padding:18px;overflow:hidden}.card-preview .kicker{color:var(--dream-accent);font-size:11px;font-weight:700;letter-spacing:.08em}.card-preview h3{font-size:clamp(20px,3vw,30px);color:#f5f7ff;margin:8px 0;overflow-wrap:anywhere}.subtitle{font-size:11px;color:#bdccda}.preview-row{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:8px;align-items:center;background:var(--dream-panel);border-left:3px solid var(--dream-accent);padding:10px;margin:7px 0;min-height:65px}.role-label{font-size:12px;font-weight:700;color:var(--dream-accent)}.role-label small,.pick-label small{display:block;font-size:10px;color:#bdccda;margin-top:5px;font-weight:400}.pick-label{min-width:0;text-align:left;background:transparent;border:0;padding:5px 0;color:#f5f7ff;font:inherit;cursor:pointer;overflow-wrap:anywhere}.pick-label strong{font-size:16px}.pick-right{display:grid;justify-items:end;gap:3px}.clear{padding:0 8px;min-height:24px;border:0;background:transparent;color:#d3dfeb;cursor:pointer;font-size:20px}.card-preview footer{display:flex;justify-content:space-between;gap:5px;font-size:10px;color:var(--dream-accent);margin-top:14px}.card-preview footer span{color:#bdccda}.metrics{display:grid;grid-template-columns:repeat(3,1fr);text-align:center;margin:14px 0;gap:5px}.metrics b,.metrics small{display:block}.metrics b{font-size:23px;color:var(--mint)}.metrics small{font-size:11px;color:var(--muted)}.actions button{min-height:44px}.share-actions .png-save{background:#8ee2c3;color:#122b24;border:1px solid #8ee2c3;border-radius:8px;padding:10px 16px;font-size:13px;font-weight:700;line-height:1.4}.share-actions .png-save:hover:not(:disabled){background:#b5f1da;border-color:#b5f1da;color:#122b24}.share-actions .png-save:active:not(:disabled){background:#75cba9;border-color:#75cba9}.share-actions .png-save:focus-visible{outline:2px solid var(--mint);outline-offset:3px}.share-actions button:disabled{opacity:.45;cursor:not-allowed}.share-actions .png-save:disabled{background:#243345;color:#a9b8ca;border-color:#405165;opacity:1}.message{font-size:13px;color:var(--mint);overflow-wrap:anywhere}.guide p{font-size:13px;line-height:1.8;color:#afbed0}.guide a{color:var(--mint)}@media(max-width:760px){.builder{grid-template-columns:1fr}.preview-row{padding:8px}.edit,.preview-panel{padding:14px}}@media(max-width:360px){.preview-row{grid-template-columns:42px minmax(0,1fr)}.pick-right{grid-column:2;display:flex;justify-content:space-between}.card-preview{padding:10px}}
</style>
