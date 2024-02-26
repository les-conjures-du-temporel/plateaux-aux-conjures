<script setup lang="ts">
import { inject, type Ref, computed } from 'vue'
import { Database, type Game } from '@/database'
import GameItem from '@/components/GameItem.vue'

const MAX_GAMES = 50
const games: Ref<Game[]> = inject<Database>('db')!.games

const recentGames = computed(() => {
  return games.value
    .map((game) => {
      let key
      if (game.ownedSince === null) {
        key = game.lastPlayed
      } else if (game.lastPlayed === null) {
        key = game.ownedSince
      } else if (game.ownedSince > game.lastPlayed) {
        key = game.ownedSince
      } else {
        key = game.lastPlayed
      }

      return { game, key }
    })
    .filter((each) => each.key)
    .sort((a, b) => {
      return compare(b.key, a.key) || compare(a.game.name, b.game.name)
    })
    .slice(0, MAX_GAMES)
    .map((each) => each.game)
})

function compare<T>(a: T, b: T): number {
  return a < b ? -1 : a > b ? 1 : 0
}
</script>

<template>
  <p>
    Sur cette page tu trouves la liste des jeux récemment joués et les derniers arrivés dans notre
    collection.
  </p>

  <div class="text-center" v-if="games.length === 0">
    <q-spinner color="primary" size="5em" />
  </div>

  <template v-for="(game, index) in recentGames" :key="game.bgg.id">
    <q-separator v-if="index > 0" color="secondary" />
    <game-item :game="game" show-total-plays show-owned-by-club />
  </template>
</template>

<style scoped></style>
