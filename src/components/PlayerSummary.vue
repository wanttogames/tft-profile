<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PlayerData } from '../types/riot';
import { profileLink } from '../utils/profileLink';

const props = defineProps<{ data: PlayerData }>();
const copied = ref('');
const manualCopy = ref(false);
const url = computed(() =>
  profileLink(
    props.data.account.gameName || '플레이어',
    props.data.account.tagLine || 'KR1',
    !!props.data.demo,
  ),
);
const rank = computed(
  () => [props.data.rank?.tier, props.data.rank?.rank].filter(Boolean).join(' ') || '언랭크',
);
const fetchedAt = computed(() =>
  new Date(props.data.fetchedAt).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  }),
);

async function copyLink() {
  try {
    await navigator.clipboard.writeText(url.value);
    copied.value = '공유 링크를 복사했습니다.';
    manualCopy.value = false;
  } catch {
    copied.value = '아래 공유 링크를 직접 복사해 주세요.';
    manualCopy.value = true;
  }
}
</script>

<template>
  <header class="panel player-summary">
    <div class="summary-row">
      <div>
        <h1>
          {{ data.account.gameName || '플레이어' }}
          <span class="muted">#{{ data.account.tagLine || '—' }}</span>
        </h1>
        <p class="rank-line">
          <span>한국 서버{{ data.demo ? ' · 샘플 분석' : '' }}</span>
          <strong :data-tier="data.rank?.tier">{{ rank }}</strong>
          <span v-if="data.rank?.leaguePoints != null">{{ data.rank.leaguePoints }} LP</span>
          <span v-if="data.rank">랭크 {{ data.rank.wins }}승 {{ data.rank.losses }}패</span>
        </p>
      </div>
      <div class="summary-actions">
        <a href="/" class="back-home">← 콘텐츠 홈</a>
        <button class="secondary" type="button" @click="copyLink">전적 공유 링크 복사</button>
      </div>
    </div>
    <p class="small muted lookup-time">데이터 조회 {{ fetchedAt }} (한국 시간)</p>
    <p v-if="copied" class="small mint" role="status">{{ copied }}</p>
    <input
      v-if="manualCopy"
      class="share-url"
      :value="url"
      aria-label="전적 공유 링크"
      readonly
      @focus="($event.target as HTMLInputElement).select()"
    />
  </header>
</template>

<style scoped>
.player-summary {
  padding: 16px 20px;
  margin-bottom: 12px;
  overflow-wrap: anywhere;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
h1 {
  margin: 0 0 6px;
  font-size: clamp(20px, 3vw, 28px);
}
h1 span {
  font-size: 0.7em;
  font-weight: 500;
}
.rank-line,
.summary-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 14px;
}
.rank-line {
  margin: 0;
  font-size: 14px;
}
.rank-line strong,
.back-home {
  color: var(--mint);
}
.rank-line [data-tier='IRON'],
.rank-line [data-tier='SILVER'] {
  color: #d0dce9;
}
.rank-line [data-tier='BRONZE'] {
  color: #dcaa80;
}
.rank-line [data-tier='GOLD'],
.rank-line [data-tier='CHALLENGER'] {
  color: #f4d18a;
}
.rank-line [data-tier='DIAMOND'] {
  color: #b6ceff;
}
.rank-line [data-tier='MASTER'] {
  color: #d5a6ff;
}
.rank-line [data-tier='GRANDMASTER'] {
  color: #ffb4a7;
}
.summary-actions .secondary {
  min-height: 40px;
  padding: 6px 12px;
}
.back-home {
  font-size: 13px;
}
.lookup-time {
  margin: 7px 0 0;
}
.share-url {
  width: 100%;
}
</style>
