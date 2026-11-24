import {describe,it,expect} from 'vitest';
import {CONTRACT_ROWS, MARKET_ROWS, lookupTerm, termLabel, filterContracts, filterMarket, contractSummary, LCK_FA_PATH, LCK_CONTRACTS_PATH, CONTRACT_YEARS} from '../src/data/lckContracts';
import {PUBLIC_PAGES} from '../src/seo/pages';
describe('LCK-FA-1',()=>{
 it('includes representative slots and two other confirmed players',()=>{expect(CONTRACT_ROWS).toHaveLength(38);expect(new Set(CONTRACT_ROWS.map(r=>r.team+':'+r.player.toLowerCase())).size).toBe(38);expect(contractSummary()).toEqual({total:38,exact:20,partial:10,unknown:8});});
 it('never copies old team expiry dates to new teams',()=>{expect(lookupTerm('dk','Delight')).toBeNull();expect(lookupTerm('dns','Cuzz')?.precision).toBe('season');expect(lookupTerm('dk','Siwoo')).toBeNull();expect(lookupTerm('hle','Delight')).toBeNull();});
 it('keeps dates and season-only evidence separate',()=>{expect(termLabel(lookupTerm('t1','Faker'))).toBe('2029-11-19');expect(termLabel(lookupTerm('ns','Kingen'))).toContain('일자 미확인');expect(termLabel(lookupTerm('dk','ShowMaker'))).toContain('종료일 미확인');expect(termLabel(null)).toBe('기간 미확인');});
 it('separates confirmed roster and unresolved market',()=>{expect(MARKET_ROWS).toHaveLength(21);expect(MARKET_ROWS.filter(r=>r.status==='departed')).toHaveLength(17);expect(MARKET_ROWS.every(r=>!CONTRACT_ROWS.some(c=>c.player.toLowerCase()===r.player.toLowerCase()))).toBe(true);expect(filterMarket('제우스')[0].reports.some(r=>r.team==='t1')).toBe(true);});
 it('supports Korean search and team position year filters',()=>{expect(filterContracts('페이커','t1','미드','2029')).toHaveLength(1);expect(filterContracts('','all','all','unknown')).toHaveLength(8);expect(filterMarket('','ns','all','awaiting')).toHaveLength(4);expect(CONTRACT_YEARS).toEqual(['2027','2028','2029']);});
 it('registers public routes',()=>{expect(Object.hasOwn(PUBLIC_PAGES,LCK_FA_PATH)).toBe(true);expect(Object.hasOwn(PUBLIC_PAGES,LCK_CONTRACTS_PATH)).toBe(true);});
});
