import { afterEach, expect, it, vi } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { readFileSync, existsSync } from 'node:fs';
import { CONTACT_EMAIL, legalPage, RIOT_DISCLAIMER } from '../src/config/legal';
import App from '../src/App.vue';
afterEach(() => vi.unstubAllGlobals());
it.each(['/', '/privacy', '/terms'])(
  'renders direct URL %s with shared footer',
  async (pathname) => {
    vi.stubGlobal('window', { location: { pathname, search: '' } });
    const html = await renderToString(createSSRApp(App));
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('id="riot-disclaimer"');
    expect(html).toContain('href="/#riot-disclaimer"');
    for (const paragraph of RIOT_DISCLAIMER)
      expect(html.replaceAll('&#39;', "'")).toContain(paragraph);
    if (pathname === '/') expect(html).toContain('나의 플레이를 읽다');
    else {
      expect(html).toContain(
        pathname === '/privacy' ? '<h1>개인정보처리방침</h1>' : '<h1>이용약관</h1>',
      );
      expect(html).toContain('mailto:' + CONTACT_EMAIL);
      expect(html).toContain('2026-09-12');
      expect(html).not.toContain('나의 플레이를 읽다');
    }
  },
);
it('uses default Pages SPA fallback without redirects and preserves API routing', () => {
  expect(legalPage('/privacy/')).toBe('privacy');
  expect(legalPage('/terms/')).toBe('terms');
  expect(legalPage('/api/meta/items')).toBeNull();
  const redirects = readFileSync('public/_redirects', 'utf8');
  expect(
    redirects.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#')),
  ).toEqual([]);
  expect(existsSync('public/404.html')).toBe(false);
  expect(JSON.parse(readFileSync('public/_routes.json', 'utf8')).include).toEqual(['/api/*']);
});
