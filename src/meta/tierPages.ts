import type { MetaKind } from '../types/meta';

export const TIER_LIST_PATH = '/tier-list';
export const TIER_PAGES = {
  champion: { name: '챔피언', path: '/tier-list/champions', stats: '/champions' },
  item: { name: '아이템', path: '/tier-list/items', stats: '/items' },
  trait: { name: '특성', path: '/tier-list/traits', stats: '/traits' },
} satisfies Record<MetaKind, { name: string; path: string; stats: string }>;

export function tierPageKind(path: string): MetaKind | undefined {
  return (Object.keys(TIER_PAGES) as MetaKind[]).find((kind) => TIER_PAGES[kind].path === path);
}
