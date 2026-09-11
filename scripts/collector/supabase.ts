import { HttpError, sleep } from './riot';
export class Store {
  constructor(
    private url: string,
    private secret: string,
    private fetcher = fetch,
  ) {}
  async request(path: string, method = 'GET', body?: unknown): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt++) {
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
      } catch {
        if (attempt === 2) throw new Error('Supabase network request failed');
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      if (response.ok) {
        const text = await response.text();
        return text ? JSON.parse(text) : null;
      }
      if ((response.status >= 500 || response.status === 429) && attempt < 2) {
        await sleep(
          Math.max(1000 * 2 ** attempt, Number(response.headers.get('retry-after') ?? 0) * 1000),
        );
        continue;
      }
      throw new HttpError(response.status, 'Supabase');
    }
    throw new Error('Supabase retry exhausted');
  }
  async existing(ids: string[]) {
    const found = new Set<string>();
    for (let i = 0; i < ids.length; i += 50) {
      const query = new URLSearchParams({
        select: 'match_id',
        match_id: `in.(${ids.slice(i, i + 50).join(',')})`,
      });
      const rows = await this.request(`tft_matches?${query}`);
      if (!Array.isArray(rows)) throw new Error('Invalid existing match response');
      for (const row of rows) {
        if (typeof row.match_id !== 'string') throw new Error('Invalid existing match row');
        found.add(row.match_id);
      }
    }
    return found;
  }
}
