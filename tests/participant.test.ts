import { describe, expect, it } from 'vitest';
import response from './fixtures/riot-match-v5.anonymized.json';
import { parseParticipant } from '../netlify/lib/matchParticipant';
import { toGame } from '../netlify/functions/tft-player';
import { patterns } from '../src/analytics/patterns';
import { parseRiotId } from '../src/utils/riotId';

// Published Match-V1 response, with PUUIDs anonymized. See fixtures/README.md.
// The original queue is NORMAL (1090), never mislabeled as a captured ranked game.
const target = 'fixture-player-7';
const rankedVariant = () => ({
  ...structuredClone(response),
  info: { ...structuredClone(response.info), queue_id: 1100 },
});

describe('published Match-V1 participant response regression', () => {
  it('parses all eight observed itemNames-only participants', () => {
    expect(response.metadata.data_version).toBe('5');
    for (const p of response.info.participants) {
      expect(p.units.every((u) => !('items' in u))).toBe(true);
      const parsed = parseParticipant(response.info.participants, p.puuid)!;
      expect(parsed.placement).toBe(p.placement);
      expect(parsed.units.map((u) => u.itemNames)).toEqual(p.units.map((u) => u.itemNames));
      expect(parsed.units.every((u) => Array.isArray(u.items) && u.items.length === 0)).toBe(true);
    }
  });
  it('finds exact PUUID in info.participants, not the first participant', () => {
    const parsed = parseParticipant(response.info.participants, target)!;
    expect(parsed.puuid).toBe(target);
    expect(parsed.placement).toBe(1);
    expect(parsed.level).toBe(8);
    expect(parsed.units.find((u) => u.character_id === 'TFT8_Annie')?.itemNames).toEqual([
      'TFT_Item_WarmogsArmor',
      'TFT_Item_RedBuff',
      'TFT_Item_BrambleVest',
    ]);
  });
  it('ignores metadata participant ordering', () => {
    const m = rankedVariant();
    m.metadata.participants.reverse();
    const result = toGame(m, target)!;
    expect(result.player.placement).toBe(1);
    expect(result.player.puuid).toBe(target);
  });
  it('filters the original normal match without altering fixture metadata', () =>
    expect(toGame(response, target)).toBeNull());
  it('keeps named equipment counts in analytics after normalization', () =>
    expect(patterns([toGame(rankedVariant(), target)!]).items).toBe(12));
  it('accepts legacy numeric equipment without itemNames', () => {
    const p = structuredClone(response.info.participants[6]!);
    const units = p.units.map(({ itemNames: _, ...u }) => ({ ...u, items: [1, 2] }));
    const parsed = parseParticipant([{ ...p, units }], target)!;
    expect(parsed.units[0]!.items).toEqual([1, 2]);
    expect(parsed.units[0]!.itemNames).toBeUndefined();
  });
  it('tolerates a null optional items array when names exist', () => {
    const p = structuredClone(response.info.participants[6]!);
    expect(
      parseParticipant([{ ...p, units: p.units.map((u) => ({ ...u, items: null })) }], target)
        ?.units[0]?.items,
    ).toEqual([]);
  });
  it('accepts genuinely empty itemNames as an unequipped unit', () => {
    expect(parseParticipant(response.info.participants, target)?.units[0]?.itemNames).toEqual([]);
  });
  it('does not fabricate placement or mask malformed equipment', () => {
    const p = structuredClone(response.info.participants[6]!);
    expect(() => parseParticipant([{ ...p, placement: '1' }], target)).toThrow('(placement)');
    expect(() =>
      parseParticipant([{ ...p, units: [{ ...p.units[0], itemNames: 'bad' }] }], target),
    ).toThrow('itemNames');
    expect(() =>
      parseParticipant([{ ...p, units: [{ ...p.units[0], itemNames: undefined }] }], target),
    ).toThrow('items/itemNames');
  });
  it('reports missing PUUID explicitly and never substitutes another player', () => {
    expect(parseParticipant(response.info.participants, 'missing')).toBeNull();
    expect(() => toGame(rankedVariant(), 'missing')).toThrow('PUUID와 일치하는 참가자');
  });
  it('ignores irrelevant null entries but rejects invalid selected units', () => {
    expect(parseParticipant([null, ...response.info.participants], target)?.placement).toBe(1);
    const p = response.info.participants[6]!;
    expect(() => parseParticipant([{ ...p, units: [null] }], target)).toThrow('units[0]');
  });
});
describe('Riot ID input', () => {
  it('splits gameName#tagLine without a login identifier lookup', () =>
    expect(parseRiotId(' 게임 이름#KR1 ')).toEqual({ gameName: '게임 이름', tagLine: 'KR1' }));
  it('keeps two-field input compatible and normalizes #', () =>
    expect(parseRiotId('게임 이름', ' #KR1 ')).toEqual({ gameName: '게임 이름', tagLine: 'KR1' }));
  it('prefers an explicitly pasted tag over the default tag input', () =>
    expect(parseRiotId('게임 이름#ABC', 'KR1').tagLine).toBe('ABC'));
  it.each(['name', 'name#', '#KR1', 'name#KR1#oops'])('rejects malformed ID %s', (id) =>
    expect(() => parseRiotId(id)).toThrow('게임이름#태그'),
  );
});
