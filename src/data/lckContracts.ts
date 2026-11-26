import { GCD, syncedExpiry } from './lckGcd';
import { LCK_BASE, TEAMS, POSITIONS, type Report, type Status } from './lck2027';

export const LCK_FA_PATH = LCK_BASE + '/free-agents';
export const LCK_CONTRACTS_PATH = LCK_BASE + '/contracts';
export const CONTRACTS_CHECKED = '2026-11-26';
export const GCD_SNAPSHOT = GCD.sourceDate ?? '2026-11-16 PT (수동 기준)';
export const CONTRACT_SOURCES = {
  gcd: {label:'Riot 공식 계약 명부 (GCD)',url:'https://docs.google.com/spreadsheets/d/1Y7k5kQ2AegbuyiGwEPsa62e883FYVtHqr6UVut9RC4o/pubhtml'},
  archive: {label:'GCD 11/16 스냅샷 및 구단 발표 대조 · LoL2LLM',url:'https://lol2llm.com/ko/esports/lck-2027-roster-changes'},
  market: {label:'1군 FA·발표 대기 명단 · LoL 스토브 (11/26)',url:'https://lol-stove.ps-esports.kr/lck/fa'},
  roster: {label:'구단 발표 취합 · LoL 스토브',url:'https://lol-stove.ps-esports.kr/lck'},
  genAnnouncement: {label:'국민일보 · 젠지 관계자 계약 기간 확인 (11/24)',url:'https://www.kmib.co.kr/article/20261124502119'},
  officialTimeline: {label:'구단 발표 취합 · 11/25 계약 기간',url:'https://lol-stove.ps-esports.kr/lck/timeline'},
  secondary: {label:'계약 기간 보조 확인 · JJANG.GG (11/26)',url:'https://jjang.gg/stove-league'},
};
export type SourceKey = keyof typeof CONTRACT_SOURCES;
export type Precision = 'day' | 'month' | 'year' | 'season' | 'unknown';
export interface ContractTerm { value: string; precision: Exclude<Precision,'unknown'>; source: SourceKey; note?: string }
export interface ContractRow { player:string; team:string; position:string; status:Exclude<Status,'pending'>; term:ContractTerm|null }
export interface MarketRow {player:string; team:string; position:string; status:'departed'|'awaiting'; reports: {team:string; report:Report}[]; source:SourceKey}
const day = (value:string): ContractTerm => ({value,precision:'day',source:'archive'});
const year = (value:string): ContractTerm => ({value,precision:'year',source:'archive'});
const season = (value:string): ContractTerm => ({value,precision:'season',source:'archive'});
const month = (value:string): ContractTerm => ({value,precision:'month',source:'secondary'});
// Team + player keys prevent applying an OLD team's GCD expiry to a new signing.
const TERMS: Record<string,ContractTerm> = {
  't1:zeus': {value:'2029',precision:'year',source:'officialTimeline'},
  'geng:siwoo': {value:'2027',precision:'season',source:'genAnnouncement'}, 'geng:sharvel': {value:'2027',precision:'season',source:'genAnnouncement'}, 'geng:cloud': {value:'2027',precision:'season',source:'genAnnouncement'},
  'bfx:thanatos': {value:'2028',precision:'year',source:'officialTimeline'},
  't1:oner': day('2028-11-20'), 't1:faker': day('2029-11-19'), 't1:peyz': day('2028-11-20'), 't1:keria': day('2029-11-19'),
  'geng:chovy': day('2027-11-15'), 'geng:ruler': day('2027-11-15'),
  'hle:zeka': day('2027-11-15'), 'hle:gumayusi': day('2027-11-15'),
  'dk:lucid': day('2027-11-15'), 'dk:showmaker': season('2027'), 'dk:smash': season('2027'),
  'kt:perfect': day('2028-11-20'), 'kt:bdd': day('2028-11-20'), 'kt:kellin': month('2028-11'),
  'ns:kingen': year('2028'), 'ns:calix': year('2028'),
  'bfx:vicla': day('2027-11-15'), 'bfx:vincenzo': year('2028'),
  'dns:dudu': day('2028-11-20'), 'dns:deokdam': day('2027-11-15'), 'dns:cuzz': season('2027'), 'dns:ucal': season('2027'), 'dns:bluffing': year('2028'),
  'bro:casting': day('2028-11-20'), 'bro:gideon': day('2027-11-15'), 'bro:roamer': day('2027-11-15'), 'bro:teddy': day('2027-11-15'), 'bro:namgung': day('2027-11-15'), 'bro:setab': month('2027-11'),
};
export function lookupTerm(team:string,player:string|null): ContractTerm|null {
  const synced = syncedExpiry(team,player);
  if(synced)return {value:synced,precision:'day',source:'gcd'};
  return player ? TERMS[team+':'+player.toLowerCase()]??null : null;
}
export function termLabel(term:ContractTerm|null):string {
  if (!term) return '기간 미확인';
  if (term.precision==='day') return term.value;
  if (term.precision==='month') return term.value+' (일자 미확인)';
  if (term.precision==='year') return term.value+'년까지 (일자 미확인)';
  return term.value+' 시즌 계약 (종료일 미확인)';
}
export const PRECISION_LABEL: Record<Precision,string> = {day:'GCD 일자',month:'월 확인',year:'연도 확인',season:'시즌 확인',unknown:'미확인'};
export const CONTRACT_ROWS: ContractRow[] = TEAMS.flatMap<ContractRow>(t=>t.slots.flatMap<ContractRow>((s,i)=>
  s.player && s.status!=='pending' ? [{player:s.player,team:t.slug,position:POSITIONS[i],status:s.status,term:lookupTerm(t.slug,s.player)}] : []
));
// Two additional officially confirmed first-team members, not extra starting positions.
CONTRACT_ROWS.push(
  {player:'Lucid',team:'dk',position:'정글',status:'contract',term:lookupTerm('dk','Lucid')},
  {player:'SeTab',team:'bro',position:'미드',status:'signed',term:lookupTerm('bro','SeTab')},
);
const candidates: [string,string,string,'departed'|'awaiting'][] = [
  ['Kiin','geng','탑','departed'], ['Zeus','hle','탑','departed'], ['Siwoo','dk','탑','departed'], ['Clear','bfx','탑','departed'], ['Rich','krx','탑','departed'],
  ['Canyon','geng','정글','departed'], ['Sharvel','dns','정글','departed'], ['Willer','krx','정글','departed'], ['Sponge','ns','정글','awaiting'],
  ['Daystar','bfx','미드','departed'], ['Clozer','dns','미드','departed'], ['Pungyeon','bro','미드','departed'], ['Scout','ns','미드','awaiting'],
  ['Jiwoo','kt','원딜','departed'], ['Taeyoon','bfx','원딜','departed'], ['Aiming','krx','원딜','departed'], ['Diable','ns','원딜','awaiting'],
  ['Duro','geng','서포터','departed'], ['Career','dk','서포터','departed'], ['Effort','kt','서포터','departed'], ['Peter','dns','서포터','departed'], ['Lehends','ns','서포터','awaiting'],
];
// Announced exits without a confirmed next team in the curated 1st-team snapshot.
// Four NS departures are listed separately as destination-pending by the market source.
// Missing announcements are NOT proof of current worldwide free agency.
export const MARKET_ROWS: MarketRow[] = candidates.filter(([player])=>!CONTRACT_ROWS.some(r=>r.player.toLowerCase()===player.toLowerCase())).map<MarketRow>(([player,team,position,status])=>({
  player,team,position,status,source:'market',
  reports:TEAMS.flatMap(t=>t.slots.flatMap(s=>s.report?.player.toLowerCase()===player.toLowerCase() ? [{team:t.slug,report:s.report}] : [])),
}));
export const teamForContract = (slug:string)=>TEAMS.find(t=>t.slug===slug);
const KOREAN: Record<string,string> = {cloud:'클라우드',thanatos:'타나토스',haetae:'해태',viper:'바이퍼',faker:'페이커',keria:'케리아',oner:'오너',peyz:'페이즈',chovy:'쵸비',ruler:'룰러',duro:'듀로',zeka:'제카',gumayusi:'구마유시',lucid:'루시드',showmaker:'쇼메이커',smash:'스매쉬 스매시',perfect:'퍼펙트',bdd:'비디디',kellin:'켈린',kingen:'킹겐',calix:'칼릭스',vicla:'빅라',vincenzo:'빈첸조',dudu:'두두',deokdam:'덕담',cuzz:'커즈',ucal:'유칼',bluffing:'블러핑',casting:'캐스팅',gideon:'기드온',roamer:'로머',teddy:'테디',namgung:'남궁',setab:'세탭',doran:'도란',kanavi:'카나비',delight:'딜라이트',raptor:'랩터',pyosik:'표식',deft:'데프트',andil:'안딜',noah:'노아',kiin:'기인',zeus:'제우스',siwoo:'시우',clear:'클리어',rich:'리치',canyon:'캐니언',sharvel:'샤벨',willer:'윌러',sponge:'스폰지',daystar:'데이스타',clozer:'클로저',pungyeon:'풍연',scout:'스카웃',jiwoo:'지우',taeyoon:'태윤',aiming:'에이밍',diable:'디아블',career:'커리어',effort:'에포트',peter:'피터',lehends:'리헨즈'};
export const playerKoreanName = (player:string):string => KOREAN[player.toLowerCase()]??'';
function matchRow(row:{player:string;team:string;position:string},query:string,team:string,position:string) {
  const q=query.trim().toLowerCase();
  return (team==='all'||row.team===team)&&(position==='all'||row.position===position)&&(!q||[row.player,row.position,KOREAN[row.player.toLowerCase()],teamForContract(row.team)?.name,teamForContract(row.team)?.code].some(v=>v?.toLowerCase().includes(q)));
}
export function filterContracts(query='',team='all',position='all',period='all') {
  return CONTRACT_ROWS.filter(r=>matchRow(r,query,team,position)&&(period==='all'||(period==='unknown'?!r.term:r.term?.value.slice(0,4)===period)))
    .sort((a,b)=>(a.term?.value??'9999').localeCompare(b.term?.value??'9999')||a.player.localeCompare(b.player));
}
export function filterMarket(query='',team='all',position='all',status='all') {
  return MARKET_ROWS.filter(r=>matchRow(r,query,team,position)&&(status==='all'||r.status===status));
}
export function contractSummary() {
  return {total:CONTRACT_ROWS.length,exact:CONTRACT_ROWS.filter(r=>r.term?.precision==='day').length,partial:CONTRACT_ROWS.filter(r=>r.term&&r.term.precision!=='day').length,unknown:CONTRACT_ROWS.filter(r=>!r.term).length};
}
export const CONTRACT_YEARS = [...new Set(CONTRACT_ROWS.flatMap(r=>r.term?[r.term.value.slice(0,4)]:[]))].sort();
