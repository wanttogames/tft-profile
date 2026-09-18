<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PlayerData } from '../types/riot';
import { scoreHelp } from '../analytics/playerScores';
import { profileCardModel, scoreLabels } from '../profile-card/model';
import PlayStyleArt from './PlayStyleArt.vue';
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
    <article class="collectible-card" :data-tier="card.theme.tier">
      <div class="card-topline">
        <span>TFT / PLAYER ARCHIVE</span><span>{{ card.edition }}</span>
      </div>
      <div class="collectible-body">
        <div class="card-identity">
          <div class="identity-heading">
            <span class="card-kicker">TFT PLAYER PROFILE</span
            ><span class="card-rank-chip">{{ card.rank }}</span>
          </div>
          <h2>
            {{ card.name }}<small>{{ card.tag }}</small>
          </h2>
          <p class="card-title">「{{ card.profile.name }}」</p>
          <div class="style-tags" aria-label="보조 성향">
            <span v-for="tag in card.profile.tags" :key="tag">{{ tag }}</span
            ><span v-if="!card.profile.tags.length">성향 태그는 표본 확보 후 표시</span>
          </div>
          <div class="style-art-frame" :data-style="card.profile.key">
            <PlayStyleArt :art="card.art" /><span class="style-art-caption">{{
              card.art.illustrationTheme
            }}</span>
          </div>
          <p class="style-flavor">{{ card.art.shortFlavorText }}</p>
          <p class="style-rank">{{ card.rank }} · {{ card.lp }} LP</p>
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
    </article>
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
  margin: 24px 0 32px;
  --card-accent: #b6ceff;
  --card-secondary: #9b88e6;
  min-width: 0;
}
.collectible-card {
  position: relative;
  isolation: isolate;
  border: 1px solid var(--card-accent);
  border-radius: 22px;
  padding: 22px 28px 16px;
  background:
    radial-gradient(
      ellipse at 10% 0%,
      color-mix(in srgb, var(--card-secondary) 20%, transparent),
      transparent 58%
    ),
    linear-gradient(135deg, #192335, #101722 65%, #1d2635);
  box-shadow:
    0 18px 55px #0005,
    inset 0 0 0 5px #101620,
    inset 0 0 0 6px color-mix(in srgb, var(--card-accent) 32%, transparent);
  overflow: hidden;
}
.collectible-card:before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background: linear-gradient(
    115deg,
    transparent 30%,
    #ffffff06 31%,
    transparent 45%,
    #ffffff04 67%,
    transparent 68%
  );
}
.card-topline,
.card-bottomline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--card-accent);
  font-size: 10px;
  letter-spacing: 0.16em;
  font-weight: 700;
}
.card-topline {
  padding-bottom: 20px;
  border-bottom: 1px solid #ffffff13;
}
.card-bottomline {
  padding-top: 16px;
  opacity: 0.75;
  font-size: 9px;
}
.collectible-body {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.15fr);
  gap: 36px;
  padding: 26px 0;
}
.card-identity {
  min-width: 0;
}
.identity-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.card-kicker {
  font-size: 10px;
  letter-spacing: 0.14em;
  color: #acbad1;
}
.card-rank-chip {
  border: 1px solid color-mix(in srgb, var(--card-accent) 50%, transparent);
  background: #ffffff05;
  color: var(--card-accent);
  padding: 5px 9px;
  border-radius: 5px;
  font-size: 10px;
  letter-spacing: 0.08em;
}
.card-identity h2 {
  font-size: clamp(24px, 3vw, 36px);
  margin: 14px 0 0;
  letter-spacing: -0.035em;
  overflow-wrap: anywhere;
  line-height: 1.3;
}
.card-identity h2 small {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #a0b1c8;
  margin-top: 6px;
  letter-spacing: 0;
}
.card-title {
  text-align: center;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.4;
  margin: 10px 0;
}
.card-sample {
  text-align: center;
  font-size: 11px;
  color: #a6b5ca;
  margin: 0 0 20px;
}
.collectible-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 16px 0;
  border-top: 1px solid #ffffff17;
  border-bottom: 1px solid #ffffff17;
}
.collectible-stats > div {
  text-align: center;
  border-right: 1px solid #ffffff17;
}
.collectible-stats > div:last-child {
  border: 0;
}
.collectible-stats span {
  display: block;
  font-size: 11px;
  color: #b1bfd1;
}
.collectible-stats strong {
  font-size: 29px;
  display: block;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
}
.card-abilities {
  border-left: 1px solid #ffffff17;
  padding-left: 34px;
  min-width: 0;
}
.dna-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 8px;
}
.dna-heading h3 {
  margin: 0;
  color: var(--card-accent);
  font-size: 15px;
  letter-spacing: 0.1em;
}
.dna-heading > span {
  font-size: 10px;
  color: #9baec7;
}
.collectible-dna {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 19px 28px;
}
.ability > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}
.ability strong {
  color: var(--card-accent);
  font-size: 22px;
  font-variant-numeric: tabular-nums;
}
.ability progress {
  width: 100%;
  height: 4px;
  border: 0;
  display: block;
  appearance: none;
  margin-top: 7px;
  background: #344154;
  border-radius: 0;
}
.ability progress::-webkit-progress-bar {
  background: #344154;
}
.ability progress::-webkit-progress-value {
  background: linear-gradient(90deg, var(--card-secondary), var(--card-accent));
}
.ability progress::-moz-progress-bar {
  background: var(--card-accent);
}
.signature-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 26px;
  padding-top: 20px;
  border-top: 1px solid #ffffff17;
}
.signature-grid h3 {
  font-size: 11px;
  margin: 0 0 14px;
}
.signature-grid h3 span {
  color: var(--card-accent);
  font-size: 9px;
  margin-left: 4px;
}
.signature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.signature {
  min-width: 0;
}
.signature :deep(.asset) {
  font-size: 12px;
  display: flex;
  min-width: 0;
  gap: 8px;
}
.signature :deep(.asset img),
.signature :deep(.asset-letter) {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: 1px solid #ffffff24;
  border-radius: 5px;
}
.signature :deep(.asset > span:last-child) {
  overflow-wrap: anywhere;
}
.signature > small {
  display: block;
  font-size: 9px;
  color: #a2b2c9;
  margin: 2px 0 0 36px;
}
.card-flavor {
  border-top: 1px solid color-mix(in srgb, var(--card-accent) 25%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--card-accent) 25%, transparent);
  padding: 17px 4px;
  display: flex;
  gap: 24px;
  align-items: center;
}
.card-flavor > span {
  font-size: 9px;
  color: var(--card-accent);
  white-space: nowrap;
  letter-spacing: 0.1em;
}
.card-flavor p {
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
  color: #d3dcea;
}
.card-controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-top: 14px;
}
.card-controls .method {
  flex: 1;
  margin: 0;
}
.share-toggle {
  border: 1px solid #ffffff25;
  border-radius: 8px;
  background: #1c2635;
  padding: 11px 16px;
  font-size: 12px;
  flex-shrink: 0;
}
.share-toggle:hover {
  border-color: var(--card-accent);
  color: var(--card-accent);
}
.share-panel {
  padding: 0 28px 24px;
  background: #101824;
  border: 1px solid #2c384d;
  border-radius: 16px;
  margin-top: 16px;
}
@media (max-width: 760px) {
  .collectible-body {
    grid-template-columns: 1fr;
    gap: 26px;
  }
  .card-abilities {
    border-left: 0;
    border-top: 1px solid #ffffff17;
    padding: 24px 0 0;
  }
  .collectible-card {
    max-width: 560px;
    margin: auto;
    padding: 20px 22px 16px;
  }
  .card-controls {
    max-width: 560px;
    margin: 14px auto 0;
    flex-wrap: wrap;
  }
  .card-controls .method {
    flex-basis: 100%;
  }
  .card-identity h2 {
    font-size: 30px;
  }
  .card-flavor {
    display: block;
  }
  .card-flavor > span {
    display: block;
    margin-bottom: 7px;
  }
  .card-topline {
    font-size: 9px;
  }
  .share-panel {
    padding: 0 18px 20px;
  }
}
@media (max-width: 380px) {
  .collectible-card {
    padding: 18px;
  }
  .collectible-dna {
    gap: 16px;
  }
  .signature-grid {
    gap: 12px;
  }
  .card-rank-chip {
    font-size: 9px;
  }
  .card-bottomline {
    letter-spacing: 0.04em;
    font-size: 8px;
  }
  .card-title {
    font-size: 18px;
  }
}

