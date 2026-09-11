export class HttpError extends Error {
  constructor(
    public status: number,
    service: string,
  ) {
    super(
      `${service} HTTP ${status}${status === 429 ? ': 요청 한도 초과 (재시도 소진)' : status === 403 ? ': API Key 만료 또는 권한 확인 필요' : ''}`,
    );
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
  ) {}
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
      } catch {
        if (attempt === 3) throw new Error('Riot network request failed');
        this.cooldown = 2000 * 2 ** attempt;
        continue;
      }
      if (response.ok) return response.json();
      if (response.status === 429) {
        const header = response.headers.get('retry-after');
        const seconds = header === null ? NaN : Number(header);
        const retryMs = Number.isFinite(seconds)
          ? seconds * 1000
          : Date.parse(header ?? '') - Date.now();
        this.cooldown = Math.max(2000 * 2 ** attempt, Number.isFinite(retryMs) ? retryMs : 0);
        console.warn('Riot 429: 요청을 늦춰 재시도합니다.');
      } else if (response.status >= 500) this.cooldown = 2000 * 2 ** attempt;
      else throw new HttpError(response.status, 'Riot');
      if (attempt === 3) throw new HttpError(response.status, 'Riot');
    }
    throw new Error('Riot retry exhausted');
  }
}
export function fatal(error: unknown) {
  return error instanceof HttpError && [401, 403].includes(error.status);
}
export function safeError(error: unknown) {
  return error instanceof HttpError ? error.message : '요청 또는 데이터 검증 실패';
}
