<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import InformationPage from './pages/InformationPage.vue';
import RerollCalculator from './pages/RerollCalculator.vue';
import ItemCalculator from './pages/ItemCalculator.vue';
import EconomyCalculator from './pages/EconomyCalculator.vue';
import LckStove from './pages/LckStove.vue';
import LckChanges from './pages/LckChanges.vue';
import LckContracts from './pages/LckContracts.vue';
import LckDream from './pages/LckDream.vue';
import LckHistory from './pages/LckHistory.vue';
import LckResults from './pages/LckResults.vue';
import { isResultPath } from './data/lckResults';
import { historyRoute } from './data/lckHistory';
import { LCK_DREAM_PATH } from './data/lckDream';
import { LCK_FA_PATH, LCK_CONTRACTS_PATH } from './data/lckContracts';
import { LCK_COMPARE_PATH, LCK_TIMELINE_PATH } from './data/lckChanges';
import { LCK_STOVE_PATH, findTeam } from './data/lck2027';
import Set19Overview from './pages/Set19Overview.vue';
import Set19Unlocks from './pages/Set19Unlocks.vue';
import Set19UnlockDetail from './pages/Set19UnlockDetail.vue';
import HomeContent from './components/HomeContent.vue';
import HomeHub from './components/HomeHub.vue';
import { showHomeHub, initialSection } from './data/homeHub';
import MetaPreview from './components/MetaPreview.vue';
import { normalizePath, updatePageMetadata } from './seo/pages';
import { profileFromQuery, profileLink } from './utils/profileLink';
import MetaDashboard from './components/MetaDashboard.vue';
import SiteFooter from './components/SiteFooter.vue';
import SiteHeader from './components/SiteHeader.vue';
import PrivacyPolicy from './pages/PrivacyPolicy.vue';
import TermsOfService from './pages/TermsOfService.vue';
import { legalPage } from './config/legal';
const props = defineProps<{ routePath?: string; routeSearch?: string }>();
const path = normalizePath(
  props.routePath ?? (typeof window === 'undefined' ? '/' : window.location.pathname),
);
const query = props.routeSearch ?? (typeof window === 'undefined' ? '' : window.location.search);
const page = legalPage(path);
const isLckChanges = path === LCK_COMPARE_PATH || path === LCK_TIMELINE_PATH;
const isLckContracts = path === LCK_FA_PATH || path === LCK_CONTRACTS_PATH;
const isLckDream = path === LCK_DREAM_PATH;
const isLckHistory = historyRoute(path).valid;
const isLckResults = isResultPath(path);
const isLckPage = path === LCK_STOVE_PATH || !!findTeam(path) || isLckChanges || isLckContracts || isLckDream || isLckHistory || isLckResults;
const set19Slug = path.startsWith('/set19/unlocks/') ? path.slice('/set19/unlocks/'.length) : '';
const information = path === '/guide' ? 'guide' : path === '/about' ? 'about' : null;
const metaKind = path === '/champions' ? 'champion' : path === '/traits' ? 'trait' : 'item';
const section = ref<'profile' | 'meta'>(initialSection(path,query));
if (typeof document !== 'undefined') updatePageMetadata(path);
import { parseRiotId } from './utils/riotId';
import type { PlayerData } from './types/riot';
import { fetchPlayer, recentSearches, saveSearch } from './api/player';
import { demoPlayer } from './data/demo';
import { statistics, formAnalysis } from './analytics/formAnalysis';
import { playStyle } from './analytics/playStyle';
import { strengthWeakness } from './analytics/strengthWeakness';
import { deckDiversity } from './analytics/deckDiversity';
import { patterns } from './analytics/patterns';
import FormChart from './components/FormChart.vue';
import BoardInsights from './components/BoardInsights.vue';
import PlayerGameProfile from './components/PlayerGameProfile.vue';
import PlayerCard from './components/PlayerCard.vue';
import RecordHighlights from './components/RecordHighlights.vue';
import MatchList from './components/MatchList.vue';
import PreferencePanel from './components/PreferencePanel.vue';
import { displayName } from './static-data/catalog';
const name = ref(''),
  tag = ref('KR1'),
  busy = ref(false),
  error = ref(''),
  data = ref<PlayerData | null>(null),
  history = ref(recentSearches());
