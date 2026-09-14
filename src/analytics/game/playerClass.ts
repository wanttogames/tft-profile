import type { Game } from '../../types/riot';
import type { AssetMap } from '../../static-data/catalog';
import { playerStyle } from '../playerScores';
export function playerClass(input: Game[], assets: AssetMap = {}) {
  return playerStyle(input, assets);
}
