import { afterEach, describe, expect, it, vi } from 'vitest';
import { maintainMeta, sizeStatus } from '../scripts/collector/metaRetention';
const success = { Players: 2, 'Failed matches': 0, 'Failed player scans': 0 };
afterEach(() => vi.restoreAllMocks());
function store(fail?: string) {
  return {
    request: vi.fn(async (path: string) => {
      if (path === fail) throw Error('synthetic failure');
      if (path.includes('db_size')) return { bytes: 284 * 1024 ** 2 };
      if (path.includes('patch_probe')) return { needsFallback: false } as never;
      if (path.includes('refresh')) return { status: 'refreshed', generation: 4 };
      return { status: 'cleaned', deletedMatches: 3 };
    }),
  };
}
describe('retention orchestration', () => {
  it('failed collection does not refresh or clean', async () => {
    const s = store();
    expect(await maintainMeta(s, { ...success, 'Failed matches': 1 })).toBe(false);
    expect(s.request.mock.calls.map((c) => c[0])).toEqual([
      'rpc/tft_meta_db_size',
      'rpc/tft_meta_db_size',
    ]);
  });
  it('refresh failure skips cleanup without touching saved matches', async () => {
    const s = store('rpc/refresh_tft_meta_stats');
    expect(await maintainMeta(s, success)).toBe(false);
    expect(s.request.mock.calls.map((c) => c[0])).not.toContain('rpc/cleanup_tft_meta_data');
  });
  it('cleanup failure preserves collection and aggregate', async () => {
    const s = store('rpc/cleanup_tft_meta_data');
    expect(await maintainMeta(s, success)).toBe(false);
    expect(s.request.mock.calls.map((c) => c[0])).toEqual([
      'rpc/tft_meta_db_size',
      'rpc/tft_meta_patch_probe',
      'rpc/refresh_tft_meta_stats',
      'rpc/cleanup_tft_meta_data',
      'rpc/tft_meta_db_size',
    ]);
  });
  it('refreshes once, then deletes in separate 200-match transactions', async () => {
    let calls = 0;
    const s = store();
    s.request.mockImplementation(async (path: string) => {
      if (path.includes('db_size')) return { bytes: 0 } as never;
      if (path.includes('patch_probe')) return { needsFallback: false } as never;
      if (path.includes('refresh')) return { status: 'refreshed', generation: 4 };
      return { status: 'cleaned', deletedMatches: calls++ === 0 ? 200 : 3 };
    });
    expect(await maintainMeta(s, success)).toBe(true);
    expect(s.request).toHaveBeenCalledWith(
      'rpc/cleanup_tft_meta_data',
      'POST',
      { expected_generation: 4, batch_size: 200 },
      1,
    );
    expect(s.request.mock.calls.filter((c) => c[0].includes('refresh'))).toHaveLength(1);
    expect(calls).toBe(2);
  });
  it('busy refresh never permits cleanup', async () => {
    const s = {
      request: vi.fn(async (p: string) =>
        p.includes('db_size') ? { bytes: 0 } : { status: 'busy' },
      ),
    };
    expect(await maintainMeta(s, success)).toBe(true);
    expect(s.request.mock.calls.some((c) => c[0].includes('cleanup'))).toBe(false);
  });
  it.each([
    [284, false, false],
    [350, true, false],
    [399, true, false],
    [400, true, true],
  ])('size %i MiB', (mb, warning, critical) => {
    expect(sizeStatus(mb * 1024 ** 2)).toEqual({ currentMB: mb, warning, critical });
  });
});
