<script setup lang="ts">
import { SERVICE_NAME, RIOT_DISCLAIMER } from '../config/legal';
</script>
<template>
  <footer class="site-footer">
    <div class="footer-links">
      <span>{{ SERVICE_NAME }}</span>
      <nav aria-label="서비스 안내와 정책">
        <a href="/">홈</a><a href="/meta">메타</a><a href="/guide">사용 가이드</a
        ><a href="/about">서비스 소개</a>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
        <a href="/#riot-disclaimer">Riot Games 비제휴 고지</a>
      </nav>
    </div>
    <div id="riot-disclaimer" class="disclaimer" tabindex="-1" aria-label="Riot Games 비제휴 고지">
      <p>
        TFT Profile Analyzer는 Riot Games와 제휴하거나 후원·승인받은 공식 서비스가 아닙니다. Riot
        API를 이용해 데이터를 제공하며, Riot 관련 상표와 게임 자산은 Riot Games 또는 각 권리자에게
        귀속됩니다.
      </p>
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
