import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { readFileSync } from 'node:fs';
import App from '../src/App.vue';
import MetaDashboard from '../src/components/MetaDashboard.vue';
import { PUBLIC_PAGES } from '../src/seo/pages';
import { profileLink, profileFromQuery } from '../src/utils/profileLink';
import { profileCardModel } from '../src/profile-card/model';
import { demoPlayer } from '../src/data/demo';
import { renderShareCard } from '../src/profile-card/renderShareCard';
afterEach(() => vi.unstubAllGlobals());
describe('public pages and sharing', () => {
  it.each(Object.keys(PUBLIC_PAGES))(
    'renders readable content and links at %s without API access',
    async (path) => {
      const fetch = vi.fn();
      vi.stubGlobal('fetch', fetch);
      const html = await renderToString(createSSRApp(App, { routePath: path, routeSearch: '' }));
      for (const href of ['/guide', '/about', '/privacy', '/terms', '/meta'])
        expect(html).toContain(`href="${href}"`);
      expect(html.length).toBeGreaterThan(1000);
      expect(fetch).not.toHaveBeenCalled();
      if (path === '/guide') expect(html).toContain('최근 10경기');
      if (path === '/about') expect(html).toContain('공개 메타의 집계 단위');
      if (path === '/meta') expect(html).not.toContain('Riot ID</span>');
    },
  );
  it.each([
    ['champion', '/champions'],
    ['item', '/items'],
    ['trait', '/traits'],
  ] as const)('reuses the existing %s meta screen', async (kind, path) => {
    const html = await renderToString(createSSRApp(MetaDashboard, { initialKind: kind }));
    expect(html).toContain(`href="${path}"`);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('표본 수 높은 순');
  });
  it('round-trips Korean and punctuation safely without ambiguous separators', () => {
    const id = { gameName: '별의 장인-왕 & +', tagLine: 'KR1' };
    const url = new URL(profileLink(id.gameName, id.tagLine));
    expect(url.pathname).toBe('/profile');
    expect(profileFromQuery(url.search)).toEqual(id);
    expect([...url.searchParams.keys()]).toEqual(['gameName', 'tagLine']);
    expect(profileLink('sample', 'DEMO', true)).toBe('https://tft-profile.pages.dev/?demo=1');
    expect(() => profileFromQuery('?gameName=bad')).toThrow();
    expect(() => profileFromQuery('?gameName=x%2Fy&tagLine=KR1')).toThrow();
  });
  it('includes measured level and item preference in the shared model', () => {
    const data = demoPlayer(),
      model = profileCardModel(data);
    expect(model.items.length).toBeGreaterThan(0);
    expect(model.averageLevel).toBeGreaterThan(0);
    expect(model.shareUrl).toContain('demo=1');
  });
  it('renders a 1200x630 card including item, statistics and source attribution', () => {
    const texts: string[] = [];
    const c = {
      measureText: (s: string) => ({ width: s.length * 16 }),
      fillText: (s: string) => texts.push(s),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
    };
    const canvas = { width: 0, height: 0, getContext: () => c };
    vi.stubGlobal('Path2D', class {});
    const model = profileCardModel(demoPlayer());
    renderShareCard(canvas as unknown as HTMLCanvasElement, model, 'landscape');
    expect([canvas.width, canvas.height]).toEqual([1200, 630]);
    expect(texts).toContain(model.items[0]!.name);
    expect(texts).toContain('tft-profile.pages.dev');
    expect(texts).toContain(model.profile.name);
    expect(texts).toContain(model.sample);
  });
  it('retains one AdSense head script, no slots, and a sitemap matching all public routes', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html.match(/google-adsense-account/g)).toHaveLength(1);
    expect(html.match(/adsbygoogle\.js/g)).toHaveLength(1);
    expect(html).not.toContain('<ins');
    const sitemap = readFileSync('public/sitemap.xml', 'utf8');
    for (const path of Object.keys(PUBLIC_PAGES))
      expect(sitemap).toContain(`https://tft-profile.pages.dev${path}</loc>`);
    expect(readFileSync('public/robots.txt', 'utf8')).not.toContain('Disallow: /');
  });
});
