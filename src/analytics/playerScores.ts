import type { Game } from '../types/riot';
import type { AssetMap } from '../static-data/catalog';
import { lookupAsset } from '../static-data/catalog';
import { statistics, mean } from './formAnalysis';
import { boardIds, preferenceAnalysis, recentSample, unitItems } from './preferences';
import { deckDiversity } from './deckDiversity';

const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
const ratio = (n: number) => Math.max(0, Math.min(1, n));
const average = (values: number[]) => mean(values)!;
const coreUnitIds = (game: Game) => {
  const equipped = game.player.units
    .filter((unit) => unitItems(unit).length >= 2)
    .map((unit) => unit.character_id);
  // Some old responses lack item names; keep their board usable instead of inventing a carry.
  return equipped.length ? equipped : game.player.units.map((unit) => unit.character_id);
};

function signatureDiversity(games: Game[], kind: 'unit' | 'trait'): number | null {
  const signatures = games
    .map((game) =>
      [...new Set(kind === 'unit' ? coreUnitIds(game) : boardIds(game, kind))].sort().join('|'),
    )
    .filter(Boolean);
  if (signatures.length < 5) return null;
  const counts = new Map<string, number>();
  signatures.forEach((key) => counts.set(key, (counts.get(key) ?? 0) + 1));
  if (counts.size === 1) return 0;
  const entropy = -[...counts.values()].reduce((sum, count) => {
    const p = count / signatures.length;
    return sum + p * Math.log(p);
  }, 0);
  return clamp((entropy / Math.log(signatures.length)) * 100);
}

/** Final-board completion from observable stars, classified items and active trait tiers. */
export function boardCompletion(game: Game, assets: AssetMap = {}): number | null {
  const units = game.player.units;
  if (!units.length) return null;
  const starScore = average(units.map((unit) => ratio((unit.tier - 1) / 2)));
  const itemIds = units.flatMap(unitItems);
  const classified = itemIds
    .map((id) => lookupAsset(assets, 'item', id)?.itemType)
    .filter((type): type is 'component' | 'completed' => type !== undefined);
  // Nine completed items is a fully equipped three-carry final board proxy.
  const itemScore = classified.length
    ? ratio(classified.filter((type) => type === 'completed').length / 9)
    : null;
  const activeTraits = game.player.traits.filter(
    (trait) => trait.tier_current > 0 && trait.tier_total > 0,
  );
  const traitScore = activeTraits.length
    ? average(activeTraits.map((trait) => ratio(trait.tier_current / trait.tier_total)))
    : null;
  const parts = [
    { value: starScore, weight: 0.5 },
    ...(itemScore === null ? [] : [{ value: itemScore, weight: 0.3 }]),
    ...(traitScore === null ? [] : [{ value: traitScore, weight: 0.2 }]),
  ];
  return clamp(
    (parts.reduce((sum, part) => sum + part.value * part.weight, 0) /
      parts.reduce((sum, part) => sum + part.weight, 0)) *
      100,
  );
}

