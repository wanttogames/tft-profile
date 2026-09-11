<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerData } from '../types/riot';
import { playerScore } from '../analytics/game/playerScore';
import { playDna, dnaHelp } from '../analytics/game/playDna';
import { playerClass } from '../analytics/game/playerClass';
import { streaks } from '../analytics/game/streaks';
import { playerComparison } from '../analytics/game/playerComparison';
import { achievements } from '../analytics/game/achievements';
import { challenge } from '../analytics/game/challenges';
const props = defineProps<{ data: PlayerData }>();
const score = computed(() => playerScore(props.data.games)),
  dna = computed(() => playDna(props.data.games)),
  role = computed(() => playerClass(props.data.games)),
  streak = computed(() => streaks(props.data.games)),
  comparison = computed(() => playerComparison(props.data.games)),
  badges = computed(() => achievements(props.data.games)),
  boss = computed(() => challenge(props.data.games));
const labels = {
  stability: '안정성',
  peak: '폭발력',
  flexibility: '유연성',
  completion: '완성도',
  survival: '생존력',
  aggression: '공격성',
};
const format = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(2));
const pct = (n: number | null) => (n == null ? '—' : Math.round(n * 100) + '%');
</script>
<template>
  <div class="game-experience">
    <section class="panel game-hero">
      <div>
        <p class="eyebrow">PLAYER PROFILE / 나의 플레이 캐릭터</p>
        <h2>
          {{ data.account.gameName }} <span class="muted">#{{ data.account.tagLine }}</span>
        </h2>
        <p class="game-class">「{{ role.name }}」</p>
        <p>{{ role.reason }}</p>
        <p class="small muted">
          {{
            data.rank
              ? `${data.rank.tier ?? ''} ${data.rank.rank ?? ''} · ${data.rank.leaguePoints ?? '—'} LP`
              : 'UNRANKED'
          }}
          · 최근 50경기 범위 / {{ data.games.length }}경기
        </p>
      </div>
      <div class="game-score">
        <span>PLAYER SCORE</span><strong>{{ score ?? '—' }}</strong
        ><small>/ 1000 · 자체 지표</small>
        <p v-if="comparison">
          {{ comparison.scoreDelta >= 0 ? '▲' : '▼' }} {{ Math.abs(comparison.scoreDelta) }}
          <small>최근25 − 이전25 점수</small>
        </p>
        <p v-else class="small">25경기 간 점수 비교는 50경기 필요</p>
      </div>
      <div class="game-streak">
        <b>TOP4 STREAK ×{{ streak.currentTop4 }}</b
        ><b>WIN STREAK ×{{ streak.currentWins }}</b
        ><span>범위 내 최고 TOP4 ×{{ streak.bestTop4 }}</span>
      </div>
      <details class="method">
        <summary>점수와 클래스 기준</summary>
        <p>
          PLAYER SCORE = [(8−평균 등수)/7 × 60% + TOP4 비율 × 25% + 1등률 × 15%] × 1000. 5경기 이상
          필요합니다. 조합 다양성·레벨·장착 아이템에 점수 보너스를 주지 않습니다. Riot 실력 순위나
          백분위가 아닙니다.
        </p>
        <p>
          클래스는 DNA와 사용 집중도·성적을 함께 보는 자체 규칙입니다. 연속 기록은 현재 조회한 랭크
          경기 순서 기준이며 제외된 모드의 경기는 포함하지 않습니다.
        </p>
      </details>
    </section>
    <section class="panel">
      <div class="section-head">
        <h2>PLAY DNA</h2>
        <span class="pill">6개의 플레이 능력치 · 자체 분석</span>
      </div>
      <div class="dna-grid">
        <div v-for="(label, key) in labels" :key="key" class="dna-stat">
          <div>
            <span>{{ label }}</span
            ><strong>{{ dna[key].value ?? '—' }}</strong>
          </div>
          <progress :value="dna[key].value ?? 0" max="100" :aria-label="label"></progress
          ><small class="muted"
            >{{ dna[key].value === null ? '표본 부족 · ' : '' }}유효 표본
            {{ dna[key].count }}경기</small
          >
        </div>
      </div>
      <details class="method">
        <summary>능력치 계산 방법</summary>
        <p v-for="help in dnaHelp" :key="help">{{ help }}</p>
        <p>
          각 지표는 최소 5경기 필요. 미제공 값은 0으로 대체하지 않습니다. 공격성은 피해량·처치 각각
          유효한 표본으로 계산합니다.
        </p>
      </details>
    </section>
    <section class="panel">
      <div class="section-head">
        <h2>YOU VS PAST YOU</h2>
        <span class="pill">과거의 나와 비교</span>
      </div>
      <template v-if="comparison"
        ><div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>기록</th>
                <th>최근 25경기</th>
                <th>이전 25경기</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>평균 등수</td>
                <td>{{ format(comparison.recent.stats.average) }}</td>
                <td>{{ format(comparison.past.stats.average) }}</td>
              </tr>
              <tr>
                <td>TOP4</td>
                <td>{{ pct(comparison.recent.stats.top4) }}</td>
                <td>{{ pct(comparison.past.stats.top4) }}</td>
              </tr>
              <tr>
                <td>1등률</td>
                <td>{{ pct(comparison.recent.stats.win) }}</td>
                <td>{{ pct(comparison.past.stats.win) }}</td>
              </tr>
              <tr v-for="key in ['survival', 'completion'] as const" :key="key">
                <td>{{ labels[key] }}</td>
                <td>{{ comparison.recent.dna[key].value ?? '—' }}</td>
                <td>{{ comparison.past.dna[key].value ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="game-change">
          평균 등수 {{ format(Math.abs(comparison.improvement)) }}
          {{ comparison.improvement >= 0 ? '개선' : '하락' }} · TOP4
          {{ comparison.top4Change >= 0 ? '+' : '' }}{{ comparison.top4Change.toFixed(0) }}%p
        </p>
        <p>{{ comparison.comment }}</p></template
      >
      <p v-else class="empty-note">
        데이터 부족 · 최근 25경기와 이전 25경기를 비교하려면 50경기가 필요합니다.
      </p>
    </section>
    <section class="panel game-boss">
      <div>
        <span class="eyebrow">PERSONAL CHALLENGE</span>
        <h2>「{{ boss.name }}」</h2>
        <p>{{ boss.description }}</p>
        <p class="small muted">
          조회할 때마다 최근 10경기로 재계산합니다. 시작 시점이 있는 퀘스트나 주간 기록이 아닙니다.
        </p>
      </div>
      <div class="boss-meter">
        <strong>{{ boss.current }} / {{ boss.target }}</strong
        ><progress
          :value="boss.progress"
          :max="boss.target"
          aria-label="개인 도전 달성도"
        ></progress>
        <p>
          {{
            boss.available < 10
              ? `표본 수집 중 · ${boss.available}/10경기`
              : boss.complete
                ? '현재 기록으로 달성!'
                : '현재 기록에서 도전 중'
          }}
        </p>
      </div>
    </section>
    <section class="panel">
      <div class="section-head">
        <h2>ACHIEVEMENTS</h2>
        <span class="pill"
          >현재 범위에서 {{ badges.filter((b) => b.unlocked).length }} /
          {{ badges.length }} 달성</span
        >
      </div>
      <p class="small muted">
        최근 최대 50경기로 재계산합니다. 영구 수집·획득 날짜를 저장하지 않으며 기록 범위가 바뀌면
        달성 상태도 바뀝니다.
      </p>
      <div class="achievement-grid">
        <article
          v-for="badge in badges"
          :key="badge.id"
          class="achievement"
          :class="{ 'is-earned': badge.unlocked }"
          :data-rarity="badge.tier"
        >
          <span class="eyebrow">{{ badge.tier }}</span>
          <h3>{{ badge.name }}</h3>
          <p>{{ badge.description }}</p>
          <b>{{ badge.unlocked ? '달성' : !badge.ready ? '표본 부족' : '미달성' }}</b
          ><small v-if="badge.tier !== 'HIDDEN' || badge.unlocked">
            · {{ badge.progress }} / {{ badge.target }}</small
          >
        </article>
      </div>
    </section>
  </div>
</template>
