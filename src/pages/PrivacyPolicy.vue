<script setup lang="ts">
import { CONTACT_EMAIL, EFFECTIVE_DATE, SERVICE_NAME } from '../config/legal';
</script>
<template>
  <article class="legal-document">
    <a href="/" class="legal-back">← 서비스로 돌아가기</a>
    <h1>개인정보처리방침</h1>
    <p class="muted">{{ SERVICE_NAME }} · 시행일: {{ EFFECTIVE_DATE }}</p>
<<<<<<< HEAD
    <p>
      본 방침은 TFT 개인 분석 및 메타 통계를 제공하는 과정에서 처리하는 정보를 설명합니다. 현재
      회원가입, 로그인 및 결제 기능은 없습니다.
    </p>
    <section>
      <h2>1. 수집 또는 처리하는 정보</h2>
      <p>
        사용자가 입력한 Riot ID, Riot API에서 조회한 PUUID 및 TFT 경기 데이터를 처리합니다. 경기
        데이터에는 경기 기록과 결과, 챔피언, 아이템, 특성, 순위, 레벨 및 분석에 사용하는 기타 TFT
        경기 정보가 포함됩니다.
      </p>
      <p>
        Cloudflare 등 인프라 제공자를 통해 IP 주소를 포함한 일반적인 접속 로그와 요청 정보가 처리될
        수 있습니다.
      </p>
    </section>
    <section>
      <h2>2. 이용 목적</h2>
      <ul>
        <li>TFT 개인 전적 분석 및 평균 등수·TOP4·1위율 계산</li>
        <li>챔피언·아이템·특성 통계와 TFT 메타 통계 생성 및 제공</li>
        <li>서비스 안정성 확보 및 오류 분석</li>
      </ul>
    </section>
    <section>
      <h2>3. 데이터 저장</h2>
      <p>
        개인 분석을 위해 조회한 Riot API 데이터는 서비스 제공에 필요한 범위에서 처리하며, 반복
        요청을 줄이기 위해 브라우저와 서버 메모리에 일시적으로 캐시합니다.
      </p>
      <p>
        최근 검색한 Riot ID는 사용자 브라우저의 로컬 스토리지에 최대 5개 저장됩니다. 브라우저에서
        해당 사이트의 저장 데이터를 지우면 삭제할 수 있습니다.
      </p>
      <p>
        메타 통계를 위해 수집한 경기 데이터와 참가자 식별자(PUUID), 수집 대상 플레이어 정보는
        Supabase PostgreSQL에 저장될 수 있습니다. 이는 통계 생성과 중복 수집 방지를 위한 것으로,
        특정 개인의 신원을 식별하기 위한 목적으로 사용하지 않습니다. PUUID가 포함된 원본 데이터가
        익명 정보라는 의미는 아닙니다.
      </p>
      <p>
        현재 메타 원본 데이터에는 자동 삭제 기한이 설정되어 있지 않습니다. 데이터 삭제 요청은 아래
        연락처로 접수할 수 있습니다.
      </p>
    </section>
    <section>
      <h2>4. API Key 및 비밀정보</h2>
      <p>
        Riot API Key와 Supabase Secret Key 등은 서버 측 Cloudflare Pages Functions의 비밀 설정 및
        GitHub Actions Secrets 등에서 관리하며, 브라우저 클라이언트 코드에 노출하지 않습니다.
      </p>
    </section>
    <section>
      <h2>5. 제3자 서비스</h2>
      <p>
        Riot Games API(경기 데이터 조회), Cloudflare(호스팅·API 요청 처리), Supabase(메타 데이터
        저장), GitHub Actions(정기 데이터 수집)를 사용합니다. 각 사업자의 데이터 처리에는 해당
        사업자의 정책이 적용될 수 있습니다.
      </p>
      <p>
        게임 이름·이미지 표시를 위해 Riot Data Dragon 및 CommunityDragon의 정적 데이터를 사용하며,
        글꼴은 Google Fonts에서 불러옵니다. 브라우저가 외부 이미지나 글꼴을 요청하면 해당 제공자에게
        IP 주소 등 요청 정보가 전달될 수 있습니다.
      </p>
    </section>
    <section>
      <h2>6. 쿠키 및 분석 도구</h2>
      <p>
        현재 자체 회원가입·로그인용 쿠키를 사용하지 않으며, 자체 방문 분석 도구나 광고 플랫폼을
        도입하지 않았습니다. 최근 검색 기록에는 쿠키가 아닌 로컬 스토리지를 사용합니다. 인프라
        제공자의 보안·요청 처리 과정에는 해당 사업자의 정책이 적용될 수 있습니다.
      </p>
    </section>
    <section>
      <h2>7. 데이터 삭제 요청 및 문의</h2>
      <p>
        본인 데이터의 삭제 또는 개인정보 처리에 관한 문의는
        <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a
        >으로 보내주세요. 관련 Riot ID와 요청 내용을 알려주시면 대상 정보와 본인 여부를 확인한 뒤
        처리 범위 및 결과를 안내합니다. 비밀번호나 API Key를 보내지 마세요.
      </p>
      <p>서비스에 대한 삭제 요청은 Riot Games가 보유한 원본 데이터의 삭제 요청과 별개입니다.</p>
    </section>
    <section>
      <h2>8. 방침 변경</h2>
      <p>개인정보처리방침이 변경되면 이 페이지를 통해 변경 내용과 시행일을 고지합니다.</p>
=======
    <p>현재 회원가입·로그인·결제 기능은 없습니다.</p>
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
        삭제 기능으로 지울 수 있습니다. 반복 조회를 줄이기 위해 조회 결과를 브라우저와 서버 메모리에
        일시 캐시하며, 유효기간이 지난 캐시는 조회에 재사용하지 않습니다.
      </p>
      <p>
        메타 통계용 경기·플레이어 데이터와 PUUID는 Supabase에 저장합니다. 현재 자동 삭제 기한은
        없으며 통계 생성과 중복 수집 방지에 사용합니다. PUUID가 포함되므로 원본 데이터를 익명
        데이터라고 간주하지 않습니다. 삭제 요청은 아래 이메일로 접수하며 대상과 본인 여부를 확인한
        뒤 처리 범위와 결과를 안내합니다. Riot Games가 보유한 원본 데이터 삭제는 별도입니다.
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
        등 요청 정보가 전달될 수 있습니다. 자체 로그인 쿠키, 방문 분석 도구, 광고 플랫폼은 사용하지
        않습니다. 서버 비밀키는 브라우저에 공개하지 않습니다.
      </p>
    </section>
    <section>
      <h2>문의와 변경 안내</h2>
      <p>
        데이터 삭제 및 개인정보 문의: <a :href="`mailto:${CONTACT_EMAIL}`">{{ CONTACT_EMAIL }}</a
        >. 관련 Riot ID와 요청 내용을 보내주시고 비밀번호나 API Key는 보내지 마세요. 방침이 변경되면
        이 페이지에서 내용과 시행일을 안내합니다.
      </p>
>>>>>>> 2e64e5d (privercy)
    </section>
  </article>
</template>
