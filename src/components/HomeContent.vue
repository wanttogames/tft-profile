<script setup lang="ts">
import { NAV_GROUPS,SERVICE_LINKS } from "../config/navigation";
</script>
<template>
  <section class="home-content" aria-label="분석 기능과 사용 방법">
    <div>
      <h2>숫자를 읽고, 습관을 발견하세요</h2>
      <p>
        평균 등수는 전체 성적을, TOP4는 순방 빈도를, 1위율은 고점의 빈도를 보여줍니다. 최근 폼과
        선호 챔피언·아이템·활성 특성을 함께 보면 반복되는 선택을 확인할 수 있습니다.
      </p>
      <p>
        덱 다양성과 플레이 스타일은 최종 보드의 분포로 계산한 자체 지표입니다. 높은 점수 하나가
        실력을 증명하지 않으며, 경기 수가 부족하면 분석을 유보합니다.
      </p>
    </div>
    <div>
      <h2>세 단계로 보는 나의 플레이</h2>
      <ol>
        <li><b>Riot ID 입력</b> — 이름과 실제 태그를 입력합니다.</li>
        <li><b>최근 경기 분석</b> — 최근 최대 30경기에서 랭크·세트 조건에 맞는 기록을 모읍니다.</li>
        <li><b>패턴 확인과 공유</b> — 성향과 표본을 읽고 카드로 저장합니다.</li>
      </ol>
      <nav class="help-links" aria-label="서비스 안내"><a v-for="item in SERVICE_LINKS.slice(0,2)" :key="item.href" :href="item.href">{{item.label}} →</a></nav>
    </div>
    <nav class="content-links" aria-label="콘텐츠 바로가기"><section v-for="group in NAV_GROUPS" :key="group.id"><h3>{{group.label}}</h3><a v-for="item in group.items" :key="item.href" :href="item.href">{{item.label}}</a></section></nav>
  </section>
</template>
<style scoped>
.home-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  padding: 25px 0;
  border-top: 1px solid var(--border);
  margin-top: 26px;
}
.home-content p,
.home-content li {
  font-size: 13px;
  line-height: 1.85;
  color: #aebbcd;
}
.home-content ol {
  padding-left: 20px;
}
.home-content li {
  margin-bottom: 10px;
}
.home-content nav {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--mint);
}
@media (max-width: 650px) {
  .home-content {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
.home-content .content-links{grid-column:1/-1;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;padding-top:12px;border-top:1px solid var(--border)}
.content-links section{min-width:0}.content-links h3{margin:6px 0 10px;color:#d2deec;font-size:13px}.content-links a{display:block;padding:5px 0;font-size:12px;line-height:1.5}.content-links a:hover{text-decoration:underline}
@media(max-width:760px){.home-content .content-links{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>
