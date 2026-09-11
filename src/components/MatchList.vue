<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { displayName, lookupAsset } from '../static-data/catalog';
import { MATCH_PAGE_SIZE } from '../config/analysis';
import type { PlayerData, Unit } from '../types/riot';
import { matchFeedback } from '../analytics/game/matchFeedback';
import AssetBadge from './AssetBadge.vue';
const props = defineProps<{ data: PlayerData }>();
const feedback = computed(
  () => new Map(props.data.games.map((g) => [g.id, matchFeedback(g, props.data.games)])),
);
const visibleCount = ref(MATCH_PAGE_SIZE);
watch(
  () => props.data,
  () => {
    visibleCount.value = MATCH_PAGE_SIZE;
  },
);
const visibleGames = computed(() => props.data.games.slice(0, visibleCount.value));
const name = (kind: 'unit' | 'item' | 'trait', id: string, set?: number) =>
  displayName(props.data.assets, kind, id, set);
const items = (u: Unit) => (u.itemNames?.length ? u.itemNames : u.items.map(String));
const date = (n: number) =>
  new Date(n).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
</script>
<template>
  <section id="matches" class="panel">
    <div class="section-head">
      <h2>
        최근 50경기 전적 <span class="muted">{{ data.games.length }}</span>
      </h2>
      <span class="small muted">최신순 · 랭크</span>
    </div>
    <p v-if="!data.games.length" class="empty-note">조회 범위에 분석할 랭크 경기가 없습니다.</p>
    <details v-for="game in visibleGames" :key="game.id" class="match">
      <summary>
        <b class="placement" :class="{ positive: game.player.placement <= 4 }"
          >{{ game.player.placement }}<small>위</small></b
        >
        <div class="match-board">
          <div class="unit-preview">
            <AssetBadge
              v-for="u in game.player.units.slice(0, 4)"
              :key="u.character_id"
              :id="u.character_id"
              :asset="lookupAsset(data.assets, 'unit', u.character_id, game.set)"
              :stars="u.tier"
            />
          </div>
          <div class="small muted">
            {{
              game.player.traits
                .filter((t) => t.tier_current > 0)
                .slice(0, 3)
                .map((t) => name('trait', t.name, game.set))
                .join(' · ') || '활성 특성 없음'
            }}
          </div>
        </div>
        <div class="match-meta">
          <strong>Lv. {{ game.player.level }}</strong
          ><span>{{ Math.floor(game.player.time_eliminated / 60) }}분 플레이</span
          ><span>{{ date(game.date) }}</span>
        </div>
        <span class="expand" aria-hidden="true">＋</span>
      </summary>
      <div class="match-feedback">
        <span class="result-banner">{{
          game.player.placement === 1
            ? 'VICTORY'
            : game.player.placement <= 4
              ? 'TOP4'
              : '다음 도전을 향해'
        }}</span
        ><span v-for="tag in feedback.get(game.id)" :key="tag.label" :title="tag.reason">{{
          tag.label
        }}</span>
      </div>
      <div class="match-detail">
        <div class="small muted">
          {{ game.id }} · 마지막 라운드 {{ game.player.last_round }} (API 원본 번호) · 전체 경기
          {{ Math.floor(game.duration / 60) }}분
        </div>
        <div class="detail-units">
          <div v-for="(u, i) in game.player.units" :key="i">
            <AssetBadge
              :id="u.character_id"
              :asset="lookupAsset(data.assets, 'unit', u.character_id, game.set)"
              :stars="u.tier"
            />
            <div class="item-list">
              <span v-for="(item, index) in items(u)" :key="index">{{ name('item', item) }}</span
              ><span v-if="!items(u).length" class="muted">아이템 없음</span>
            </div>
          </div>
        </div>
        <p>
          <span
            v-for="t in game.player.traits.filter((t) => t.tier_current > 0)"
            :key="t.name"
            class="trait"
            >{{ name('trait', t.name, game.set) }} {{ t.num_units }} ·
            {{ t.tier_current }}단계</span
          >
        </p>
        <p class="small muted">
          플레이어 피해량 {{ game.player.total_damage_to_players ?? '—' }} · 플레이어 처치
          {{ game.player.players_eliminated ?? '—' }}
        </p>
      </div>
    </details>
    <div class="load-more">
      <p class="small muted">
        {{ Math.min(visibleCount, data.games.length) }} / {{ data.games.length }}경기 표시 · 모든
        분석은 전체 {{ data.games.length }}경기를 사용합니다.
      </p>
      <button
        v-if="visibleCount < data.games.length"
        class="secondary"
        @click="visibleCount += MATCH_PAGE_SIZE"
      >
        더 보기 · {{ Math.min(MATCH_PAGE_SIZE, data.games.length - visibleCount) }}경기
      </button>
    </div>
  </section>
</template>
