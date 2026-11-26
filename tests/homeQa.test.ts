import {describe,it,expect} from 'vitest';
import {initialSection,showHomeHub} from '../src/data/homeHub';
import {profileFromQuery,profileLink} from '../src/utils/profileLink';
import {parseRiotId} from '../src/utils/riotId';
describe('TFT-HOME-QA-1',()=>{
 it('keeps legacy meta query scoped to home, not shared profile',()=>{
  expect(initialSection('/','?section=meta')).toBe('meta');
  expect(initialSection('/profile','?section=meta&gameName=Tester&tagLine=KR1')).toBe('profile');
  expect(initialSection('/guide','?section=meta')).toBe('profile');
  for(const path of ['/meta','/champions','/items','/traits'])expect(initialSection(path,'')).toBe('meta');
 });
 it('uses embedded tag rather than the separate tag, and rejects empty tags',()=>{
  expect(parseRiotId('테스터#TEST','KR1')).toEqual({gameName:'테스터',tagLine:'TEST'});
  expect(()=>parseRiotId('테스터#','KR1')).toThrow();
  expect(()=>parseRiotId('테스터#KR1#A','KR1')).toThrow();
 });
 it('round trips the real profile URL without exposing the home portal',()=>{
  const url=new URL(profileLink('한글 이름','KR1'));
  expect(profileFromQuery(url.search)).toEqual({gameName:'한글 이름',tagLine:'KR1'});
  expect(showHomeHub(url.pathname,true,false,false)).toBe(false);
  expect(showHomeHub('/',false,false,false)).toBe(true);
 });
});
