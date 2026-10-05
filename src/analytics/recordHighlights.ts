import type { Game } from '../types/riot';
import type { AssetMap } from '../static-data/catalog';
import { displayName } from '../static-data/catalog';
import { statistics, formAnalysis, mean } from './formAnalysis';
import { preferenceAnalysis, recentSample } from './preferences';
import { FORM_WINDOW } from '../config/analysis';
export interface RecordHighlight {
  key: string;
  title: string;
  detail: string;
}
/** Descriptive observations, not causal coaching. Five matches minimum;
 * form requires two complete windows, level comparisons require 3 matches per group. */
export function recordHighlights(input: Game[], assets: AssetMap = {}) {
  const games = recentSample(input);
  const highlights: RecordHighlight[] = [];
  if (games.length < 5) return { count: games.length, highlights };
  const form = formAnalysis(games);
  if (form.delta !== null && Math.abs(form.delta) >= 0.1) {
    highlights.push({
      key: 'form',
      title: `최근 평균 등수 ${Math.abs(form.delta).toFixed(2)} ${form.delta > 0 ? '개선' : '하락'}`,
      detail: `이전 ${FORM_WINDOW}경기 ${form.previous!.toFixed(2)}위 → 최근 ${FORM_WINDOW}경기 ${form.recent!.toFixed(2)}위. 평균 등수는 낮을수록 좋습니다.`,
    });
  }
  const units = preferenceAnalysis(games, 'unit');
  const unit = units.rows[0];
  if (unit?.enough)
    highlights.push({
      key: 'unit',
      title: `가장 자주 사용한 챔피언 · ${displayName(assets, 'unit', unit.id, unit.set)}`,
      detail: `최종 보드 확인 가능 ${units.available}경기 중 ${unit.count}경기에서 사용했습니다. 해당 ${unit.count}경기 평균 ${unit.average.toFixed(2)}위, TOP4 ${Math.round(unit.top4 * 100)}%.`,
    });
  const validLevel = games.filter((g) => Number.isFinite(g.player.level) && g.player.level > 0);
  const low = validLevel.filter((g) => g.player.placement >= 7);
  const rest = validLevel.filter((g) => g.player.placement < 7);
  if (low.length >= 3 && rest.length >= 3) {
    const a = mean(low.map((g) => g.player.level))!,
      b = mean(rest.map((g) => g.player.level))!;
    if (b - a >= 0.5)
      highlights.push({
        key: 'level',
        title: '7~8등 경기에서 최종 레벨이 낮았습니다',
        detail: `7~8등 ${low.length}경기 평균 ${a.toFixed(1)}레벨, 나머지 ${rest.length}경기 ${b.toFixed(1)}레벨. 종료 시점의 차이이며, 레벨업 판단이 원인이라는 뜻은 아닙니다.`,
      });
  }
  const traits = preferenceAnalysis(games, 'trait');
  const trait = traits.rows[0];
  if (trait?.enough)
    highlights.push({
      key: 'trait',
      title: `가장 자주 활성화한 특성 · ${displayName(assets, 'trait', trait.id, trait.set)}`,
      detail: `활성 특성 확인 가능 ${traits.available}경기 중 ${trait.count}경기에서 활성화했습니다. 해당 경기 TOP4 ${Math.round(trait.top4 * 100)}%.`,
    });
  const s = statistics(games);
  highlights.push({
    key: 'results',
    title: `최근 ${games.length}경기 TOP4 ${games.filter((g) => g.player.placement <= 4).length}회`,
    detail: `평균 ${s.average!.toFixed(2)}위, TOP4 ${Math.round(s.top4! * 100)}%, 1등 ${games.filter((g) => g.player.placement === 1).length}회입니다.`,
  });
  return { count: games.length, highlights: highlights.slice(0, 3) };
}
