import { describe, it, expect } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import PlayerCard from '../src/components/PlayerCard.vue';
import { demoPlayer } from '../src/data/demo';
import { cardTheme, profileCardModel, scoreLabels } from '../src/profile-card/model';
import { playerScores } from '../src/analytics/playerScores';

describe('collectible profile presentation', () => {
  it('keeps analysis scores unchanged while changing the rank frame', () => {
    const data = demoPlayer();
    const expected = playerScores(data.games, data.assets);
    for (const tier of ['IRON', 'GOLD', 'EMERALD', 'DIAMOND', 'CHALLENGER']) {
      data.rank = { ...data.rank!, tier };
      const card = profileCardModel(data);
      expect(card.theme.tier).toBe(tier);
      expect(card.scores).toEqual(expected);
      expect(card.units.length).toBeLessThanOrEqual(3);
      expect(card.traits.length).toBeLessThanOrEqual(3);
    }
    expect(cardTheme('GOLD').accent).not.toBe(cardTheme('DIAMOND').accent);
    expect(cardTheme('unknown').tier).toBe('UNRANKED');
  });
  it('renders all eight abilities, localized preferences and an honest sample label', async () => {
    const html = await renderToString(createSSRApp(PlayerCard, { data: demoPlayer() }));
    for (const label of Object.values(scoreLabels)) expect(html).toContain(label);
    expect(html).toContain('아리');
    expect(html).toContain('30경기 분석');
    expect(html).toContain('가상 데이터');
    expect(html).toContain('공유 카드 만들기');
  });
  it('keeps missing-data and unranked states instead of inventing scores', async () => {
    const data = demoPlayer();
    data.games = [];
    data.rank = null;
    const card = profileCardModel(data);
    expect(card.scores).toBeNull();
    expect(card.stats.every((s) => s.value === '—')).toBe(true);
    const html = await renderToString(createSSRApp(PlayerCard, { data }));
    expect(html).toContain('UNRANKED');
    expect(html).toContain('분석 표본 부족');
  });
});

import { renderShareCard } from '../src/profile-card/renderShareCard';
import { vi } from 'vitest';
it('renders a self-contained portrait export with Korean labels and missing scores', () => {
  const data = demoPlayer();
  data.games = [];
  const drawn: string[] = [];
  const context = {
    createLinearGradient: () => ({ addColorStop: vi.fn() }),
    createRadialGradient: () => ({ addColorStop: vi.fn() }),
    fillText: (text: string) => drawn.push(text),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 20 }),
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  vi.stubGlobal(
    'Path2D',
    class {
      constructor(public path: string) {}
    },
  );
  renderShareCard(canvas as unknown as HTMLCanvasElement, profileCardModel(data));
  expect([canvas.width, canvas.height]).toEqual([1080, 1512]);
  expect(drawn).toContain('분석 표본 부족');
  expect(drawn.filter((t) => t === '—')).toHaveLength(3);
  expect(drawn.join(' ')).toContain('가상 데이터');
  expect(drawn).not.toContain('선호 챔피언 TOP 3');
  vi.unstubAllGlobals();
});
