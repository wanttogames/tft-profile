<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PlayerData } from '../types/riot';
import { scoreHelp } from '../analytics/playerScores';
import { profileCardModel, scoreLabels } from '../profile-card/model';
import RankFrame from './RankFrame.vue';
import HeroArtworkPanel from './HeroArtworkPanel.vue';
import RankBadge from './RankBadge.vue';
import AssetBadge from './AssetBadge.vue';
import ShareProfileCard from './ShareProfileCard.vue';
const props = defineProps<{ data: PlayerData }>();
const card = computed(() => profileCardModel(props.data));
const sharing = ref(false);
</script>
<template>
  <section
    class="profile-collection"
    :style="{
      '--card-accent': card.theme.accent,
      '--card-secondary': card.theme.secondary,
      '--style-color': card.art.color,
      '--style-secondary': card.art.secondary,
      '--style-backdrop': card.art.backdrop,
    }"
    aria-label="TFT 플레이어 프로필 카드"
  >
    <RankFrame class="collectible-card" :tier="card.theme.tier">
      <div class="card-topline">
        <span>TFT / PLAYER ARCHIVE</span><span>{{ card.edition }}</span>
      </div>
      <div class="collectible-body">
        <div class="card-identity">
          <h2>
            {{ card.name }}<small>{{ card.tag }}</small>
          </h2>
          <HeroArtworkPanel :model="card" />
          <RankBadge :rank="card.rank" :lp="card.lp" />
          <p class="card-title">「{{ card.profile.name }}」</p>
          <div class="style-tags" aria-label="보조 성향">
            <span v-for="tag in card.profile.tags" :key="tag">{{ tag }}</span
            ><span v-if="!card.profile.tags.length">성향 태그는 표본 확보 후 표시</span>
          </div>
          <p class="card-sample">{{ card.sample }}</p>
          <div class="collectible-stats">
            <div v-for="s in card.stats" :key="s.label">
              <span>{{ s.label }}</span
              ><strong>{{ s.value }}</strong>
            </div>
          </div>
        </div>
        <div class="card-abilities">
          <div class="dna-heading">
            <h3>PLAY DNA</h3>
            <span>자체 분석 · 0–100</span>
          </div>
          <div class="collectible-dna">
            <div
              v-for="(label, key) in scoreLabels"
              :key="key"
              class="ability"
              :title="scoreHelp[key]"
            >
              <div>
                <span>{{ label }}</span
                ><strong>{{ card.scores?.[key] ?? '—' }}</strong>
              </div>
              <progress :value="card.scores?.[key] ?? 0" max="100" :aria-label="label" />
            </div>
          </div>
          <p v-if="!card.scores" class="small muted">
            분석 표본 부족 · 점수는 5경기 이상 필요합니다.
          </p>
          <div class="signature-grid">
            <div>
              <h3 aria-label="선호 챔피언 TOP 3">선호 챔피언 <span>TOP 3</span></h3>
              <div class="signature-list">
                <div v-for="r in card.units" :key="r.id" class="signature">
                  <AssetBadge :id="r.id" :asset="r.asset" /><small
                    >{{ r.count }}경기{{ r.enough ? '' : ' · 표본 부족' }}</small
                  >
                </div>
                <p v-if="!card.units.length" class="small muted">기록 부족</p>
              </div>
            </div>
            <div>
              <h3 aria-label="선호 활성 특성 TOP 3">선호 활성 특성 <span>TOP 3</span></h3>
              <div class="signature-list">
                <div v-for="r in card.traits" :key="r.id" class="signature">
                  <AssetBadge :id="r.id" :asset="r.asset" /><small
                    >{{ r.count }}경기{{ r.enough ? '' : ' · 표본 부족' }}</small
                  >
                </div>
                <p v-if="!card.traits.length" class="small muted">기록 부족</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-flavor">
        <span>PLAY IDENTITY</span>
        <p>{{ card.profile.comment }}</p>
      </div>
      <div class="card-bottomline">
        <span>기록이 만드는 나만의 카드</span><span>TFT PROFILE ANALYZER</span>
      </div>
    </RankFrame>
    <div class="card-controls">
      <details class="method">
        <summary>점수·칭호 계산 기준</summary>
        <p v-for="help in scoreHelp" :key="help">{{ help }}</p>
        <p>{{ card.profile.reason }}</p>
        <p>
          칭호는 20경기 이상, 보드·활성 특성 기록 80% 이상에서 여러 지표를 조합해 결정합니다. Riot
          공식 실력·백분위가 아닙니다. 프레임은 현재 티어에 따라 달라지며 점수에는 영향을 주지
          않습니다.
        </p>
      </details>
      <button
        class="share-toggle"
        :aria-expanded="sharing"
        aria-controls="share-profile-card"
        @click="sharing = !sharing"
      >
        {{ sharing ? '공유 카드 닫기 ×' : '공유 카드 만들기 ↗' }}
      </button>
    </div>
    <div v-if="sharing" id="share-profile-card" class="share-panel">
      <ShareProfileCard :model="card" />
    </div>
  </section>
