<script setup lang="ts">
import { inject, type Ref, computed } from 'vue'
import { Database, type Game } from '@/database'
import GameItem from '@/components/GameItem.vue'

const MAX_GAMES = 50
const games: Ref<Game[]> = inject<Database>('db')!.games

const recentGames = computed(() => {
  const playedGames = games.value.filter((game) => game.lastPlayed)
  playedGames.sort((a, b) => b.lastPlayed!.localeCompare(a.lastPlayed!))
  return playedGames.slice(0, MAX_GAMES)
})
</script>

<template>
  <div class="q-pa-sm">
    <p>
      Sur cette page tu trouves une liste des jeux récemment joués chez nous et d'autres jeux dans
      notre collection.
    </p>

    <div class="text-center" v-if="games.length === 0">
      <q-spinner color="primary" size="5em" />
    </div>

    <template v-for="(game, index) in recentGames" :key="game.bgg.id">
      <q-separator v-if="index > 0" color="secondary" />
      <game-item :game="game" show-total-plays />
    </template>
  </div>
</template>

<style scoped></style>
