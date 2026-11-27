import handler from '../../../server/handlers/tft-meta';
import type { ApiContext } from '../../../server/env';

export const onRequest = ({ request, env }: ApiContext) => handler(request, env, false, true);
