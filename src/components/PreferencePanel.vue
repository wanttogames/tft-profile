<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerData } from '../types/riot';
import {
  preferenceAnalysis,
  preferenceInsights,
  type PreferenceKind,
} from '../analytics/preferences';
import { displayName } from '../static-data/catalog';
const props = defineProps<{ data: PlayerData; kind: PreferenceKind }>();
const result = computed(() => preferenceAnalysis(props.data.games, props.kind));
const name = (id: string, set: number) =>
  displayName(props.data.assets, props.kind, id, props.kind === 'trait' ? set : undefined);
const insights = computed(() => preferenceInsights(result.value, name));
const title = computed(() =>
  props.kind === 'augment' ? '선호 증강체 TOP 5' : '선호 특성 · 시너지 TOP 5',
);
</script>
<template>
  <section class="panel preference-panel">
    <div class="section-head">
      <div>
        <span class="eyebrow">50-GAME PREFERENCES</span>
        <h2>{{ title }}</h2>
      </div>
      <span class="pill">자체 분석</span>
    </div>
    <p class="small muted">
      최근 50경기 조회 범위 · 분석 {{ result.total }}경기 ·
      {{ kind === 'augment' ? '증강 기록 확인' : '특성 확인' }} {{ result.available }}경기<span
        v-if="result.missing"
      >
        · 실제 데이터 없음(API 필드 누락·null) {{ result.missing }}경기</span
      >
    </p>
    <p v-if="result.parseErrors" class="small">
      파싱 오류 {{ result.parseErrors }}경기 · 증강 관련 데이터 형식을 읽지 못해 증강 통계에서
      제외했습니다.
    </p>
    <p v-if="result.empty" class="small muted">선택 기록 없음(빈 배열) {{ result.empty }}경기</p>
    <div v-if="result.top.length" class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{{ kind === 'augment' ? '증강체' : '특성 / 시너지' }}</th>
            <th>사용</th>
            <th>{{ kind === 'augment' ? '선택' : '사용' }} 비율</th>
            <th>평균 등수</th>
            <th>TOP4</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in result.top" :key="`${row.set}:${row.id}`">
            <td>
              <strong>{{ name(row.id, row.set) }}</strong
              ><small v-if="row.restricted" class="sample-label">성과 미제공</small
              ><small v-else-if="!row.enough" class="sample-label">표본 부족</small>
            </td>
            <td>{{ row.count }}회</td>
            <td>{{ Math.round(row.rate * 100) }}%</td>
            <td>{{ row.enough && !row.restricted ? row.average?.toFixed(2) + '위' : '—' }}</td>
            <td>{{ row.enough && !row.restricted ? Math.round(row.top4! * 100) + '%' : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty-note">
      {{
        kind === 'augment'
          ? result.parseErrors
            ? '증강 데이터 파싱 오류가 있습니다. 실제 응답 확인이 필요합니다.'
            : 'API 응답에 증강 선택 기록이 없습니다. 게임에서 증강을 선택하지 않았다는 뜻은 아닙니다.'
          : '조회된 경기에서 활성화된 특성 기록이 없습니다.'
      }}
    </p>
    <div class="preference-insights">
      <div v-for="insight in insights" :key="insight.label">
        <h3>{{ insight.label }}</h3>
        <p>{{ insight.text }}</p>
      </div>
    </div>
    <details class="method">
      <summary>비율과 해석 기준</summary>
      <p>
        각 항목은 한 경기에서 최대 1회 사용으로 집계합니다.
        {{
          kind === 'augment'
            ? '선택 비율은 해당 증강체 사용 경기 수 ÷ 증강체 기록이 있는 경기 수입니다. 제시된 선택지 중 선택 확률은 알 수 없습니다.'
            : '사용 비율은 해당 특성이 활성화된 경기 수 ÷ 전체 분석 경기 수입니다. 비활성 특성은 제외합니다.'
        }}
        한 경기에 여러 항목이 있으므로 비율의 합은 100%를 넘을 수 있습니다.
      </p>
      <p>
        항목별 3회 미만은 표본 부족입니다. 성과 해석은 확인된 경기 10개 이상에서만 표시합니다. TOP
        5는 사용 횟수순이며 성과 비교는 전체 항목을 대상으로 합니다. 모든 결과는 관찰된 관계이며
        메타 추천이나 승리 원인을 뜻하지 않습니다.
      </p>
      <p v-if="result.rows.some((r) => r.restricted)">
        전설 기반 증강체를 구분할 수 없는 과거 세트는 Riot 정책에 따라 증강 성과 통계를 표시하지
        않습니다.
      </p>
    </details>
  </section>
</template>
