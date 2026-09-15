import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import { demoPlayer } from '../src/data/demo';
beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it('uses one relative API request and shares normalized browser results for 120 seconds', async () => {
  const fetcher = vi.fn(async (_url: string) => Response.json(demoPlayer()));
  vi.stubGlobal('fetch', fetcher);
  const { fetchPlayer } = await import('../src/api/player');
  await fetchPlayer('Name#KR1');
  await fetchPlayer('name', 'kr1');
  expect(fetcher).toHaveBeenCalledTimes(1);
  const url = String(fetcher.mock.calls[0]![0]);
  expect(url).toContain('/api/tft/profile?');
  expect(url).not.toContain('start=');
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 120001);
  await fetchPlayer('name', 'kr1');
  expect(fetcher).toHaveBeenCalledTimes(2);
});
it('shows and honors actual Retry-After without making another browser call', async () => {
  const fetcher = vi.fn(async () =>
    Response.json(
      { message: 'Riot API 요청이 많습니다. 41초 후 다시 시도해 주세요.', retryAfter: 41 },
      { status: 429, headers: { 'Retry-After': '41' } },
    ),
  );
  vi.stubGlobal('fetch', fetcher);
  const { fetchPlayer } = await import('../src/api/player');
  await expect(fetchPlayer('Name#KR1')).rejects.toThrow('41초');
  await expect(fetchPlayer('Other#KR1')).rejects.toThrow('Riot API 요청이 많습니다.');
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it('ordinary server failure never blocks the next search as rate limited', async () => {
  const fetcher = vi.fn(async () => Response.json({ message: '서버 장애' }, { status: 502 }));
  vi.stubGlobal('fetch', fetcher);
  const { fetchPlayer } = await import('../src/api/player');
  await expect(fetchPlayer('Name#KR1')).rejects.toThrow('서버 장애');
  await expect(fetchPlayer('Name#KR1')).rejects.toThrow('서버 장애');
  expect(fetcher).toHaveBeenCalledTimes(2);
});
