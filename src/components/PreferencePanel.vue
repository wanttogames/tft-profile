<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerData } from '../types/riot';
import { preferenceAnalysis, type PreferenceKind } from '../analytics/preferences';
import { displayName } from '../static-data/catalog';
const props = defineProps<{ data: PlayerData; kind: PreferenceKind }>();
const result = computed(() => preferenceAnalysis(props.data.games, props.kind));
const titles = {
  unit: '선호 챔피언 TOP 10',
  item: '선호 아이템 TOP 10',
  trait: '활성 특성 · 시너지 TOP 10',
};
const name = (id: string, set: number) =>
  displayName(props.data.assets, props.kind, id, props.kind === 'item' ? undefined : set);
</script>
<template>
  <section class="panel preference-panel">
    <div class="section-head">
      <h2>{{ titles[kind] }}</h2>
      <span class="pill">자체 분석</span>
    </div>
    <p class="small muted">
      최근 50경기 기준 · 분석 {{ result.total }}경기 · 해당 보드 기록 {{ result.available }}경기
    </p>
    <div v-if="result.top.length" class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>사용 경기 수</th>
            <th v-if="kind === 'item'">장착 개수</th>
            <th>사용 비율</th>
            <th>평균 등수</th>
            <th>TOP4 비율</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in result.top" :key="`${row.set}:${row.id}`">
            <td>
              <strong>{{ name(row.id, row.set) }}</strong
              ><small v-if="!row.enough" class="sample-label">표본 부족</small>
            </td>
            <td>{{ row.count }}회</td>
            <td v-if="kind === 'item'">{{ row.copies }}개</td>
            <td>{{ Math.round(row.rate * 100) }}%</td>
            <td>{{ row.average.toFixed(2) }}위</td>
            <td>{{ Math.round(row.top4 * 100) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty-note">분석할 기록이 없습니다.</p>
    <p class="small muted">
      한 경기의 동일 항목은 성적 집계에 1회만 반영합니다. 비율의 분모는 해당 보드 기록이 있는
      경기입니다. 아이템은 최종 보드 장착 기록이며 보유·조합 과정은 알 수 없습니다. 3회 미만의
      성적은 참고용 표본 부족입니다.
    </p>
  </section>
</template>