export function playerScoreContext(input: Game[], assets: AssetMap = {}) {
  const games = recentSample(input);
  if (games.length < 5) return null;
  const stats = statistics(games);
  const placements = games.map((game) => game.player.placement);
  const variance = average(placements.map((placement) => (placement - stats.average!) ** 2));
  const deviation = Math.sqrt(variance);
  const top2 = games.filter((game) => game.player.placement <= 2).length / games.length;
  const bottom2 = games.filter((game) => game.player.placement >= 7).length / games.length;
  const thirdFourth =
    games.filter((game) => game.player.placement === 3 || game.player.placement === 4).length /
    games.length;
  const coreGames = games.map((game) => {
    const ids = new Set(coreUnitIds(game));
    return {
      ...game,
      player: {
        ...game.player,
        units: game.player.units.filter((unit) => ids.has(unit.character_id)),
      },
    };
  });
  const units = preferenceAnalysis(coreGames, 'unit');
  const traits = preferenceAnalysis(games, 'trait');
  const deck = deckDiversity(games);
  const unitDiversity = signatureDiversity(games, 'unit');
  const traitDiversity = signatureDiversity(games, 'trait');
  const deckConcentration = deck.valid ? (deck.top[0]?.[1] ?? 0) / deck.valid : null;
  const unitConcentration = units.rows[0]?.rate ?? null;
  const traitConcentration = traits.rows[0]?.rate ?? null;

  // 1) Peak: wins, top-two finishes and overall placement quality.
  const ceiling = clamp((stats.win! * 0.4 + top2 * 0.4 + ((8 - stats.average!) / 7) * 0.2) * 100);
  // 2) Stability: TOP4, avoiding 7–8th, and low placement deviation (maximum 3.5).
  const stability = clamp(
    (stats.top4! * 0.5 + (1 - bottom2) * 0.25 + (1 - ratio(deviation / 3.5)) * 0.25) * 100,
  );
  // 3) Survival: TOP4 is primary; 3–4th finishes can add up to 15 supporting points.
  const survival = clamp(stats.top4! * 100 + thirdFourth * 15);

  const avgLevel = average(games.map((game) => game.player.level));
  const avgRound = average(games.map((game) => game.player.last_round));
  const high = games.filter((game) => game.player.placement <= 2);
  const low = games.filter((game) => game.player.placement >= 7);
  const highLevel = high.length >= 3 ? average(high.map((game) => game.player.level)) : null;
  const lowLevel = low.length >= 3 ? average(low.map((game) => game.player.level)) : null;
  // 4) Late game: level, last round, high-placement level and high/low level gap.
  const lateParts = [
    { value: ratio((avgLevel - 6) / 4), weight: 0.35 },
    { value: ratio((avgRound - 20) / 20), weight: 0.35 },
    ...(highLevel === null ? [] : [{ value: ratio((highLevel - 6) / 4), weight: 0.15 }]),
    ...(highLevel === null || lowLevel === null
      ? []
      : [{ value: ratio(0.5 + (highLevel - lowLevel) / 4), weight: 0.15 }]),
  ];
  const lateGame = clamp(
    (lateParts.reduce((sum, part) => sum + part.value * part.weight, 0) /
      lateParts.reduce((sum, part) => sum + part.weight, 0)) *
      100,
  );

  // 5) Diversity: entropy of core-unit boards, active-trait boards and composition signatures.
  const diversityParts = [unitDiversity, traitDiversity, deck.score].filter(
    (value): value is number => value !== null,
  );
  const diversity = diversityParts.length ? clamp(average(diversityParts)) : null;
  // 6) Flexibility: inverse concentration of the most repeated unit, active trait and deck.
  const flexibilityParts = [unitConcentration, traitConcentration, deckConcentration]
    .filter((value): value is number => value !== null)
    .map((value) => (1 - value) * 100);
  const flexibility = flexibilityParts.length ? clamp(average(flexibilityParts)) : null;
  // 7) Completion: average of observable final-board completion scores.
  const completedBoards = games
    .map((game) => boardCompletion(game, assets))
    .filter((value): value is number => value !== null);
  const completion = completedBoards.length >= 5 ? clamp(average(completedBoards)) : null;

  // 8) Form: last 10 absolute quality plus changes against the preceding 10–20 games.
  const recent = games.slice(0, 10);
  const previous = games.slice(10, 30);
  let form: number | null = null;
  if (recent.length === 10 && previous.length >= 10) {
    const current = statistics(recent);
    const past = statistics(previous);
    const currentQuality = (8 - current.average!) / 7;
    const placementChange = ratio(0.5 + (past.average! - current.average!) / 7);
    const top4Change = ratio(0.5 + (current.top4! - past.top4!) / 2);
    form = clamp((currentQuality * 0.5 + placementChange * 0.3 + top4Change * 0.2) * 100);
  }

  return {
    games,
    stats,
    top2,
    bottom2,
    thirdFourth,
    deviation,
    avgLevel,
    avgRound,
    highLevel,
    lowLevel,
    unitConcentration,
    traitConcentration,
    deckConcentration,
    units,
    traits,
    deck,
    scores: {
      ceiling,
      stability,
      survival,
      lateGame,
      diversity,
      flexibility,
      completion,
      form,
    },
  };
}

