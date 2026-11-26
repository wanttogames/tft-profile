<script setup lang="ts">
import { SERVICE_NAME, RIOT_DISCLAIMER } from '../config/legal';
import { NAV_GROUPS,SERVICE_LINKS } from '../config/navigation';
</script>
<template>
  <footer class="site-footer">
    <div class="footer-heading"><a href="/" class="footer-brand">{{SERVICE_NAME}}</a><p>TFT 분석과 LoL e스포츠 기록을 한곳에서.</p></div>
    <nav class="footer-groups" aria-label="전체 콘텐츠">
      <section v-for="group in NAV_GROUPS" :key="group.id">
        <h2>{{group.label}}</h2>
        <a v-for="item in group.items" :key="item.href" :href="item.href">{{item.label}}</a>
      </section>
    </nav>
    <nav class="footer-services" aria-label="서비스 안내와 정책">
      <a v-for="item in SERVICE_LINKS" :key="item.href" :href="item.href">{{item.label}}</a>
    </nav>
    <div id="riot-disclaimer" class="disclaimer" tabindex="-1" aria-label="Riot Games 비제휴 고지">
      <p>TFT Profile Analyzer는 Riot Games와 제휴하거나 후원·승인받은 공식 서비스가 아닙니다. Riot API를 이용해 데이터를 제공하며, Riot 관련 상표와 게임 자산은 Riot Games 또는 각 권리자에게 귀속됩니다.</p>
      <p v-for="paragraph in RIOT_DISCLAIMER" :key="paragraph">{{ paragraph }}</p>
    </div>
  </footer>
</template>
<style scoped>
.site-footer{margin-top:40px;padding:28px 0 24px;border-top:1px solid var(--border);color:var(--muted)}
.footer-heading{margin-bottom:22px}.footer-brand{font-size:16px;font-weight:700;color:#e8edf5}.footer-heading p{font-size:12px;margin:6px 0 0}
.footer-groups{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:22px;padding-bottom:24px}
.footer-groups h2{font-size:13px;font-weight:700;color:#c9d4e2;margin:0 0 9px;letter-spacing:0}
.footer-groups a{display:block;font-size:12px;line-height:1.6;padding:5px 0;overflow-wrap:anywhere}
.footer-services{display:flex;flex-wrap:wrap;gap:8px 20px;padding:15px 0;border-top:1px solid var(--border);font-size:12px}
.footer-services a{padding:5px 0}.site-footer a:hover{color:var(--mint);text-decoration:underline}
.disclaimer{margin-top:6px;scroll-margin-top:100px}.site-footer .disclaimer p{max-width:none;margin:4px 0;font-size:11px;line-height:1.7;overflow-wrap:anywhere}
@media(max-width:760px){.footer-groups{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 12px}.footer-groups a{min-height:34px;display:flex;align-items:center}.footer-services{gap:8px 14px}}
</style>
