// LOCAL DEVELOPMENT ONLY. Production uses Pages Functions with context.env.
import { createServer } from 'node:http';
import { loadEnv } from 'vite';
import { onRequest as profile } from '../functions/api/tft/profile';
import { onRequest as items } from '../functions/api/meta/items';
import { onRequest as champions } from '../functions/api/meta/champions';
import { onRequest as traits } from '../functions/api/meta/traits';
import { onRequest as summary } from '../functions/api/meta/summary';
import { onRequest as tierList } from '../functions/api/meta/tier-list';
import { onRequest as trends } from '../functions/api/meta/trends';
import { onRequest as history } from '../functions/api/meta/patch-history';
import { onRequest as entity } from '../functions/api/meta/trends/entity';
import { onRequest as readiness } from '../functions/api/meta/readiness';
const env = { ...process.env, ...loadEnv('development', process.cwd(), '') };
const routes: Record<string, typeof profile> = {
  '/api/tft/profile': profile,
  '/api/meta/items': items,
  '/api/meta/champions': champions,
  '/api/meta/traits': traits,
  '/api/meta/summary': summary,
  '/api/meta/readiness': readiness,
  '/api/meta/tier-list': tierList,
  '/api/meta/trends': trends,
  '/api/meta/patch-history': history,
  '/api/meta/trends/entity': entity,
};
createServer(async (req, res) => {
  try {
    const request = new Request('http://localhost:8889' + req.url, { method: req.method });
    const route = routes[new URL(request.url).pathname];
    const response = route
      ? await route({ request, env })
      : Response.json({ message: 'API route not found' }, { status: 404 });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json' }).end('{"message":"Local API error"}');
  }
}).listen(8889, '127.0.0.1', () => console.log('Local API: http://127.0.0.1:8889/api'));
