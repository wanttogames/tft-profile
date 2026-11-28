import type { MetaData } from '../types/meta';

export const READINESS_PATH = '/set19/readiness';
export const TARGET_SET = 19;
export type ReadinessData = {
  summary: MetaData['summary'];
  collection: { count: number; unknownVersion: number; latest: string | null } | null;
  catalog: {
    source: string;
    version: string;
    fetchedAt: string;
    champions: number;
    icons: number;
    costs: number;
  } | null;
};
export function readinessStatus({ summary: s, collection }: ReadinessData) {
  if (
    s.scope_ready &&
    s.aggregate_set_number === TARGET_SET &&
    !s.preview_set_number &&
    s.match_count > 0
  ) {
    if (s.patch_source === 'match') return '경기 버전으로 확인된 집계';
    if (s.patch_source === 'official')
      return s.boundary_basis === 'verified'
        ? '검증된 적용 기준 집계'
        : s.boundary_basis === 'schedule-estimate'
          ? '공식 일정 기반 추정 집계'
          : '최초 관측 기반 추정 집계';
  }
  if (s.preview_set_number === TARGET_SET) return '패치 전환 대기 · 참고 집계';
  if (collection?.count) return '시즌19 경기 수집 중 · 집계 확인 대기';
  if (collection) return '시즌19 수집 표본 없음';
  return '시즌19 수집 상태 조회 불가';
}
export function hasTargetPatch(patch?: string | null) {
  return patch?.split('.')[0] === String(TARGET_SET);
}
