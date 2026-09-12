<script setup lang="ts">
import { SERVICE_NAME, RIOT_DISCLAIMER } from '../config/legal';
</script>
<template>
  <footer class="site-footer">
    <div class="footer-links">
      <span>{{ SERVICE_NAME }}</span>
      <nav aria-label="서비스 정책">
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
        <a href="#riot-disclaimer">Riot Games 비제휴 고지</a>
      </nav>
    </div>
    <div id="riot-disclaimer" class="disclaimer" tabindex="-1" aria-label="Riot Games 비제휴 고지">
      <p v-for="paragraph in RIOT_DISCLAIMER" :key="paragraph">{{ paragraph }}</p>
    </div>
  </footer>
</template>
<style scoped>
.site-footer {
  margin-top: 40px;
  padding: 24px 0;
  border-top: 1px solid var(--border);
  color: var(--muted);
}
.footer-links,
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
}
.footer-links {
  justify-content: space-between;
  font-size: 12px;
}
nav a {
  padding: 6px 0;
}
nav a:hover {
  color: var(--mint);
  text-decoration: underline;
}
.disclaimer {
  margin-top: 14px;
  scroll-margin-top: 140px;
}
.site-footer .disclaimer p {
  max-width: none;
  margin: 4px 0;
  font-size: 11px;
  line-height: 1.7;
}
</style>
