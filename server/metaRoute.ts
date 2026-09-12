import handler from './handlers/tft-meta';
import type { ApiContext } from './env';
import type { MetaKind } from '../src/types/meta';
export function metaRoute(kind: MetaKind) {
  return ({ request, env }: ApiContext) => {
    const url = new URL(request.url);
    url.searchParams.set('kind', kind);
    return handler(new Request(url, request), env);
  };
}
