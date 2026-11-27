import {describe,it,expect} from 'vitest';
import {NAV_GROUPS,navItems,navSections,activeNavSection} from '../src/config/navigation';
import {PUBLIC_PAGES} from '../src/seo/pages';
describe('TFT-NAV-2',()=>{
 it('groups every existing LCK and history destination exactly once',()=>{
  expect(navSections('lck').map(s=>[s.id,s.items.length])).toEqual([['roster',3],['contracts',2],['dream',1]]);
  expect(navSections('history').map(s=>[s.id,s.items.length])).toEqual([['people',2],['results',2]]);
  for(const id of ['lck','history'] as const){
   const sections=navSections(id);
   expect(sections.flatMap(s=>s.items.map(i=>i.href)).sort()).toEqual(navItems(id).map(i=>i.href).sort());
   expect(sections.every(s=>s.href===s.items[0].href&&Object.hasOwn(PUBLIC_PAGES,s.href))).toBe(true);
  }
  expect(NAV_GROUPS.flatMap(g=>g.items)).toHaveLength(22);
 });
 it('uses correct hierarchy on nested team, player and result pages',()=>{
  for(const [path,id] of [
   ['/esports/lck/2027/t1','roster'],['/esports/lck/2027/timeline','roster'],['/esports/lck/2027/compare','roster'],
   ['/esports/lck/2027/free-agents','contracts'],['/esports/lck/2027/contracts','contracts'],
   ['/esports/lck/dream-team','dream'],['/esports/lck/history/players/faker','people'],
   ['/esports/lck/history/teams/t1','people'],['/esports/lck/history/results/2026-season','results']
  ])expect(activeNavSection(path)?.id).toBe(id);
  expect(activeNavSection('/meta')).toBeNull();
 });
});
