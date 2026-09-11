import type { Game } from '../../types/riot';
import { sample } from './sample';
import { statistics } from '../formAnalysis';
export function challenge(input: Game[]) {
  const g = sample(input),
    recent = g.slice(0, 10),
    s = statistics(g);
  const peak = g.length >= 10 && s.top4! >= 0.6;
  const target = peak ? 2 : 5,
    current = recent.filter((x) =>
      peak ? x.player.placement === 1 : x.player.placement <= 4,
    ).length;
  return {
    id: peak ? 'peak' : 'top4',
    name: peak ? '고점의 벽' : 'TOP4 수문장',
    window: 10,
    available: recent.length,
    target,
    current,
    progress: Math.min(current, target),
    complete: recent.length === 10 && current >= target,
    description: peak ? '최근 10경기에서 1위 2회' : '최근 10경기에서 TOP4 5회',
  };
}
