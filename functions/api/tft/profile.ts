import handler from '../../../server/handlers/tft-player';
import type { ApiContext } from '../../../server/env';
export const onRequest = ({ request, env }: ApiContext) => {
  const edge = (
    globalThis as unknown as {
      caches?: { default?: import('../../../server/lib/profileCache').EdgeCache };
    }
  ).caches?.default;
  return handler(request, env, edge);
};
