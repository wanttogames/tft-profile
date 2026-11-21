/** Set 18 ordinary shop probabilities (2026-11). Review on each patch/set. */
export const SHOP_ODDS: Record<number, readonly number[]> = {
  3: [75,25,0,0,0], 4: [55,30,15,0,0], 5: [45,33,20,2,0],
  6: [30,40,25,5,0], 7: [19,30,40,10,1], 8: [15,20,32,30,3],
  9: [10,17,25,33,15], 10: [5,10,20,40,25],
};
export const POOL_COPIES: Record<number, number> = {1:30,2:25,3:18,4:10,5:9};
export const CHAMPIONS_PER_COST: Record<number, number> = {1:14,2:13,3:14,4:14,5:10};
export const LEVELS = [3,4,5,6,7,8,9,10] as const;
export interface RerollInput {
  level:number; cost:number; gold:number; owned:number;
  contested:number; otherCopiesOut:number; goal:number;
}
const clamp = (n:number,min:number,max:number) =>
  Math.min(max,Math.max(min,Number.isFinite(n)?Math.floor(n):min));
export function normalizeRerollInput(raw:RerollInput):RerollInput {
  const cost=clamp(raw.cost,1,5), pool=POOL_COPIES[cost];
  const owned=clamp(raw.owned,0,pool);
  return {
    level:clamp(raw.level,3,10),cost,gold:clamp(raw.gold,0,200),owned,
    contested:clamp(raw.contested,0,pool-owned),
    otherCopiesOut:clamp(raw.otherCopiesOut,0,(CHAMPIONS_PER_COST[cost]-1)*pool-5),
    goal:raw.goal===1?1:raw.goal===9?9:3,
  };
}
function choose(n:number,k:number):number {
  if(k<0||k>n) return 0;
  let value=1;
  for(let i=1;i<=Math.min(k,n-k);i++) value=value*(n-i+1)/i;
  return value;
}
/** Number of target copies appearing in one ordinary paid five-slot shop. */
export function shopHitDistribution(raw:RerollInput, held=raw.owned):number[] {
  const x=normalizeRerollInput(raw);
  const targets=Math.max(0,POOL_COPIES[x.cost]-x.contested-held);
  const others=(CHAMPIONS_PER_COST[x.cost]-1)*POOL_COPIES[x.cost]-x.otherCopiesOut;
  const total=targets+others, tierRate=SHOP_ODDS[x.level][x.cost-1]/100;
  const result=Array<number>(6).fill(0);
  if(!targets||!tierRate){result[0]=1;return result;}
  for(let slots=0;slots<=5;slots++){
    const weight=choose(5,slots)*tierRate**slots*(1-tierRate)**(5-slots);
    const denominator=choose(total,slots);
    if(!denominator)continue;
    for(let hits=0;hits<=slots;hits++)
      result[hits]+=weight*choose(targets,hits)*choose(others,slots-hits)/denominator;
  }
  return result;
}
export function oneShopHitChance(raw:RerollInput):number {
  return 1-shopHitDistribution(raw)[0];
}
/**
 * Exact dynamic programming within the declared ordinary-shop model:
 * 2 gold per refresh, buy every affordable target at champion cost,
 * with purchased copies leaving the shared tier pool between shops.
 * Does not model special shops/slots, free rolls, current visible shop,
 * opponent actions, interest or leveling costs.
 */
export function reachGoalChance(raw:RerollInput):number {
  const x=normalizeRerollInput(raw);
  if(x.owned>=x.goal)return 1;
  if(POOL_COPIES[x.cost]-x.contested<x.goal)return 0;
  let states=new Map<string,number>([[x.gold+':'+x.owned,1]]);
  const add=(m:Map<string,number>,g:number,o:number,p:number)=>{
    const key=g+':'+o; m.set(key,(m.get(key)??0)+p);
  };
  for(let r=0;r<Math.floor(x.gold/2);r++){
    const next=new Map<string,number>();
    for(const [key,weight] of states){
      const [g,o]=key.split(':').map(Number);
      if(g<2||o>=x.goal||g-2<x.cost){add(next,g,o,weight);continue;}
      const after=g-2, affordable=Math.floor(after/x.cost);
      const chances=shopHitDistribution(x,o);
      for(let hits=0;hits<chances.length;hits++){
        const buy=Math.min(hits,affordable,x.goal-o);
        add(next,after-buy*x.cost,o+buy,weight*chances[hits]);
      }
    }
    states=next;
  }
  let success=0;
  for(const [key,value] of states)if(Number(key.split(':')[1])>=x.goal)success+=value;
  return Math.min(1,Math.max(0,success));
}