export function playerScores(input: Game[], assets: AssetMap = {}) {
  return playerScoreContext(input, assets)?.scores ?? null;
}

export function playerStyle(input: Game[], assets: AssetMap = {}) {
  const context = playerScoreContext(input, assets);
  const result = (name: string, reason: string) => ({ name, reason });
  if (
    !context ||
    context.games.length < 20 ||
    context.units.available < context.games.length * 0.8 ||
    context.traits.available < context.games.length * 0.8
  )
    return result('분석 표본 부족', '20경기와 80% 이상의 최종 보드·활성 특성 기록이 필요합니다.');
  const s = context.scores;
  if (context.unitConcentration! >= 0.65 && context.traitConcentration! >= 0.65 && s.survival >= 60)
    return result(
      '한 우물 장인',
      '특정 챔피언과 활성 특성 사용이 65% 이상 집중되면서 순방력도 60 이상입니다.',
    );
  if (s.ceiling >= 65 && s.stability < 60 && context.top2 >= 0.35)
    return result('고점 폭발형', '고점력 65 이상·1~2위 비율 35% 이상이며 안정성은 60 미만입니다.');
  if (s.stability >= 70 && s.survival >= 70 && context.bottom2 <= 0.15)
    return result(
      '안정적 순방형',
      '안정성과 순방력이 모두 70 이상이며 7~8위 비율은 15% 이하입니다.',
    );
  if ((s.diversity ?? 0) >= 65 && (s.flexibility ?? 0) >= 60 && s.survival >= 45)
    return result('유연한 운영가', '덱 다양성 65 이상·유연성 60 이상이며 순방력도 45 이상입니다.');
  if (s.lateGame >= 70 && context.avgLevel >= 8.5 && context.avgRound >= 30)
    return result(
      '후반 운영형',
      '후반 운영력 70 이상이며 평균 최종 레벨 8.5 이상·평균 마지막 라운드 30 이상입니다.',
    );
  if ((s.completion ?? 0) >= 70 && s.survival >= 55 && context.avgLevel >= 8)
    return result(
      '완성도 중시형',
      '보드 완성도 70 이상·순방력 55 이상이며 평균 최종 레벨도 8 이상입니다.',
    );
  if (s.ceiling >= 40 && s.stability < 45 && context.deviation >= 2)
    return result(
      '변동성 높은 도전자',
      '고점력은 40 이상이지만 안정성이 45 미만이고 등수 표준편차가 2 이상입니다.',
    );
  return result(
    '균형 운영형',
    '8개 지표를 함께 보았을 때 한 가지 성향이 과도하게 두드러지지 않습니다.',
  );
}

export const scoreHelp = {
  ceiling: '고점력 = 1등률 40% + 1~2위 비율 40% + 평균 등수 품질 20%.',
  stability: '안정성 = TOP4 50% + 7~8위 회피 25% + 낮은 등수 표준편차 25%.',
  survival: '순방력 = TOP4 비율을 100점 기준으로 계산하고 3~4위 비율을 최대 15점 보조 반영.',
  lateGame:
    '후반 운영력 = 평균 최종 레벨 35% + 평균 마지막 라운드 35% + 고점 경기 레벨 및 고점·저점 레벨 차이 각 15%.',
  diversity: '덱 다양성 = 핵심 유닛 집합·활성 특성 집합·주요 활성 특성 조합의 다양성 평균.',
  flexibility: '유연성 = 최다 핵심 유닛·활성 특성·주요 조합 집중도의 반대값 평균.',
  completion:
    '보드 완성도 = 유닛 별 등급 50% + 정적 데이터로 확인된 완성 아이템 수 30% + 활성 특성 단계 20%. 재료 아이템은 제외.',
  form: '최근 폼 = 최근 10경기 성적 50% + 이전 10~20경기 대비 평균 등수 변화 30% + TOP4 변화 20%. 최소 20경기 필요.',
};
