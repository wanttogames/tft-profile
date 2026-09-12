// Lightweight local runner for the same Netlify handler. Use `netlify dev` for platform parity.
import { createServer } from 'node:http';
import { loadEnv } from 'vite';
import handler from '../netlify/functions/tft-player';
import metaHandler from '../netlify/functions/tft-meta';
Object.assign(process.env, loadEnv('development', process.cwd(), ''));
process.env.NODE_ENV ??= 'development';
createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  const selected =
    path === '/.netlify/functions/tft-meta'
      ? metaHandler
      : path === '/.netlify/functions/tft-player'
        ? handler
        : null;
  if (!selected) {
    res.writeHead(404).end();
    return;
  }
  try {
    const r = await selected(
      new Request('http://localhost:8889' + req.url, { method: req.method }),
    );
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(await r.text());
  } catch {
    res.writeHead(500).end('{"message":"Local server error"}');
  }
}).listen(8889, '0.0.0.0', () => console.log('Function runner: http://localhost:8889'));
