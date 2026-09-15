<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerData } from '../types/riot';
import { playerProfile, extremeComparison } from '../analytics/profileAnalysis';
import { displayName } from '../static-data/catalog';
const props = defineProps<{ data: PlayerData }>();
const p = computed(() => playerProfile(props.data.games));
const comparison = computed(() => extremeComparison(props.data.games));
const number = (v: number | null) => (v === null ? '—' : v.toFixed(2));
const name = (kind: 'unit' | 'trait', id: string, set: number) =>
  displayName(props.data.assets, kind, id, set);
</script>
<template>
  <div class="two-grid">
    <section class="panel">
      <div class="section-head">
        <h2>반복 사용과 후반 기록</h2>
        <span class="pill">최근 30경기 · 자체 분석</span>
      </div>
      <div v-for="kind in ['unit', 'trait'] as const" :key="kind">
        <h3>{{ kind === 'unit' ? '챔피언' : '활성 특성' }} 의존도 · 사용 집중도</h3>
        <p v-if="(kind === 'unit' ? p.units : p.traits).top[0]">
          {{
            name(
              kind,
              (kind === 'unit' ? p.units : p.traits).top[0]!.id,
              (kind === 'unit' ? p.units : p.traits).top[0]!.set,
            )
          }}
          · {{ Math.round((kind === 'unit' ? p.units : p.traits).top[0]!.rate * 100) }}%
          <span class="small muted"
            >({{ (kind === 'unit' ? p.units : p.traits).top[0]!.count }} /
            {{ (kind === 'unit' ? p.units : p.traits).available }}경기)</span
          >
        </p>
        <p v-else>분석 표본 부족</p>
      </div>
      <p class="small muted">
        빈도는 의존도의 대리 지표입니다. 보조 유닛·특성 반복만으로 과도한 의존이나 성적 저하를
        단정하지 않습니다.
      </p>
      <div class="card-stats">
        <div>
          평균 최종 레벨<strong>{{ number(p.level) }}</strong>
        </div>
        <div>
          평균 마지막 라운드<strong>{{ number(p.round) }}</strong>
        </div>
        <div>
          고레벨 종료 비율<strong>{{ Math.round(p.late * 100) }}%</strong
          ><small>최종 레벨 9 이상</small>
        </div>
      </div>
      <p class="small muted">
        최종 레벨과 마지막 라운드는 Riot Match 응답의 관측값이며, 라운드는 API 원본 번호 평균입니다.
      </p>
    </section>
    <section class="panel">
      <div class="section-head">
        <h2>고점·저점의 보드 차이</h2>
        <span class="pill">최근 30경기 · 자체 분석</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>관측 항목</th>
              <th>1~2위 {{ comparison.high.count }}경기</th>
              <th>7~8위 {{ comparison.low.count }}경기</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>평균 최종 레벨</td>
              <td>{{ number(comparison.high.level) }}</td>
              <td>{{ number(comparison.low.level) }}</td>
            </tr>
            <tr v-for="kind in ['units', 'traits'] as const" :key="kind">
              <td>{{ kind === 'units' ? '챔피언' : '활성 특성' }} TOP 3</td>
              <td v-for="side in ['high', 'low'] as const" :key="side">
                <p v-for="r in comparison[side][kind]" :key="r.id" class="small">
                  {{ name(kind === 'units' ? 'unit' : 'trait', r.id, r.set) }} · {{ r.count }}경기
                  ({{ Math.round(r.rate * 100) }}%)
                </p>
                <span v-if="!comparison[side][kind].length">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="small muted">
        {{
          comparison.enough
            ? `고점 평균 레벨 − 저점 평균 레벨: ${number(comparison.levelDelta)}. 관찰된 차이이며 원인을 뜻하지 않습니다.`
            : '분석 표본 부족 · 비교 해석은 각 집단 3경기 이상 필요합니다.'
        }}
      </p>
    </section>
  </div>
</template>
