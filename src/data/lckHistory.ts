import { LEGACY_ROSTERS, LEGACY_TEAMS, LEGACY_ALIASES, LEGACY_KOREAN } from './lckHistoryLegacy';
import { TEAMS, POSITIONS, LCK_CHECKED } from './lck2027';
import { LAST_2026, BASELINE_SOURCE } from './lckChanges';
import { CONTRACT_ROWS, playerKoreanName } from './lckContracts';
export const LCK_HISTORY_PATH = '/esports/lck/history';
export const HISTORY_PLAYERS_PATH = LCK_HISTORY_PATH + '/players';
export const HISTORY_YEARS = [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025,2026,2027] as const;
export type HistoryYear = typeof HISTORY_YEARS[number];
export const HISTORY_PERIODS: Record<HistoryYear,{label:string;description:string;sources:{label:string;url:string}[]}> = {
  2015:{label:'스프링 대표 로스터',description:'2015 스프링 대회에 수록된 대표 선수 및 일부 교체 선수. 개막일 전체 등록 명단이나 시즌 전체 이력이 아닙니다.',sources:[{label:'Liquipedia · 2015 LCK Spring 참가 팀 및 로스터',url:'https://liquipedia.net/leagueoflegends/LCK/2015/Spring'}]},
  2016:{label:'스프링 대표 로스터',description:'2016 스프링 대회에 수록된 대표 선수 및 일부 교체 선수. 개막일 전체 등록 명단이나 시즌 전체 이력이 아닙니다.',sources:[{label:'Liquipedia · 2016 LCK Spring 참가 팀 및 로스터',url:'https://liquipedia.net/leagueoflegends/LCK/2016/Spring'}]},
  2017:{label:'스프링 대표 로스터',description:'2017 스프링 대회에 수록된 대표 선수 및 일부 교체 선수. 개막일 전체 등록 명단이나 시즌 전체 이력이 아닙니다.',sources:[{label:'Liquipedia · 2017 LCK Spring 참가 팀 및 로스터',url:'https://liquipedia.net/leagueoflegends/LCK/2017/Spring'}]},
  2018:{label:'스프링 대표 로스터',description:'2018 스프링 대회에 수록된 대표 선수 및 일부 교체 선수. 개막일 전체 등록 명단이나 시즌 전체 이력이 아닙니다.',sources:[{label:'Liquipedia · 2018 LCK Spring 참가 팀 및 로스터',url:'https://liquipedia.net/leagueoflegends/LCK/2018/Spring'}]},
  2019:{label:'스프링 대표 로스터',description:'2019 스프링 대회에 수록된 대표 선수 및 일부 교체 선수. 개막일 전체 등록 명단이나 시즌 전체 이력이 아닙니다.',sources:[{label:'Liquipedia · 2019 LCK Spring 참가 팀 및 로스터',url:'https://liquipedia.net/leagueoflegends/LCK/2019/Spring'}]},
  2020:{label:'스프링 대표 로스터',description:'2020 스프링 대회에 수록된 대표 선수 및 일부 교체 선수. 개막일 전체 등록 명단이나 시즌 전체 이력이 아닙니다.',sources:[{label:'Liquipedia · 2020 LCK Spring 참가 팀 및 로스터',url:'https://liquipedia.net/leagueoflegends/LCK/2020/Spring'}]},
  2021:{label:'스프링 대표 로스터',description:'2021 스프링 대회에 수록된 대표 선수 및 일부 교체 선수. 개막일 전체 등록 명단이나 시즌 전체 이력이 아닙니다.',sources:[{label:'Liquipedia · 2021 LCK Spring 참가 팀 및 로스터',url:'https://liquipedia.net/leagueoflegends/LCK/2021/Spring'}]},
  2022:{label:'스프링 개막 명단',description:'2022년 1월 공개 로스터. 복수 등록 선수 포함.',sources:[{label:'ONE Esports · 2022 스프링 로스터',url:'https://www.oneesports.gg/league-of-legends/lck-spring-split-2022-roster/'}]},
  2023:{label:'스프링 개막 명단',description:'2023년 1월 공개 1군 명단. 일부 복수 등록 선수 포함.',sources:[{label:'ONE Esports · 2023 스프링 로스터',url:'https://www.oneesports.gg/league-of-legends/lck-spring-2023-rosters/'}]},
  2024:{label:'스프링 개막 명단',description:'2024년 1월 공개 로스터. 복수 등록 선수 포함.',sources:[{label:'ONE Esports · 2024 스프링 로스터',url:'https://www.oneesports.gg/league-of-legends/lck-spring-2024-roster-teams/'}]},
  2025:{label:'시즌 초 공개 명단',description:'시즌 전 발표 명단을 기준으로 DRX의 LCK 컵 원딜 등록 정보를 보완. 컵 전체 출전 이력은 아님.',sources:[{label:'ONE Esports · 2025 시즌 공개 명단',url:'https://www.oneesports.gg/league-of-legends/lck-2025-rosters-teams-players/'},{label:'Sheep Esports · DRX Teddy / LazyFeel',url:'https://www.sheepesports.com/kr/articles/lol-lck-cup-teddy-returns-to-drx-s-roster/en'},{label:'Strafe · 2025 이적 현황',url:'https://www.strafe.com/news/read/lck-2024-2025-league-of-legends-rostermania/'}]},
  2026:{label:'시즌 마지막 공식 경기',description:'기존 LCK-STOVE-2의 마지막 공식 시리즈 마지막 경기 출전 5명 기준.',sources:[{label:'LoL2LLM · 2026 마지막 경기 출전 명단',url:BASELINE_SOURCE}]},
  2027:{label:'스토브리그 확인 스냅샷',description:LCK_CHECKED+' 기준 사이트에 등록된 영입·계약 확인 자료. 미확정 보도는 제외하며 현재 실시간 명단이 아님.',sources:[{label:'기존 사이트 2027 스토브리그 확인 자료',url:'/esports/lck/2027/stove-league'},{label:'LoL 스토브 · 발표 취합',url:'https://lol-stove.ps-esports.kr/lck'}]},
};
// Factual player IDs, separated by role. Comma = multiple players at a position.
// These snapshots are not complete employment histories.
const EARLY:Record<number,Record<string,string>> = {
  "2022": {
    "t1": "Zeus|Oner|Faker|Gumayusi|Keria,Asper",
    "geng": "Doran|Peanut,YoungJae|Chovy|Ruler|Lehends",
    "hle": "DuDu|Willer,OnFleek|Karis|SamD|Vsta",
    "dk": "Burdol,Hoya|Canyon|ShowMaker|deokdam|Kellin",
    "kt": "Rascal|Cuzz,GIDEON|Aria|Aiming,Noah|Life",
    "ns": "Canna|Dread|Bdd|Ghost|Effort,Peter",
    "bfx": "Dove,Howling|Croco|Clozer|Ice,Envyy|Kael",
    "dns": "Kiin|Ellim|FATE|Teddy,Leo|Hoit,MapSSi",
    "bro": "Sword,Morgan|UmTi|Lava|Hena|Delight",
    "krx": "Kingen|Pyosik|Zeka|Deft,Taeyoon|BeryL"
  },
  "2023": {
    "t1": "Zeus|Oner|Faker|Gumayusi|Keria",
    "geng": "Doran|Peanut|Chovy|Peyz|Delight",
    "hle": "Kingen|Clid|Zeka|Viper|Life",
    "dk": "Canna|Canyon|ShowMaker|Deft|Kellin",
    "kt": "Kiin|Cuzz|Bdd|Aiming|Lehends",
    "ns": "DnDn|Sylvie|FIESTA|vital|Peter",
    "bfx": "Burdol|Willer|Clozer|Envyy|Kael",
    "dns": "DuDu|YoungJae|BuLLDoG|Taeyoon|Jun,Moham",
    "bro": "Morgan|UmTi,Raptor|Karis|Hena|Effort",
    "krx": "Rascal|Croco|FATE|deokdam|BeryL"
  },
  "2024": {
    "t1": "Zeus|Oner|Faker|Gumayusi|Keria",
    "geng": "Kiin|Canyon|Chovy|Peyz|Lehends",
    "hle": "Doran|Peanut|Zeka|Viper|Delight",
    "dk": "Kingen|Lucid|ShowMaker|Aiming|Kellin",
    "kt": "PerfecT|Pyosik|Bdd|Deft|BeryL",
    "ns": "DnDn|Sylvie|FIESTA|Jiwoo|Peter",
    "bfx": "Clear|Willer|Clozer|Hena|JeongHoon",
    "dns": "DuDu|Cuzz,YoungJae|BuLLDoG|Taeyoon|Andil",
    "bro": "Morgan|GIDEON|Karis|Envyy|Effort",
    "krx": "Rascal|Sponge,Juhan|SeTab,kyeahoo|Teddy|Pleata"
  },
  "2025": {
    "t1": "Doran|Oner|Faker|Gumayusi|Keria",
    "geng": "Kiin|Canyon|Chovy|Ruler|Duro",
    "hle": "Zeus|Peanut|Zeka|Viper|Delight",
    "dk": "Siwoo|Lucid|ShowMaker|Aiming|BeryL",
    "kt": "PerfecT|Cuzz|Bdd|deokdam|Way",
    "ns": "Kingen|Sylvie|Calix,Fisher|Jiwoo|Lehends,vital",
    "bfx": "Clear|Raptor|VicLa|Diable|Kellin",
    "dns": "DuDu|Pyosik|BuLLDoG|Berserker|Life",
    "bro": "Morgan|HamBak|Clozer|Bull,Hype|Pollu",
    "krx": "Rich|Juhan,Sponge|Ucal|Teddy,LazyFeel|Andil"
  }
};
const NAMES:Record<string,Record<number,string>> = {
  dk:{2022:'DWG KIA'}, bfx:{2022:'Liiv SANDBOX',2023:'Liiv SANDBOX',2024:'FearX',2025:'BNK FearX'},
  dns:{2022:'Kwangdong Freecs',2023:'Kwangdong Freecs',2024:'Kwangdong Freecs',2025:'DN Freecs'},
  bro:{2022:'Fredit BRION',2023:'BRION',2024:'OKSavingsBank BRION',2025:'OKSavingsBank BRION'},
  krx:{2022:'DRX',2023:'DRX',2024:'DRX',2025:'DRX'},
};
const ALIASES:Record<string,string> = {bfx:'샌드박스 리브 샌드박스 피어엑스',dns:'광동 프릭스 DN 프릭스 수퍼스',bro:'프레딧 브리온 OK저축은행 브리온',dk:'담원 기아 디플러스 기아',krx:'DRX 디알엑스 킹존',geng:'Gen.G 젠지',t1:'T1 티원',hle:'한화생명 한화',kt:'KT 케이티',ns:'농심'};
const EXTRA_NAMES:Record<string,string> = {peanut:'피넛',viper:'바이퍼',beryl:'베릴',sword:'소드',morgan:'모건',umti:'엄티',lava:'라바',hena:'헤나',rascal:'라스칼',aria:'아리아',dread:'드레드',ghost:'고스트',life:'라이프',clid:'클리드',bulldog:'불독',fate:'페이트',envyy:'엔비',croco:'크로코',dove:'도브',kael:'카엘',canna:'칸나',burdol:'버돌',sylvie:'실비',dndn:'든든',fiesta:'피에스타',lazyfeel:'레이지필',berserker:'버서커',youngjae:'영재',hoit:'호잇',jun:'준',moham:'모함',hoya:'호야',sponge:'스폰지',juhan:'주한',pleata:'플레타',kyeahoo:'예후',jeonghoon:'정훈',hambak:'함박',pollu:'폴루',hype:'하이프',bull:'불',way:'웨이',fisher:'피셔',vital:'바이탈',asper:'애스퍼',samd:'쌈디',vsta:'비스타',onfleek:'온플릭',ellim:'엘림',leo:'레오',mapssi:'맵씨',howling:'하울링',ice:'아이스',frog:'프로그',minous:'마이너스'};
export function historyKoreanName(name:string){return playerKoreanName(name)||EXTRA_NAMES[name.toLowerCase()]||LEGACY_KOREAN[name.toLowerCase()]||'';}
// Normalize only known same-player aliases; do not merge unrelated names.
export const historyPlayerId=(name:string)=>({solka:'quad',lee:'hojin'} as Record<string,string>)[name.toLowerCase()]??name.toLowerCase().replace(/ /g,'-');
export const HISTORY_TEAMS=[...TEAMS.map(t=>({slug:t.slug,name:t.name,current:true})),...LEGACY_TEAMS.map(t=>({...t,current:false}))];
export interface HistoryRoster {year:HistoryYear;team:string;name:string;roles:string[][]}
export const HISTORY_ROSTERS:HistoryRoster[]=HISTORY_YEARS.flatMap<HistoryRoster>(year=>{
  if(year<=2021)return Object.entries(LEGACY_ROSTERS[year]).map(([team,[name,lineup]])=>({year,team,name,roles:lineup.split('|').map(s=>s?s.split(','):[])}));
  return TEAMS.map(t=>{
  let roles:string[][];
  if(year<=2025)roles=EARLY[year][t.slug].split('|').map(s=>s?s.split(','):[]);
  else if(year===2026)roles=LAST_2026[t.slug].map(p=>[p]);
  else roles=POSITIONS.map(position=>CONTRACT_ROWS.filter(r=>r.team===t.slug&&r.position===position).map(r=>r.player));
  return {year,team:t.slug,name:NAMES[t.slug]?.[year]??t.name,roles};
});
});
export interface HistoryEntry {year:HistoryYear;team:string;name:string;position:string;player:string;roleIndex:number}
export const HISTORY_ENTRIES:HistoryEntry[]=HISTORY_ROSTERS.flatMap(r=>r.roles.flatMap((names,i)=>names.map(player=>({year:r.year,team:r.team,name:r.name,position:POSITIONS[i],player,roleIndex:i}))));
export const HISTORY_PLAYERS=[...new Map(HISTORY_ENTRIES.map(e=>[historyPlayerId(e.player),e.player])).entries()].map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name,'en'));
export const historyYearPath=(year:number)=>LCK_HISTORY_PATH+'/'+year;
export const historyTeamPath=(slug:string)=>LCK_HISTORY_PATH+'/teams/'+slug;
export const historyPlayerPath=(id:string)=>HISTORY_PLAYERS_PATH+'/'+id;
export const playerHistory=(id:string)=>HISTORY_ENTRIES.filter(e=>historyPlayerId(e.player)===historyPlayerId(id)).sort((a,b)=>a.year-b.year);
export const HISTORY_DETAIL_PLAYERS=HISTORY_PLAYERS.filter(p=>new Set(playerHistory(p.id).map(e=>e.year)).size>=2);
export function hasHistoryDetail(id:string){return HISTORY_DETAIL_PLAYERS.some(p=>p.id===id);}
export function historyRoster(year:number,team:string){return HISTORY_ROSTERS.find(r=>r.year===year&&r.team===team);}
export function historyRoute(path:string){
  const year=HISTORY_YEARS.find(y=>historyYearPath(y)===path);
  const team=HISTORY_TEAMS.find(t=>historyTeamPath(t.slug)===path);
  const player=HISTORY_DETAIL_PLAYERS.find(p=>historyPlayerPath(p.id)===path);
  return {year,team,player,directory:path===HISTORY_PLAYERS_PATH,valid:path===LCK_HISTORY_PATH||path===HISTORY_PLAYERS_PATH||!!year||!!team||!!player};
}
function contains(values:(string|undefined)[],q:string){return !q||values.some(v=>v?.toLowerCase().includes(q));}
export function filterHistoryRosters(year='all',team='all',query=''){
  const q=query.trim().toLowerCase();
  return HISTORY_ROSTERS.filter(r=>(year==='all'||String(r.year)===year)&&(team==='all'||r.team===team)
    &&contains([r.name,r.team,HISTORY_TEAMS.find(t=>t.slug===r.team)?.name,ALIASES[r.team],LEGACY_ALIASES[r.team],...r.roles.flat().flatMap(n=>[n,historyKoreanName(n)])],q));
}
export function filterHistoryPlayers(query='',position='all'){
  const q=query.trim().toLowerCase();
  return HISTORY_PLAYERS.filter(p=>{
    const entries=playerHistory(p.id);
    return (position==='all'||entries.some(e=>e.position===position))&&contains([p.name,historyKoreanName(p.name),...entries.flatMap(e=>[e.name,ALIASES[e.team],LEGACY_ALIASES[e.team],e.position,e.player,historyKoreanName(e.player)])],q);
  });
}
export const historyPages=()=>{
  const pages:Record<string,{title:string;description:string}>={};
  pages[LCK_HISTORY_PATH]={title:'역대 LCK 로스터 아카이브 2015~2027 | TFT Profile',description:'LCK 역대 참가 팀의 2015~2027 시즌별 공개 로스터와 선수 소속팀 기록을 찾아보세요. 자료 기준 시점과 팀명 변천을 구분합니다.'};
  pages[HISTORY_PLAYERS_PATH]={title:'LCK 선수 소속팀 이력 도감 - 역대 로스터 검색 | TFT Profile',description:'페이커, 쵸비, 도란 등 LCK 선수의 시즌별 소속팀 기록을 한글·영문 이름과 포지션으로 검색하세요.'};
  for(const y of HISTORY_YEARS)pages[historyYearPath(y)]={title:y+' LCK 로스터 - 팀별 선수 명단 | TFT Profile',description:y+' LCK '+HISTORY_ROSTERS.filter(r=>r.year===y).length+'개 팀 포지션별 로스터. '+HISTORY_PERIODS[y].description};
  for(const t of HISTORY_TEAMS)pages[historyTeamPath(t.slug)]={title:t.name+' 역대 로스터 - 2015~2027 LCK | TFT Profile',description:t.name+'의 시즌별 탑, 정글, 미드, 원딜, 서포터 구성과 당시 팀명, 선수 변화를 확인하세요.'};
  for(const p of HISTORY_DETAIL_PLAYERS)pages[historyPlayerPath(p.id)]={title:p.name+(historyKoreanName(p.name)?' ('+historyKoreanName(p.name)+')':'')+' LCK 소속팀 이력 - 시즌별 기록 | TFT Profile',description:p.name+' 선수의 아카이브에 수록된 시즌별 LCK 소속팀과 포지션 기록. 전체 커리어가 아닌 확인 시점별 명단입니다.'};
  return pages;
};
