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
  <div class="logo">
    <el-image style="height: 100px" src="/logo-conjures.png" fit="cover" />
  </div>

  <p>
    Bienvenu ! Tu viens jouer avec nous ?<br>
    Cette application permet de voir à quoi on joue. Elle t'aide aussi à trouver des jeux
    dans notre bibliothèque pour tes parties
  </p>

  <div v-loading="isLoading" class="loading" v-if="isLoading"></div>

  <el-alert :title="String(loadError)" type="error" v-if="loadError" />

  <game-item v-for="game in games" :key="game.bgg.id" :game="game" />
</template>

<style scoped>
.loading {
  width: 100%;
  height: 300px;
}

.logo {
  text-align: center;
}
</style>
