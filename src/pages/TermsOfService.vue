<script setup lang="ts">
import { CONTACT_EMAIL, EFFECTIVE_DATE, SERVICE_NAME } from '../config/legal';
</script>
<template>
  <article class="legal-document">
    <a href="/" class="legal-back">← 서비스로 돌아가기</a>
    <h1>이용약관</h1>
    <p class="muted">{{ SERVICE_NAME }} · 시행일: {{ EFFECTIVE_DATE }}</p>
    <section>
<<<<<<< HEAD
      <h2>1. 서비스 목적</h2>
      <p>
        TFT Profile Analyzer는 Teamfight Tactics 경기 데이터를 기반으로 개인 분석 및 메타 통계를
        제공합니다. 현재 회원가입, 로그인 및 결제 기능은 없습니다.
      </p>
    </section>
    <section>
      <h2>2. Riot Games와의 관계</h2>
      <p>
        본 서비스는 Riot Games가 직접 운영하거나 공식적으로 보증하는 서비스가 아닙니다. Riot Games
        관련 상표와 자산은 각 권리자에게 귀속됩니다.
      </p>
    </section>
    <section>
      <h2>3. 통계 및 분석 정보</h2>
      <p>
        평균 등수, TOP4%, 1위%, 아이템·챔피언·특성 통계 및 기타 분석 결과는 수집된 데이터와 자체
        계산 방식에 기반한 참고 정보입니다. 항상 최신 패치 상태, 전체 사용자 모집단 또는 정확한 게임
        내 성능을 반영한다고 보장하지 않습니다. 자체 점수와 플레이 성향은 Riot 공식 지표가 아닙니다.
      </p>
    </section>
    <section>
      <h2>4. API 및 외부 서비스 의존성</h2>
      <p>
        Riot API, Cloudflare, Supabase 등 외부 서비스의 상태나 요청 제한에 따라 조회 실패 또는
        일시적인 서비스 중단이 발생할 수 있습니다.
      </p>
    </section>
    <section>
      <h2>5. 금지 행위</h2>
      <ul>
        <li>서비스에 과도한 자동 요청을 보내는 행위</li>
        <li>서비스 또는 API를 공격하는 행위</li>
        <li>서비스 운영에 지장을 주거나 접근 제한을 무시하는 비정상적인 크롤링·스크래핑</li>
        <li>보안 기능 우회 및 타인의 서비스 이용 방해</li>
        <li>Riot Games 또는 제3자의 권리 침해</li>
      </ul>
    </section>
    <section>
      <h2>6. 경기 종료 후 분석</h2>
      <p>
        본 서비스는 경기 종료 후 데이터 분석과 메타 통계 제공을 목적으로 합니다. 현재 진행 중인
        게임에서 사용자의 행동에 따라 실시간으로 의사결정을 지시하는 도구를 제공하지 않습니다.
      </p>
    </section>
    <section>
      <h2>7. 서비스 변경 및 중단</h2>
      <p>
        기능은 개선 또는 운영상의 이유로 변경되거나 중단될 수 있습니다. 주요 변경은 가능한 범위에서
        사이트 내에 안내합니다.
      </p>
    </section>
    <section>
      <h2>8. 책임 제한</h2>
      <p>
        분석 결과는 참고용이며 게임 결과나 랭크 상승을 보장하지 않습니다. 외부 API 장애, 데이터
        지연, 패치 변경, 수집 누락 등에 의해 정보가 실제 게임 상태와 다를 수 있습니다. 본 조항은
        관련 법령에 따라 배제하거나 제한할 수 없는 책임까지 배제하는 취지가 아닙니다.
      </p>
    </section>
    <section>
      <h2>9. 약관 변경 및 문의</h2>
      <p>
        약관 변경 시 사이트 내에서 변경 내용과 시행일을 고지합니다. 서비스 관련 문의는
        <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a
        >으로 보내주세요.
=======
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
>>>>>>> 2e64e5d (privercy)
      </p>
    </section>
  </article>
</template>
