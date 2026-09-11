import type { Game } from '../types/riot';
import { formAnalysis } from './formAnalysis';
import { profileMetrics } from './profileAnalysis';
const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));
export function playerScores(input: Game[]) {
  const m = profileMetrics(input);
  if (m.games.length < 5) return null;
  const form = formAnalysis(m.games);
  return {
    ceiling: clamp(m.top2! * 100),
    // Maximum population variance on bounded placements [1,8] is (8-1)^2 / 4 = 12.25.
    stability: clamp((1 - m.variance! / 12.25) * 100),
    flexibility: m.flexibility,
    diversity: m.deck.score,
    survival: clamp(m.stats.top4! * 100),
    form: form.delta === null ? null : clamp(50 + (form.delta / 7) * 50),
  };
}
export const scoreHelp = {
  ceiling: '고점력 = 1~2위 비율 × 100',
  stability:
    '안정성 = (1 − 등수 분산 ÷ 12.25) × 100. 등수가 일정할수록 높으며, 계속 하위권이어도 높을 수 있습니다.',
  flexibility:
    '유연성 = 인접 경기 최종 챔피언·활성 특성 집합의 Jaccard 변화율 평균 × 100. 둘 다 있는 같은 세트 경기 쌍 4개 이상 필요. 경기 중 전환 능력은 아닙니다.',
  diversity:
    '덱 다양성 = 주요 활성 특성 상위 2개 조합의 Shannon 엔트로피 ÷ log(유효 경기 수) × 100',
  survival: '순방력 = TOP4 비율 × 100',
  form: '최근 폼 = 50 + (이전 25경기 평균 − 최근 25경기 평균) ÷ 7 × 50. 50경기 필요.',
};
