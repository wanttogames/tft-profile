
import { LCK_BASE, TEAMS, POSITIONS, type Team } from './lck2027';
export const LCK_COMPARE_PATH = LCK_BASE + '/compare';
export const LCK_TIMELINE_PATH = LCK_BASE + '/timeline';
export const CHANGES_CHECKED = '2026-11-26';
export const BASELINE_SOURCE = 'https://lol2llm.com/en/esports/lck-2027-roster-changes';
export const TIMELINE_SOURCE = 'https://lol-stove.ps-esports.kr/lck/timeline';
// Last official series, final game (LCK or Worlds 2026), not the season-opening roster.
export const LAST_2026: Record<string, readonly string[]> = {
  t1: ['Doran','Oner','Faker','Peyz','Keria'],
  geng: ['Kiin','Canyon','Chovy','Ruler','Duro'],
  hle: ['Zeus','Kanavi','Zeka','Gumayusi','Delight'],
  dk: ['Siwoo','Lucid','ShowMaker','Smash','Career'],
  kt: ['PerfecT','Cuzz','Bdd','Jiwoo','Effort'],
  ns: ['Kingen','Sponge','Scout','Diable','Lehends'],
  bfx: ['Clear','Raptor','VicLa','Taeyoon','Kellin'],
  dns: ['DuDu','Sharvel','Clozer','deokdam','Peter'],
  bro: ['Casting','GIDEON','Roamer','Teddy','Namgung'],
  krx: ['Frog','Willer','Ucal','Aiming','Minous'],
};
export type Change = 'retained' | 'changed' | 'pending';
export const CHANGE_LABEL: Record<Change,string> = {retained:'유지',changed:'신규 구성',pending:'발표 대기'};
export function compareTeam(team: Team) {
  return team.slots.map((slot,index) => {
    const before = LAST_2026[team.slug][index];
    const change: Change = !slot.player || slot.status==='pending' ? 'pending' : before.toLowerCase() === slot.player.toLowerCase() ? 'retained' : 'changed';
    return { position: POSITIONS[index], before, slot, change };
  });
}
export function changeCounts(teamList: Team[] = TEAMS) {
  const counts = {retained:0,changed:0,pending:0};
  for (const team of teamList) for (const row of compareTeam(team)) counts[row.change]++;
  return counts;
}
export type MoveKind = 'signed' | 'renewed' | 'departed';
export const MOVE_LABEL: Record<MoveKind,string> = {signed:'영입',renewed:'재계약',departed:'결별·계약 종료'};
export interface Move { id:string; date:string; player:string; position:string; team:string; kind:MoveKind; previousTeam?:string; source:string }
const rows: [string,string,string,string,MoveKind,string?][] = [
  ['11-25','Zeus','탑','t1','signed','hle'],
  ['11-25','Taeyoon','원딜','kt','signed','bfx'],
  ['11-25','Thanatos','탑','bfx','signed'],
  ['11-24','Cloud','서포터','geng','signed'],
  ['11-24','Sharvel','정글','geng','signed','dns'],
  ['11-24','Siwoo','탑','geng','signed','dk'],
  ['11-24','Canyon','정글','hle','signed','geng'],
  ['11-24','Duro','서포터','geng','departed'],
  ['11-23','Delight','서포터','dk','signed','hle'],
  ['11-23','Career','서포터','dk','departed'],
  ['11-23','Delight','서포터','hle','departed'],
  ['11-20','Kanavi','정글','dk','signed','hle'],
  ['11-20','Doran','탑','dk','signed','t1'],
  ['11-20','Siwoo','탑','dk','departed'],
  ['11-20','Kellin','서포터','kt','signed','bfx'],
  ['11-20','Noah','원딜','bfx','signed'],
  ['11-19','Smash','원딜','dk','renewed'],
  ['11-19','ShowMaker','미드','dk','renewed'],
  ['11-19','Pyosik','정글','ns','signed','dns'],
  ['11-19','Andil','서포터','ns','signed','krx'],
  ['11-19','Deft','원딜','ns','signed'],
  ['11-19','Bluffing','서포터','dns','signed'],
  ['11-19','Raptor','정글','kt','signed','bfx'],
  ['11-19','Doran','탑','t1','departed'],
  ['11-19','Kanavi','정글','hle','departed'],
  ['11-19','Zeus','탑','hle','departed'],
  ['11-18','Ucal','미드','dns','signed','krx'],
  ['11-18','Kingen','탑','ns','renewed'],
  ['11-18','Vincenzo','정글','bfx','signed','krx'],
  ['11-18','Calix','미드','ns','renewed'],
  ['11-18','SeTab','미드','bro','signed','ns'],
  ['11-17','Cuzz','정글','dns','signed','kt'],
  ['11-17','Cuzz','정글','kt','departed'],
  ['11-17','VicLa','미드','bfx','renewed'],
  ['11-17','Sharvel','정글','dns','departed'],
  ['11-17','Peter','서포터','dns','departed'],
  ['11-17','Kellin','서포터','bfx','departed'],
  ['11-17','Taeyoon','원딜','bfx','departed'],
  ['11-17','Daystar','미드','bfx','departed'],
  ['11-17','Clozer','미드','dns','departed'],
  ['11-17','Canyon','정글','geng','departed'],
  ['11-17','Raptor','정글','bfx','departed'],
  ['11-17','Life','서포터','dns','departed'],
  ['11-17','Pyosik','정글','dns','departed'],
  ['11-17','Clear','탑','bfx','departed'],
  ['11-17','Kiin','탑','geng','departed'],
  ['11-17','Aiming','원딜','krx','departed'],
  ['11-17','Andil','서포터','krx','departed'],
  ['11-17','Rich','탑','krx','departed'],
  ['11-17','Ucal','미드','krx','departed'],
  ['11-17','Vincenzo','정글','krx','departed'],
  ['11-17','Willer','정글','krx','departed'],
  ['11-17','Pungyeon','미드','bro','departed'],
  ['11-16','DuDu','탑','dns','renewed'],
  ['11-16','Effort','서포터','kt','departed'],
  ['11-16','Jiwoo','원딜','kt','departed'],
  ['10-24','Casting','탑','bro','renewed'],
  ['10-24','GIDEON','정글','bro','renewed'],
  ['10-24','Roamer','미드','bro','renewed'],
  ['10-24','Teddy','원딜','bro','renewed'],
  ['10-24','Namgung','서포터','bro','renewed'],
  ['10-08','Bdd','미드','kt','renewed'],
  ['10-08','PerfecT','탑','kt','renewed'],
];
// Curated subset of dated first-team player announcements; same-day order is not an exact timestamp.
export const MOVES: Move[] = rows.map(([day,player,position,team,kind,previousTeam]) => ({
  id: day+'-'+team+'-'+player.toLowerCase()+'-'+kind,
  date:'2026-'+day,player,position,team,kind,previousTeam,source:TIMELINE_SOURCE,
}));
export const teamBySlug = (slug: string) => TEAMS.find(t=>t.slug===slug);
export function filterMoves(team = 'all', kind = 'all', query = '') {
  const q=query.trim().toLowerCase();
  return MOVES.filter(m=>(team==='all'||m.team===team||m.previousTeam===team)
    &&(kind==='all'||m.kind===kind)
    &&(!q||[m.player,m.position,teamBySlug(m.team)?.name,teamBySlug(m.team)?.code,teamBySlug(m.previousTeam??'')?.name,teamBySlug(m.previousTeam??'')?.code].some(v=>v?.toLowerCase().includes(q))))
    .sort((a,b)=>b.date.localeCompare(a.date));
}
export function groupMoves(moves: Move[]) {
  return [...new Set(moves.map(m=>m.date))].map(date=>({date,moves:moves.filter(m=>m.date===date)}));
}
