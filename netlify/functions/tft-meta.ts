// Legacy Netlify/local adapter. Pages routes use context.env explicitly.
import handler from '../../server/handlers/tft-meta';
export * from '../../server/handlers/tft-meta';
export default (request: Request) => handler(request, process.env);
