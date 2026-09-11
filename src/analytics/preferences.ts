import type { Game } from '../types/riot';
import { MIN_PREFERENCE_SAMPLE } from '../config/analysis';
import { statistics } from './formAnalysis';
export type PreferenceKind = 'augment' | 'trait';
export interface PreferenceRow {
  id: string;
  set: number;
  count: number;
  rate: number;
  average: number | null;
  top4: number | null;
  enough: boolean;
  restricted: boolean;
}
export interface PreferenceAnalysis {
  kind: PreferenceKind;
  total: number;
  available: number;
  missing: number;
  rows: PreferenceRow[];
  top: PreferenceRow[];
  baseline: number | null;
}
// Runeterra Reforged's Legend-supplied choices cannot be distinguished from ordinary choices.
// Conservatively withhold performance for that entire historical set. See docs/API.md policy sources.
const RESTRICTED_AUGMENT_SETS = new Set([9]);
export function preferenceAnalysis(games: Game[], kind: PreferenceKind): PreferenceAnalysis {
  const available =
    kind === 'augment' ? games.filter((g) => Array.isArray(g.player.augments)) : games;
  const groups = new Map<string, { id: string; set: number; games: Game[] }>();
  for (const g of available) {
    const ids =
      kind === 'augment'
        ? g.player.augments!
        : g.player.traits.filter((t) => t.tier_current > 0).map((t) => t.name);
    for (const id of new Set(ids)) {
      const key = `${g.set}:${id}`;
      const group = groups.get(key) || { id, set: g.set, games: [] };
      group.games.push(g);
      groups.set(key, group);
    }
  }
  const rows = [...groups.values()]
    .map(({ id, set, games: sample }) => {
      const stats = statistics(sample),
        restricted = kind === 'augment' && RESTRICTED_AUGMENT_SETS.has(set);
      return {
        id,
        set,
        count: sample.length,
        rate: sample.length / available.length,
        average: restricted ? null : stats.average,
        top4: restricted ? null : stats.top4,
        enough: sample.length >= MIN_PREFERENCE_SAMPLE,
        restricted,
      };
    })
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
  return {
    kind,
    total: games.length,
    available: available.length,
    missing: games.length - available.length,
    rows,
    top: rows.slice(0, 5),
    baseline: statistics(available).average,
  };
}
export interface PreferenceInsight {
  label: string;
  text: string;
}
/** Descriptive rules only: no claims about causality or offered-but-not-selected augments. */
export function preferenceInsights(
  result: PreferenceAnalysis,
  name: (id: string, set: number) => string,
): PreferenceInsight[] {
  const out: PreferenceInsight[] = [];
  const { rows, available, baseline, kind } = result;
  const noun = kind === 'augment' ? '증강체' : '특성';
  const most = rows[0];
  if (!most) return [{ label: '분석 대기', text: `기록된 ${noun} 정보가 없습니다.` }];
  out.push({
    label: `최다 사용 ${noun}`,
    text: `${name(most.id, most.set)} · ${most.count}회 (${Math.round(most.rate * 100)}%).${rows.filter((r) => r.count === most.count).length > 1 ? ' 같은 사용 횟수의 항목이 있습니다.' : ''}`,
  });
  const eligible = rows
    .filter((r) => r.enough && !r.restricted)
    .sort((a, b) => a.average! - b.average! || b.count - a.count || a.id.localeCompare(b.id));
  if (available >= 10 && eligible.length) {
    const best = eligible[0]!;
    out.push({
      label: '관측 성적이 좋은 항목',
      text: `${name(best.id, best.set)} · ${best.count}회 평균 ${best.average!.toFixed(2)}위. ${MIN_PREFERENCE_SAMPLE}회 이상 사용한 항목 중 가장 낮은 평균 등수${eligible.filter((r) => r.average === best.average).length > 1 ? '(동률 포함)' : ''}입니다.`,
    });
  } else
    out.push({
      label: '성과 비교',
      text: `표본 부족 또는 성과 통계 미제공: 확인된 경기 10개, 항목별 ${MIN_PREFERENCE_SAMPLE}회 이상이 필요합니다.`,
    });
  const weak = eligible.find(
    (r) =>
      r.count >= Math.max(5, Math.ceil(available * 0.15)) &&
      r.average! >= 4.5 &&
      r.average! >= baseline! + 0.5 &&
      r.top4! < 0.5,
  );
  if (available >= 10 && weak)
    out.push({
      label: '자주 쓰지만 성적이 낮은 항목',
      text: `${name(weak.id, weak.set)} · ${weak.count}회 평균 ${weak.average!.toFixed(2)}위, TOP4 ${Math.round(weak.top4! * 100)}%. 본인 전체 평균보다 0.5위 이상 낮은 성적입니다. 선택 자체가 원인이라는 뜻은 아닙니다.`,
    });
  if (kind === 'trait' && available >= 20 && most.count >= 10 && most.rate >= 0.6)
    out.push({
      label: '특성 사용 집중',
      text: `${name(most.id, most.set)}이 ${Math.round(most.rate * 100)}%의 경기에서 활성화됐습니다. 보조 특성이 반복된 경우도 있어 과도한 의존으로 단정하지 않습니다.`,
    });
  return out;
}
