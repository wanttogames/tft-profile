// Legacy Netlify/local adapter. Pages routes use context.env explicitly.
import handler from '../../server/handlers/tft-player';
export * from '../../server/handlers/tft-player';
export default (request: Request) => handler(request, process.env);
