import { describe, it, expect } from 'vitest';
import { TEAMS, POSITIONS, LCK_STOVE_PATH, teamPath, findTeam, rosterSummary, countConfirmed, STATUS_LABEL } from '../src/data/lck2027';
import { PUBLIC_PAGES } from '../src/seo/pages';
describe('LCK-STOVE-1', () => {
  it('contains 10 unique teams with five ordered positions each', () => {
    expect(TEAMS.length).toBe(10);
    expect(new Set(TEAMS.map(t=>t.slug)).size).toBe(10);
    expect(POSITIONS.length).toBe(5);
    expect(TEAMS.every(t=>t.slots.length===5)).toBe(true);
  });
  it('does not count pending reports as confirmed slots', () => {
    expect(rosterSummary()).toEqual({teams:10,confirmed:36,total:50,complete:4});
    expect(countConfirmed(TEAMS.find(t=>t.slug==='krx')!)).toBe(0);
    for(const t of TEAMS) for(const s of t.slots) {
      expect(s.status==='pending').toBe(s.player===null);
      expect(STATUS_LABEL[s.status]).toBeTruthy();
      if(s.report) expect(s.report.url.startsWith('https://')).toBe(true);
    }
  });
  it('maps every team route and the hub to public SEO pages', () => {
    expect(Object.hasOwn(PUBLIC_PAGES,LCK_STOVE_PATH)).toBe(true);
    for(const t of TEAMS) {
      expect(findTeam(teamPath(t))).toBe(t);
      expect(Object.hasOwn(PUBLIC_PAGES,teamPath(t))).toBe(true);
    }
    expect(findTeam(LCK_STOVE_PATH)).toBeUndefined();
  });
});
