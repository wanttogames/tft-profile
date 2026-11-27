import trends from '../../../server/handlers/tft-trends';
import type { ApiContext } from '../../../server/env';
export const onRequest = ({ request, env }: ApiContext) => trends(request, env, 'trends');
