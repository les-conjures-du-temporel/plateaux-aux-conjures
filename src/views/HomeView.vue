<script setup>
import { ref, inject } from 'vue'

const db = inject('db')

const isLoading = ref(true)
const games = ref(null)
const loadError = ref(null)

db.getGames()
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
  height: 100px;
}
</style>
