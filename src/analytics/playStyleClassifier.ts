import type { playerScoreContext } from './playerScores';
export type StyleContext = NonNullable<ReturnType<typeof playerScoreContext>>;
export const STYLE_TITLES = {
  'steady-guardian': '안정적 순방형',
  'peak-mage': '고점 폭발형',
  'flexible-strategist': '유연한 운영가',
  'dedicated-master': '한 우물 장인',
  'late-commander': '후반 운영형',
  'artifact-artisan': '완성도 중시형',
  'resilient-warden': '저점 방어형',
  'bold-adventurer': '변동성 높은 도전자',
  'crown-seeker': '1등 지향형',
  'synergy-specialist': '시너지 전문형',
  'carry-specialist': '핵심 캐리 집중형',
  'deck-explorer': '덱 탐험가',
  balanced: '균형 운영형',
  insufficient: '분석 표본 부족',
} as const;
export type StyleKey = keyof typeof STYLE_TITLES;
export function hasStyleSample(c: StyleContext | null): c is StyleContext {
  return (
    !!c &&
    c.games.length >= 20 &&
    c.units.available >= c.games.length * 0.8 &&
    c.traits.available >= c.games.length * 0.8
  );
}
type Rule = { key: StyleKey; matches: (c: StyleContext) => boolean; reason: string };
// Combined mastery first, then distinctive outcome/board patterns, then specialist and broad rules. Each requires at least three observable signals.
// These describe final-board/results patterns, not mid-game decisions or player intent.
export const STYLE_RULES: readonly Rule[] = [
  {
    key: 'dedicated-master',
    matches: (c) =>
      c.unitConcentration! >= 0.65 && c.traitConcentration! >= 0.65 && c.stats.top4! >= 0.6,
    reason: '특정 유닛과 활성 특성 사용이 각각 65% 이상이며 TOP4 비율이 60% 이상입니다.',
  },
  {
    key: 'peak-mage',
    matches: (c) => c.scores.ceiling >= 65 && c.scores.stability < 60 && c.top2 >= 0.35,
    reason: '고점력 65 이상·1~2위 비율 35% 이상이며 안정성은 60 미만입니다.',
  },
  {
    key: 'crown-seeker',
    matches: (c) =>
      c.stats.win! >= 0.25 && c.top2 >= 0.4 && c.stats.average! <= 3.8 && c.scores.stability >= 60,
    reason:
      '1등률 25% 이상·1~2위 비율 40% 이상·평균 3.8위 이내이며 안정성도 60 이상입니다. 실제 의도를 뜻하지는 않습니다.',
  },
  {
    key: 'late-commander',
    matches: (c) => c.scores.lateGame >= 70 && c.avgLevel >= 8.5 && c.avgRound >= 30,
    reason:
      '후반 운영력 70 이상·평균 최종 레벨 8.5 이상·평균 마지막 라운드 30 이상입니다. 최종 보드 기준 성향입니다.',
  },
  {
    key: 'artifact-artisan',
    matches: (c) =>
      c.scores.completion !== null &&
      c.scores.completion >= 70 &&
      c.scores.survival >= 55 &&
      c.avgLevel >= 8,
    reason: '보드 완성도 70 이상·순방력 55 이상이며 평균 최종 레벨도 8 이상입니다.',
  },
  {
    key: 'steady-guardian',
    matches: (c) => c.scores.stability >= 70 && c.scores.survival >= 70 && c.bottom2 <= 0.15,
    reason: '안정성과 순방력이 모두 70 이상이며 7~8위 비율은 15% 이하입니다.',
  },
  {
    key: 'synergy-specialist',
    matches: (c) =>
      c.traitConcentration! >= 0.7 && c.unitConcentration! < 0.65 && c.stats.top4! >= 0.5,
    reason:
      '같은 활성 특성이 70% 이상 등장하지만 유닛 집중도는 65% 미만이고 TOP4 비율은 50% 이상입니다.',
  },
  {
    key: 'carry-specialist',
    matches: (c) =>
      c.equippedCoverage >= 0.8 &&
      c.unitConcentration! >= 0.65 &&
      c.traitConcentration! < 0.65 &&
      c.stats.top4! >= 0.5,
    reason:
      '아이템 2개 이상 장착 유닛이 확인된 경기가 80% 이상이며 핵심 유닛 집중도 65% 이상·활성 특성 집중도 65% 미만·TOP4 50% 이상입니다. 캐리는 최종 장착 보드 기준 추정입니다.',
  },
  {
    key: 'flexible-strategist',
    matches: (c) =>
      (c.scores.diversity ?? 0) >= 65 && (c.scores.flexibility ?? 0) >= 60 && c.stats.top4! >= 0.45,
    reason:
      '덱 다양성 65 이상·유연성 60 이상이며 TOP4 비율이 45% 이상입니다. 경기 간 보드 다양성이며 경기 중 전환 능력을 뜻하지 않습니다.',
  },
  {
    key: 'resilient-warden',
    matches: (c) => c.bottom2 <= 0.1 && c.deviation <= 1.7 && c.stats.average! <= 4.7,
    reason: '7~8위 비율 10% 이하·등수 표준편차 1.7 이하이며 평균 등수가 4.7위 이내입니다.',
  },
  {
    key: 'bold-adventurer',
    matches: (c) => c.scores.ceiling >= 40 && c.scores.stability < 45 && c.deviation >= 2,
    reason:
      '고점력은 40 이상이지만 안정성이 45 미만이고 등수 표준편차가 2 이상입니다. 의도적인 위험 감수로 단정하지 않습니다.',
  },
  {
    key: 'deck-explorer',
    matches: (c) =>
      (c.unitDiversity ?? 0) >= 75 &&
      (c.traitDiversity ?? 0) >= 75 &&
      (c.scores.flexibility ?? 0) >= 60,
    reason:
      '핵심 유닛·활성 특성 보드 다양성이 각각 75 이상이고 유연성도 60 이상입니다. 실제 실험 의도가 아닌 보드 분포를 설명합니다.',
  },
];
export function classifyPlayStyle(context: StyleContext | null) {
  if (!hasStyleSample(context))
    return {
      key: 'insufficient' as StyleKey,
      name: STYLE_TITLES.insufficient,
      reason: '20경기와 80% 이상의 최종 보드·활성 특성 기록이 필요합니다.',
    };
  const rule = STYLE_RULES.find((r) => r.matches(context));
  const key: StyleKey = rule?.key ?? 'balanced';
  return {
    key,
    name: STYLE_TITLES[key],
    reason:
      rule?.reason ?? '여러 지표를 함께 보았을 때 대표 규칙 하나로 뚜렷하게 분류되지 않습니다.',
  };
}
