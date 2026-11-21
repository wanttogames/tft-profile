import { describe,expect,it } from 'vitest';
import {
  SET19_FEATURED_SLUGS,SET19_GUIDES,SET19_RELEASE_DATE,SET19_UNLOCKS,
  findSet19Unlock
} from '../src/content/set19';
import { PUBLIC_PAGES } from '../src/seo/pages';
describe('Set 19 content and public routes',()=>{
  it('has 32 unique unlocks with cost and condition',()=>{
    expect(SET19_UNLOCKS).toHaveLength(32);
    expect(new Set(SET19_UNLOCKS.map(x=>x.slug)).size).toBe(32);
    expect(SET19_UNLOCKS.every(x=>x.name&&x.condition&&x.cost>=1)).toBe(true);
  });
  it('separates Riot-confirmed examples from provisional PBE information',()=>{
    expect(SET19_UNLOCKS.filter(x=>x.status==='official').map(x=>x.slug).sort())
      .toEqual(['baron-nashor','mordekaiser','tibbers']);
    expect(SET19_UNLOCKS.filter(x=>x.status==='pbe')).toHaveLength(29);
    expect(findSet19Unlock('tibbers')?.condition).toMatch(/2성 애니/);
    expect(SET19_RELEASE_DATE).toBe('2026-12-02');
  });
  it('ensures detailed pages have useful editorial content and unique metadata',()=>{
    expect(SET19_FEATURED_SLUGS).toHaveLength(10);
    for(const slug of SET19_FEATURED_SLUGS){
      expect(findSet19Unlock(slug)).toBeDefined();
      expect(SET19_GUIDES[slug].steps.length).toBeGreaterThanOrEqual(3);
      expect(SET19_GUIDES[slug].checks.length).toBeGreaterThanOrEqual(3);
      const metadata=PUBLIC_PAGES['/set19/unlocks/'+slug as keyof typeof PUBLIC_PAGES];
      expect(metadata).toBeDefined();
      expect(metadata.title).toContain(findSet19Unlock(slug)?.name);
    }
  });
  it('makes the overview and all unlocks indexable through public-page registry',()=>{
    expect(PUBLIC_PAGES['/set19']).toBeDefined();
    expect(PUBLIC_PAGES['/set19/unlocks']).toBeDefined();
  });
});