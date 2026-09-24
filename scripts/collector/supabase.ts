import { StageError, protect } from './diagnostics';
import { HttpError, sleep } from './riot';
export class Store {
  constructor(
    private url: string,
    private secret: string,
    private fetcher = fetch,
  ) {
    protect(secret);
    protect(url);
  }
  async request(path: string, method = 'GET', body?: unknown, attempts = 3): Promise<unknown> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      let response: Response;
      try {
        response = await this.fetcher(`${this.url.replace(/\/$/, '')}/rest/v1/${path}`, {
          method,
          headers: {
            apikey: this.secret,
            'Content-Type': 'application/json',
            ...(this.secret.startsWith('eyJ') ? { Authorization: `Bearer ${this.secret}` } : {}),
            ...(path.startsWith('rpc/')
              ? {}
              : { Prefer: 'resolution=merge-duplicates,return=minimal' }),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(30000),
        });
      } catch (error) {
        if (attempt === attempts - 1)
          throw new StageError('SUPABASE ERROR', {
            stage: 'Supabase request',
            table: path.split('?')[0],
            message: error instanceof Error ? error.message : String(error),
          });
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      if (response.ok) {
        const text = await response.text();
        try {
          return text ? JSON.parse(text) : null;
        } catch {
          throw new StageError('SUPABASE ERROR', {
            stage: 'Supabase JSON parsing',
            status: response.status,
            table: path.split('?')[0],
            message: 'Response is not valid JSON',
          });
        }
      }
      if ((response.status >= 500 || response.status === 429) && attempt < attempts - 1) {
        await sleep(
          Math.max(1000 * 2 ** attempt, Number(response.headers.get('retry-after') ?? 0) * 1000),
        );
        continue;
      }
      const bodyText = await response.text();
      let data: Record<string, unknown>;
      try {
        const parsed: unknown = JSON.parse(bodyText);
        data =
          parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : { message: bodyText };
      } catch {
        data = { message: bodyText };
      }
      const table =
        typeof data.message === 'string' ? /\[table=(\w+)\]/.exec(data.message)?.[1] : undefined;
      throw new HttpError(response.status, 'Supabase', {
        stage: 'Supabase save/response',
        table: table ?? path.split('?')[0],
        code: data.code ?? null,
        message: data.message ?? bodyText,
        details: data.details ?? null,
        hint: data.hint ?? null,
      });
    }
    throw new Error('Supabase retry exhausted');
  }
  async existing(ids: string[]) {
    const found = new Set<string>();
    for (let i = 0; i < ids.length; i += 50) {
      const rows = await this.request('rpc/tft_meta_existing_matches', 'POST', {
        ids: ids.slice(i, i + 50),
      });
      if (!Array.isArray(rows)) throw new Error('Invalid existing match response');
      for (const row of rows) {
        if (typeof row.match_id !== 'string') throw new Error('Invalid existing match row');
        found.add(row.match_id);
      }
    }
    return found;
  }
}
