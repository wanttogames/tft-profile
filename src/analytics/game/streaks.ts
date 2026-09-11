import type { Game } from '../../types/riot';
import { sample } from './sample';
export function streaks(input: Game[]) {
  const g = sample(input);
  let currentTop4 = 0,
    currentWins = 0,
    bestTop4 = 0,
    run = 0;
  for (const x of g) {
    if (x.player.placement <= 4) currentTop4++;
    else break;
  }
  for (const x of g) {
    if (x.player.placement === 1) currentWins++;
    else break;
  }
  for (const x of g) {
    run = x.player.placement <= 4 ? run + 1 : 0;
    bestTop4 = Math.max(bestTop4, run);
  }
  return { currentTop4, currentWins, bestTop4 };
}
