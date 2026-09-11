import type { Game } from '../../types/riot';
import { statistics } from '../formAnalysis';
import { sample } from './sample';
/** Outcome-only index: no bonus for a specific deck, level, item count or diversity. */
export function playerScore(input: Game[]): number | null {
  const g = sample(input),
    s = statistics(g);
  if (g.length < 5) return null;
  return Math.round(
    Math.max(
      0,
      Math.min(1000, (((8 - s.average!) / 7) * 0.6 + s.top4! * 0.25 + s.win! * 0.15) * 1000),
    ),
  );
}
