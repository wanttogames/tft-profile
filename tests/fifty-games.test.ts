import type { Game } from '../src/types/riot';
import { describe, it, expect } from 'vitest';
import { demoPlayer } from '../src/data/demo';
import { statistics, formAnalysis } from '../src/analytics/formAnalysis';
import { playStyle } from '../src/analytics/playStyle';
import { playerScores } from '../src/analytics/playerScores';
import { deckDiversity } from '../src/analytics/deckDiversity';
import { patterns } from '../src/analytics/patterns';
import { preferenceAnalysis, preferenceInsights } from '../src/analytics/preferences';
import { parseParticipant } from '../netlify/lib/matchParticipant';
import published from './fixtures/riot-match-v5.anonymized.json';
const fifty = (): Game[] =>
  demoPlayer().games.map((g, i) => ({
    ...g,
    player: {
      ...g.player,
      placement: i < 20 ? 1 : 8,
      augments: i < 20 ? ['early'] : ['late'],
      traits: [
        {
          name: i < 20 ? 'early-trait' : 'late-trait',
          num_units: 5,
          style: 1,
          tier_current: 1,
          tier_total: 3,
        },
      ],
    },
  }));
describe('all fifty games drive analytics', () => {
  it('uses all 50 for placement, TOP4 and first-place rate', () => {
    expect(statistics(fifty())).toEqual({ count: 50, average: 5.2, top4: 0.4, win: 0.4 });
  });
  it('uses the last 30 in player scores, diversity and end-placement patterns', () => {
    const g = fifty();
    expect(playerScores(g)?.ceiling).toBe(40);
    expect(playerScores(g)?.stability).toBe(40);
    expect(deckDiversity(g).valid).toBe(50);
    expect(deckDiversity(g).top[0]?.[1]).toBe(30);
    expect(patterns(g.filter((x) => x.player.placement >= 7)).count).toBe(30);
  });
  it('counts all 50 style observations', () => {
    const g = fifty();
    g.forEach((x, i) => {
      x.player.units = x.player.units.map((u) => ({ ...u, tier: 2 }));
      x.player.level = i < 20 ? 8 : 9;
    });
    const styles = playStyle(g);
    expect(styles.find((s) => s.label === 'Fast 9형')?.percent).toBe(60);
  });
  it('compares 25 with 25 so games 21-50 influence form', () => {
    const f = formAnalysis(fifty());
    expect(f.recent).toBe(2.4);
    expect(f.previous).toBe(8);
    expect(f.delta).toBe(5.6);
    expect(formAnalysis(fifty().slice(0, 49)).delta).toBeNull();
  });
  it('ranks trait and augment preferences from all 50, not the displayed ten', () => {
    for (const kind of ['augment', 'trait'] as const) {
      const p = preferenceAnalysis(fifty(), kind);
      expect(p.total).toBe(50);
      expect(p.top[0]?.count).toBe(30);
      expect(p.top[0]?.rate).toBe(0.6);
      expect(p.top[0]?.average).toBe(8);
      expect(p.top[0]?.top4).toBe(0);
    }
  });
});
describe('preference sample safety', () => {
  it('preserves observed augment IDs from the historical response', () => {
    const p = published.info.participants[6]!;
    expect(parseParticipant(published.info.participants, p.puuid)?.augments).toEqual(p.augments);
  });
  it('distinguishes missing, malformed, and explicitly empty augment selections', () => {
    const p = published.info.participants[6]!;
    expect(parseParticipant([{ ...p, augments: undefined }], p.puuid)?.augments).toBeUndefined();
    expect(parseParticipant([{ ...p, augments: 'bad' }], p.puuid)?.augments).toBeUndefined();
    expect(parseParticipant([{ ...p, augments: [] }], p.puuid)?.augments).toEqual([]);
  });
  it('excludes missing augment records from the denominator, not missing selections', () => {
    const g = fifty();
    g.forEach((x, i) => {
      x.player.augments = i < 10 ? undefined : i < 20 ? [] : ['one', 'one'];
    });
    const p = preferenceAnalysis(g, 'augment');
    expect(p.available).toBe(40);
    expect(p.missing).toBe(10);
    expect(p.rows[0]?.count).toBe(30);
    expect(p.rows[0]?.rate).toBe(0.75);
  });
  it('counts each trait once per game and ignores inactive traits', () => {
    const g = fifty();
    g.forEach((x) =>
      x.player.traits.push(
        { ...x.player.traits[0]! },
        { ...x.player.traits[0]!, name: 'inactive', tier_current: 0 },
      ),
    );
    const p = preferenceAnalysis(g, 'trait');
    expect(p.rows).toHaveLength(2);
    expect(p.rows[0]?.count).toBe(30);
  });
  it('does not call a one-game winner the best-performing augment', () => {
    const g = fifty();
    g.forEach((x, i) => {
      x.player.augments = i === 0 ? ['rare'] : ['common'];
      x.player.placement = i === 0 ? 1 : 4;
    });
    const p = preferenceAnalysis(g, 'augment');
    expect(p.rows.find((r) => r.id === 'rare')?.enough).toBe(false);
    const texts = preferenceInsights(p, (id) => id);
    expect(texts.find((x) => x.label === '관측 성적이 좋은 항목')?.text).toContain('common');
  });
  it('labels no eligible sample as insufficient', () => {
    const g = fifty().slice(0, 2);
    expect(
      preferenceInsights(preferenceAnalysis(g, 'augment'), (id) => id).some((r) =>
        r.text.includes('표본 부족'),
      ),
    ).toBe(true);
  });
  it('reports repeated low results without claiming causality', () => {
    const result = preferenceInsights(preferenceAnalysis(fifty(), 'augment'), (id) => id);
    expect(result.find((x) => x.label === '자주 쓰지만 성적이 낮은 항목')?.text).toContain(
      '원인이라는 뜻은 아닙니다',
    );
  });
  it('describes trait concentration without asserting dependency', () => {
    const result = preferenceInsights(preferenceAnalysis(fifty(), 'trait'), (id) => id);
    expect(result.find((x) => x.label === '특성 사용 집중')?.text).toContain(
      '과도한 의존으로 단정하지 않습니다',
    );
  });
  it('withholds historical Legend-set augment performance', () => {
    const g = fifty().map((g) => ({ ...g, set: 9 }));
    const p = preferenceAnalysis(g, 'augment');
    expect(p.rows.every((r) => r.average === null && r.top4 === null && r.restricted)).toBe(true);
  });
});
