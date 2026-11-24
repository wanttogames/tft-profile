import {describe,it,expect} from 'vitest';
import {GCD,syncedExpiry} from '../src/data/lckGcd';
describe('GCD overlay',()=>{
 const snapshot={...GCD,sourceDate:'2026-11-25',rows:[{team:'t1',player:'Faker',expires:'2029-11-19'},{team:'dk',player:'Doran',expires:'2028-11-20'}]};
 it('matches team and player, not previous team',()=>{expect(syncedExpiry('t1','FAKER',snapshot)).toBe('2029-11-19');expect(syncedExpiry('t1','Doran',snapshot)).toBeNull();});
 it('rejects stale or unknown source dates',()=>{expect(syncedExpiry('t1','Faker',{...snapshot,sourceDate:'2026-11-16'})).toBeNull();expect(syncedExpiry('t1','Faker',{...snapshot,sourceDate:null})).toBeNull();});
 it('rejects expired dates and unknown players',()=>{expect(syncedExpiry('t1','Faker',{...snapshot,rows:[{team:'t1',player:'Faker',expires:'2026-11-16'}]})).toBeNull();expect(syncedExpiry('t1','Missing',snapshot)).toBeNull();});
});
