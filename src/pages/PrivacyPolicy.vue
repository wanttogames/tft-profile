<script setup lang="ts">
import { CONTACT_EMAIL, EFFECTIVE_DATE, SERVICE_NAME } from '../config/legal';
</script>
<template>
  <article class="legal-document">
    <a href="/" class="legal-back">← 서비스로 돌아가기</a>
    <h1>개인정보처리방침</h1>
    <p class="muted">{{ SERVICE_NAME }} · 시행일: {{ EFFECTIVE_DATE }}</p>
    <p>
      현재 회원가입·로그인·결제 기능은 없습니다. 업데이트: 2026-09-18 (공유 링크·캐시·AdSense 처리
      안내)
    </p>
    <section>
      <h2>처리하는 정보와 목적</h2>
      <p>
        입력한 Riot ID와 Riot API에서 받은 PUUID, TFT 경기 결과·순위·챔피언·아이템·특성·레벨 등을
        개인 전적 분석과 메타 통계 제공에 사용합니다. 운영 중 IP 주소, 요청 시각, 오류 기록 같은
        접속 로그와 기술정보가 인프라 제공자를 통해 처리될 수 있습니다.
      </p>
    </section>
    <section>
      <h2>저장과 삭제</h2>
      <p>
        최근 검색 Riot ID 최대 5개를 브라우저 로컬스토리지에 저장합니다. 브라우저의 사이트 데이터
        삭제 기능으로 지울 수 있습니다. 반복 조회를 줄이기 위해 브라우저·Cloudflare 캐시와 Supabase
        임시 경기 캐시를 사용합니다. 프로필 결과는 2분, 임시 경기 데이터는 7일 유효하며 만료
        데이터는 조회에 재사용하지 않습니다.
      </p>
      <p>
        메타 통계용 경기·플레이어 데이터와 PUUID는 Supabase에 저장합니다. 현재 자동 삭제 기한은
        없으며 통계 생성과 중복 수집 방지에 사용합니다. PUUID가 포함되므로 원본 데이터를 익명
        데이터라고 간주하지 않습니다. 삭제 요청은 아래 이메일로 접수하며 대상과 본인 여부를 확인한
        뒤 처리 범위와 결과를 안내합니다. Riot Games가 보유한 원본 데이터 삭제는 별도입니다.
      </p>
    </section>
    <section>
      <h2>프로필 공유</h2>
      <p>
        공유 이미지와 링크에는 Riot ID가 포함됩니다. 사용자가 공유한 링크를 열면 해당 Riot ID의 최근
        경기 데이터를 다시 조회합니다. 링크는 PUUID나 서버 비밀키를 포함하지 않습니다.
      </p>
    </section>
    <section>
      <h2>외부 서비스와 쿠키</h2>
      <p>
        Riot Games API로 전적을 조회하고, Cloudflare로 사이트와 API를 운영하며, Supabase에 메타
        데이터를 저장합니다. GitHub Actions로 데이터를 정기 수집합니다. 외부 서비스의 정보 처리에는
        각 사업자의 정책이 적용될 수 있습니다.
      </p>
      <p>
        Riot Data Dragon·CommunityDragon 이미지와 Google Fonts 글꼴 요청 시 해당 제공자에게 IP 주소
        등 요청 정보가 전달될 수 있습니다. 자체 로그인 쿠키와 별도 방문 분석 도구는 사용하지
        않습니다. Google AdSense 사이트 확인용 스크립트를 사용하며 Google이 접속 정보 및 쿠키 등을
        처리할 수 있습니다. 자세한 내용은
        <a href="https://policies.google.com/technologies/partner-sites" rel="noopener"
          >Google의 파트너 사이트 데이터 이용 안내</a
        >를 확인하세요. 서버 비밀키는 브라우저에 공개하지 않습니다.
      </p>
    </section>
    <section>
      <h2>문의와 변경 안내</h2>
      <p>
        데이터 삭제 및 개인정보 문의: <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a
        >. 관련 Riot ID와 요청 내용을 보내주시고 비밀번호나 API Key는 보내지 마세요. 방침이 변경되면
        이 페이지에서 내용과 시행일을 안내합니다.
      </p>
    </section>
  </article>
</template>
