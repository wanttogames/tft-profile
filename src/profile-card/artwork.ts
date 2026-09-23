import manifest from './artwork-manifest.json';
import type { StyleKey } from '../analytics/playStyleClassifier';
export type ArtStyle = 'flexible' | 'aggressive' | 'stable' | 'lategame';
/** Presentation only: aggressive means peak-seeking art, never a combat metric. */
export const STYLE_ART: Record<StyleKey, ArtStyle | null> = {
  'steady-guardian': 'stable',
  'peak-mage': 'aggressive',
  'flexible-strategist': 'flexible',
  'dedicated-master': 'stable',
  'late-commander': 'lategame',
  'artifact-artisan': 'lategame',
  'resilient-warden': 'stable',
  'bold-adventurer': 'aggressive',
  'crown-seeker': 'aggressive',
  'synergy-specialist': 'stable',
  'carry-specialist': 'lategame',
  'deck-explorer': 'flexible',
  balanced: null,
  insufficient: null,
};
const catalog: Record<string, Partial<Record<ArtStyle, string>>> = manifest;
const aliases: Record<string, string> = { 나르: 'gnar', 아리: 'ahri' };
/** No API/analysis parsing changes: match artwork folders against localized names or exact ID tokens.
 * Unknown keys never produce speculative image requests. New folders are indexed at dev/build time. */
export function championArtworkKey(id?: string, displayName?: string): string | undefined {
  const name = displayName?.trim().toLowerCase();
  const candidates = [
    name && aliases[name],
    name,
    id?.toLowerCase(),
    id?.split('_').at(-1)?.toLowerCase(),
  ];
  return candidates.find((key): key is string => !!key && Object.hasOwn(catalog, key));
}
export function getProfileArtwork(championKey?: string, artStyle?: ArtStyle | null): string | null {
  if (!championKey || !artStyle || !Object.hasOwn(catalog, championKey)) return null;
  return catalog[championKey]?.[artStyle] ?? null;
}
/** Same-origin images only; a load error/timeout preserves the vector fallback and PNG export. */
export function loadProfileArtwork(src: string | null): Promise<HTMLImageElement | null> {
  if (
    !src ||
    !/^\/profile-art\/[a-z0-9-]+\/(flexible|aggressive|stable|lategame)\.webp$/.test(src) ||
    typeof Image === 'undefined'
  )
    return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    const finish = (value: HTMLImageElement | null) => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), 5000);
    img.onload = () => finish(img.naturalWidth > 0 ? img : null);
    img.onerror = () => finish(null);
    img.src = src;
  });
}
