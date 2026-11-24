import { describe, expect, it } from 'vitest';
import {
  TOTAL_XP_FOR_LEVEL, XP_TO_REACH_LEVEL, advanceStreak, calculateLevelPlan,
  calculateRoundIncome, interestForGold, roundUpXpPurchase, streakGold,
} from '../src/utils/economy';

describe('TFT-ECON-1 Set 18 economy', () => {
  it('uses the Set 18 level XP ladder through level 10', () => {
    expect(XP_TO_REACH_LEVEL.slice(2)).toEqual([2, 2, 6, 10, 20, 36, 56, 68, 68]);
    expect(TOTAL_XP_FOR_LEVEL[10]).toBe(268);
  });
  it('rounds XP purchases to 4 XP / 4 gold blocks', () => {
    expect([0, 1, 4, 5].map(roundUpXpPurchase)).toEqual([0, 4, 4, 8]);
  });
  it('calculates immediate and delayed level-up cost with passive XP', () => {
    const plan = calculateLevelPlan({ gold: 60, level: 7, currentXp: 0, targetLevel: 8, waitRounds: 2, passiveXpPerRound: 2 });
    expect(plan.requiredXpNow).toBe(56);
    expect(plan.immediateGoldCost).toBe(56);
    expect(plan.afterWaitGoldCost).toBe(52);
    expect(plan.afterWaitPurchases).toBe(13);
    expect(plan.savedGoldByWaiting).toBe(4);
  });
  it('handles a goal reached by natural XP alone', () => {
    const plan = calculateLevelPlan({ gold: 20, level: 7, currentXp: 52, targetLevel: 8, waitRounds: 2, passiveXpPerRound: 2 });
    expect(plan.remainingXpAfterWait).toBe(0);
    expect(plan.afterWaitGoldCost).toBe(0);
    expect(plan.afterWaitSurplusXp).toBe(0);
  });
  it('clamps targets to the current level and level 10', () => {
    expect(calculateLevelPlan({ gold: 0, level: 9, currentXp: 0, targetLevel: 99, waitRounds: 0, passiveXpPerRound: 2 }).targetLevel).toBe(10);
    expect(calculateLevelPlan({ gold: 0, level: 7, currentXp: 0, targetLevel: 3, waitRounds: 0, passiveXpPerRound: 2 }).targetLevel).toBe(7);
  });
  it('calculates standard interest breakpoints and optional augment caps', () => {
    expect([9, 10, 49, 50, 99].map((g) => interestForGold(g))).toEqual([0, 1, 4, 5, 5]);
    expect(interestForGold(99, 10)).toBe(9);
    expect(interestForGold(50, 5, false)).toBe(0);
  });
  it('uses the Set 18 win/loss streak thresholds', () => {
    expect([1, 2, 3, 4, 5, 6, 9].map(streakGold)).toEqual([0, 1, 1, 1, 2, 3, 3]);
  });
  it('advances, resets, or preserves a streak based on the result', () => {
    expect(advanceStreak('win', 4, 'win')).toEqual({ type: 'win', length: 5 });
    expect(advanceStreak('win', 5, 'loss')).toEqual({ type: 'loss', length: 1 });
    expect(advanceStreak('loss', 6, 'pve')).toEqual({ type: 'loss', length: 6 });
  });
  it('calculates round income and win-streak gold', () => {
    const result = calculateRoundIncome({
      currentGold: 50, plannedSpend: 0, baseIncome: 5, streakType: 'win',
      streakLength: 5, nextCombat: 'win', interestEnabled: true, interestCap: 5,
    });
    expect([result.interest, result.streakBonus, result.winBonus, result.totalIncome, result.projectedGold])
      .toEqual([5, 3, 1, 14, 64]);
  });
  it('shows interest lost when spending crosses a 10-gold threshold', () => {
    const result = calculateRoundIncome({
      currentGold: 50, plannedSpend: 1, baseIncome: 5, streakType: 'none',
      streakLength: 0, nextCombat: 'pve', interestEnabled: true, interestCap: 5,
    });
    expect([result.bankForInterest, result.currentInterest, result.interest, result.interestLost, result.goldToNextInterest])
      .toEqual([49, 5, 4, 1, 1]);
  });
  it('handles disabled interest and unaffordable planned spending', () => {
    const result = calculateRoundIncome({
      currentGold: 10, plannedSpend: 15, baseIncome: 5, streakType: 'none',
      streakLength: 0, nextCombat: 'loss', interestEnabled: false, interestCap: 5,
    });
    expect(result.spendShortfall).toBe(5);
    expect(result.interest).toBe(0);
    expect(result.winBonus).toBe(0);
  });
});
