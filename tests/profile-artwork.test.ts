import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import {
  championArtworkKey,
  getProfileArtwork,
  loadProfileArtwork,
  STYLE_ART,
  type ArtStyle,
} from '../src/profile-card/artwork';
import { STYLE_TITLES } from '../src/analytics/playStyleClassifier';
import { profileCardModel } from '../src/profile-card/model';
import { renderShareCard } from '../src/profile-card/renderShareCard';
import { demoPlayer } from '../src/data/demo';
import HeroArtworkPanel from '../src/components/HeroArtworkPanel.vue';
import PlayerCard from '../src/components/PlayerCard.vue';
import manifest from '../src/profile-card/artwork-manifest.json';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('supplied profile artwork', () => {
  it.each(['gnar', 'ahri'])('provides all four optimized %s images', (champion) => {
    for (const style of ['flexible', 'aggressive', 'stable', 'lategame'] as ArtStyle[]) {
      const url = getProfileArtwork(champion, style)!;
      expect(url).toBe(`/profile-art/${champion}/${style}.webp`);
      expect(existsSync('public' + url)).toBe(true);
      expect(
        readFileSync('public' + url)
          .subarray(8, 12)
          .toString(),
      ).toBe('WEBP');
    }
  });
  it('indexes exactly the supplied files and matches newly indexed folders by exact token', () => {
    for (const [champion, styles] of Object.entries(manifest)) {
      expect(Object.keys(styles)).toHaveLength(4);
      expect(readdirSync('public/profile-art/' + champion)).toHaveLength(4);
      expect(championArtworkKey(`SET_${champion}`)).toBe(champion);
    }
  });
  it('uses localized aliases, not display title or partial identifier matches', () => {
    expect(championArtworkKey('unfamiliar-id', '아리')).toBe('ahri');
    expect(championArtworkKey('unfamiliar-id', '나르')).toBe('gnar');
    expect(championArtworkKey('DA_18_Gnar')).toBe('gnar');
    expect(championArtworkKey('TFT18_Ahri')).toBe('ahri');
    expect(championArtworkKey('TFT18_AhriClone')).toBeUndefined();
    expect(getProfileArtwork('../ahri', 'stable')).toBeNull();
    expect(getProfileArtwork('missing', 'stable')).toBeNull();
  });
  it('maps every style explicitly and does not infer art from insufficient data', () => {
    expect(Object.keys(STYLE_ART).sort()).toEqual(Object.keys(STYLE_TITLES).sort());
    expect(STYLE_ART['flexible-strategist']).toBe('flexible');
    expect(STYLE_ART['peak-mage']).toBe('aggressive');
    expect(STYLE_ART['steady-guardian']).toBe('stable');
    expect(STYLE_ART['late-commander']).toBe('lategame');
    expect(getProfileArtwork('gnar', STYLE_ART.insufficient)).toBeNull();
    expect(getProfileArtwork('ahri', STYLE_ART.balanced)).toBeNull();
  });
  it('selects only the most-used champion, not a supported second favorite', () => {
    const data = demoPlayer();
    for (const g of data.games)
      g.player.units = [{ character_id: 'unknown', tier: 2, rarity: 1, items: [], itemNames: [] }];
    data.assets.unknown = { name: '다른 챔피언' };
    expect(profileCardModel(data).artwork.src).toBeNull();
    const model = profileCardModel(demoPlayer());
    expect(model.artwork.championKey).toBe('ahri');
  });
  it.each(['GOLD', 'PLATINUM', 'MASTER'])(
    'renders %s frame and real statistics as text',
    async (tier) => {
      const data = demoPlayer();
      data.rank!.tier = tier;
      const model = profileCardModel(data);
      const html = await renderToString(createSSRApp(PlayerCard, { data }));
      expect(html).toContain(`data-tier="${tier}"`);
      expect(html).toContain(model.theme.accent);
      expect(html).toContain('top-crest');
      expect(html).toContain(model.artwork.src!);
      expect(html).toContain('PLAY DNA');
      expect(html).toContain(model.stats[0]!.value);
    },
  );
  it('uses vector fallback for unsupported champion or insufficient style', async () => {
    const model = profileCardModel(demoPlayer());
    model.artwork.src = null;
    const html = await renderToString(createSSRApp(HeroArtworkPanel, { model }));
    expect(html).not.toContain('<img');
    expect(html).toContain('<svg');
  });
  it('returns fallback on image failure and timeout, rejects remote URLs', async () => {
    vi.useFakeTimers();
    class FakeImage {
      naturalWidth = 1086;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        this.onerror?.();
      }
    }
    vi.stubGlobal('Image', FakeImage);
    expect(await loadProfileArtwork('/profile-art/gnar/stable.webp')).toBeNull();
    expect(await loadProfileArtwork('https://example.com/art.webp')).toBeNull();
    class SlowImage {
      set src(_: string) {}
    }
    vi.stubGlobal('Image', SlowImage);
    const pending = loadProfileArtwork('/profile-art/ahri/stable.webp');
    await vi.advanceTimersByTimeAsync(5000);
    expect(await pending).toBeNull();
  });
  it('returns a loaded image for the share renderer', async () => {
    class FakeImage {
      naturalWidth = 1086;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_: string) {
        this.onload?.();
      }
    }
    vi.stubGlobal('Image', FakeImage);
    expect(await loadProfileArtwork('/profile-art/ahri/stable.webp')).toBeInstanceOf(FakeImage);
  });
  it.each(['gnar', 'ahri'] as const)(
    'draws actual hero pixels in %s exports and keeps labels',
    (champion) => {
      const texts: string[] = [];
      const c = {
        createLinearGradient: () => ({ addColorStop: vi.fn() }),
        createRadialGradient: () => ({ addColorStop: vi.fn() }),
        fillText: (s: string) => texts.push(s),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
        strokeRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        drawImage: vi.fn(),
        measureText: (s: string) => ({ width: s.length * 15 }),
      };
      const canvas = { width: 0, height: 0, getContext: () => c };
      vi.stubGlobal('Path2D', class {});
      const image = { naturalWidth: 1086, naturalHeight: 1448 } as HTMLImageElement;
      const model = profileCardModel(demoPlayer());
      model.artwork.championKey = champion;
      renderShareCard(canvas as unknown as HTMLCanvasElement, model, image);
      expect(c.drawImage).toHaveBeenCalledTimes(1);
      expect(c.drawImage.mock.calls[0]![0]).toBe(image);
      expect(texts.join(' ')).toContain(model.profile.name);
      expect(texts).toContain('PLAY DNA / TOP 2');
    },
  );
});
