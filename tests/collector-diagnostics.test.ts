import { describe, it, expect, vi } from 'vitest';
import fixture from './fixtures/riot-match-v5.anonymized.json';
import { normalizeMatch } from '../scripts/collector/saveMatch';
import { logError, responseShape, protect, redact } from '../scripts/collector/diagnostics';
import { RiotClient } from '../scripts/collector/riot';
import { Store } from '../scripts/collector/supabase';
const raw = () => {
  const data = structuredClone(fixture);
  data.metadata.match_id = 'KR_1';
  data.info.queue_id = 1100;
  return data;
};
describe('collector actionable diagnostics', () => {
  it('reports exact field path for missing required values', () => {
    const data = raw();
    Reflect.deleteProperty(data.info.participants[3]!, 'placement');
    try {
      normalizeMatch(data, 'KR_1');
      throw Error('expected failure');
    } catch (error) {
      expect(error).toHaveProperty('context.field', 'info.participants[3].placement');
    }
  });
  it('accepts absent optional boards and items; supports explicit snake-case compatibility', () => {
    const data = raw();
    const p = data.info.participants[0]!;
    Reflect.deleteProperty(p.units[0]!, 'itemNames');
    expect(normalizeMatch(data, 'KR_1').participants[0]!.units[0]!.itemNames).toEqual([]);
    Reflect.set(p.units[0]!, 'item_names', ['fixture-item']);
    expect(normalizeMatch(data, 'KR_1').participants[0]!.units[0]!.itemNames).toEqual([
      'fixture-item',
    ]);
    Reflect.deleteProperty(p, 'units');
    Reflect.deleteProperty(p, 'traits');
    expect(normalizeMatch(data, 'KR_1').participants[0]).toMatchObject({ units: [], traits: [] });
  });
  it('distinguishes HTTP body, invalid JSON, and network errors', async () => {
    const make = (response: Response) =>
      new RiotClient(
        'secret-key-value',
        0,
        vi.fn(async () => response),
        async () => {},
      );
    await expect(
      make(new Response('not found', { status: 404 })).get('/match'),
    ).rejects.toMatchObject({ context: { status: 404, body: 'not found' } });
    await expect(make(new Response('invalid')).get('/match')).rejects.toMatchObject({
      category: 'RIOT JSON ERROR',
    });
    await expect(
      new RiotClient(
        'secret-key-value',
        0,
        vi.fn(async () => {
          throw Error('connection reset');
        }),
        async () => {},
      ).get('/match'),
    ).rejects.toMatchObject({
      context: { stage: 'Riot Match Detail request', message: 'connection reset' },
    });
  });
  it('preserves Supabase fields and table while removing secrets and participant identities from logs', async () => {
    const data = raw();
    responseShape(data);
    protect('my-private-key');
    const fetcher = vi.fn(async () =>
      Response.json(
        {
          code: '23514',
          message: '[table=tft_units] check violation',
          details: `Failing row ${data.info.participants[0]!.puuid} my-private-key`,
          hint: 'Check unit tier',
        },
        { status: 400 },
      ),
    );
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await new Store('https://test.supabase.co', 'my-private-key', fetcher).request(
        'rpc/tft_save_match',
        'POST',
        {},
      );
    } catch (error) {
      logError(error, { matchId: 'KR_1' });
    }
    const output = JSON.stringify(log.mock.calls);
    expect(output).toContain('23514');
    expect(output).toContain('tft_units');
    expect(output).toContain('Check unit tier');
    expect(output).not.toContain('my-private-key');
    expect(output).not.toContain(data.info.participants[0]!.puuid);
    log.mockRestore();
  });
  it('summarizes types and counts without values', () => {
    const data = raw(),
      output = JSON.stringify(responseShape(data));
    expect(output).toContain('itemNames');
    expect(output).not.toContain(data.info.participants[0]!.puuid);
    expect(output).not.toContain(data.info.participants[0]!.units[0]!.character_id);
  });
});

it('redacts identity fields inside nested JSON error bodies', () => {
  const output = redact({
    body: JSON.stringify({ puuid: 'unknown-sensitive-identity', riotIdGameName: 'private-name' }),
  });
  expect(output).not.toContain('unknown-sensitive-identity');
  expect(output).not.toContain('private-name');
});
