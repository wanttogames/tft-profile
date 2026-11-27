import {describe,it,expect} from 'vitest';
import {NAV_GROUPS,SERVICE_LINKS,activeNavigation,navItems} from '../src/config/navigation';
import {PUBLIC_PAGES} from '../src/seo/pages';
import {readFileSync} from 'node:fs';
describe('TFT-NAV-1',()=>{
 it('has five ordered categories and 22 unique content destinations',()=>{
  expect(NAV_GROUPS.map(g=>g.id)).toEqual(['analysis','tools','season','lck','history']);
  const links=NAV_GROUPS.flatMap(g=>g.items.map(i=>i.href));
  expect(links).toHaveLength(22);expect(new Set(links).size).toBe(22);
 });
 it('keeps all menu links on public pages and in sitemap',()=>{
  const sitemap=readFileSync(new URL('../public/sitemap.xml',import.meta.url),'utf8');
  for(const item of [...NAV_GROUPS.flatMap(g=>g.items),...SERVICE_LINKS]){
   const href=item.href.split('#')[0];expect(Object.hasOwn(PUBLIC_PAGES,href)).toBe(true);
   expect(sitemap).toContain('https://tft-profile.pages.dev'+href+'</loc>');
  }
 });
 it('matches profile and legacy meta query only on home',()=>{
  expect(activeNavigation('/profile')).toEqual({group:'analysis',href:'/'});
  expect(activeNavigation('/','meta')).toEqual({group:'analysis',href:'/meta'});
  expect(activeNavigation('/champions','meta')?.href).toBe('/champions');
  expect(activeNavigation('/tools/item-calculator','meta')?.group).toBe('tools');
 });
 it('prioritizes specific children over prefix hubs',()=>{
  expect(activeNavigation('/set19/unlocks/tibbers/')?.href).toBe('/set19/unlocks');
  expect(activeNavigation('/esports/lck/history/players/faker')?.href).toBe('/esports/lck/history/players');
  expect(activeNavigation('/esports/lck/history/results/2026-season')?.href).toBe('/esports/lck/history/results');
  expect(activeNavigation('/esports/lck/history/teams/t1')?.href).toBe('/esports/lck/history');
 });
 it('distinguishes roster, transfers, contracts and dream team',()=>{
  expect(activeNavigation('/esports/lck/2027/t1')?.href).toBe('/esports/lck/2027/stove-league');
  expect(activeNavigation('/esports/lck/2027/free-agents')?.href).toBe('/esports/lck/2027/free-agents');
  expect(activeNavigation('/esports/lck/2027/timeline')?.href).toBe('/esports/lck/2027/timeline');
  expect(activeNavigation('/esports/lck/dream-team')?.group).toBe('lck');
  expect(navItems('history')).toHaveLength(4);
 });
 it('does not mark policy pages or unrelated prefixes as active',()=>{
  expect(activeNavigation('/guide')).toBeNull();expect(activeNavigation('/privacy')).toBeNull();
  expect(activeNavigation('/set190')).toBeNull();expect(activeNavigation('/esports/lck/history-other')).toBeNull();
 });
});
