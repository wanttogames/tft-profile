import type { Game } from '../types/riot';
import { statistics, formAnalysis } from './formAnalysis';
import { deckDiversity, deckKey } from './deckDiversity';
const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
export function playerScores(games: Game[]) {
  if (games.length < 5) return null;
  const stats = statistics(games),
    form = formAnalysis(games);
  const pairs = games
    .slice(1)
    .map((g, i) => [deckKey(g), deckKey(games[i]!)])
    .filter((p) => p[0] && p[1]);
  return {
    // Descriptive within-sample indices, NOT skill percentile or substitute ranked ladder.
    ceiling: clamp((games.filter((g) => g.player.placement <= 2).length / games.length) * 100),
    stability: clamp(stats.top4! * 100),
    flexibility:
      pairs.length >= 4
        ? clamp((pairs.filter((p) => p[0] !== p[1]).length / pairs.length) * 100)
        : null,
    diversity: deckDiversity(games).score,
    form: form.delta === null ? null : clamp(50 + (form.delta / 7) * 50),
    risk: clamp(
      (games.filter((g) => g.player.placement <= 2 || g.player.placement >= 7).length /
        games.length) *
        100,
    ),
  };
}
export const scoreHelp = {
  ceiling: '고점력 = 1~2등 비율 × 100',
  stability: '안정성 = TOP4 비율 × 100',
  flexibility:
    '유연성 = 인접 경기의 주요 특성 조합 변경 비율 × 100. 경기 내 전환 능력을 뜻하지 않습니다.',
  diversity: '덱 다양성 = 주요 특성 조합의 정규화 Shannon 엔트로피 × 100',
  form: '최근 폼 = 50 + (이전 10경기 평균 − 최근 10경기 평균) ÷ 7 × 50',
  risk: '리스크 성향 = 1~2등 또는 7~8등 비율 × 100. 실제 위험 선택의 증거가 아닌 결과의 극단성입니다.',
};
