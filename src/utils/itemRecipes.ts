import { RECIPES, COMPONENTS, type ItemRecipe } from '../data/itemRecipes';
export function findRecipe(a: number, b: number): ItemRecipe | undefined {
  return RECIPES.find(r => r.parts[0] === Math.min(a,b) && r.parts[1] === Math.max(a,b));
}
export function missingParts(recipe: ItemRecipe, inventory: readonly number[]): number[] {
  const stock = COMPONENTS.map((_,i) => Math.max(0, Math.floor(inventory[i] || 0)));
  return recipe.parts.filter(i => { if (stock[i] > 0) { stock[i]--; return false; } return true; });
}
export function craftItem(recipe: ItemRecipe, inventory: readonly number[]): number[] | null {
  if (missingParts(recipe,inventory).length) return null;
  const next = COMPONENTS.map((_,i) => inventory[i] || 0);
  for (const i of recipe.parts) next[i]--;
  return next;
}
