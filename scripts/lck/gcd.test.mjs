import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,isoDate,parseGcd,diffRows,nextSnapshot} from './gcd.mjs';
const teams=['T1','Gen.G','Hanwha Life Esports','Dplus KIA','KT Rolster','Nongshim RedForce','BNK FearX','DN Supers','Hanjin BRION','Kiwoom DRX'];
const header='League,Team,Official Summoner Name,Legal First Name,Legal Family Name,"End Date (Month, Day, Year)",Team Contact Information';
function fixture(date='November 24, 2026',count=3){
 return '"Last Updated: '+date+'"\r\n'+header+'\r\n'+teams.flatMap((t,i)=>Array.from({length:count},(_,j)=>'LCK,'+t+',P'+i+'x'+j+',PRIVATE,PRIVATE,"November 15, 2027",PRIVATE@example.com')).join('\r\n');
}
const initial={version:1,sourceDate:null,capturedAt:null,rows:[],changes:[]};
const now='2026-11-25T00:00:00.000Z';
test('CSV quotes, comma, escaped quote and newline',()=>assert.deepEqual(parseCsv('a,"b,c","d""e"\r\nx,"y\nz",q'),[['a','b,c','d"e'],['x','y\nz','q']]));
test('date formats and invalid calendar dates',()=>{assert.equal(isoDate('November 15, 2027'),'2027-11-15');assert.equal(isoDate('11/20/2028'),'2028-11-20');assert.equal(isoDate('2027-02-29'),null);});
test('KR rows only; no legal or contact data',()=>{const r=parseGcd(fixture()+'\nLCK CL,T1 Academy,Academy,X,Y,2027-11-15,X');assert.equal(r.rows.length,30);assert.equal(r.sourceDate,'2026-11-24');assert.ok(!JSON.stringify(r).includes('PRIVATE'));});
test('wrong tab, malformed input, unmapped team fail closed',()=>{assert.throws(()=>parseGcd('<html>error'));assert.throws(()=>parseGcd(fixture().replaceAll('LCK,','LPL,')));assert.throws(()=>parseGcd(fixture().replaceAll('T1,','Unknown,')));assert.throws(()=>parseGcd(fixture().replace('P1x0','P0x0')));});
test('first capture has no false transfer alerts; unchanged run does not write',()=>{const r=nextSnapshot(initial,parseGcd(fixture()),now);assert.equal(r.changes.length,0);assert.equal(nextSnapshot(r,parseGcd(fixture()),'2026-11-26T00:00:00Z'),r);});
test('diffs separate added, removed and expiry',()=>{const before=[{team:'t1',player:'A',expires:'2027-11-15'},{team:'dk',player:'B',expires:'2027-11-15'}];const after=[{team:'t1',player:'A',expires:'2028-11-20'},{team:'ns',player:'B',expires:'2027-11-15'}];assert.deepEqual(diffRows(before,after).map(x=>x.kind),['expiry','added','removed']);});
test('regression and incomplete snapshot preserve previous data',()=>{const r=nextSnapshot(initial,parseGcd(fixture()),now);assert.throws(()=>nextSnapshot(r,parseGcd(fixture('November 23, 2026')),now));assert.throws(()=>nextSnapshot(r,parseGcd(fixture('November 24, 2026',2)),now));assert.throws(()=>nextSnapshot(r,{...parseGcd(fixture()),sourceDate:null},now));});
