import type { Game } from '../types/riot';
import { mean, statistics } from './formAnalysis';
import { boardIds, preferenceAnalysis, recentSample } from './preferences';
import { deckDiversity } from './deckDiversity';
const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
export function signatureDiversity(games: Game[], kind: 'unit' | 'trait'): number | null {
  const signatures = games
    .map((g) => `${g.set}:${[...new Set(boardIds(g, kind))].sort().join('|')}`)
    .filter((s) => !s.endsWith(':'));
  if (signatures.length < 5) return null;
  const counts = new Map<string, number>();
  signatures.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  return clamp(
    (-[...counts.values()].reduce(
      (s, c) => s + (c / signatures.length) * Math.log(c / signatures.length),
      0,
    ) /
      Math.log(signatures.length)) *
      100,
  );
}
export function boardFlexibility(games: Game[]): number | null {
  const changes: number[] = [];
  for (let i = 1; i < games.length; i++) {
    const a = games[i - 1]!,
      b = games[i]!;
    if (a.set !== b.set) continue;
    const values: number[] = [];
    for (const kind of ['unit', 'trait'] as const) {
      const x = new Set(boardIds(a, kind)),
        y = new Set(boardIds(b, kind));
      if (!x.size || !y.size) continue;
      values.push(1 - [...x].filter((id) => y.has(id)).length / new Set([...x, ...y]).size);
    }
    if (values.length === 2) changes.push(mean(values)!);
  }
  return changes.length >= 4 ? clamp(mean(changes)! * 100) : null;
}
export function profileMetrics(input: Game[]) {
  const games = recentSample(input),
    stats = statistics(games);
  const units = preferenceAnalysis(games, 'unit'),
    traits = preferenceAnalysis(games, 'trait'),
    deck = deckDiversity(games);
  const damage = games.filter((g) => g.player.total_damage_to_players !== undefined);
  const eliminated = games.filter((g) => g.player.players_eliminated !== undefined);
  return {
    games,
    stats,
    units,
    traits,
    deck,
    variance:
      stats.average === null
        ? null
        : mean(games.map((g) => (g.player.placement - stats.average!) ** 2)),
    top2: games.length ? games.filter((g) => g.player.placement <= 2).length / games.length : null,
    bottom2: games.length
      ? games.filter((g) => g.player.placement >= 7).length / games.length
      : null,
    level: mean(games.map((g) => g.player.level)),
    round: mean(games.map((g) => g.player.last_round)),
    late: games.length ? games.filter((g) => g.player.level >= 9).length / games.length : 0,
    damage: mean(damage.map((g) => g.player.total_damage_to_players!)),
    damageCount: damage.length,
    eliminated: mean(eliminated.map((g) => g.player.players_eliminated!)),
    eliminatedCount: eliminated.length,
    unitDiversity: signatureDiversity(games, 'unit'),
    traitDiversity: signatureDiversity(games, 'trait'),
    flexibility: boardFlexibility(games),
    unitConcentration: units.rows[0]?.rate ?? null,
    traitConcentration: traits.rows[0]?.rate ?? null,
    deckConcentration: deck.valid ? (deck.top[0]?.[1] ?? 0) / deck.valid : null,
  };
}
/** Ordered, multi-metric descriptive rules. Thresholds are product heuristics, not population percentiles. */
export function playerProfile(input: Game[]) {
  const m = profileMetrics(input),
    n = m.games.length;
  let name = '균형 탐색형',
    reason = '여러 지표를 함께 보았을 때 뚜렷한 한 가지 성향이 확인되지 않습니다.';
  if (n < 20 || m.units.available < n * 0.8 || m.traits.available < n * 0.8) {
    name = '분석 표본 부족';
    reason = '20경기 이상과 80% 이상의 보드·특성 기록이 있어야 성향을 분류합니다.';
  } else if (
    m.deckConcentration! >= 0.6 &&
    m.unitConcentration! >= 0.8 &&
    m.traitConcentration! >= 0.8
  ) {
    name = '한 우물 장인';
    reason = '주요 특성 조합 60% 이상, 최다 챔피언·특성 80% 이상으로 사용이 집중됐습니다.';
  } else if (m.top2! >= 0.4 && m.stats.win! >= 0.2 && m.variance! >= 3) {
    name = '고점 폭발형';
    reason = '1~2위 40% 이상·1등 20% 이상이면서 등수 분산도 3 이상입니다.';
  } else if (m.stats.top4! >= 0.65 && m.stats.average! <= 4 && m.variance! <= 2.5) {
    name = '안정적 순방형';
    reason = 'TOP4 65% 이상·평균 4위 이내이며 등수 분산이 2.5 이하입니다.';
  } else if (
    m.flexibility! >= 35 &&
    m.deck.score! >= 45 &&
    m.unitDiversity! >= 40 &&
    m.traitDiversity! >= 40 &&
    m.stats.top4! >= 0.5
  ) {
    name = '유연한 운영가';
    reason =
      '챔피언·특성·주요 조합이 다양하고 TOP4 50% 이상입니다. 경기 중 전환 능력을 뜻하지 않습니다.';
  } else if (
    m.damageCount >= Math.max(10, n * 0.8) &&
    m.eliminatedCount >= Math.max(10, n * 0.8) &&
    m.damage! >= 100 &&
    m.eliminated! >= 1 &&
    m.stats.top4! >= 0.5 &&
    m.stats.average! <= 4.5
  ) {
    name = '공격적 운영가';
    reason =
      '평균 플레이어 피해량 100 이상·처치 1명 이상과 TOP4 50% 이상이 함께 관측됐습니다. 공격적 선택을 직접 관찰한 것은 아닙니다.';
  } else if (m.level! >= 8.5 && m.late >= 0.6 && m.stats.average! <= 4.5 && m.stats.top4! >= 0.5) {
    name = '후반 지향형';
    reason = '평균 최종 레벨 8.5 이상·9레벨 이상 60% 이상이며 TOP4 50% 이상입니다.';
  } else if (
    m.bottom2! <= 0.1 &&
    m.variance! <= 2.5 &&
    m.stats.average! <= 4.5 &&
    m.stats.top4! >= 0.5
  ) {
    name = '저점 방어형';
    reason = '7~8위 10% 이하·등수 분산 2.5 이하이며 평균 4.5위 이내입니다.';
  }
  const comment =
    n < 20
      ? reason
      : `최근 ${n}경기 평균 ${m.stats.average!.toFixed(2)}위, TOP4 ${Math.round(m.stats.top4! * 100)}%. ${reason}`;
  // Most frequently fielded item-equipped unit per match is a proxy, not a verified carry.
  const coreGames = m.games.map((g) => ({
    ...g,
    player: {
      ...g.player,
      units: g.player.units.filter((u) => (u.itemNames ?? u.items).length >= 2),
    },
  }));
  return {
    ...m,
    name,
    reason,
    comment,
    core: preferenceAnalysis(coreGames, 'unit').top.slice(0, 3),
  };
}
export function extremeComparison(input: Game[]) {
  const games = recentSample(input);
  const group = (selected: Game[]) => ({
    count: selected.length,
    level: mean(selected.map((g) => g.player.level)),
    units: preferenceAnalysis(selected, 'unit').top.slice(0, 3),
    traits: preferenceAnalysis(selected, 'trait').top.slice(0, 3),
  });
  const high = group(games.filter((g) => g.player.placement <= 2)),
    low = group(games.filter((g) => g.player.placement >= 7));
  const enough = high.count >= 3 && low.count >= 3;
  return { high, low, enough, levelDelta: enough ? high.level! - low.level! : null };
}
