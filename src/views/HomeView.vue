<script setup lang="ts">
import { ref, inject, type Ref } from 'vue'
import type { Database, Game } from '@/database'
import GameItem from '@/components/GameItem.vue'

const db: Database = inject('db')!

const isLoading = ref(true)
const games: Ref<Game[]> = ref([])
const loadError = ref(null)

db.getGamesWithCache()
  .then((result) => {
    games.value = result
    isLoading.value = false
  })
  .catch((error) => {
    console.error(error)
    loadError.value = error
  })
</script>

<template>
  <div class="q-pa-sm">
    <div class="logo">
      <img style="height: 100px" src="/logo-conjures.png" alt="Logo des conjurés du temporel" />
    </div>

    <p>
      Bienvenu ! Tu viens jouer avec nous ?<br />
      Cette application permet de voir à quoi on joue. Elle t'aide aussi à trouver des jeux dans notre
      bibliothèque pour tes parties
    </p>

    <div class="spinner" v-if="isLoading">
      <q-spinner color="primary" size="5em" />
    </div>

    <q-banner class="text-white bg-accent" v-if="loadError">
      Erreur de chargement: {{ loadError }}
      You have lost connection to the internet. This app is offline.
    </q-banner>

    <div class="">
      <template v-for="(game, index) in games" :key="game.bgg.id">
        <q-separator v-if="index > 0" color="secondary" />
        <game-item :game="game" />
      </template>
    </div>
  </div>
</template>

<style scoped>
.logo {
  text-align: center;
}

.spinner {
  text-align: center;
}
</style>
