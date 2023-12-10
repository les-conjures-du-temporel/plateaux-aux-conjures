<script setup lang="ts">
import { ref, inject, type Ref } from 'vue'
import type { Database, Game } from '@/database'

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

  <div v-loading="isLoading" class="loading" v-if="isLoading"></div>

  <el-alert :title="String(loadError)" type="error" v-if="loadError" />

  <el-descriptions v-for="game in games" :key="game.bgg.id" :title="game.name" border>
    <el-descriptions-item>
      <el-image style="width: 100px; height: 100px" :src="game.bgg.thumbnail" />
    </el-descriptions-item>
    <el-descriptions-item label="Players"
      >{{ game.bgg.minPlayers }} - {{ game.bgg.maxPlayers }}</el-descriptions-item
    >
    <el-descriptions-item label="Play time"
      >{{ game.bgg.minPlayTimeMinutes }} - {{ game.bgg.maxPlayTimeMinutes }}</el-descriptions-item
    >
    <el-descriptions-item label="Min age">
      {{ game.bgg.minAge }}
    </el-descriptions-item>
    <el-descriptions-item label="Average rating">{{ game.bgg.averageRating }}</el-descriptions-item>
    <el-descriptions-item label="Average weight">{{ game.bgg.averageWeight }}</el-descriptions-item>
  </el-descriptions>
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