.style-art-frame {
  position: relative;
  height: 205px;
  margin-top: 18px;
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--style-color) 35%, transparent);
  background: var(--style-backdrop);
}
.style-art-caption {
  position: absolute;
  bottom: 9px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--style-color);
  text-shadow: 0 1px 8px #000;
  background: #101722a8;
  padding: 4px;
}
.style-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}
.style-tags span {
  font-size: 10px;
  border: 1px solid color-mix(in srgb, var(--style-color) 25%, transparent);
  background: #ffffff05;
  border-radius: 20px;
  padding: 4px 9px;
  color: var(--style-color);
}
.card-title {
  font-size: clamp(22px, 2.5vw, 29px);
  margin: 24px 0 12px;
  color: var(--style-color);
}
.style-flavor {
  text-align: center;
  font-size: 11px;
  color: #b9c8db;
  margin: 11px 0;
}
.style-rank {
  text-align: center;
  font-size: 12px;
  color: var(--card-accent);
  margin: 13px 0 6px;
  letter-spacing: 0.06em;
}
.card-abilities .dna-heading h3,
.ability strong {
  color: var(--style-color);
}
.ability progress::-webkit-progress-value {
  background: linear-gradient(90deg, var(--style-secondary), var(--style-color));
}
.ability progress::-moz-progress-bar {
  background: var(--style-color);
}
.collectible-card {
  background:
    radial-gradient(
      ellipse at 12% 5%,
      color-mix(in srgb, var(--style-color) 14%, transparent),
      transparent 65%
    ),
    linear-gradient(135deg, var(--style-backdrop), #101722 65%, #1d2635);
}
@media (max-width: 380px) {
  .style-art-frame {
    height: 160px;
  }
  .card-title {
    font-size: 21px;
  }
}
</style>
