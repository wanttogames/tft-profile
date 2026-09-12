import handler from '../../../server/handlers/tft-player';
import type { ApiContext } from '../../../server/env';
// 25 details per invocation leaves room for account, league, IDs and static lookups.
export const onRequest = ({ request, env }: ApiContext) => handler(request, env, 25);
