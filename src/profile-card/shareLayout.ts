import { scoreLabels, type ProfileCardModel } from './model';
export const SHARE_LAYOUT = {
  width: 1080,
  height: 1512,
  hero: { x: 58, y: 206, width: 964, height: 720 },
} as const;
/** CSS object-position equivalent; tune each champion without changing analysis. */
export const SHARE_ART_POSITION: Record<string, { x: number; y: number }> = {
  gnar: { x: 0.5, y: 0.35 },
  ahri: { x: 0.5, y: 0.25 },
};
export function shareArtPosition(champion?: string) {
  return (champion && SHARE_ART_POSITION[champion]) || { x: 0.5, y: 0.3 };
}
/** Only available measured values, descending; stable label order breaks ties. */
export function topShareScores(scores: ProfileCardModel['scores']) {
  return Object.entries(scoreLabels)
    .flatMap(([key, label]) => {
      const value = scores?.[key as keyof typeof scoreLabels];
      return typeof value === 'number' && Number.isFinite(value) ? [{ key, label, value }] : [];
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
}
export function heroCoverCrop(width: number, height: number, champion?: string) {
  const box = SHARE_LAYOUT.hero;
  const scale = Math.max(box.width / width, box.height / height);
  const sw = box.width / scale,
    sh = box.height / scale;
  const position = shareArtPosition(champion);
  return { sx: (width - sw) * position.x, sy: (height - sh) * position.y, sw, sh };
}
