import {navItems} from '../config/navigation';
import {TEAMS,LCK_CHECKED,rosterSummary,teamPath} from './lck2027';
import {CHANGES_CHECKED,filterMoves,MOVE_LABEL} from './lckChanges';
import {HISTORY_YEARS,HISTORY_PLAYERS,HISTORY_ROSTERS} from './lckHistory';
import {LCK_RESULTS} from './lckResults';
import {SET19_RELEASE_DATE,SET19_UNLOCKS,SET19_PBE_VERIFIED_DATE} from '../content/set19';

export const HOME_TOOLS=navItems('tools');
export const HOME_ANALYSIS=navItems('analysis').filter(item=>item.href!=='/');
export const HOME_LCK=navItems('lck');
export const HOME_HISTORY=navItems('history');
export const HOME_SEASON=navItems('season');

export function homeHubData(){
 const roster=rosterSummary();
 const recentMoves=filterMoves().slice(0,5).map(move=>{
  const team=TEAMS.find(t=>t.slug===move.team);
  const previous=TEAMS.find(t=>t.slug===move.previousTeam);
  return {...move,teamName:team?.code??move.team,previousName:previous?.code??null,
    teamHref:team?teamPath(team):'/esports/lck/2027/stove-league',label:MOVE_LABEL[move.kind]};
 });
 return {
  roster:{...roster,pending:roster.total-roster.confirmed,percent:roster.total?Math.round(roster.confirmed/roster.total*100):0,checked:LCK_CHECKED},
  moves:{checked:CHANGES_CHECKED,items:recentMoves},
  season:{release:SET19_RELEASE_DATE,unlockCount:SET19_UNLOCKS.length,pbeChecked:SET19_PBE_VERIFIED_DATE},
  archive:{first:Math.min(...HISTORY_YEARS),last:Math.max(...HISTORY_YEARS),players:HISTORY_PLAYERS.length,rosters:HISTORY_ROSTERS.length,events:LCK_RESULTS.length},
 };
}
// Profile pages and completed searches must not display the full home portal.
export function showHomeHub(path:string,profileMode:boolean,hasData:boolean,busy:boolean){
 return path==='/'&&!profileMode&&!hasData&&!busy;
}

// The historic section=meta URL is supported on home only.
export function initialSection(path:string,query:string):'profile'|'meta'{
 return ['/meta','/champions','/items','/traits'].includes(path)||(path==='/'&&new URLSearchParams(query).get('section')==='meta')?'meta':'profile';
}
