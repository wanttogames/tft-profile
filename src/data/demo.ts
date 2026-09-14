import type { PlayerData, Game } from '../types/riot';
/** Synthetic demonstration, deliberately labelled. Never returned by the live API. */
export function demoPlayer(): PlayerData {
  const basePlacements = [2, 1, 5, 3, 2, 4, 1, 7, 3, 2, 6, 4, 8, 3, 5, 2, 7, 4, 6, 1];
  const placements = Array.from(
    { length: 50 },
    (_, i) => basePlacements[i % basePlacements.length]!,
  );
  const names = ['아리', '야스오', '니코', '세트', '애쉬', '리 신', '신드라', '라칸', '오른'];
  const traits = ['마법사', '결투가', '숲지기', '저격수', '수호자'];
  const assets: PlayerData['assets'] = {};
  names.forEach((name, i) => (assets['DEMO_Unit' + i] = { name }));
  traits.forEach((name, i) => (assets['DEMO_Trait' + i] = { name }));
  assets.DEMO_Item0 = { name: '구인수의 격노검', itemType: 'completed' };
  assets.DEMO_Item1 = { name: '무한의 대검', itemType: 'completed' };
  assets.DEMO_Item2 = { name: '워모그의 갑옷', itemType: 'completed' };
  const games: Game[] = placements.map((placement, i) => ({
    id: `DEMO_${i}`,
    date: 1789020000000 - i * 3600000,
    duration: 2200,
    version: 'DEMO',
    set: 0,
    player: {
      puuid: 'demo',
      placement,
      level: i % 4 === 0 ? 9 : i % 3 === 0 ? 7 : 8,
      last_round: placement <= 4 ? 35 : 28,
      time_eliminated: placement <= 4 ? 2100 : 1750,
      units: names.slice(0, i % 3 === 0 ? 7 : 8).map((_, j) => ({
        character_id: 'DEMO_Unit' + j,
        tier: i % 3 === 0 && j < 2 ? 3 : j % 3 === 0 ? 1 : 2,
        rarity: j % 5,
        items: [],
        itemNames: j < 3 ? ['DEMO_Item' + j, 'DEMO_Item' + ((j + 1) % 3)] : [],
      })),
      traits: [
        { name: 'DEMO_Trait' + (i % 5), num_units: 5, style: 3, tier_current: 2, tier_total: 4 },
        {
          name: 'DEMO_Trait' + ((i + 2) % 5),
          num_units: 3,
          style: 2,
          tier_current: 1,
          tier_total: 3,
        },
      ],
    },
  }));
  return {
    account: { gameName: '나의 플레이어', tagLine: 'DEMO', puuid: 'demo' },
    rank: {
      queueType: 'RANKED_TFT',
      tier: 'DIAMOND',
      rank: 'II',
      leaguePoints: 67,
      wins: 84,
      losses: 65,
    },
    games,
    assets,
    warnings: [],
    fetchedAt: 1789020000000,
    scanned: 50,
    demo: true,
  };
}
