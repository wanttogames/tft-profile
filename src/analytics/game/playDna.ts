import type { Game } from '../../types/riot';
import { profileMetrics } from '../profileAnalysis';
import { sample, clamp, avg, valid } from './sample';
export function completion(g: Game): number | null {
  const u = g.player.units;
  if (!u.length) return null;
  // Equipped item count is observable; completed-item recipes and bench are NOT available.
  const stars = avg(u.map((x) => Math.min(1, Math.max(0, (x.tier - 1) / 2))))!;
  const equipped = u.filter((x) => x.itemNames !== undefined);
  const parts = [{ v: stars, w: 0.7 }];
  if (equipped.length)
    parts.push({ v: avg(equipped.map((x) => Math.min(1, x.itemNames!.length / 3)))!, w: 0.3 });
  return clamp(
    (parts.reduce((s, p) => s + p.v * p.w, 0) / parts.reduce((s, p) => s + p.w, 0)) * 100,
  );
}
export const dnaHelp = {
  stability: '안정성: 평균 등수 정규화 40% + TOP4 비율 40% + (1−등수 분산/12.25) 20%.',
  peak: '폭발력: 1등 비율 40% + 1~2위 비율 60%.',
  flexibility:
    '유연성: 최종 챔피언 집합·활성 특성 집합·주요 특성 조합의 다양성 평균. 경기 중 전환 능력은 아닙니다.',
  completion:
    '완성도: 유닛별 (별 등급−1)/2 평균 70% + 유닛별 장착 아이템 수/3 평균 30%. 범위는 제한합니다. 완성 아이템 판별·벤치 포함 지표는 아닙니다.',
  survival:
    '생존력: 마지막 라운드/40 정규화 50% + (8−등수)/7 50%. 라운드 40은 자체 기준이며 패치별 실력 백분위가 아닙니다.',
  aggression:
    '공격성: 플레이어 피해량/200 70% + 처치 수/4 30%. 유효 표본만 계산하고 없는 지표의 가중치는 제외합니다. 누적 피해는 생존 시간의 영향을 받습니다.',
};
export function playDna(input: Game[]) {
  const games = sample(input),
    m = profileMetrics(games);
  const metric = (value: number | null, count: number) => ({
    value: games.length >= 5 && count >= 5 ? value : null,
    count,
  });
  const boards = games.map(completion).filter((n): n is number => n !== null);
  const rounds = games.filter((g) => valid(g.player.last_round));
  const damage = games.map((g) => g.player.total_damage_to_players).filter(valid),
    kills = games.map((g) => g.player.players_eliminated).filter(valid);
  const combat = [
    ...(damage.length >= 5 ? [{ v: Math.min(1, avg(damage)! / 200), w: 0.7 }] : []),
    ...(kills.length >= 5 ? [{ v: Math.min(1, avg(kills)! / 4), w: 0.3 }] : []),
  ];
  const flex = [m.unitDiversity, m.traitDiversity, m.deck.score].filter(
    (n): n is number => n !== null,
  );
  return {
    stability: metric(
      m.stats.average === null
        ? null
        : clamp(
            (((8 - m.stats.average) / 7) * 0.4 +
              m.stats.top4! * 0.4 +
              (1 - m.variance! / 12.25) * 0.2) *
              100,
          ),
      games.length,
    ),
    peak: metric(
      m.stats.win === null ? null : clamp((m.stats.win * 0.4 + m.top2! * 0.6) * 100),
      games.length,
    ),
    flexibility: metric(
      avg(flex) === null ? null : clamp(avg(flex)!),
      Math.min(m.units.available, m.traits.available),
    ),
    completion: metric(avg(boards) === null ? null : clamp(avg(boards)!), boards.length),
    survival: metric(
      rounds.length
        ? clamp(
            avg(
              rounds.map(
                (g) =>
                  Math.min(1, g.player.last_round / 40) * 50 + ((8 - g.player.placement) / 7) * 50,
              ),
            )!,
          )
        : null,
      rounds.length,
    ),
    aggression: metric(
      combat.length
        ? clamp(
            (combat.reduce((s, p) => s + p.v * p.w, 0) / combat.reduce((s, p) => s + p.w, 0)) * 100,
          )
        : null,
      Math.max(damage.length, kills.length),
    ),
  };
}
