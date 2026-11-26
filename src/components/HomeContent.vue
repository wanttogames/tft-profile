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
      <nav><a href="/set19">시즌19 공략 →</a><a href="/set19/unlocks">시즌19 해금 도감 →</a><a href="/tools/reroll-calculator">리롤 확률 계산기 →</a><a href="/tools/item-calculator">아이템 조합 계산기 →</a><a href="/tools/economy-calculator">골드·레벨업 계산기 →</a><a href="/esports/lck/2027/stove-league">2027 LCK 스토브리그 →</a><a href="/esports/lck/2027/compare">LCK 로스터 비교</a><a href="/esports/lck/2027/timeline">LCK 이적 타임라인</a><a href="/esports/lck/2027/free-agents">LCK FA 선수</a><a href="/esports/lck/2027/contracts">LCK 계약 만료일</a><a href="/esports/lck/dream-team">LCK 드림팀 만들기</a><a href="/esports/lck/history">역대 LCK 로스터</a><a href="/esports/lck/history/results">LCK 역대 우승·순위</a><a href="/guide">지표 읽는 방법 →</a><a href="/about">서비스와 데이터 소개 →</a></nav>
    </div>
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
</style>
