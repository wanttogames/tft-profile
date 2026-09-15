<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { ProfileCardModel } from '../profile-card/model';
import { renderShareCard } from '../profile-card/renderShareCard';
const props = defineProps<{ model: ProfileCardModel }>();
const canvas = ref<HTMLCanvasElement>();
const error = ref('');
const saving = ref(false);
function draw() {
  try {
    if (canvas.value) renderShareCard(canvas.value, props.model);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '카드를 만들지 못했습니다.';
  }
}
onMounted(async () => {
  draw();
  await document.fonts.ready;
  draw();
});
watch(() => props.model, draw);
async function save() {
  saving.value = true;
  error.value = '';
  try {
    await document.fonts.ready;
    const target = canvas.value;
    if (!target) throw new Error('공유 카드를 다시 열어 주세요.');
    renderShareCard(target, props.model);
    const blob = await new Promise<Blob>((resolve, reject) =>
      target.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('이미지 저장에 실패했습니다.'))),
        'image/png',
      ),
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = 'tft-profile-card.png';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    error.value = e instanceof Error ? e.message : '이미지 저장에 실패했습니다.';
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <div class="share-layout">
    <canvas
      ref="canvas"
      role="img"
      :aria-label="`${model.name} 공유 카드: ${model.profile.name}, ${model.stats.map((s) => s.label + ' ' + s.value).join(', ')}`"
    ></canvas>
    <div class="share-caption">
      <span class="eyebrow">KEEP YOUR PLAY IDENTITY</span>
      <h3>지금의 나를<br />한 장으로.</h3>
      <p>
        티어와 플레이 DNA를 담은 900 × 1260 세로형 카드입니다. 저장한 이미지를 SNS나 카카오톡에
        공유하세요.
      </p>
      <button class="primary" :disabled="saving" @click="save">
        {{ saving ? '이미지 생성 중…' : 'PNG 이미지 저장 ↓' }}
      </button>
      <p class="small muted">
        현재 조회한 기록으로 만든 카드입니다. 계정이나 카드 수집 기록을 별도로 저장하지 않습니다.
      </p>
      <p v-if="error" role="alert">{{ error }}</p>
    </div>
  </div>
</template>
<style scoped>
.share-layout {
  display: grid;
  grid-template-columns: minmax(0, 380px) minmax(0, 1fr);
  gap: 36px;
  align-items: center;
  padding: 26px 0 4px;
}
.share-layout canvas {
  width: 100%;
  height: auto;
  box-shadow: 0 15px 40px #0005;
  border-radius: 12px;
}
.share-caption h3 {
  font-size: 30px;
  margin: 20px 0;
}
.share-caption p {
  color: #adbad0;
}
.share-caption .small {
  margin-top: 20px;
}
@media (max-width: 650px) {
  .share-layout {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .share-layout canvas {
    max-width: 380px;
    margin: auto;
  }
  .share-caption h3 {
    font-size: 24px;
  }
}
</style>
