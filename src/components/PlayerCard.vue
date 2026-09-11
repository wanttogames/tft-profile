<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerData } from '../types/riot';
import { playerScores, scoreHelp } from '../analytics/playerScores';
import { playerProfile } from '../analytics/profileAnalysis';
import { displayName } from '../static-data/catalog';
const props = defineProps<{ data: PlayerData }>();
const scores = computed(() => playerScores(props.data.games));
const profile = computed(() => playerProfile(props.data.games));
const names = {
  ceiling: '고점력',
  stability: '안정성',
  flexibility: '유연성',
  diversity: '덱 다양성',
  survival: '순방력',
  form: '최근 폼',
};
const pct = (v: number | null) => (v === null ? '—' : Math.round(v * 100) + '%');
const name = (kind: 'trait' | 'unit', id: string, set: number) =>
  displayName(props.data.assets, kind, id, set);
</script>
<template>
  <section class="panel player-card">
    <div class="section-head">
      <span class="eyebrow">TFT PLAYER PROFILE</span><span class="pill">자체 분석</span>
    </div>
    <h2>
      {{ data.account.gameName }}<span class="muted"> #{{ data.account.tagLine }}</span>
    </h2>
    <p class="tier">
      {{
        data.rank
          ? `${data.rank.tier ?? ''} ${data.rank.rank ?? ''} · ${data.rank.leaguePoints ?? '—'} LP`
          : 'UNRANKED'
      }}
    </p>
    <p class="small muted">최근 50경기 기준 · 실제 {{ profile.stats.count }}경기</p>
    <div class="card-stats">
      <div>
        평균 등수<strong>{{ profile.stats.average?.toFixed(2) ?? '—' }}</strong>
      </div>
      <div>
        TOP4<strong>{{ pct(profile.stats.top4) }}</strong>
      </div>
      <div>
        1등률<strong>{{ pct(profile.stats.win) }}</strong>
      </div>
    </div>
    <h3 class="profile-style">{{ profile.name }}</h3>
    <div v-if="scores" class="score-list">
      <div v-for="(label, key) in names" :key="key" class="score-row" :title="scoreHelp[key]">
        <span>{{ label }}</span>
        <div class="score-track"><i :style="{ width: (scores[key] ?? 0) + '%' }"></i></div>
        <strong>{{ scores[key] ?? '—' }}</strong>
      </div>
    </div>
    <p v-else class="empty-note">분석 표본 부족 · 점수는 5경기 이상 필요합니다.</p>
    <h3>선호 특성 TOP 3</h3>
    <p v-for="r in profile.traits.top.slice(0, 3)" :key="r.id" class="small">
      {{ name('trait', r.id, r.set) }} · {{ r.count }}경기 <span v-if="!r.enough">(표본 부족)</span>
    </p>
    <p v-if="!profile.traits.top.length" class="small muted">기록 부족</p>
    <h3>핵심 유닛 TOP 3</h3>
    <p v-for="r in profile.core" :key="r.id" class="small">
      {{ name('unit', r.id, r.set) }} · {{ r.count }}경기 <span v-if="!r.enough">(표본 부족)</span>
    </p>
    <p v-if="!profile.core.length" class="small muted">기록 부족</p>
    <p class="small muted">
      핵심 유닛은 아이템 2개 이상을 장착한 유닛의 사용 빈도입니다. 실제 캐리를 확정하지 않습니다.
    </p>
    <p class="profile-comment">{{ profile.comment }}</p>
    <details class="method">
      <summary>점수·성향 계산 기준</summary>
      <p v-for="help in scoreHelp" :key="help">{{ help }}</p>
      <p>{{ profile.reason }}</p>
      <p>
        성향은 20경기 이상, 보드·특성 기록 80% 이상 필요. 조건이 겹치면
        집중형→고점형→순방형→유연형→공격형→후반형→저점형 순으로 표시합니다. 명칭은 관측 결과의
        휴리스틱이며 Riot 공식 실력·백분위가 아닙니다.
      </p>
    </details>
  </section>
</template>
