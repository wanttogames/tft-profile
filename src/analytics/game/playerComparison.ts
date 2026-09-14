import type { Game } from '../../types/riot';
import { statistics } from '../formAnalysis';
import { sample } from './sample';
import { playerScore } from './playerScore';
import { playerScores } from '../playerScores';
import type { AssetMap } from '../../static-data/catalog';
export function playerComparison(input: Game[], assets: AssetMap = {}) {
  const g = sample(input);
  if (g.length < 50) return null;
  const group = (g: Game[]) => ({
    stats: statistics(g),
    scores: playerScores(g, assets)!,
    score: playerScore(g)!,
  });
  const recent = group(g.slice(0, 25)),
    past = group(g.slice(25, 50));
  const improvement = past.stats.average! - recent.stats.average!,
    top4Change = (recent.stats.top4! - past.stats.top4!) * 100;
  return {
    recent,
    past,
    improvement,
    top4Change,
    scoreDelta: recent.score - past.score,
    comment:
      improvement > 0.05 && top4Change > 0
        ? '평균 등수와 TOP4 비율이 함께 개선됐습니다.'
        : improvement < -0.05 && top4Change < 0
          ? '평균 등수와 TOP4 비율이 함께 낮아졌습니다. 최근 기록을 살펴보세요.'
          : '지표별 변화 방향이 다르거나 변화가 작습니다.',
  };
}
