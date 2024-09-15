<script setup lang="ts">
import { inject, type Ref, computed } from 'vue'
import { Database, type Game } from '@/database'
import GameItem from '@/components/GameItem.vue'

const db = inject<Database>('db')!

const gamesInCollection = computed<Game[]>(() => {
  const games = Array.from(db.games.value)
  const gamesInCollection = games.filter((game) => game.ownedByClub)
  gamesInCollection.sort((a, b) => a.name.localeCompare(b.name))
  return gamesInCollection
})
</script>

<template>
  <p>Sur cette page tu trouves la liste des jeux dans notre ludothèque.</p>

  <div class="text-center" v-if="gamesInCollection.length === 0">
    <q-spinner color="primary" size="5em" />
  </div>

  <template v-for="(game, index) in gamesInCollection" :key="game.bgg.id">
    <q-separator v-if="index > 0" color="secondary" />
    <game-item :game="game" show-total-plays />
  </template>
</template>

<style scoped></style>
