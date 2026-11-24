// TFT Set 18, current patch 18.7 (2026-11-17). Patch 18.7 did not list XP-cost changes.
// The XP ladder retains the values verified through patch 18.6 and the 18.2 mid-patch update.
export const LEVELS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const XP_TO_REACH_LEVEL = [0, 0, 2, 2, 6, 10, 20, 36, 56, 68, 68] as const;
export const TOTAL_XP_FOR_LEVEL = [0, 0, 2, 4, 10, 20, 40, 76, 132, 200, 268] as const;
export const XP_PER_PURCHASE = 4;
export type StreakType = 'none' | 'win' | 'loss';
export type CombatResult = 'win' | 'loss' | 'pve';
export const BASE_INCOME_PRESETS = [
  { value: 'early', label: '1-2 / 1-3', income: 2 },
  { value: 'prestage', label: '1-4', income: 3 },
  { value: 'stage2', label: '2-1', income: 4 },
  { value: 'standard', label: '2-2 이후', income: 5 },
  { value: 'custom', label: '직접 입력', income: 5 },
] as const;

export function interestForGold(gold: number, cap = 5, enabled = true): number {
  if (!enabled) return 0;
  const bank = Math.max(0, Math.floor(Number.isFinite(gold) ? gold : 0));
  const safeCap = Math.max(0, Math.min(10, Math.floor(Number.isFinite(cap) ? cap : 5)));
  return Math.min(safeCap, Math.floor(bank / 10));
}
export function streakGold(length: number): number {
  const streak = Math.max(0, Math.floor(Number.isFinite(length) ? length : 0));
  if (streak >= 6) return 3;
  if (streak === 5) return 2;
  if (streak >= 2) return 1;
  return 0;
}
export function advanceStreak(currentType: StreakType, currentLength: number, result: CombatResult) {
  const length = Math.max(0, Math.floor(Number.isFinite(currentLength) ? currentLength : 0));
  if (result === 'pve') {
    return currentType === 'none' || length === 0
      ? { type: 'none' as StreakType, length: 0 }
      : { type: currentType, length };
  }
  if (result === 'win') {
    return currentType === 'win' && length > 0
      ? { type: 'win' as StreakType, length: length + 1 }
      : { type: 'win' as StreakType, length: 1 };
  }
  return currentType === 'loss' && length > 0
    ? { type: 'loss' as StreakType, length: length + 1 }
    : { type: 'loss' as StreakType, length: 1 };
}
export interface LevelPlanInput {
  gold: number; level: number; currentXp: number; targetLevel: number;
  waitRounds: number; passiveXpPerRound: number;
}
export function roundUpXpPurchase(xp: number): number {
  const safeXp = Math.max(0, Math.ceil(Number.isFinite(xp) ? xp : 0));
  return Math.ceil(safeXp / XP_PER_PURCHASE) * XP_PER_PURCHASE;
}
export function calculateLevelPlan(input: LevelPlanInput) {
  const gold = Math.max(0, Math.floor(Number.isFinite(input.gold) ? input.gold : 0));
  const level = Math.max(1, Math.min(10, Math.floor(input.level || 1)));
  const targetLevel = Math.max(level, Math.min(10, Math.floor(input.targetLevel || level)));
  const maxCurrentXp = level < 10 ? XP_TO_REACH_LEVEL[level + 1] - 1 : 0;
  const currentXp = Math.max(0, Math.min(maxCurrentXp, Math.floor(input.currentXp || 0)));
  const waitRounds = Math.max(0, Math.min(99, Math.floor(input.waitRounds || 0)));
  const passiveXpPerRound = Math.max(0, Math.min(20, Math.floor(input.passiveXpPerRound || 0)));
  const requiredXpNow = Math.max(0, TOTAL_XP_FOR_LEVEL[targetLevel] - TOTAL_XP_FOR_LEVEL[level] - currentXp);
  const passiveXp = waitRounds * passiveXpPerRound;
  const remainingXpAfterWait = Math.max(0, requiredXpNow - passiveXp);
  const immediatePurchaseXp = roundUpXpPurchase(requiredXpNow);
  const afterWaitPurchaseXp = roundUpXpPurchase(remainingXpAfterWait);
  return {
    gold, level, currentXp, targetLevel, waitRounds, passiveXpPerRound,
    currentTotalXp: TOTAL_XP_FOR_LEVEL[level] + currentXp,
    targetTotalXp: TOTAL_XP_FOR_LEVEL[targetLevel],
    requiredXpNow, passiveXp, remainingXpAfterWait,
    immediatePurchaseXp, immediateGoldCost: immediatePurchaseXp,
    immediatePurchases: immediatePurchaseXp / XP_PER_PURCHASE,
    immediateGoldShortfall: Math.max(0, immediatePurchaseXp - gold),
    immediateGoldAfter: Math.max(0, gold - immediatePurchaseXp),
    afterWaitPurchaseXp, afterWaitGoldCost: afterWaitPurchaseXp,
    afterWaitPurchases: afterWaitPurchaseXp / XP_PER_PURCHASE,
    afterWaitGoldShortfall: Math.max(0, afterWaitPurchaseXp - gold),
    afterWaitGoldAfter: Math.max(0, gold - afterWaitPurchaseXp),
    afterWaitSurplusXp: passiveXp + afterWaitPurchaseXp - requiredXpNow,
    savedGoldByWaiting: Math.max(0, immediatePurchaseXp - afterWaitPurchaseXp),
  };
}
export interface RoundIncomeInput {
  currentGold: number; plannedSpend: number; baseIncome: number;
  streakType: StreakType; streakLength: number; nextCombat: CombatResult;
  interestEnabled: boolean; interestCap: number;
}
export function calculateRoundIncome(input: RoundIncomeInput) {
  const currentGold = Math.max(0, Math.floor(Number.isFinite(input.currentGold) ? input.currentGold : 0));
  const plannedSpend = Math.max(0, Math.floor(Number.isFinite(input.plannedSpend) ? input.plannedSpend : 0));
  const baseIncome = Math.max(0, Math.min(20, Math.floor(Number.isFinite(input.baseIncome) ? input.baseIncome : 0)));
  const interestCap = Math.max(0, Math.min(10, Math.floor(Number.isFinite(input.interestCap) ? input.interestCap : 5)));
  const bankForInterest = Math.max(0, currentGold - plannedSpend);
  const currentInterest = interestForGold(currentGold, interestCap, input.interestEnabled);
  const interest = interestForGold(bankForInterest, interestCap, input.interestEnabled);
  const nextStreak = advanceStreak(input.streakType, input.streakLength, input.nextCombat);
  const streakBonus = streakGold(nextStreak.length);
  const winBonus = input.nextCombat === 'win' ? 1 : 0;
  const totalIncome = baseIncome + interest + streakBonus + winBonus;
  const nextInterestThreshold =
    input.interestEnabled && interestCap > 0 && bankForInterest < interestCap * 10
      ? Math.min(interestCap * 10, (Math.floor(bankForInterest / 10) + 1) * 10)
      : null;
  return {
    currentGold, plannedSpend, bankForInterest,
    spendShortfall: Math.max(0, plannedSpend - currentGold),
    baseIncome, currentInterest, interest, interestLost: Math.max(0, currentInterest - interest),
    streakType: nextStreak.type, streakLength: nextStreak.length,
    streakBonus, winBonus, totalIncome, projectedGold: bankForInterest + totalIncome,
    nextInterestThreshold,
    goldToNextInterest: nextInterestThreshold === null ? null : Math.max(0, nextInterestThreshold - bankForInterest),
    interestEnabled: input.interestEnabled, interestCap,
  };
}
