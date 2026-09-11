import type { Game } from '../../types/riot';
import { sample, avg } from './sample';
import { deckKey } from '../deckDiversity';
import { completion } from './playDna';
import { streaks } from './streaks';
export function achievements(input: Game[]) {
  const g = sample(input),
    s = streaks(g);
  const unique = new Set(
    g
      .filter((x) => x.player.placement <= 4)
      .map(deckKey)
      .filter(Boolean),
  ).size;
  const wins = new Map<string, number>();
  g.filter((x) => x.player.placement === 1).forEach((x) => {
    const k = deckKey(x);
    if (k) wins.set(k, (wins.get(k) ?? 0) + 1);
  });
  const record = (
    id: string,
    tier: string,
    name: string,
    description: string,
    progress: number,
    target: number,
    ready = true,
  ) => ({
    id,
    tier,
    name,
    description,
    progress: Math.min(target, progress),
    target,
    unlocked: ready && progress >= target,
    ready,
  });
  const list = [
    record(
      'podium',
      'COMMON',
      '포디움 입성',
      '조회 범위에서 TOP4 1회',
      g.filter((x) => x.player.placement <= 4).length,
      1,
    ),
    record('three', 'RARE', '연승의 시작', '조회된 경기에서 TOP4 3회 연속', s.bestTop4, 3),
    record('variety', 'EPIC', '전천후 전략가', '서로 다른 주요 특성 조합 5개로 TOP4', unique, 5),
    record(
      'board',
      'EPIC',
      '완성된 보드',
      '보드 완성도 대리 지표 70 이상으로 1위',
      g.filter((x) => x.player.placement === 1 && (completion(x) ?? -1) >= 70).length,
      1,
    ),
    record(
      'dominator',
      'LEGENDARY',
      '지배자',
      '최근 10경기 평균 등수 2.5 이하',
      g.length >= 10 && avg(g.slice(0, 10).map((x) => x.player.placement))! <= 2.5 ? 1 : 0,
      1,
      g.length >= 10,
    ),
    record('wall', 'LEGENDARY', '철벽', '조회된 경기에서 TOP4 5회 연속', s.bestTop4, 5),
    record(
      'revenge',
      'HIDDEN',
      '복수는 다음 판에',
      '조회 순서에서 8위 직후 1위',
      g.some((x, i) => x.player.placement === 1 && g[i + 1]?.player.placement === 8) ? 1 : 0,
      1,
    ),
    record(
      'master',
      'HIDDEN',
      '장인의 증명',
      '같은 주요 특성 조합으로 1위 3회',
      Math.max(0, ...wins.values()),
      3,
    ),
  ];
  // Do not expose locked hidden name, condition or partial progress to rendering consumers.
  return list.map((x) =>
    x.tier === 'HIDDEN' && !x.unlocked
      ? { ...x, name: '????', description: '조건을 만족하면 공개됩니다.', progress: 0, target: 1 }
      : x,
  );
}
