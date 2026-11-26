import { HISTORY_TEAMS, historyRoster, historyPlayerId, historyTeamPath } from './lckHistory';
export const LCK_RESULTS_PATH='/esports/lck/history/results';
export const RESULTS_CHECKED='2026-11-26';
export type EventKind='spring'|'summer'|'season'|'cup';
export const EVENT_LABEL:Record<EventKind,string>={spring:'스프링',summer:'서머',season:'시즌',cup:'LCK 컵'};
export interface Placement {team:string;rank:number;lastRank:number}
export interface LckResult {id:string;year:number;kind:EventKind;score:string;mvp:string;placements:Placement[];source:string}
export const RESULTS_SOURCES=[
 {label:'LCK 역대 결승 및 시즌 체제',url:'https://en.wikipedia.org/wiki/League_of_Legends_Champions_Korea'},
 {label:'LCK 국내 시즌별 최종 순위 기록',url:'https://m.namu.moe/w/League%20of%20Legends%20Champions%20Korea/%EC%97%AD%EB%8C%80%20%EA%B8%B0%EB%A1%9D'},
 {label:'2026 LCK 컵 공동 순위',url:'https://leggends.lol/competitions/lck/cup/'},
 {label:'2025 LCK 컵 순위',url:'https://lol.fandom.com/wiki/LCK/2025_Season/Cup'}
];
// Final domestic placement (not regular-season standing). '+' marks a tied range.
// For 2021–24 the Korean league's published season ranking distinguishes teams
// eliminated in the same round using season order; Cup ranges are preserved.
const rows:[number,EventKind,number,string,string][]=[
  [
    2015,
    "spring",
    0,
    "Easyhoon",
    "t1 hle cj jinair kt kongdoo krx geng"
  ],
  [
    2015,
    "summer",
    0,
    "Faker",
    "t1 kt hle cj kongdoo jinair geng dns krx sbenu"
  ],
  [
    2016,
    "spring",
    1,
    "Duke",
    "t1 hle kt jinair dns geng krx cj sbenu kongdoo"
  ],
  [
    2016,
    "summer",
    2,
    "Kuro",
    "hle kt t1 geng dns mvp jinair krx bbq cj"
  ],
  [
    2017,
    "spring",
    0,
    "Peanut",
    "t1 kt geng mvp dns hle krx bbq jinair kongdoo"
  ],
  [
    2017,
    "summer",
    1,
    "Khan",
    "krx t1 kt geng dns jinair hle mvp bbq ever8"
  ],
  [
    2018,
    "spring",
    1,
    "PraY",
    "krx dns kt t1 geng hle jinair bbq mvp kongdoo"
  ],
  [
    2018,
    "summer",
    2,
    "Score",
    "kt griffin dns krx geng hle t1 jinair mvp bbq"
  ],
  [
    2019,
    "spring",
    0,
    "Teddy",
    "t1 griffin krx dk bfx hle geng dns kt jinair"
  ],
  [
    2019,
    "summer",
    1,
    "Clid",
    "t1 griffin dk bfx dns geng krx kt hle jinair"
  ],
  [
    2020,
    "spring",
    0,
    "Cuzz",
    "t1 geng krx dk kt dns apk hle bfx griffin"
  ],
  [
    2020,
    "summer",
    0,
    "Nuguri",
    "dk krx geng dns t1 kt bfx ns hle apk"
  ],
  [
    2021,
    "spring",
    0,
    "Khan",
    "dk geng hle t1 krx ns kt bfx dns bro"
  ],
  [
    2021,
    "summer",
    1,
    "ShowMaker",
    "dk t1 geng ns bfx dns kt hle bro krx"
  ],
  [
    2022,
    "spring",
    1,
    "Oner",
    "t1 geng dk dns krx bro kt ns bfx hle"
  ],
  [
    2022,
    "summer",
    0,
    "Peanut",
    "geng t1 bfx dk kt krx dns ns bro hle"
  ],
  [
    2023,
    "spring",
    1,
    "Peyz",
    "geng t1 kt hle dk bfx dns bro krx ns"
  ],
  [
    2023,
    "summer",
    0,
    "Chovy",
    "geng t1 kt hle dk krx bfx bro ns dns"
  ],
  [
    2024,
    "spring",
    2,
    "Kiin",
    "geng t1 hle dk kt dns bfx ns krx bro"
  ],
  [
    2024,
    "summer",
    2,
    "Zeka",
    "hle geng t1 dk kt bfx dns ns krx bro"
  ],
  [
    2025,
    "cup",
    2,
    "Zeus",
    "hle geng dk ns kt+t1 krx bro+dns bfx"
  ],
  [
    2025,
    "season",
    1,
    "Ruler",
    "geng hle kt t1 dk bfx ns bro krx dns"
  ],
  [
    2026,
    "cup",
    0,
    "Canyon",
    "geng bfx dk t1 dns krx ns bro+kt hle"
  ],
  [
    2026,
    "season",
    1,
    "Ruler",
    "geng hle t1 dk kt bfx bro ns krx dns"
  ]
];
export const RESULT_TEAMS=[...HISTORY_TEAMS,{slug:'ever8',name:'Ever8 Winners',current:false}];
export const LCK_RESULTS:LckResult[]=rows.map(([year,kind,loserGames,mvp,order])=>{
 let rank=1;const placements:Placement[]=[];
 for(const group of order.split(' ')){const teams=group.split('+');for(const team of teams)placements.push({team,rank,lastRank:rank+teams.length-1});rank+=teams.length;}
 const id=year+'-'+kind;
 return {id,year,kind,score:'3–'+loserGames,mvp,placements,source:'https://leaguerecords.com/championships/lck/'+id};
});
export const RESULTS_YEARS=[...new Set(LCK_RESULTS.map(r=>r.year))].sort((a,b)=>b-a);
export const resultPath=(id:string)=>LCK_RESULTS_PATH+'/'+id;
export const findResult=(path:string)=>LCK_RESULTS.find(r=>resultPath(r.id)===path);
export const isResultPath=(path:string)=>path===LCK_RESULTS_PATH||!!findResult(path);
export const resultTitle=(r:LckResult)=>r.year+' '+EVENT_LABEL[r.kind];
export const resultTeamLabel=(slug:string)=>RESULT_TEAMS.find(t=>t.slug===slug)?.name??slug;
export function resultTeamName(r:LckResult,slug:string):string{
 if(slug==='ever8')return 'Ever8 Winners';
 if(r.year===2015&&r.kind==='summer'){
  if(slug==='hle')return 'KOO Tigers';if(slug==='dns')return 'Anarchy';if(slug==='krx')return 'Longzhu IM';
 }
 if(r.year===2016&&r.kind==='summer'&&slug==='bbq')return 'ESC Ever';
 if(r.year===2018&&r.kind==='summer'){if(slug==='geng')return 'Gen.G';if(slug==='hle')return 'Hanwha Life Esports';}
 if(r.year===2020&&r.kind==='summer'){if(slug==='ns')return 'Team Dynamics';if(slug==='apk')return 'SeolHaeOne Prince';if(slug==='krx')return 'DRX';}
 if(slug==='griffin')return 'Griffin';
 if(r.year===2023&&r.kind==='summer'&&slug==='bro')return 'OKSavingsBank BRION';
 if(r.year===2024&&r.kind==='summer'&&slug==='bfx')return 'BNK FEARX';
 if(r.year===2026&&slug==='bro')return 'HANJIN BRION';
 return historyRoster(r.year,slug)?.name??resultTeamLabel(slug);
}
export function resultTeamLink(slug:string):string|null{return HISTORY_TEAMS.some(t=>t.slug===slug)?historyTeamPath(slug):null;}
export const rankLabel=(p:Placement)=>p.rank===1?'우승':p.rank===2?'준우승':p.rank===p.lastRank?p.rank+'위':p.rank+'–'+p.lastRank+'위';
export function filterResults(year='all',kind='all',team='all'){
 return LCK_RESULTS.filter(r=>(year==='all'||String(r.year)===year)&&(kind==='all'||(kind==='league'?r.kind!=='cup':r.kind===kind))&&(team==='all'||r.placements.some(p=>p.team===team))).slice().reverse();
}
export function teamResults(team:string,year?:number){
 return filterResults(year===undefined?'all':String(year),'all',team).flatMap(r=>{const p=r.placements.find(v=>v.team===team);return p?[{result:r,placement:p}]:[];});
}
export function titleTable(kind:'league'|'cup'='league'){
 const events=filterResults('all',kind);
 return RESULT_TEAMS.map(t=>({team:t.slug,name:t.name,wins:events.filter(r=>r.placements[0].team===t.slug).length,runners:events.filter(r=>r.placements[1].team===t.slug).length})).filter(t=>t.wins||t.runners).sort((a,b)=>b.wins-a.wins||b.runners-a.runners||a.name.localeCompare(b.name));
}
export const finalsAwards=(id:string)=>LCK_RESULTS.filter(r=>historyPlayerId(r.mvp)===historyPlayerId(id)).slice().reverse();
export function resultsPages(){
 const pages:Record<string,{title:string;description:string}>={[LCK_RESULTS_PATH]:{title:'역대 LCK 우승팀·시즌별 최종 순위 2015~2026 | TFT Profile',description:'LCK 스프링·서머·단일 시즌과 LCK 컵의 우승, 준우승, 결승 스코어, 파이널 MVP, 팀별 최종 순위를 확인하세요.'}};
 for(const r of LCK_RESULTS)pages[resultPath(r.id)]={title:resultTitle(r)+' LCK 최종 순위·우승팀·결승 MVP | TFT Profile',description:resultTitle(r)+' 우승 '+resultTeamName(r,r.placements[0].team)+', 준우승 '+resultTeamName(r,r.placements[1].team)+', 결승 '+r.score+' 및 파이널 MVP '+r.mvp+'. 참가팀 최종 순위와 관련 로스터를 확인하세요.'};
 return pages;
}
