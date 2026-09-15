/** Cache API is persistent across isolates in a Cloudflare location, not a global lock. */
export const TTL = {
  profile: 120000,
  account: 604800000,
  rank: 300000,
  matchIds: 120000,
  match: 604800000,
};
const memory = new Map<string, { value: unknown; expires: number }>();
const pending = new Map<string, Promise<unknown>>();
export interface EdgeCache {
  match(key: Request): Promise<Response | undefined>;
  put(key: Request, value: Response): Promise<void>;
}
export async function cacheValue<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>,
  edge?: EdgeCache,
  origin = 'https://profile-cache.local',
  onHit?: () => void,
): Promise<T> {
  const hit = memory.get(origin + key);
  if (hit && hit.expires > Date.now()) {
    onHit?.();
    return hit.value as T;
  }
  const request = new Request(`${origin}/__profile_cache/v2/${encodeURIComponent(key)}`);
  try {
    const response = await edge?.match(request);
    if (response) {
      const entry = (await response.json()) as { value: T; expires: number };
      if (entry.expires > Date.now()) {
        onHit?.();
        return entry.value;
      }
    }
  } catch {
    /* cache failure is not a profile failure */
  }
  const identity = origin + key;
  if (pending.has(identity)) {
    onHit?.();
    return pending.get(identity) as Promise<T>;
  }
  const job = (async () => {
    const value = await fn();
    const entry = { value, expires: Date.now() + ttl };
    if (memory.size >= 500) memory.delete(memory.keys().next().value!);
    memory.set(identity, entry);
    try {
      await edge?.put(
        request,
        Response.json(entry, { headers: { 'Cache-Control': `public, max-age=${ttl / 1000}` } }),
      );
    } catch {
      /* best effort */
    }
    return value;
  })().finally(() => pending.delete(identity));
  pending.set(identity, job);
  return job;
}
