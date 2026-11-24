import { TEAMS, POSITIONS, LCK_CHECKED } from './lck2027';
import { CONTRACT_ROWS, MARKET_ROWS, playerKoreanName } from './lckContracts';

export const LCK_DREAM_PATH = '/esports/lck/dream-team';
export const DREAM_CHECKED = LCK_CHECKED;
export const ROLE_CODES = ['TOP','JGL','MID','ADC','SUP'] as const;
export type DreamRole = typeof ROLE_CODES[number];
export type DreamStatus = 'confirmed'|'market'|'reported';
export interface DreamPlayer { id:string; player:string; role:DreamRole; team:string|null; status:DreamStatus; context:string }
export interface Dream { name:string; theme:DreamTheme; picks:string[] }
export const DREAM_THEMES = {
  mint:{label:'민트 아레나',accent:'#77e2c0',background:'#101b28',panel:'#1a2d39'},
  gold:{label:'골드 챔피언',accent:'#f1cd78',background:'#201a20',panel:'#362c2b'},
  violet:{label:'바이올렛',accent:'#c6afff',background:'#18182e',panel:'#292541'},
} as const;
export type DreamTheme = keyof typeof DREAM_THEMES;
export const DREAM_STATUS:Record<DreamStatus,string>={confirmed:'발표·계약 확인',market:'거취 미확정',reported:'보도·전망'};
const pool=new Map<string,DreamPlayer>();
function insert(player:string,role:DreamRole,team:string|null,status:DreamStatus,context:string) {
  const id=role.toLowerCase()+'-'+player.toLowerCase();
  if(!pool.has(id)) pool.set(id,{id,player,role,team,status,context});
}
for(const r of CONTRACT_ROWS){
  const role=ROLE_CODES[POSITIONS.findIndex(p=>p===r.position)];
  if(role)insert(r.player,role,r.team,'confirmed',TEAMS.find(t=>t.slug===r.team)?.code??r.team);
}
for(const r of MARKET_ROWS){
  const role=ROLE_CODES[POSITIONS.findIndex(p=>p===r.position)];
  if(role)insert(r.player,role,r.team,'market',(TEAMS.find(t=>t.slug===r.team)?.code??r.team)+' (이전 팀)');
}
for(const t of TEAMS)t.slots.forEach((s,i)=>{
  if(s.report)insert(s.report.player,ROLE_CODES[i],null,'reported',t.code+' 합류 '+(s.report.level==='reported'?'보도':'전망'));
});
export const DREAM_PLAYERS=[...pool.values()].sort((a,b)=>a.player.localeCompare(b.player,'en'));
export function dreamPlayer(id:string):DreamPlayer|undefined{return pool.get(id);}
export function cleanDreamName(value:string):string {
  return Array.from(value.replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,' ').trim()).slice(0,24).join('')||'MY DREAM TEAM';
}
export function emptyDream():Dream{return {name:'MY DREAM TEAM',theme:'mint',picks:['','','','','']};}
export function normalizeDream(value:unknown):Dream{
  const raw=value && typeof value==='object'?value as Partial<Dream>:{};
  const seen=new Set<string>();
  const picks=ROLE_CODES.map((role,i)=>{
    const id=Array.isArray(raw.picks)&&typeof raw.picks[i]==='string'?raw.picks[i]:'';
    const p=dreamPlayer(id);
    if(!p||p.role!==role||seen.has(p.player.toLowerCase()))return '';
    seen.add(p.player.toLowerCase());return id;
  });
  return {name:cleanDreamName(typeof raw.name==='string'?raw.name:''),theme:typeof raw.theme==='string'&&Object.hasOwn(DREAM_THEMES,raw.theme)?raw.theme:'mint',picks};
}
export function encodeDream(value:Dream):string{
  const d=normalizeDream(value);
  return new URLSearchParams({v:'1',name:d.name,theme:d.theme,p:d.picks.join(',')}).toString();
}
export function decodeDream(query:string):Dream|null{
  if(query.length>1800)return null;
  const q=new URLSearchParams(query);
  if(q.get('v')!=='1'||!q.has('p'))return null;
  return normalizeDream({name:q.get('name'),theme:q.get('theme'),picks:(q.get('p')??'').split(',')});
}
export function filterDreamPlayers(role:DreamRole,query='',status='all',team='all'):DreamPlayer[]{
  const q=query.trim().toLowerCase();
  return DREAM_PLAYERS.filter(p=>p.role===role&&(status==='all'||p.status===status)&&(team==='all'||p.team===team)
    &&(!q||[p.player,playerKoreanName(p.player),p.context,TEAMS.find(t=>t.slug===p.team)?.name].some(v=>v?.toLowerCase().includes(q))));
}
export function selectDreamPlayer(d:Dream,index:number,id:string):Dream{
  if(!Number.isInteger(index)||index<0||index>=ROLE_CODES.length)return normalizeDream(d);
  const picks=[...d.picks];picks[index]=id;
  return normalizeDream({...d,picks});
}
export function randomDream(d:Dream,confirmedOnly=false,random=Math.random):Dream{
  const used=new Set<string>();
  const picks=ROLE_CODES.map(role=>{
    const options=filterDreamPlayers(role,'',confirmedOnly?'confirmed':'all').filter(p=>!used.has(p.player.toLowerCase()));
    if(!options.length)return '';
    const i=Math.min(options.length-1,Math.max(0,Math.floor(random()*options.length)));
    const p=options[i];if(!p)return '';used.add(p.player.toLowerCase());return p.id;
  });
  return normalizeDream({...d,picks});
}
export function dreamStats(d:Dream){
  const selected=normalizeDream(d).picks.flatMap(id=>{const p=dreamPlayer(id);return p?[p]:[];});
  return {filled:selected.length,confirmed:selected.filter(p=>p.status==='confirmed').length,unconfirmed:selected.filter(p=>p.status!=='confirmed').length,teams:new Set(selected.flatMap(p=>p.status==='confirmed'&&p.team?[p.team]:[])).size};
}
