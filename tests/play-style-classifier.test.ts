import { describe, expect, it } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { demoPlayer } from '../src/data/demo';
import { playerScoreContext, playerStyle } from '../src/analytics/playerScores';
import {
  classifyPlayStyle,
  STYLE_RULES,
  type StyleContext,
  type StyleKey,
} from '../src/analytics/playStyleClassifier';
import { playStyleTags } from '../src/analytics/playStyleTags';
import { STYLE_ILLUSTRATIONS } from '../src/analytics/playStyleIllustration';
import { styleArtPaths } from '../src/profile-card/styleArt';
import { profileCardModel } from '../src/profile-card/model';
import PlayerCard from '../src/components/PlayerCard.vue';
function base(): StyleContext {
  const c = playerScoreContext(demoPlayer().games)!;
  return {
    ...c,
    unitConcentration: 0.4,
    traitConcentration: 0.4,
    deckConcentration: 0.4,
    equippedCoverage: 0.9,
    unitDiversity: 45,
    traitDiversity: 45,
    top2: 0.2,
    bottom2: 0.2,
    deviation: 2,
    avgLevel: 7.5,
    avgRound: 28,
    stats: { count: 30, average: 4.8, top4: 0.4, win: 0.1 },
    scores: {
      ceiling: 30,
      stability: 55,
      survival: 45,
      lateGame: 50,
      diversity: 45,
      flexibility: 40,
      completion: 50,
      form: 50,
    },
  };
}
describe('twelve descriptive archetypes', () => {
  const cases: [StyleKey, (c: StyleContext) => void][] = [
    [
      'dedicated-master',
      (c) => {
        c.unitConcentration = 0.8;
        c.traitConcentration = 0.8;
        c.stats.top4 = 0.65;
      },
    ],
    [
      'synergy-specialist',
      (c) => {
        c.traitConcentration = 0.8;
        c.stats.top4 = 0.55;
      },
    ],
    [
      'carry-specialist',
      (c) => {
        c.unitConcentration = 0.8;
        c.stats.top4 = 0.55;
      },
    ],
    [
      'peak-mage',
      (c) => {
        c.scores.ceiling = 70;
        c.scores.stability = 50;
        c.top2 = 0.7;
      },
    ],
    [
      'crown-seeker',
      (c) => {
        c.stats.win = 0.3;
        c.top2 = 0.45;
        c.stats.average = 3.4;
        c.scores.stability = 65;
      },
    ],
    [
      'late-commander',
      (c) => {
        c.scores.lateGame = 75;
        c.avgLevel = 9;
        c.avgRound = 35;
      },
    ],
    [
      'artifact-artisan',
      (c) => {
        c.scores.completion = 80;
        c.scores.survival = 65;
        c.avgLevel = 8;
      },
    ],
    [
      'steady-guardian',
      (c) => {
        c.scores.stability = 80;
        c.scores.survival = 80;
        c.bottom2 = 0.1;
      },
    ],
    [
      'flexible-strategist',
      (c) => {
        c.scores.diversity = 70;
        c.scores.flexibility = 70;
        c.stats.top4 = 0.5;
      },
    ],
    [
      'resilient-warden',
      (c) => {
        c.bottom2 = 0.05;
        c.deviation = 1.5;
        c.stats.average = 4.5;
      },
    ],
    [
      'bold-adventurer',
      (c) => {
        c.scores.ceiling = 50;
        c.scores.stability = 40;
        c.deviation = 2.8;
      },
    ],
    [
      'deck-explorer',
      (c) => {
        c.unitDiversity = 80;
        c.traitDiversity = 80;
        c.scores.flexibility = 70;
      },
    ],
  ];
  it.each(cases)('can reach %s without being shadowed by a prior rule', (key, setup) => {
    const c = base();
    setup(c);
    expect(classifyPlayStyle(c).key).toBe(key);
    expect(playStyleTags(c).length).toBeGreaterThanOrEqual(2);
    expect(playStyleTags(c).length).toBeLessThanOrEqual(3);
  });
  it('has twelve distinct rules plus neutral and insufficient states', () => {
    expect(new Set(STYLE_RULES.map((r) => r.key)).size).toBe(12);
    expect(classifyPlayStyle(base()).key).toBe('balanced');
    expect(classifyPlayStyle(null).key).toBe('insufficient');
    const c = base();
    c.games = c.games.slice(0, 19);
    expect(classifyPlayStyle(c).key).toBe('insufficient');
    expect(playStyleTags(c)).toEqual([]);
  });
  it('does not classify from a high score alone or a missing final board', () => {
    const c = base();
    c.scores.ceiling = 100;
    expect(classifyPlayStyle(c).key).toBe('balanced');
    c.units.available = 20;
    expect(classifyPlayStyle(c).key).toBe('insufficient');
  });
  it('requires evidence of equipped units before claiming a carry focus', () => {
    const c = base();
    c.unitConcentration = 0.8;
    c.stats.top4 = 0.55;
    c.equippedCoverage = 0.2;
    expect(classifyPlayStyle(c).key).not.toBe('carry-specialist');
    expect(playStyleTags(c)).not.toContain('핵심 캐리 중심');
  });
  it('uses all fifty supplied games, ordered by date, without changing the API sample setting', () => {
    const data = demoPlayer();
    const games = Array.from({ length: 55 }, (_, i) => ({
      ...structuredClone(data.games[i % 30]!),
      id: `test-${i}`,
      date: 1000 - i,
    }));
    const c = playerScoreContext(games, data.assets, 50)!;
    expect(c.games).toHaveLength(50);
    expect(c.units.total).toBe(50);
    expect(c.traits.total).toBe(50);
    expect(playerStyle(games, data.assets).sampleCount).toBe(50);
    expect(playerScoreContext(games, data.assets)!.games).toHaveLength(30);
    expect(playerStyle([...games].reverse(), data.assets)).toEqual(playerStyle(games, data.assets));
  });
  it('maps every style to complete and distinct art metadata', () => {
    for (const [key, art] of Object.entries(STYLE_ILLUSTRATIONS)) {
      expect(art.visualKeywords.length).toBeGreaterThanOrEqual(3);
      for (const value of [
        art.illustrationTheme,
        art.backgroundMood,
        art.accentStyle,
        art.emblemStyle,
        art.shortFlavorText,
      ])
        expect(value.length).toBeGreaterThan(3);
      expect(styleArtPaths(art).length).toBeGreaterThan(5);
      expect(key.length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(STYLE_ILLUSTRATIONS).map((a) => a.illustrationTheme)).size).toBe(
      14,
    );
  });
  it('renders the classified style, tags and original art concept in the card', async () => {
    const data = demoPlayer();
    const model = profileCardModel(data);
    const html = await renderToString(createSSRApp(PlayerCard, { data }));
    expect(html).toContain(`data-style="${model.profile.key}"`);
    if (model.artwork.src) expect(html).toContain(model.artwork.src);
    else expect(html).toContain(model.art.illustrationTheme);
    expect(html).toContain(model.profile.name);
    for (const tag of model.profile.tags) expect(html).toContain(tag);
  });
});
