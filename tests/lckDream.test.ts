import {describe,it,expect} from 'vitest';
import {DREAM_PLAYERS,ROLE_CODES,emptyDream,normalizeDream,encodeDream,decodeDream,filterDreamPlayers,selectDreamPlayer,randomDream,dreamStats,LCK_DREAM_PATH} from '../src/data/lckDream';
import {PUBLIC_PAGES} from '../src/seo/pages';
describe('LCK-DREAM-1',()=>{
 it('deduplicates confirmed, market and report players',()=>{expect(new Set(DREAM_PLAYERS.map(p=>p.id)).size).toBe(DREAM_PLAYERS.length);expect(DREAM_PLAYERS.filter(p=>p.player==='Lucid')).toHaveLength(1);expect(ROLE_CODES.every(role=>filterDreamPlayers(role).length>0)).toBe(true);});
 it('searches Korean names and filters verified players',()=>{expect(filterDreamPlayers('MID','페이커','confirmed','t1')[0].player).toBe('Faker');expect(filterDreamPlayers('TOP','제우스')[0].status).toBe('confirmed');});
 it('rejects forged IDs, invalid themes and wrong roles',()=>{const d=normalizeDream({name:' ',theme:'__proto__',picks:['mid-faker','bad','mid-faker','mid-faker','']});expect(d.picks).toEqual(['','','mid-faker','','']);expect(d.theme).toBe('mint');expect(d.name).toBe('MY DREAM TEAM');});
 it('preserves selected players, theme and Unicode team name on sharing',()=>{const d=randomDream({...emptyDream(),name:'우리 팀 & 친구',theme:'gold'},true,()=>0);expect(decodeDream(encodeDream(d))).toEqual(d);expect(dreamStats(d).filled).toBe(5);expect(dreamStats(d).confirmed).toBe(5);expect(decodeDream('?v=2&p=bad')).toBeNull();});
 it('supports slot replacement and clearing without mutating input',()=>{const base=emptyDream(),d=selectDreamPlayer(base,2,'mid-faker');expect(base.picks[2]).toBe('');expect(d.picks[2]).toBe('mid-faker');expect(selectDreamPlayer(d,2,'').picks[2]).toBe('');});
 it('registers static SEO page',()=>{expect(Object.hasOwn(PUBLIC_PAGES,LCK_DREAM_PATH)).toBe(true);});
});
