import type { PlayerData } from '../types/riot';
import { playerScores } from '../analytics/playerScores';
import { playerProfile } from '../analytics/profileAnalysis';
import { displayName, lookupAsset } from '../static-data/catalog';

export const scoreLabels = {
  ceiling: '고점력',
  stability: '안정성',
  survival: '순방력',
  lateGame: '후반 운영력',
  flexibility: '유연성',
  diversity: '덱 다양성',
  completion: '보드 완성도',
  form: '최근 폼',
} as const;
// Presentation only: rank changes the frame, never a player's analysis scores.
const palettes: Record<string, [string, string]> = {
  IRON: ['#b2a9a4', '#77788b'],
  BRONZE: ['#dcaa80', '#9b6a60'],
  SILVER: ['#d0dce9', '#8aacc3'],
  GOLD: ['#f4d18a', '#c58b45'],
  PLATINUM: ['#91e6dc', '#5ba9c8'],
  EMERALD: ['#81edb5', '#40a899'],
  DIAMOND: ['#b6ceff', '#9b88e6'],
  MASTER: ['#d5a6ff', '#9a6fdb'],
  GRANDMASTER: ['#ffb4a7', '#dd6279'],
  CHALLENGER: ['#ffe0a0', '#76d5f3'],
};
export function cardTheme(tier?: string) {
  const name = tier?.toUpperCase() ?? 'UNRANKED';
  const [accent, secondary] = palettes[name] ?? ['#b7c9dc', '#738da8'];
  return { tier: palettes[name] ? name : 'UNRANKED', accent, secondary };
}
export function profileCardModel(data: PlayerData) {
  const profile = playerProfile(data.games, data.assets);
  const scores = playerScores(data.games, data.assets);
  const preferences = (kind: 'unit' | 'trait') =>
    (kind === 'unit' ? profile.units : profile.traits).top.slice(0, 3).map((r) => ({
      ...r,
      name: displayName(data.assets, kind, r.id, r.set),
      asset: lookupAsset(data.assets, kind, r.id, r.set),
    }));
  return {
    theme: cardTheme(data.rank?.tier),
    name: data.account.gameName || '플레이어',
    tag: '#' + (data.account.tagLine || '—'),
    rank: data.rank ? `${data.rank.tier ?? 'UNRANKED'} ${data.rank.rank ?? ''}`.trim() : 'UNRANKED',
    lp: data.rank?.leaguePoints == null ? '—' : String(data.rank.leaguePoints),
    profile,
    scores,
    units: preferences('unit'),
    traits: preferences('trait'),
    stats: [
      { label: '평균 등수', value: profile.stats.average?.toFixed(2) ?? '—' },
      {
        label: 'TOP4',
        value: profile.stats.top4 == null ? '—' : Math.round(profile.stats.top4 * 100) + '%',
      },
      {
        label: '1등률',
        value: profile.stats.win == null ? '—' : Math.round(profile.stats.win * 100) + '%',
      },
    ],
    sample: `최근 30경기 기준 · ${profile.stats.count}경기 분석`,
    edition: data.demo ? 'DEMO · 가상 데이터' : `SET ${data.games[0]?.set ?? '—'} · RANKED`,
  };
}
export type ProfileCardModel = ReturnType<typeof profileCardModel>;
