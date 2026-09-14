import type { Game } from '../../types/riot';
import type { AssetMap } from '../../static-data/catalog';
import { sample, avg, valid } from './sample';
import { boardCompletion } from '../playerScores';
export function matchFeedback(game: Game, input: Game[], assets: AssetMap = {}) {
  const baseline = sample(input).filter((g) => g.id !== game.id);
  const tags: { label: string; reason: string }[] = [];
  if (baseline.length < 5) return tags;
  const b = baseline
      .map((match) => boardCompletion(match, assets))
      .filter((n): n is number => n !== null),
    c = boardCompletion(game, assets);
  if (b.length >= 5 && c !== null && c >= 70 && c >= avg(b)! + 10)
    tags.push({
      label: 'STRONG BOARD',
      reason: '완성도 대리 지표 70 이상이며 다른 경기 평균보다 10점 이상 높습니다.',
    });
  if (b.length >= 5 && c !== null && c <= avg(b)! - 15)
    tags.push({
      label: '성장 여지가 있는 보드',
      reason: '완성도 대리 지표가 다른 경기 평균보다 15점 이상 낮습니다.',
    });
  const starCount = (g: Game) => g.player.units.filter((u) => u.tier >= 3).length;
  if (starCount(game) > 0 && starCount(game) > avg(baseline.map(starCount))!)
    tags.push({ label: '3-STAR UNIT', reason: '3성 이상 유닛 수가 다른 경기 평균보다 많습니다.' });
  const rounds = baseline.map((g) => g.player.last_round).filter(valid);
  if (rounds.length >= 5 && game.player.last_round <= avg(rounds)! - 5)
    tags.push({
      label: '짧았던 여정',
      reason: '마지막 라운드가 다른 경기 평균보다 5 이상 낮습니다.',
    });
  return tags;
}
