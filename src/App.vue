<script setup lang="ts">
import { computed, ref } from 'vue';
import type { PlayerData } from './types/riot';
import { fetchPlayer, recentSearches, saveSearch } from './api/player';
import { demoPlayer } from './data/demo';
import { statistics, formAnalysis } from './analytics/formAnalysis';
import { playStyle } from './analytics/playStyle';
import { strengthWeakness } from './analytics/strengthWeakness';
import { deckDiversity } from './analytics/deckDiversity';
import { patterns } from './analytics/patterns';
import FormChart from './components/FormChart.vue';
import PlayerCard from './components/PlayerCard.vue';
import MatchList from './components/MatchList.vue';
const name = ref(''),
  tag = ref('KR1'),
  busy = ref(false),
  error = ref(''),
  data = ref<PlayerData | null>(null),
  history = ref(recentSearches());
const stats = computed(() => statistics(data.value?.games || [])),
  form = computed(() => formAnalysis(data.value?.games || [])),
  styles = computed(() => playStyle(data.value?.games || [])),
  insights = computed(() => strengthWeakness(data.value?.games || [])),
  diversity = computed(() => deckDiversity(data.value?.games || []));
const high = computed(() =>
    patterns(data.value?.games.filter((g) => g.player.placement <= 2) || []),
  ),
  low = computed(() => patterns(data.value?.games.filter((g) => g.player.placement >= 7) || [])),
  miss = computed(() => patterns(data.value?.games.filter((g) => g.player.placement >= 5) || []));