</template>
<style scoped>
.profile-collection {
  margin: 30px 0;
  min-width: 0;
}
.card-topline,
.card-bottomline {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  color: var(--card-accent);
  font-size: 11px;
  letter-spacing: 0.07em;
  font-weight: 700;
}
.card-topline {
  margin: 12px 8px 16px;
}
.card-bottomline {
  font-size: 9px;
  opacity: 0.7;
  margin: 22px 8px 0;
}
.collectible-body {
  display: block;
}
.card-identity h2 {
  font-size: clamp(27px, 5vw, 42px);
  line-height: 1.2;
  margin: 18px 8px 0;
  overflow-wrap: anywhere;
}
.card-identity h2 small {
  display: block;
  font-size: 18px;
  color: #afc1da;
  margin-top: 7px;
}
.card-title {
  text-align: center;
  font-size: clamp(22px, 4vw, 32px);
  margin: 12px 0;
  line-height: 1.4;
  color: #e9f5ff;
}
.style-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #c4d7ee;
}
.style-tags span {
  padding: 3px 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--card-accent) 35%, transparent);
}
.card-sample {
  text-align: center;
  font-size: 12px;
  color: #adc3dd;
  margin: 14px 0 20px;
}
.collectible-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 18px 0 24px;
}
.collectible-stats > div {
  min-width: 0;
  text-align: center;
  border: 1px solid color-mix(in srgb, var(--card-accent) 60%, transparent);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--card-secondary) 14%, #0a1422),
    #09111f
  );
  padding: 15px 4px;
  clip-path: polygon(
    9px 0,
    calc(100% - 9px) 0,
    100% 9px,
    100% calc(100% - 9px),
    calc(100% - 9px) 100%,
    9px 100%,
    0 calc(100% - 9px),
    0 9px
  );
}
.collectible-stats span {
  display: block;
  color: #bed0e4;
  font-size: 12px;
}
.collectible-stats strong {
  display: block;
  font-size: clamp(25px, 4vw, 37px);
  font-variant-numeric: tabular-nums;
  margin-top: 5px;
}
.card-abilities {
  padding-top: 18px;
  border-top: 1px solid var(--card-accent);
}
.dna-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
}
.dna-heading h3 {
  color: var(--card-accent);
  font-size: 15px;
  letter-spacing: 0.07em;
  margin: 0;
}
.dna-heading > span {
  font-size: 11px;
  color: #aabed5;
}
.collectible-dna {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px 26px;
}
.ability > div {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  align-items: center;
  font-size: 13px;
}
.ability strong {
  font-size: 23px;
  color: var(--card-accent);
  font-variant-numeric: tabular-nums;
}
.ability progress {
  width: 100%;
  height: 6px;
  display: block;
  margin-top: 6px;
  appearance: none;
  border: 0;
  border-radius: 3px;
  background: #2b4054;
  overflow: hidden;
}
.ability progress::-webkit-progress-bar {
  background: #2b4054;
}
.ability progress::-webkit-progress-value {
  background: linear-gradient(90deg, var(--card-secondary), var(--card-accent));
}
.ability progress::-moz-progress-bar {
  background: var(--card-accent);
}
.signature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  padding: 24px 0;
  margin-top: 24px;
  border-top: 1px solid color-mix(in srgb, var(--card-accent) 45%, transparent);
}
.signature-grid h3 {
  font-size: 13px;
  color: var(--card-accent);
  margin: 0 0 14px;
}
.signature-grid h3 span {
  font-size: 10px;
}
.signature-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.signature {
  min-width: 0;
}
.signature :deep(.asset) {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.signature :deep(img),
.signature :deep(.asset-letter) {
  width: 28px;
  height: 28px;
  border-radius: 4px;
}
.signature small {
  display: block;
  font-size: 10px;
  color: #8fa8c4;
  margin-top: 4px;
}
.card-flavor {
  padding: 16px 0;
  border-top: 1px solid color-mix(in srgb, var(--card-accent) 45%, transparent);
}
.card-flavor > span {
  color: var(--card-accent);
  font-size: 10px;
  letter-spacing: 0.12em;
}
.card-flavor p {
  font-size: 13px;
  color: #bfd0e5;
  line-height: 1.8;
  margin: 8px 0 0;
  overflow-wrap: anywhere;
}
.card-controls {
  max-width: 760px;
  margin: 18px auto;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}
.method {
  flex: 1;
  min-width: 220px;
}
.share-toggle {
  padding: 12px;
  border: 1px solid var(--card-accent);
  border-radius: 5px;
  background: #142136;
  color: var(--card-accent);
}
.share-panel {
  padding: 0 20px 24px;
  background: #101824;
  border: 1px solid #2c384d;
  border-radius: 12px;
}
@media (max-width: 520px) {
  .card-topline {
    font-size: 9px;
    margin: 7px 2px 14px;
    letter-spacing: 0;
  }
  .collectible-dna {
    gap: 13px 16px;
  }
  .ability > div {
    font-size: 11px;
  }
  .ability strong {
    font-size: 20px;
  }
  .signature-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .card-controls .method {
    flex-basis: 100%;
  }
  .collectible-stats {
    gap: 6px;
  }
  .collectible-stats span {
    font-size: 11px;
  }
  .dna-heading > span {
    font-size: 10px;
  }
  .share-panel {
    padding-inline: 10px;
  }
}
</style>
