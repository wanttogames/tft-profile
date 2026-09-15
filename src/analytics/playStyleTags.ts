import { hasStyleSample, type StyleContext } from './playStyleClassifier';
/** Maximum three independent observations. No padding with invented traits on sparse data. */
export function playStyleTags(c: StyleContext | null): string[] {
  if (!hasStyleSample(c)) return [];
  const tags: string[] = [];
  if (c.avgLevel >= 8.5 && c.avgRound >= 30) tags.push('후반형');
  if (c.scores.stability >= 70 && c.stats.top4! >= 0.6) tags.push('순방 안정');
  if ((c.scores.diversity ?? 0) >= 65 && (c.scores.flexibility ?? 0) >= 60)
    tags.push('덱 다양성 높음');
  if (c.traitConcentration! >= 0.7 && c.traits.available >= 20) tags.push('특정 시너지 집중');
  if (c.equippedCoverage >= 0.8 && c.unitConcentration! >= 0.65) tags.push('핵심 캐리 중심');
  if ((c.scores.completion ?? 0) >= 70 && c.avgLevel >= 8) tags.push('완성도 높음');
  if (c.deviation >= 2.3 && c.bottom2 >= 0.2) tags.push('변동성 높음');
  if (c.stats.win! >= 0.2 && c.top2 >= 0.35) tags.push('고점 지향');
  if (c.bottom2 <= 0.1 && c.deviation <= 1.7 && !tags.includes('순방 안정')) tags.push('저점 방어');
  // When no strong tendency exists, use literal measured summaries, not a forced personality.
  if (tags.length < 2) tags.push(`TOP4 ${Math.round(c.stats.top4! * 100)}%`);
  if (tags.length < 2) tags.push(`평균 최종 레벨 ${c.avgLevel.toFixed(1)}`);
  return tags.slice(0, 3);
}