const decimal = (v: number | null | undefined) => (v == null ? '—' : v.toFixed(2));
const percent = (v: number | null) => (v === null ? '—' : Math.round(v * 100) + '%');
const formLabel = computed(() =>
  form.value.delta === null
    ? '20경기 필요'
    : Math.abs(form.value.delta) < 0.005
      ? '변화 없음'
      : `${form.value.delta > 0 ? '▲' : '▼'} ${Math.abs(form.value.delta).toFixed(2)} ${form.value.delta > 0 ? '개선' : '하락'}`,
);
const tier = computed(() =>
  data.value?.rank ? `${data.value.rank.tier || ''} ${data.value.rank.rank || ''}` : 'UNRANKED',
);
async function search(n = name.value, t = tag.value) {
  if (busy.value) return;
  name.value = n;
  tag.value = t;
  if (!n.trim() || !t.trim()) {
    error.value = '게임 이름과 태그를 입력해 주세요.';
    return;
  }
  busy.value = true;
  error.value = '';
  data.value = null;
  try {
    data.value = await fetchPlayer(n, t);
    history.value = saveSearch({ gameName: n.trim(), tagLine: t.replace(/^#/, '').trim() });
  } catch (e) {
    error.value = e instanceof Error ? e.message : '조회 실패';
  } finally {
    busy.value = false;
  }
}
function demo() {
  error.value = '';
  data.value = demoPlayer();
}
const assetName = (id: string | null) => (id ? data.value?.assets[id]?.name || id : '—');
const deckName = (key: string) =>
  key
    .substring(key.indexOf(':') + 1)
    .split('|')
    .map(assetName)
    .join(' + ');
</script>
<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="TFT Profile 홈"
        ><span class="brand-mark">P</span>TFT<span>PROFILE</span></a
      ><span class="top-note">POST-GAME INTELLIGENCE</span
      ><span class="region">KR <span class="muted">한국 서버</span></span>
    </header>
    <main>
      <section class="search-area">
        <div>
          <p class="eyebrow">YOUR GAME. YOUR PATTERN.</p>
          <h1>나의 플레이를 읽다<span>.</span></h1>
          <p class="muted">최근 경기 속에 숨어 있는 당신의 TFT 플레이 습관.</p>
        </div>
        <form class="search-form" @submit.prevent="search()">
          <div class="search-fields">
            <label class="name-field"
              ><span>Riot ID</span
              ><input
                v-model="name"
                placeholder="게임 이름"
                required
                maxlength="50"
                autocomplete="off"
                :disabled="busy" /></label
            ><label class="tag-field"
              ><span>태그</span>
              <div>
                <b>#</b
                ><input
                  v-model="tag"
                  aria-label="태그"
                  placeholder="KR1"
                  required
                  maxlength="16"
                  autocomplete="off"
                  :disabled="busy"
                /></div></label
            ><button class="primary" :disabled="busy">
              {{ busy ? '분석 중…' : '플레이 분석' }}<span v-if="!busy" aria-hidden="true">↗</span>
            </button>
          </div>
          <div class="recent">
            <span>최근 검색</span
            ><button
              v-for="h in history"
              :key="h.gameName + h.tagLine"
              type="button"
              :disabled="busy"
              @click="search(h.gameName, h.tagLine)"
            >
              {{ h.gameName }} <span>#{{ h.tagLine }}</span></button
            ><span v-if="!history.length" class="muted">검색 기록이 없습니다</span>
          </div>
        </form>
      </section>
      <div v-if="error" class="notice error" role="alert">{{ error }}</div>
      <div v-if="busy" class="loading panel" role="status">
        <span class="spinner"></span>
        <h2>최근 경기를 읽고 있습니다</h2>
        <p class="muted">
          경기 기록을 모아 플레이 패턴을 계산합니다. 첫 조회는 조금 더 걸릴 수 있습니다.
        </p>
      </div>
      <section v-if="!data && !busy" class="welcome panel">
        <span class="eyebrow">PLAYER LAB / 01</span>
        <h2>메타보다 먼저,<br />나의 플레이를 이해하세요.</h2>
        <p class="muted">
          평균 등수부터 보드 성향까지.<br />완료된 랭크 경기로 나의 강점과 반복되는 패턴을
          확인합니다.
        </p>
        <button class="secondary" @click="demo">
          샘플 분석 둘러보기 <span aria-hidden="true">→</span>
        </button>
        <p class="small muted">샘플은 UI 확인용 가상 데이터입니다.</p>
      </section>
      <template v-if="data"
        ><div v-if="data.demo" class="notice demo">
          <span><b>샘플 분석</b> · 가상 경기 데이터입니다. 실제 플레이어 전적이 아닙니다.</span
          ><button @click="data = null">닫기 ×</button>
        </div>
        <div v-for="w in data.warnings" :key="w" class="notice">{{ w }}</div>
        <section class="profile">
          <div class="profile-identity">
            <div class="rank-emblem">{{ data.rank?.tier?.slice(0, 1) || 'U' }}</div>
            <div>
              <div class="eyebrow">
                {{ data.demo ? 'DEMO PROFILE' : `SET ${data.games[0]?.set ?? '—'} · RANKED` }}
              </div>
              <h2>
                {{ data.account.gameName }}<span class="muted"> #{{ data.account.tagLine }}</span>
              </h2>
              <p>
                <span class="tier">{{ tier }}</span>
                <span v-if="data.rank">· {{ data.rank.leaguePoints ?? '—' }} LP</span>
              </p>
              <small class="muted" v-if="data.rank"
                >시즌 랭크 W {{ data.rank.wins }} / L {{ data.rank.losses }}</small
              >
            </div>
          </div>
          <div class="profile-period">
            <span class="pill">최근 {{ stats.count }}경기</span>
            <p class="small muted">{{ new Date(data.fetchedAt).toLocaleString('ko-KR') }} 기준</p>
          </div>
        </section>
        <div class="stats-grid">
          <section class="stat">
            <span>평균 등수</span><strong>{{ decimal(stats.average) }}<small>위</small></strong>
            <p>최근 {{ stats.count }}경기</p>
          </section>
          <section class="stat">
            <span>TOP4 비율</span><strong class="mint">{{ percent(stats.top4) }}</strong>
            <p>4위 이내 진입</p>
          </section>
          <section class="stat">
            <span>1등 비율</span><strong>{{ percent(stats.win) }}</strong>
            <p>최종 1위 경기</p>
          </section>
          <section class="stat">
            <span>최근 폼 변화</span
            ><strong
              class="form-number"
              :class="{
                mint: form.delta !== null && form.delta > 0,
                peach: form.delta !== null && form.delta < 0,
              }"
              >{{ formLabel }}</strong
            >
            <p>이전 10경기 → 최근 10경기</p>
          </section>
        </div>
        <div class="analysis-note">
          <span>INSIGHT</span>
          <p>{{ insights.comment }}</p>
          <span class="small muted">자체 분석</span>
        </div>
        <div class="main-grid">
          <section class="panel form-panel">
            <div class="section-head">
              <div>
                <span class="eyebrow">RECENT PERFORMANCE</span>
                <h2>흐름이 보이는 전적</h2>
              </div>
              <span class="pill">1위가 위쪽</span>
            </div>
            <FormChart v-if="data.games.length" :games="data.games" />
            <p v-else class="empty-note">경기가 없습니다.</p>
            <div class="form-averages">
              <div>
                최근 5경기<strong>{{ decimal(form.five) }}<small>위</small></strong>
              </div>
              <div>
                최근 10경기<strong>{{ decimal(form.recent) }}<small>위</small></strong>
              </div>
              <div>
                이전 10경기<strong>{{ decimal(form.previous) }}<small>위</small></strong>
              </div>
            </div>
            <p class="small muted">
              5·10경기 미만은 확보된 경기 평균입니다. 폼 변화는 20경기부터 표시합니다.
            </p>
          </section>
          <PlayerCard :data="data" />
        </div>
        <div class="two-grid">
          <section class="panel">
            <div class="section-head">
              <h2>어떻게 플레이했을까?</h2>
              <span class="pill">휴리스틱</span>
            </div>
            <div v-if="styles.length" class="style-list">
              <div v-for="(style, i) in styles" :key="style.label">
                <div class="style-label">
                  <span><i class="style-dot" :class="'tone-' + i"></i>{{ style.label }}</span
                  ><b>{{ Math.round(style.percent) }}<small>%</small></b>
                </div>
                <div class="style-track">
                  <i :class="'tone-' + i" :style="{ width: style.percent + '%' }"></i>
                </div>
              </div>
            </div>
            <p v-else class="empty-note">5경기 이상 필요합니다.</p>
            <details class="method">
              <summary>어떤 기준으로 분류하나요?</summary>
              <p>
                리롤형: 3성 유닛이 있고 최종 레벨 ≤ 8. 그 외 최종 레벨 ≥ 9는 Fast 9형, 8은 Fast 8형,
                나머지는 기타입니다. 레벨업 속도는 확인되지 않으므로 명칭은 보드 성향의 추정입니다.
                연승·연패 운영과 경기 중 전환은 판정하지 않습니다.
              </p>
            </details>
          </section>
          <section class="panel">
            <div class="section-head">
              <h2>강점과 살펴볼 패턴</h2>
              <span class="pill">규칙 기반</span>
            </div>
            <h3 class="mint">강점</h3>
            <p v-for="s in insights.strengths" :key="s" class="insight-line">✓ {{ s }}</p>
            <p v-if="!insights.strengths.length" class="muted small">
              뚜렷한 강점 패턴을 확인할 표본이 부족합니다.
            </p>
            <h3 class="peach">살펴볼 점</h3>
            <p v-for="s in insights.weaknesses" :key="s" class="insight-line">↘ {{ s }}</p>
            <p v-if="!insights.weaknesses.length" class="muted small">
              현재 규칙으로 확인되는 약점 패턴이 없습니다.
            </p>
            <p class="small muted">
              최소 10경기 · 부분 집단 비교는 각 3경기 이상. 관찰된 관계이며 원인 분석은 아닙니다.
            </p>
          </section>
        </div>
        <div class="two-grid">
          <section class="panel">
            <div class="section-head">
              <h2>고점과 저점 사이</h2>
              <span class="pill">자체 분석</span>
            </div>
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>최종 보드</th>
                    <th class="mint">1–2위 · {{ high.count }}경기</th>
                    <th class="peach">7–8위 · {{ low.count }}경기</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>평균 레벨</td>
                    <td>{{ decimal(high.level) }}</td>
                    <td>{{ decimal(low.level) }}</td>
                  </tr>
                  <tr>
                    <td>평균 유닛 별 등급</td>
                    <td>{{ decimal(high.stars) }}</td>
                    <td>{{ decimal(low.stars) }}</td>
                  </tr>
                  <tr>
                    <td>평균 장착 아이템 수</td>
                    <td>{{ decimal(high.items) }}</td>
                    <td>{{ decimal(low.items) }}</td>
                  </tr>
                  <tr>
                    <td>최다 활성 특성</td>
                    <td>{{ assetName(high.trait) }}</td>
                    <td>{{ assetName(low.trait) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="small muted">
              소수 경기의 기술 통계입니다. 이 조건이 성적을 만든다고 단정하지 않습니다.
            </p>
          </section>
          <section class="panel">
            <div class="section-head">
              <h2>나의 덱 스펙트럼</h2>
              <span class="pill">자체 분석</span>
            </div>
            <div class="diversity">
              <strong>{{ diversity.score ?? '—' }}<small>/ 100</small></strong>
              <p>
                {{ diversity.valid }}경기에서<br /><b>{{ diversity.unique }}개의 주요 특성 조합</b>
              </p>
            </div>
            <div v-for="([key, count], i) in diversity.top.slice(0, 3)" :key="key" class="deck-row">
              <span class="muted">0{{ i + 1 }}</span
              ><span>{{ deckName(key) }}</span
              ><b>{{ count }}회</b>
            </div>
            <p class="small muted">
              활성 특성 중 유닛 수 상위 2개를 조합 서명으로 사용합니다. 실제 덱의 종류나 경기 내
              전환 능력과는 다릅니다.
            </p>
          </section>
        </div>
        <section class="panel miss-panel">
          <div>
            <span class="eyebrow">LOOK BACK, LEARN MORE</span>
            <h2>내가 순방을 놓치는 패턴</h2>
            <p class="muted small">5–8위 {{ miss.count }}경기의 최종 보드</p>
          </div>
          <div class="miss-values">
            <div>
              <span>평균 최종 레벨</span><strong>{{ decimal(miss.level) }}</strong>
            </div>
            <div>
              <span>평균 유닛 별 등급</span><strong>{{ decimal(miss.stars) }}</strong>
            </div>
            <div>
              <span>가장 잦은 활성 특성</span
              ><strong class="trait-name">{{ assetName(miss.trait) }}</strong>
            </div>
          </div>
          <p class="small muted">
            증강 선택과 캐리 의존도는 현재 확보한 데이터만으로 판정하지 않습니다.
          </p>
        </section>
        <MatchList :data="data" />
      </template>
      <footer>
        <span class="brand footer-brand">TFT PROFILE</span>
        <p>
          완료된 경기만 분석합니다. 모든 점수와 성향은 자체 계산한 기록 요약이며 Riot 공식 실력
          지표가 아닙니다.
        </p>
        <p>
          TFT PROFILE isn’t endorsed by Riot Games and doesn’t reflect the views or opinions of Riot
          Games or anyone officially involved in producing or managing Riot Games properties. Riot
          Games and all associated properties are trademarks or registered trademarks of Riot Games,
          Inc.
        </p>
      </footer>
    </main>
  </div>
</template>