const profileMode=ref(path==='/profile');
const homeLanding=computed(()=>showHomeHub(path,profileMode.value,!!data.value,busy.value));
const riotInput=ref<HTMLInputElement|null>(null);
const resultAnchor=ref<HTMLElement|null>(null);
const embeddedTag=computed(()=>name.value.includes('#'));
function focusResult(){void nextTick(()=>resultAnchor.value?.focus());}
function closeDemo(){data.value=null;void nextTick(()=>riotInput.value?.focus());}
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
    ? '30경기 필요'
    : Math.abs(form.value.delta) < 0.005
      ? '변화 없음'
      : `${form.value.delta > 0 ? '▲' : '▼'} ${Math.abs(form.value.delta).toFixed(2)} ${form.value.delta > 0 ? '개선' : '하락'}`,
);
const tier = computed(() =>
  data.value?.rank ? `${data.value.rank.tier || ''} ${data.value.rank.rank || ''}` : 'UNRANKED',
);
async function search(n = name.value, t = tag.value, focus = true) {
  if (busy.value) return;
  try {
    const id = parseRiotId(n, t);
    n = id.gameName;
    t = id.tagLine;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Riot ID를 확인해 주세요.';
    return;
  }
  name.value = n;
  tag.value = t;
  busy.value = true;
  error.value = '';
  data.value = null;
  try {
    data.value = await fetchPlayer(n, t);
    const url = new URL(profileLink(n, t));
    window.history.replaceState(null, '', url.pathname + url.search);
    profileMode.value=true;
    updatePageMetadata('/profile');
    history.value = saveSearch({ gameName: n.trim(), tagLine: t.replace(/^#/, '').trim() });
  } catch (e) {
    error.value = e instanceof Error ? e.message : '조회 실패';
  } finally {
    busy.value = false;
    if(data.value&&focus)focusResult();
  }
}
function demo(focus=true) {
  error.value = '';
  data.value = demoPlayer();
  if(focus)focusResult();
}
onMounted(() => {
  if (path === '/profile') {
    try {
      const id = profileFromQuery(query);
      void search(id.gameName, id.tagLine, false);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '공유 링크를 확인해 주세요.';
    }
  } else if (path === '/' && new URLSearchParams(query).get('demo') === '1') demo(false);
});
const assetName = (id: string | null) =>
  id && data.value ? displayName(data.value.assets, 'trait', id, data.value.games[0]?.set) : '—';
const deckName = (key: string) =>
  key
    .substring(key.indexOf(':') + 1)
    .split('|')
    .map(assetName)
    .join(' + ');
</script>
<template>
  <div class="app-shell">
    <SiteHeader :path="path" :section="section" />
    <main>
      <PrivacyPolicy v-if="page === 'privacy'" />
      <TermsOfService v-else-if="page === 'terms'" />
      <InformationPage v-else-if="information" :kind="information" />
      <RerollCalculator v-else-if="path === '/tools/reroll-calculator'" />
      <ItemCalculator v-else-if="path === '/tools/item-calculator'" />
      <EconomyCalculator v-else-if="path === '/tools/economy-calculator'" />
      <LckResults v-else-if="isLckResults" :path="path" />
      <LckHistory v-else-if="isLckHistory" :path="path" />
      <LckDream v-else-if="isLckDream" :query="query" />
      <LckContracts v-else-if="isLckContracts" :path="path" />
      <LckChanges v-else-if="isLckChanges" :path="path" />
      <LckStove v-else-if="isLckPage" :path="path" />
      <Set19Overview v-else-if="path === '/set19'" />
      <Set19Unlocks v-else-if="path === '/set19/unlocks'" />
      <Set19UnlockDetail v-else-if="set19Slug" :slug="set19Slug" />
      <template v-else>
        <KeepAlive><MetaDashboard v-if="section === 'meta'" :initial-kind="metaKind" /></KeepAlive>
        <div v-if="section === 'profile'">
          <section class="search-area" :class="{'portal-search':path==='/'&&!profileMode&&!data}">
            <div>
              <template v-if="path==='/'&&!profileMode&&!data">
                <p class="eyebrow">TFT · TOOLS · LCK</p>
                <h1>게임을 분석하고,<br class="portal-break"/> e스포츠를 탐색하다<span>.</span></h1>
                <p class="muted">롤토체스 전적과 메타, 실전 계산기부터 LCK 로스터·이적 소식·역대 대회 기록까지 한곳에서.</p>
              </template>
              <template v-else>
                <p class="eyebrow">YOUR GAME. YOUR PATTERN.</p>
                <h1>나의 플레이를 읽다<span>.</span></h1>
                <p class="muted">최근 30경기로 읽는 나의 TFT 플레이 습관. 평균 등수와 TOP4, 선호 챔피언·아이템·특성을 살펴보고 플레이 스타일을 카드로 공유하세요.</p>
              </template>
            </div>
            <form class="search-form" @submit.prevent="search()">
              <div v-if="path==='/'&&!profileMode&&!data" class="portal-search-intro"><h2>내 TFT 전적 분석</h2><p>최근 최대 30경기 · Riot ID로 검색</p></div>
              <div class="search-fields">
                <label class="name-field"
                  ><span>Riot ID</span
                  ><input
                    ref="riotInput"
                    v-model="name"
                    placeholder="게임 이름 또는 게임이름#KR1"
                    required
                    maxlength="50"
                    autocomplete="off"
                    :disabled="busy" /></label
                ><label v-if="!embeddedTag" class="tag-field"
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
                  {{ busy ? '분석 중…' : '플레이 분석'
                  }}<span v-if="!busy" aria-hidden="true">↗</span>
                </button>
              </div>
              <p v-if="embeddedTag" class="embedded-tag-note">입력한 Riot ID의 # 뒤 태그를 사용합니다.</p>
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
              <div v-if="homeLanding" class="portal-search-actions"><button type="button" class="sample-link" @click="demo()">샘플 분석 보기 →</button><a href="/guide">분석 가이드</a><span>샘플은 가상 데이터</span></div>
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
          <section v-if="!data && !busy && !homeLanding" class="panel public-welcome">
            <div>
              <h2>어떤 분석인지 먼저 살펴보세요</h2>
              <p class="small muted">
                샘플은 UI 확인용 가상 데이터입니다. 실제 플레이어 전적이 아닙니다.
              </p>
            </div>
            <button class="secondary" @click="demo()">샘플 분석 둘러보기 →</button>
          </section>
          <template v-if="data">
            <div ref="resultAnchor" class="result-anchor" tabindex="-1" aria-label="플레이 분석 결과"><a v-if="profileMode" href="/" class="back-home">← 콘텐츠 홈</a><span class="result-caption">플레이 분석 결과</span></div>
            <div v-if="data.demo" class="notice demo">
              <span><b>샘플 분석</b> · 가상 경기 데이터입니다. 실제 플레이어 전적이 아닙니다.</span
              ><button @click="closeDemo">닫기 ×</button>
            </div>
            <div v-for="w in data.warnings" :key="w" class="notice">{{ w }}</div>
            <PlayerCard :data="data" />
            <RecordHighlights v-if="!busy && !error" :data="data" />
            <details class="panel">
              <summary>성장 기록 · 연속 기록 · 업적 더 보기</summary>
              <PlayerGameProfile :data="data" />
            </details>
            <section class="profile">
              <div class="profile-identity">
                <div class="rank-emblem">{{ data.rank?.tier?.slice(0, 1) || 'U' }}</div>
                <div>
                  <div class="eyebrow">
                    {{ data.demo ? 'DEMO PROFILE' : `SET ${data.games[0]?.set ?? '—'} · RANKED` }}
                  </div>
                  <h2>
                    {{ data.account.gameName
                    }}<span class="muted"> #{{ data.account.tagLine }}</span>
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
                <span class="pill">최근 30경기 기준 · {{ stats.count }}경기 분석</span>
                <p class="small muted">
                  {{ new Date(data.fetchedAt).toLocaleString('ko-KR') }} 기준
                </p>
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
                <p>이전 15경기 → 최근 15경기</p>
              </section>
            </div>
            <div class="analysis-note">
              <span>INSIGHT</span>
              <p>{{ insights.comment }}</p>
              <span class="small muted">자체 분석</span>
            </div>
            <div>
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
                    최근 15경기<strong>{{ decimal(form.recent) }}<small>위</small></strong>
                  </div>
                  <div>
                    이전 15경기<strong>{{ decimal(form.previous) }}<small>위</small></strong>
                  </div>
                </div>
                <p class="small muted">
                  5·15경기 미만은 확보된 경기 평균입니다. 폼 변화는 30경기부터 표시합니다.
                </p>
              </section>
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
                    리롤형: 3성 유닛이 있고 최종 레벨 ≤ 8. 그 외 최종 레벨 ≥ 9는 Fast 9형, 8은 Fast
                    8형, 나머지는 기타입니다. 레벨업 속도는 확인되지 않으므로 명칭은 보드 성향의
                    추정입니다. 연승·연패 운영과 경기 중 전환은 판정하지 않습니다.
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
                  최소 10경기 · 부분 집단 비교는 각 3경기 이상. 관찰된 관계이며 원인 분석은
                  아닙니다.
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
                    {{ diversity.valid }}경기에서<br /><b
                      >{{ diversity.unique }}개의 주요 특성 조합</b
                    >
                  </p>
                </div>
                <div
                  v-for="([key, count], i) in diversity.top.slice(0, 3)"
                  :key="key"
                  class="deck-row"
                >
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
                최종 보드에서 관측한 기록이며 운영 과정이나 실패 원인을 단정하지 않습니다.
              </p>
            </section>
            <BoardInsights :data="data" />
            <PreferencePanel :data="data" kind="unit" />
            <PreferencePanel :data="data" kind="item" />
            <PreferencePanel :data="data" kind="trait" />
            <MatchList :data="data" />
          </template>
          <template v-if="homeLanding">
            <HomeHub />
            <MetaPreview />
            <HomeContent />
          </template>
        </div>
      </template>
      <SiteFooter />
    </main>
  </div>
</template>

<style scoped>
.portal-search{margin:0 0 26px;padding:clamp(20px,3vw,34px);border:1px solid #344a51;border-radius:16px;background:radial-gradient(ellipse at 0 0,#203e3c 0,transparent 58%),linear-gradient(120deg,#172a35,#131c29 75%);gap:clamp(20px,3vw,36px);grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)}
.portal-search h1{font-size:clamp(25px,3vw,37px);line-height:1.35;letter-spacing:-.065em;margin:8px 0 12px}.portal-search .eyebrow{color:#9ddfc8;letter-spacing:.14em}.portal-search>div>p.muted{color:#b9c9d5;max-width:470px;line-height:1.8;margin-bottom:0}
.portal-search .search-form{min-width:0;padding:17px;border:1px solid #3a4b59;background:#101a27b8;border-radius:12px}.portal-search-intro h2{font-size:17px;margin:0 0 5px}.portal-search-intro p{color:#a5b5c7;font-size:12px;margin:0 0 13px}
.embedded-tag-note{font-size:11px;color:var(--muted);margin:6px 0 0}.result-anchor{scroll-margin-top:90px;display:flex;align-items:center;gap:15px;margin:0 0 12px;min-height:30px}.result-anchor:focus-visible{outline:2px solid var(--mint);outline-offset:4px}.back-home{color:var(--mint);font-size:13px}.result-caption{font-size:12px;color:var(--muted)}
.portal-search-actions{display:flex;align-items:center;flex-wrap:wrap;gap:6px 13px;font-size:12px;margin-top:8px}.portal-search-actions a,.sample-link{color:var(--mint);font-size:12px}.sample-link{border:0;padding:8px 0;background:transparent;font-weight:600}.portal-search-actions span{color:var(--muted);font-size:10px}.portal-search .primary{min-height:44px;min-width:108px;padding:0 12px}.portal-search .primary span{margin-left:6px}.portal-search .search-fields label{padding:6px 9px}.portal-search .tag-field{width:76px}.portal-search .recent{gap:6px}.search-form .recent button{max-width:100%;overflow-wrap:anywhere;text-align:left;min-height:30px}.search-form .recent{min-width:0}.search-fields .name-field{min-width:0}
@media(max-width:1000px){.portal-search{grid-template-columns:1fr;gap:18px}.portal-break{display:none}}
@media(max-width:540px){.search-form .search-fields{flex-wrap:wrap}.search-form .search-fields .primary{width:100%;min-height:44px;margin-top:8px}.search-form .search-fields input{font-size:16px}.portal-search{padding:17px;margin-bottom:20px}.portal-search h1{font-size:26px}.portal-search .search-form{padding:12px}.portal-search .search-fields{flex-wrap:wrap}.portal-search .primary{width:100%;margin-top:8px}.portal-search .name-field{flex:1;min-width:0}.portal-search .tag-field{width:78px}.portal-search .search-fields input{font-size:16px}}
</style>
