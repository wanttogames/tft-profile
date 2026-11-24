import {describe,it,expect} from 'vitest';
import {TEAMS} from '../src/data/lck2027';
import {LAST_2026,compareTeam,changeCounts,MOVES,filterMoves,groupMoves,teamBySlug,LCK_COMPARE_PATH,LCK_TIMELINE_PATH} from '../src/data/lckChanges';
import {PUBLIC_PAGES} from '../src/seo/pages';
describe('LCK-STOVE-2',()=>{
 it('covers all 50 final-game positions',()=>{expect(Object.keys(LAST_2026)).toHaveLength(10);expect(TEAMS.every(t=>compareTeam(t).length===5)).toBe(true);const c=changeCounts();expect(c.retained+c.changed+c.pending).toBe(50);expect(c.pending).toBe(14);});
 it('does not treat reported or pending players as confirmed replacements',()=>{const t=TEAMS.find(t=>t.slug==='t1')!;expect(compareTeam(t)[0]).toMatchObject({before:'Doran',change:'pending'});expect(compareTeam(t)[2].change).toBe('retained');});
 it('distinguishes new player from the former starter even with a remaining contract',()=>{expect(compareTeam(TEAMS.find(t=>t.slug==='dk')!)[1]).toMatchObject({before:'Lucid',change:'changed'});});
 it('keeps stable unique dated official records with known teams',()=>{expect(new Set(MOVES.map(m=>m.id)).size).toBe(MOVES.length);expect(MOVES.every(m=>/^2026-\d{2}-\d{2}$/.test(m.date)&&teamBySlug(m.team)&&(!m.previousTeam||teamBySlug(m.previousTeam))&&m.source.startsWith('https://'))).toBe(true);});
 it('filters both sides of a move and groups in date order',()=>{const ms=filterMoves('t1','signed','doran');expect(ms).toHaveLength(1);expect(ms[0].team).toBe('dk');expect(filterMoves('all','departed','Zeus')).toHaveLength(1);const ds=groupMoves(filterMoves());expect(ds[0].date).toBe('2026-11-23');expect(ds.flatMap(d=>d.moves)).toHaveLength(MOVES.length);});
 it('registers both SEO pages',()=>{expect(Object.hasOwn(PUBLIC_PAGES,LCK_COMPARE_PATH)).toBe(true);expect(Object.hasOwn(PUBLIC_PAGES,LCK_TIMELINE_PATH)).toBe(true);});
});
