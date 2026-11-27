import {describe,it,expect} from 'vitest';
import {HOME_TOOLS,HOME_ANALYSIS,HOME_LCK,HOME_HISTORY,HOME_SEASON,homeHubData,showHomeHub} from '../src/data/homeHub';
import {rosterSummary,LCK_CHECKED} from '../src/data/lck2027';
import {filterMoves,CHANGES_CHECKED} from '../src/data/lckChanges';
import {HISTORY_PLAYERS,HISTORY_ROSTERS,HISTORY_YEARS} from '../src/data/lckHistory';
import {LCK_RESULTS} from '../src/data/lckResults';
import {SET19_RELEASE_DATE,SET19_UNLOCKS} from '../src/content/set19';
import {PUBLIC_PAGES} from '../src/seo/pages';
describe('TFT-HOME-1',()=>{
 it('uses existing unique menu destinations',()=>{const items=[...HOME_TOOLS,...HOME_ANALYSIS,...HOME_LCK,...HOME_HISTORY,...HOME_SEASON];expect(items).toHaveLength(20);expect(new Set(items.map(i=>i.href)).size).toBe(20);expect(items.every(i=>Object.hasOwn(PUBLIC_PAGES,i.href))).toBe(true);});
 it('derives roster counts and actual snapshot dates',()=>{const h=homeHubData(),r=rosterSummary();expect(h.roster.confirmed).toBe(r.confirmed);expect(h.roster.pending).toBe(r.total-r.confirmed);expect(h.roster.checked).toBe(LCK_CHECKED);expect(h.roster.percent).toBe(Math.round(r.confirmed/r.total*100));});
 it('shows the five most recent registered moves without inventing live data',()=>{const h=homeHubData();expect(h.moves.checked).toBe(CHANGES_CHECKED);expect(h.moves.items.map(m=>m.id)).toEqual(filterMoves().slice(0,5).map(m=>m.id));expect(h.moves.items.every(m=>Object.hasOwn(PUBLIC_PAGES,m.teamHref))).toBe(true);});
 it('derives archive and season numbers from shared data',()=>{const h=homeHubData();expect(h.archive.players).toBe(HISTORY_PLAYERS.length);expect(h.archive.rosters).toBe(HISTORY_ROSTERS.length);expect(h.archive.first).toBe(Math.min(...HISTORY_YEARS));expect(h.archive.last).toBe(Math.max(...HISTORY_YEARS));expect(h.archive.events).toBe(LCK_RESULTS.length);expect(h.season.unlockCount).toBe(SET19_UNLOCKS.length);expect(h.season.release).toBe(SET19_RELEASE_DATE);});
 it('preserves focused player results and loading states',()=>{expect(showHomeHub('/',false,false,false)).toBe(true);expect(showHomeHub('/profile',true,false,false)).toBe(false);expect(showHomeHub('/',true,false,false)).toBe(false);expect(showHomeHub('/',false,true,false)).toBe(false);expect(showHomeHub('/',false,false,true)).toBe(false);expect(showHomeHub('/meta',false,false,false)).toBe(false);});
});
