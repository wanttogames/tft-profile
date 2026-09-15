import { FORM_WINDOW } from '../config/analysis';
import type { Game } from '../types/riot';
import { mean, statistics, formAnalysis } from './formAnalysis';
import { deckDiversity } from './deckDiversity';
export function strengthWeakness(games: Game[]) {
  const strengths: string[] = [],
    weaknesses: string[] = [];
  if (games.length < 10)
    return { strengths, weaknesses, comment: '10경기 이상 모이면 반복되는 패턴을 분석합니다.' };
  const f = formAnalysis(games),
    s = statistics(games),
    d = deckDiversity(games);
  if (f.delta !== null && f.delta >= 0.3)
    strengths.push(
      `최근 ${FORM_WINDOW}경기 평균 등수가 이전 ${FORM_WINDOW}경기보다 ${f.delta.toFixed(2)} 개선됐습니다.`,
    );
  if (f.delta !== null && f.delta <= -0.3)
    weaknesses.push(
      `최근 ${FORM_WINDOW}경기 평균 등수가 이전 ${FORM_WINDOW}경기보다 ${(-f.delta).toFixed(2)} 하락했습니다.`,
    );
  if (s.top4! >= 0.6)
    strengths.push(
      `${games.length}경기 중 ${games.filter((g) => g.player.placement <= 4).length}경기에서 TOP4에 진입했습니다.`,
    );
  if (d.valid >= 10 && d.top[0] && d.top[0][1] / d.valid >= 0.6)
    weaknesses.push(
      `주요 특성 조합 하나가 분석 가능한 ${d.valid}경기 중 ${d.top[0][1]}경기에 반복됩니다. 성적 하락의 원인으로 단정할 수는 없습니다.`,
    );
  const high = games.filter((g) => g.player.level >= 9),
    other = games.filter((g) => g.player.level < 9);
  if (
    high.length >= 3 &&
    other.length >= 3 &&
    statistics(high).average! + 0.5 < statistics(other).average!
  )
    strengths.push(
      `최종 9레벨 이상 ${high.length}경기의 평균 등수는 ${statistics(high).average!.toFixed(2)}로, 나머지 경기보다 좋았습니다. 오래 생존한 결과일 수도 있습니다.`,
    );
  const bottom = games.filter((g) => g.player.placement >= 7),
    top = games.filter((g) => g.player.placement <= 4);
  if (
    bottom.length >= 3 &&
    top.length >= 3 &&
    mean(bottom.map((g) => g.player.level))! + 0.5 < mean(top.map((g) => g.player.level))!
  )
    weaknesses.push(
      `7~8등 ${bottom.length}경기의 최종 레벨이 TOP4 경기보다 낮았습니다. 낮은 레벨이 패배 원인이라는 뜻은 아닙니다.`,
    );
  return {
    strengths,
    weaknesses,
    comment:
      f.delta !== null && f.delta >= 0.3
        ? `최근 ${FORM_WINDOW}경기의 성적이 이전보다 개선되고 있습니다.`
        : s.top4! >= 0.6
          ? '최근 기록에서는 하위권보다 TOP4에 진입한 경기가 더 많습니다.'
          : '최근 기록을 충분히 모아, 반복되는 보드와 성적의 관계를 살펴보세요.',
  };
}
