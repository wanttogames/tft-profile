import { describe,expect,it } from 'vitest';
import { CHAMPIONS_PER_COST, LEVELS, POOL_COPIES, SHOP_ODDS,
  normalizeRerollInput,oneShopHitChance,reachGoalChance,shopHitDistribution
} from '../src/utils/rerollOdds';
const basic={level:7,cost:3,gold:40,owned:1,contested:0,otherCopiesOut:0,goal:3};
describe('reroll calculator',()=>{
  it('uses current odds and pool sizes',()=>{
    expect(SHOP_ODDS[7]).toEqual([19,30,40,10,1]);
    expect(POOL_COPIES[4]).toBe(10);
    expect(CHAMPIONS_PER_COST[5]).toBe(10);
    for(const l of LEVELS)expect(SHOP_ODDS[l].reduce((a,b)=>a+b,0)).toBe(100);
  });
  it('normalizes single shop probabilities',()=>{
    expect(shopHitDistribution(basic).reduce((a,b)=>a+b,0)).toBeCloseTo(1,9);
    expect(shopHitDistribution({...basic,level:6,cost:5})).toEqual([1,0,0,0,0,0]);
  });
  it('accounts for already secured copies and empty budget',()=>{
    expect(reachGoalChance({...basic,owned:3})).toBe(1);
    expect(reachGoalChance({...basic,gold:0})).toBe(0);
    expect(reachGoalChance({...basic,cost:4,gold:2,owned:0})).toBe(0);
    expect(reachGoalChance({...basic,cost:4,goal:9,owned:0,contested:2})).toBe(0);
  });
  it('gives monotonic budget and contesting effect for one shop',()=>{
    expect(reachGoalChance({...basic,gold:40})).toBeGreaterThanOrEqual(reachGoalChance({...basic,gold:20}));
    expect(oneShopHitChance({...basic,contested:5})).toBeLessThan(oneShopHitChance(basic));
  });
  it('clamps out-of-range inputs',()=>{
    const x=normalizeRerollInput({...basic,gold:500,owned:-4});
    expect(x.gold).toBe(200);expect(x.owned).toBe(0);
  });
});