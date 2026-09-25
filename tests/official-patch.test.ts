import { describe, it, expect, vi, afterEach } from 'vitest';
import fixture from './fixtures/riot-official-patch-list.json';
import {
  parseOfficialPatch,
  prepareOfficialPatch,
  OFFICIAL_PATCH_LIST,
} from '../scripts/collector/officialPatch';
const html = (data: unknown) =>
  `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script>`;
const now = Date.parse('2026-09-25T03:00:00Z');
afterEach(() => vi.useRealTimers());
describe('official TFT fallback', () => {
  it('reads the captured official metadata without treating publication as rollout', () => {
    expect(parseOfficialPatch(html(fixture.cards), now)).toEqual({
      patch: '18.3',
      sourceUrl:
        'https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/teamfight-tactics-patch-18-3',
      publishedAt: '2026-09-22T18:00:00.000Z',
    });
  });
  it('rejects stale, future, unrelated, redirected and malformed source metadata', () => {
    expect(() => parseOfficialPatch(html(fixture.cards), now + 60 * 86400000)).toThrow();
    expect(() => parseOfficialPatch(html(fixture.cards), now - 10 * 86400000)).toThrow();
    const cards = structuredClone(fixture.cards);
    cards[0]!.product.machineName = 'league_of_legends';
    expect(() => parseOfficialPatch(html(cards), now)).toThrow();
    cards[0]!.product.machineName = 'teamfight_tactics';
    cards[0]!.action.payload.url =
      'https://evil.test/en-us/news/game-updates/teamfight-tactics-patch-18-3';
    expect(() => parseOfficialPatch(html(cards), now)).toThrow();
    expect(() => parseOfficialPatch('<html>schema changed</html>', now)).toThrow();
  });
  it('primary data prevents external fetch', async () => {
    const request = vi.fn(async () => ({ needsFallback: false }));
    const fetcher = vi.fn();
    await prepareOfficialPatch({ request }, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('all NULL probe registers source; no raw match updates', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const request = vi.fn(async () => ({ needsFallback: true }));
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json({}),
    );
    fetcher.mockImplementation(async () => new Response(html(fixture.cards)));
    await prepareOfficialPatch({ request }, fetcher);
    expect(fetcher.mock.calls[0]?.[0]).toBe(OFFICIAL_PATCH_LIST);
    expect(request).toHaveBeenCalledWith(
      'rpc/register_tft_external_patch',
      'POST',
      expect.objectContaining({ proposed_patch: '18.3' }),
      1,
    );
    expect(request.mock.calls).toHaveLength(2);
  });
  it('failed fallback never registers guessed values', async () => {
    const request = vi.fn(async () => ({ needsFallback: true }));
    await prepareOfficialPatch(
      { request },
      vi.fn(async () => new Response('', { status: 503 })),
    );
    expect(request).toHaveBeenCalledTimes(1);
  });
});
it('registration DB failure propagates instead of hiding it as source failure', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const request = vi.fn(async (path: string) => {
    if (path.includes('patch_probe')) return { needsFallback: true };
    throw Error('registration failed');
  });
  await expect(
    prepareOfficialPatch(
      { request },
      vi.fn(async () => new Response(html(fixture.cards))),
    ),
  ).rejects.toThrow('registration failed');
});
