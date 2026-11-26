import {describe,it,expect} from 'vitest';
import {CONTRACT_ROWS, MARKET_ROWS, lookupTerm, termLabel, filterContracts, filterMarket, contractSummary, LCK_FA_PATH, LCK_CONTRACTS_PATH, CONTRACT_YEARS} from '../src/data/lckContracts';
import {PUBLIC_PAGES} from '../src/seo/pages';
describe('LCK-FA-1',()=>{
 it('includes representative slots and two other confirmed players',()=>{expect(CONTRACT_ROWS).toHaveLength(44);expect(new Set(CONTRACT_ROWS.map(r=>r.team+':'+r.player.toLowerCase())).size).toBe(44);const summary=contractSummary();expect(summary.total).toBe(44);expect(summary.exact+summary.partial+summary.unknown).toBe(44);});
 it('never copies old team expiry dates to new teams',()=>{expect(lookupTerm('dk','Delight')?.source??'unknown').not.toBe('archive');expect(lookupTerm('dk','Siwoo')?.source??'unknown').not.toBe('archive');expect(lookupTerm('hle','Delight')?.source??'unknown').not.toBe('archive');});
 it('keeps dates and season-only evidence separate',()=>{expect(termLabel({value:'2029-11-19',precision:'day',source:'archive'})).toBe('2029-11-19');expect(termLabel({value:'2028',precision:'year',source:'archive'})).toContain('일자 미확인');expect(termLabel({value:'2027',precision:'season',source:'archive'})).toContain('종료일 미확인');expect(termLabel(null)).toBe('기간 미확인');});
 it('separates confirmed roster and unresolved market',()=>{expect(MARKET_ROWS).toHaveLength(17);expect(MARKET_ROWS.filter(r=>r.status==='departed')).toHaveLength(13);expect(MARKET_ROWS.every(r=>!CONTRACT_ROWS.some(c=>c.player.toLowerCase()===r.player.toLowerCase()))).toBe(true);expect(filterMarket('제우스')).toHaveLength(0);expect(filterMarket('듀로')[0].reports.some(r=>r.team==='krx')).toBe(true);});
 it('supports Korean search and team position year filters',()=>{expect(filterContracts('페이커','t1','미드')).toHaveLength(1);expect(filterContracts('','all','all','unknown')).toHaveLength(contractSummary().unknown);expect(filterMarket('','ns','all','awaiting')).toHaveLength(4);expect(CONTRACT_YEARS.every(y=>/^\d{4}$/.test(y))).toBe(true);});
 it('registers public routes',()=>{expect(Object.hasOwn(PUBLIC_PAGES,LCK_FA_PATH)).toBe(true);expect(Object.hasOwn(PUBLIC_PAGES,LCK_CONTRACTS_PATH)).toBe(true);});
});
