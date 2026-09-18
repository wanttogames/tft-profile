import { createServer } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { PUBLIC_PAGES, SITE_URL } from '../src/seo/pages';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
const escape = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
try {
  const { render } = await vite.ssrLoadModule('/src/seo/render.ts');
  const template = await readFile('dist/index.html', 'utf8');
  for (const [path, meta] of Object.entries(PUBLIC_PAGES)) {
    const body = await render(path);
    let html = template
      .replace(/<title>.*?<\/title>/s, `<title>${escape(meta.title)}</title>`)
      .replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${escape(meta.description)}">`,
      )
      .replace('<div id="app"></div>', `<div id="app">${body}</div>`);
    html = html
      .replace(/<meta\s+property="og:(title|description|url)"[^>]*>/g, '')
      .replace(/<link\s+rel="canonical"[^>]*>/g, '');
    html = html.replace(
      '</head>',
      `<meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:url" content="${SITE_URL}${path}"><link rel="canonical" href="${SITE_URL}${path}"></head>`,
    );
    const folder = path === '/' ? 'dist' : `dist${path}`;
    await mkdir(folder, { recursive: true });
    await writeFile(`${folder}/index.html`, html);
  }
  console.log(`Prerendered ${Object.keys(PUBLIC_PAGES).length} public pages (no API requests).`);
} finally {
  await vite.close();
}
