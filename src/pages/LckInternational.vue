<script setup lang="ts">
import { computed, ref } from 'vue';
import LckChangesNav from '../components/LckChangesNav.vue';
import { LCK_HISTORY_PATH } from '../data/lckHistory';
import {
  INTERNATIONAL_EVENTS,
  INTERNATIONAL_RESULTS,
  LCK_INTERNATIONAL_PATH,
  internationalPlaceLabel,
  internationalResultId,
  internationalRosterLink,
  internationalSource,
  type InternationalFilter,
} from '../data/lckInternational';

const event = ref<InternationalFilter>('all');
const filters = { all: '전체', ...INTERNATIONAL_EVENTS };
const results = computed(() =>
  INTERNATIONAL_RESULTS.filter(
    (record) => event.value === 'all' || record.event === event.value,
  ).map((record) => ({
    ...record,
    id: internationalResultId(record),
    roster: internationalRosterLink(record),
  })),
);
</script>

<template>
  <article class="international">
    <nav class="crumb small muted" aria-label="현재 위치">
      <a href="/">홈</a> / <a :href="LCK_HISTORY_PATH">e스포츠 역사</a> / 국제대회
    </nav>
    <header class="hero">
      <h1>LCK 국제대회 명예의 전당</h1>
      <p>
        First Stand, MSI, 월드 챔피언십(월즈)에서 우승하거나 준우승한 LCK 팀을 시즌별로 확인하세요.
      </p>
    </header>
    <LckChangesNav :path="LCK_INTERNATIONAL_PATH" />
    <section class="panel records" aria-label="국제대회 결승 성적">
      <div class="filters" role="group" aria-label="대회 필터">
        <button
          v-for="(label, key) in filters"
          :key="key"
          type="button"
          :aria-pressed="event === key"
          @click="event = key"
        >
          {{ label }}
        </button>
      </div>
      <p class="small muted" aria-live="polite">{{ results.length }}건 · 2015 LCK 출범 이후</p>
      <table>
        <thead>
          <tr>
            <th scope="col">시즌·대회</th>
            <th scope="col">팀</th>
            <th scope="col">성적</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in results" :id="record.id" :key="record.id">
            <td>
              <strong>{{ record.year }}</strong
              ><br />{{ INTERNATIONAL_EVENTS[record.event] }}
            </td>
            <td>
              <a
                v-if="record.roster"
                class="team-link"
                :href="record.roster"
                :aria-label="`${record.name} ${record.year} 시즌 로스터`"
                >{{ record.name }} ↗</a
              >
              <span v-else>{{ record.name }}</span>
              <br /><a
                class="small muted"
                :href="internationalSource(record)"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`${record.year} ${INTERNATIONAL_EVENTS[record.event]} 결과 출처`"
                >출처 ↗</a
              >
            </td>
            <td>
              <strong class="place" :class="{ champion: record.place === 1 }">{{
                internationalPlaceLabel(record.place)
              }}</strong>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="small muted note">
        팀명은 결승 당시 명칭입니다. 링크는 해당 시즌의 LCK 로스터 기록으로 연결됩니다.
      </p>
    </section>
  </article>
</template>

<style scoped>
.international {
  display: grid;
  gap: 16px;
  max-width: 1120px;
  min-width: 0;
  margin: auto;
}
.hero {
  padding: clamp(20px, 4vw, 36px);
  border: 1px solid var(--border);
  border-radius: 14px;
  background: #16212f;
}
.hero h1 {
  margin: 0 0 8px;
  font-size: clamp(23px, 4vw, 38px);
}
.hero p,
.note {
  margin-bottom: 0;
}
.records {
  min-width: 0;
  margin: 0;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.filters button {
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: #182536;
}
.filters button[aria-pressed='true'] {
  border-color: #548f81;
  background: #203931;
  color: var(--mint);
}
th,
td {
  text-align: left;
  overflow-wrap: anywhere;
}
.crumb a:hover,
td a:hover {
  text-decoration: underline;
}
.team-link {
  color: var(--mint);
  font-weight: 600;
}
.place {
  color: #ccd6e3;
  white-space: nowrap;
}
.place.champion {
  color: #ffd68a;
}
tr {
  scroll-margin-top: 90px;
}
tr:target {
  background: #22382f;
}
.note {
  margin-top: 14px;
}
</style>
