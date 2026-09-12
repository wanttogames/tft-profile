import handler from '../../../server/handlers/tft-meta';
import type { ApiContext } from '../../../server/env';
export async function onRequest(context: ApiContext): Promise<Response> {
  const response = await handler(context.request, context.env, true);
  if (!response.ok) return response;
  const data = (await response.json()) as { summary: unknown };
  return Response.json(data.summary, { headers: response.headers });
}
