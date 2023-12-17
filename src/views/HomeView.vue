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
    <div class="text-center">
      <img style="height: 100px" src="/logo-conjures.png" alt="Logo des conjurés du temporel" />
    </div>

    <p class="text-h5">Tu viens jouer avec nous ?</p>
    <p>
      Si tu veux un coup de main pour lancer ta prochain partie chez nous,
      <q-btn
        color="primary"
        label="je t'aide à choisir un jeu"
        unelevated
        no-caps
        padding="xs md"
        icon="tips_and_updates"
        :to="{ name: 'suggest' }"
      />.
    </p>
    <p>
      Si tu viens de jouer chez nous,
      <q-btn
        color="primary"
        label="enregistre ta partie"
        unelevated
        no-caps
        padding="xs md"
        icon="rate_review"
        :to="{ name: 'log-play' }"
      />
      pour qu'on sache
    </p>
    <p>
      Sur cette page tu trouves une liste des jeux récemment joués chez nous et d'autres jeux dans
      notre collection.
    </p>

    <div class="text-center" v-if="isLoading">
      <q-spinner color="primary" size="5em" />
    </div>

    <q-banner class="text-white bg-accent" v-if="loadError">
      Erreur de chargement: {{ loadError }}
    </q-banner>

    <template v-for="(game, index) in games" :key="game.bgg.id">
      <q-separator v-if="index > 0" color="secondary" />
      <game-item :game="game" />
    </template>
  </div>
</template>

<style scoped></style>
