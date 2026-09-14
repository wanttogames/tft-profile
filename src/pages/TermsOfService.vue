<script setup lang="ts">
import { CONTACT_EMAIL, EFFECTIVE_DATE, SERVICE_NAME } from '../config/legal';
</script>
<template>
  <article class="legal-document">
    <a href="/" class="legal-back">← 서비스로 돌아가기</a>
    <h1>이용약관</h1>
    <p class="muted">{{ SERVICE_NAME }} · 시행일: {{ EFFECTIVE_DATE }}</p>
    <section>
      <h2>서비스와 분석 정보</h2>
      <p>
        TFT Profile Analyzer는 Riot Games API의 완료된 TFT 경기 데이터를 이용해 전적, 개인 분석,
        메타 통계를 제공합니다. 회원가입·로그인·결제 기능은 없습니다.
      </p>
      <p>
        통계와 자체 분석은 참고용이며 게임 결과나 랭크 상승을 보장하지 않습니다. 수집 누락, 데이터
        지연, 패치 변경 등으로 실제 게임 상태와 다를 수 있으며 데이터의 정확성·최신성·항상 이용
        가능한 상태를 보장하지 않습니다.
      </p>
    </section>
    <section>
      <h2>이용 시 지켜야 할 사항</h2>
      <p>
        과도한 자동 요청, 운영에 지장을 주는 크롤링·스크래핑, API 공격, 보안 우회, 타인의 이용 방해
        및 권리 침해를 금지합니다. 현재 진행 중인 게임에서 실시간으로 의사결정을 지시하는 도구는
        제공하지 않습니다.
      </p>
    </section>
    <section>
      <h2>변경 및 중단</h2>
      <p>
        Riot API의 장애·정책 변경이나 Cloudflare·Supabase 등 외부 서비스 상태, 운영상 이유로 기능이
        변경되거나 중단될 수 있습니다. 주요 변경 및 약관 변경은 사이트 내에 안내합니다. 이 약관은
        법령상 제한할 수 없는 책임을 배제하지 않습니다.
      </p>
    </section>
    <section>
      <h2>Riot Games와의 관계 및 문의</h2>
      <p>
        본 서비스는 Riot Games와 제휴하거나 후원·승인받은 공식 서비스가 아닙니다. Riot 관련 상표와
        게임 자산은 Riot Games 또는 각 권리자에게 귀속됩니다. Riot API 사용이 제휴나 보증을 뜻하지
        않습니다.
      </p>
      <p>
        문의: <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a>
      </p>
    </section>
  </article>
</template>
