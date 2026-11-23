import { describe, expect, it } from 'vitest';
import { COMPONENTS, RECIPES } from '../src/data/itemRecipes';
import { craftItem, findRecipe, missingParts } from '../src/utils/itemRecipes';
describe('TFT-ITEM-1 Set 18', () => {
  it('contains 55 unique unordered pairs across 10 components', () => {
    expect(COMPONENTS).toHaveLength(10); expect(RECIPES).toHaveLength(55);
    expect(new Set(RECIPES.map(r=>r.parts.join(':'))).size).toBe(55);
    for(let a=0;a<10;a++) for(let b=0;b<10;b++) { expect(findRecipe(a,b)).toBeDefined(); expect(findRecipe(a,b)).toBe(findRecipe(b,a)); }
  });
  it('resolves standard and emblem recipes', () => {
    expect(findRecipe(0,1)?.id).toBe('TFT_Item_MadredsBloodrazor');
    expect(findRecipe(3,8)?.id).toBe('DA_18_EmblemInvoker');
    expect(findRecipe(3,9)?.id).toBe('DA_18_EmblemLunar');
  });
  it('requires duplicate components and never overspends', () => {
    const r=findRecipe(0,0)!; const inv=COMPONENTS.map(()=>0); inv[0]=1;
    expect(missingParts(r,inv)).toEqual([0]); expect(craftItem(r,inv)).toBeNull();
    inv[0]=2; const next=craftItem(r,inv)!; expect(next[0]).toBe(0); expect(inv[0]).toBe(2); expect(craftItem(r,next)).toBeNull();
  });
  it('deducts each different component once', () => {
    const inv=COMPONENTS.map(()=>1); const next=craftItem(findRecipe(0,3)!,inv)!;
    expect(next[0]).toBe(0); expect(next[3]).toBe(0); expect(next.reduce((a,b)=>a+b,0)).toBe(8);
  });
});
