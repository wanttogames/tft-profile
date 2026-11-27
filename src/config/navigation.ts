import { LCK_INTERNATIONAL_PATH } from '../data/lckInternational';

import { TIER_LIST_PATH } from '../meta/tierPages';

export type NavGroupId = 'analysis' | 'tools' | 'season' | 'lck' | 'history';
export type NavSectionId='roster'|'contracts'|'dream'|'people'|'results';
export interface NavItem { label:string; href:string; description:string; match?:'prefix'; aliases?:readonly string[]; section?:NavSectionId }
export interface NavGroup { id:NavGroupId; label:string; items:readonly NavItem[] }
// Keep URLs here as stable public entry points; routing remains in App.vue.
export const NAV_GROUPS:readonly NavGroup[] = [
 {id:'analysis',label:'TFT 분석',items:[
  {label:'개인 플레이 분석',href:'/',description:'전적과 플레이 성향',aliases:['/profile']},
  {label:'메타 통계',href:'/meta',description:'상위 랭커 경기 분석'},
  {label:'메타 티어리스트',href:TIER_LIST_PATH,description:'챔피언·아이템·특성 S~D 등급',match:'prefix'},
  {label:'챔피언 통계',href:'/champions',description:'챔피언별 평균 등수와 TOP4'},
  {label:'아이템 통계',href:'/items',description:'아이템별 성적'},
  {label:'특성 통계',href:'/traits',description:'시너지별 성적'},
 ]},
 {id:'tools',label:'TFT 계산기',items:[
  {label:'리롤 확률 계산기',href:'/tools/reroll-calculator',description:'레벨·코스트별 등장 확률'},
  {label:'아이템 조합',href:'/tools/item-calculator',description:'보유 재료와 완성 아이템'},
  {label:'골드·레벨업',href:'/tools/economy-calculator',description:'경제와 경험치 계산'},
 ]},
 {id:'season',label:'시즌 정보',items:[
  {label:'시즌19 가이드',href:'/set19',description:'시즌 핵심 정보',match:'prefix'},
  {label:'해금 도감',href:'/set19/unlocks',description:'챔피언별 해금 조건',match:'prefix'},
 ]},
 {id:'lck',label:'LCK',items:[
  {label:'스토브리그',href:'/esports/lck/2027/stove-league',section:'roster',description:'2027 로스터 현황'},
  {label:'이적 타임라인',href:'/esports/lck/2027/timeline',section:'roster',description:'영입·결별 발표'},
  {label:'로스터 비교',href:'/esports/lck/2027/compare',section:'roster',description:'2026 → 2027 선수 변화'},
  {label:'FA 선수',href:'/esports/lck/2027/free-agents',section:'contracts',description:'선수 거취 현황'},
  {label:'계약 만료일',href:'/esports/lck/2027/contracts',section:'contracts',description:'계약 기간과 공식 명부'},
  {label:'드림팀 만들기',href:'/esports/lck/dream-team',section:'dream',description:'나만의 선수 조합'},
 ]},
 {id:'history',label:'e스포츠 역사',items:[
  {label:'역대 로스터',href:'/esports/lck/history',section:'people',description:'2015~2027 팀별 명단',match:'prefix'},
  {label:'선수 이력 도감',href:'/esports/lck/history/players',section:'people',description:'역대 소속팀 기록',match:'prefix'},
  {label:'역대 우승·순위',href:'/esports/lck/history/results',section:'results',description:'대회 성적과 MVP',match:'prefix'},
  {label:'국제대회',href:LCK_INTERNATIONAL_PATH,section:'results',description:'First Stand·MSI·월즈 LCK 결승 기록'},
 ]},
];
export const SERVICE_LINKS:readonly NavItem[]=[
 {label:'사용 가이드',href:'/guide',description:'분석 지표 읽는 방법'},
 {label:'서비스 소개',href:'/about',description:'데이터와 분석 기준'},
 {label:'개인정보처리방침',href:'/privacy',description:'개인정보 처리 안내'},
 {label:'이용약관',href:'/terms',description:'서비스 이용 조건'},
 {label:'Riot Games 비제휴 고지',href:'/#riot-disclaimer',description:'상표 및 비제휴 안내'},
];
export interface ActiveNav {group:NavGroupId;href:string}
export function activeNavigation(rawPath:string,section?:'profile'|'meta'):ActiveNav|null{
 const path=rawPath.replace(/\/+$/,'')||'/';
 if(path==='/'&&section==='meta')return {group:'analysis',href:'/meta'};
 let best:ActiveNav|null=null,score=-1;
 for(const group of NAV_GROUPS)for(const item of group.items){
  const exact=path===item.href||item.aliases?.includes(path);
  const nested=item.match==='prefix'&&path.startsWith(item.href+'/');
  const weight=exact?10000+item.href.length:nested?item.href.length:-1;
  if(weight>score){best={group:group.id,href:item.href};score=weight;}
 }
 // Team detail pages share the stove hub. Match only single-segment team paths,
 // after the exact links above, so FA, compare, etc. keep their own selection.
 if(!best&&/^\/esports\/lck\/2027\/[a-z0-9-]+$/.test(path))return {group:'lck',href:'/esports/lck/2027/stove-league'};
 return best;
}
export function navItems(id:NavGroupId):readonly NavItem[]{return NAV_GROUPS.find(g=>g.id===id)?.items??[];}

export interface NavSection {id:NavSectionId;label:string;shortLabel:string;description:string;items:readonly NavItem[];href:string}
const SECTION_DEFS:Record<NavSectionId,{label:string;shortLabel:string;description:string}>={
 roster:{label:'로스터·이적',shortLabel:'로스터·이적',description:'팀 구성과 선수 이동'},
 contracts:{label:'FA·계약 정보',shortLabel:'FA·계약',description:'계약 상태와 기간'},
 dream:{label:'드림팀',shortLabel:'드림팀',description:'나만의 로스터 만들기'},
 people:{label:'팀·선수 역사',shortLabel:'팀·선수',description:'시즌별 로스터와 선수 이력'},
 results:{label:'대회 역사',shortLabel:'대회 역사',description:'우승팀·순위·수상 기록'},
};
export function navSections(id:NavGroupId):NavSection[]{
 const items=navItems(id);
 const ids=[...new Set(items.flatMap(item=>item.section?[item.section]:[]))];
 return ids.map(section=>{
  const links=items.filter(item=>item.section===section);
  return {id:section,...SECTION_DEFS[section],items:links,href:links[0]!.href};
 });
}
export function activeNavSection(path:string):NavSection|null{
 const active=activeNavigation(path);
 return active?navSections(active.group).find(section=>section.items.some(item=>item.href===active.href))??null:null;
}
