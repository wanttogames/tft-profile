<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { ProfileCardModel } from '../profile-card/model';
import { renderShareCard } from '../profile-card/renderShareCard';
const props = defineProps<{ model: ProfileCardModel }>();
const canvas = ref<HTMLCanvasElement>(),
  format = ref<'landscape' | 'portrait'>('landscape');
const error = ref(''),
  message = ref(''),
  readyFile = ref<File>(),
  canShare = ref(false),
  manualCopy = ref(false);
let generation = 0;
function draw() {
  const current = ++generation;
  readyFile.value = undefined;
  try {
    if (!canvas.value) return;
    renderShareCard(canvas.value, props.model, format.value);
    canvas.value.toBlob((blob) => {
      if (blob && current === generation)
        readyFile.value = new File([blob], 'tft-profile-card.png', { type: 'image/png' });
    }, 'image/png');
  } catch (e) {
    error.value = e instanceof Error ? e.message : '이미지를 만들지 못했습니다.';
  }
}
onMounted(async () => {
  canShare.value = typeof navigator.share === 'function';
  draw();
  await document.fonts.ready;
  draw();
});
watch([() => props.model, format], () => {
  error.value = '';
  message.value = '';
  draw();
});
function save() {
  if (!readyFile.value) return;
  const url = URL.createObjectURL(readyFile.value),
    a = document.createElement('a');
  a.href = url;
  a.download = 'tft-profile-card.png';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message.value = '이미지 저장을 요청했습니다.';
}
async function copy() {
  try {
    if (!navigator.clipboard) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(props.model.shareUrl);
    message.value = '프로필 링크를 복사했습니다.';
  } catch {
    manualCopy.value = true;
    message.value = '아래 주소를 선택해 복사해 주세요.';
  }
}
async function share() {
  try {
    const files = readyFile.value ? [readyFile.value] : [];
    if (files.length && navigator.canShare?.({ files }))
      await navigator.share({
        files,
        title: '나의 TFT 플레이 스타일',
        text: props.model.profile.name,
        url: props.model.shareUrl,
      });
    else
      await navigator.share({
        title: '나의 TFT 플레이 스타일',
        text: props.model.profile.name,
        url: props.model.shareUrl,
      });
  } catch (e) {
    if (!(e instanceof Error && e.name === 'AbortError')) {
      error.value = '공유를 열지 못했습니다. 이미지 저장 또는 링크 복사를 이용하세요.';
    }
  }
}
</script>
<template>
  <div class="share-layout">
    <div class="share-preview">
      <label
        >카드 비율
        <select v-model="format">
          <option value="landscape">SNS 가로형 · 1200 × 630</option>
          <option value="portrait">수집형 세로 · 900 × 1500</option>
        </select></label
      >
      <canvas
        ref="canvas"
        role="img"
        :aria-label="`${model.name} 공유 카드: ${model.profile.name}, ${model.stats.map((s) => s.label + ' ' + s.value).join(', ')}`"
      ></canvas>
    </div>
    <div class="share-caption">
      <span class="eyebrow">SHARE YOUR PLAY IDENTITY</span>
      <h3>나의 성향을 한 장으로.</h3>
      <p>
        카드에는 Riot ID와 현재 조회한 결과가 포함됩니다. 저장한 PNG를 커뮤니티나 SNS에 첨부하세요.
      </p>
      <div class="share-actions">
        <button class="primary" :disabled="!readyFile" @click="save">이미지 저장 ↓</button
        ><button class="secondary" @click="copy">링크 복사</button
        ><button v-if="canShare" class="secondary" :disabled="!readyFile" @click="share">
          공유하기
        </button>
      </div>
      <p class="small muted">
        링크를 열면 그 시점의 최근 기록을 다시 조회합니다. 이미지와 결과가 달라질 수 있습니다. 샘플
        링크는 가상 데이터를 보여줍니다.
      </p>
      <input
        v-if="manualCopy"
        aria-label="직접 복사할 프로필 링크"
        :value="model.shareUrl"
        readonly
        @focus="($event.target as HTMLInputElement).select()"
      />
      <p v-if="message" role="status">{{ message }}</p>
      <p v-if="error" role="alert">{{ error }}</p>
    </div>
  </div>
</template>
<style scoped>
.share-layout {
  padding: 24px 0 0;
  display: grid;
  gap: 22px;
}
.share-preview {
  min-width: 0;
}
.share-preview label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  margin-bottom: 18px;
}
.share-preview select {
  background: #172435;
  color: #d9e6f4;
  padding: 8px;
  border: 1px solid #3e4c60;
  border-radius: 6px;
}
.share-preview canvas {
  display: block;
  width: 100%;
  max-height: 750px;
  object-fit: contain;
  height: auto;
  box-shadow: 0 10px 35px #0004;
}
.share-caption h3 {
  font-size: 22px;
  margin: 10px 0;
}
.share-caption p {
  font-size: 13px;
  color: #b4c2d4;
}
.share-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 16px 0;
}
.share-caption input {
  width: 100%;
  padding: 10px;
  background: #1c2a3d;
  color: #d9e6f4;
  border: 1px solid #465971;
}
.share-actions button {
  min-height: 44px;
}
</style>
