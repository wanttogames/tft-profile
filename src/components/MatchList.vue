<script setup lang="ts">
import type { PlayerData, Unit } from '../types/riot';
import AssetBadge from './AssetBadge.vue';
defineProps<{ data: PlayerData }>();
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
        최근 전적 <span class="muted">{{ data.games.length }}</span>
      </h2>
      <span class="small muted">최신순 · 랭크</span>
    </div>
    <p v-if="!data.games.length" class="empty-note">조회 범위에 분석할 랭크 경기가 없습니다.</p>
    <details v-for="game in data.games" :key="game.id" class="match">
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
              :asset="data.assets[u.character_id]"
              :stars="u.tier"
            />
          </div>
          <div class="small muted">
            {{
              game.player.traits
                .filter((t) => t.tier_current > 0)
                .slice(0, 3)
                .map((t) => data.assets[t.name]?.name || t.name)
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
      <div class="match-detail">
        <div class="small muted">
          {{ game.id }} · 마지막 라운드 {{ game.player.last_round }} (API 원본 번호) · 전체 경기
          {{ Math.floor(game.duration / 60) }}분
        </div>
        <div class="detail-units">
          <div v-for="(u, i) in game.player.units" :key="i">
            <AssetBadge :id="u.character_id" :asset="data.assets[u.character_id]" :stars="u.tier" />
            <div class="item-list">
              <span v-for="item in items(u)" :key="item">{{ data.assets[item]?.name || item }}</span
              ><span v-if="!items(u).length" class="muted">아이템 없음</span>
            </div>
          </div>
        </div>
        <p>
          <span
            v-for="t in game.player.traits.filter((t) => t.tier_current > 0)"
            :key="t.name"
            class="trait"
            >{{ data.assets[t.name]?.name || t.name }} {{ t.num_units }} ·
            {{ t.tier_current }}단계</span
          >
        </p>
        <p class="small muted">증강체: 현재 공식 Match API 명세에서 제공되지 않습니다.</p>
      </div>
    </details>
  </section>
</template>
