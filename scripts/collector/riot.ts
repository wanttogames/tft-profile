import { StageError, protect, redact } from './diagnostics';
export class HttpError extends StageError {
  constructor(
    public status: number,
    service: string,
    detail: Record<string, unknown> = {},
  ) {
    super(service === 'Riot' ? 'RIOT MATCH ERROR' : 'SUPABASE ERROR', {
      stage: `${service} response status`,
      status,
      message: `${service} HTTP ${status}`,
      ...detail,
    });
  }
}
export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
// Sequential caller + spacing on EVERY attempt; 429 applies to subsequent requests too.
export class RiotClient {
  private cooldown = 0;
  constructor(
    private key: string,
    private delayMs = 1400,
    private fetcher = fetch,
    private wait = sleep,
  ) {
    protect(key);
  }
  async get(path: string, platform = false): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt++) {
      await this.wait(Math.max(this.delayMs, this.cooldown));
      this.cooldown = 0;
      let response: Response;
      try {
        response = await this.fetcher(
          `https://${platform ? 'kr' : 'asia'}.api.riotgames.com${path}`,
          {
            headers: { 'X-Riot-Token': this.key },
            signal: AbortSignal.timeout(20000),
          },
        );
      } catch (error) {
        if (attempt === 3)
          throw new StageError('RIOT MATCH ERROR', {
            stage: 'Riot Match Detail request',
            message: error instanceof Error ? error.message : String(error),
          });
        this.cooldown = 2000 * 2 ** attempt;
        continue;
      }
      let body: string;
      try {
        body = await response.text();
      } catch (error) {
        throw new StageError('RIOT MATCH ERROR', {
          stage: 'Riot response body read',
          status: response.status,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      if (response.ok) {
        try {
          return JSON.parse(body);
        } catch {
          throw new StageError('RIOT JSON ERROR', {
            stage: 'JSON parsing',
            status: response.status,
            message: 'Response is not valid JSON',
            body: body.slice(0, 2000),
          });
        }
      }
      if (response.status === 429) {
        const header = response.headers.get('retry-after');
        const seconds = header === null ? NaN : Number(header);
        const retryMs = Number.isFinite(seconds)
          ? seconds * 1000
          : Date.parse(header ?? '') - Date.now();
        this.cooldown = Math.max(2000 * 2 ** attempt, Number.isFinite(retryMs) ? retryMs : 0);
        console.warn('Riot 429: 요청을 늦춰 재시도합니다.');
      } else if (response.status >= 500) this.cooldown = 2000 * 2 ** attempt;
      else throw new HttpError(response.status, 'Riot', { body: body.slice(0, 4000) });
      if (attempt === 3)
        throw new HttpError(response.status, 'Riot', { body: body.slice(0, 4000) });
    }
    throw new Error('Riot retry exhausted');
  }
}
export function fatal(error: unknown) {
  return error instanceof HttpError && [401, 403].includes(error.status);
}
export function safeError(error: unknown) {
  return redact(
    error instanceof StageError
      ? error.context
      : error instanceof Error
        ? error.message
        : String(error),
  );
}
