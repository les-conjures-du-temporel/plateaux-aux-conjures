<script setup lang="ts">
import type { Game } from '@/database'
import { ref } from 'vue'
import { formatDate, formatNumber } from '../helpers'

defineProps<{
  game: Game
}>()

const showDetails = ref(false)
</script>

<template>
  <div class="game-item">
    <el-row :gutter="5">
      <el-col :span="6">
        <img
          v-if="game.bgg.thumbnail"
          :src="game.bgg.thumbnail"
          class="game-image"
          alt="boardgame image"
        />
      </el-col>
      <el-col :span="18">
        <h2 class="game-name">{{ game.name }}</h2>

        <el-row class="game-main-specs">
          <el-col :span="12">
            <span
              v-if="
                game.bgg.minPlayers &&
                game.bgg.maxPlayers &&
                game.bgg.minPlayers == game.bgg.maxPlayers
              "
            >
              {{ game.bgg.minPlayers }} joueurs
            </span>
            <span v-else-if="game.bgg.minPlayers && game.bgg.maxPlayers">
              {{ game.bgg.minPlayers }} à {{ game.bgg.maxPlayers }} joueurs
            </span>
          </el-col>
          <el-col :span="12">
            <span
              v-if="
                game.bgg.minPlayTimeMinutes &&
                game.bgg.maxPlayTimeMinutes &&
                game.bgg.minPlayTimeMinutes == game.bgg.maxPlayTimeMinutes
              "
            >
              {{ game.bgg.minPlayTimeMinutes }} min
            </span>
            <span v-else-if="game.bgg.minPlayTimeMinutes && game.bgg.maxPlayTimeMinutes">
              {{ game.bgg.minPlayTimeMinutes }} à {{ game.bgg.maxPlayTimeMinutes }} min
            </span>
          </el-col>
        </el-row>
        <el-row class="game-main-specs">
          <el-col :span="12">
            <span v-if="game.bgg.minAge">{{ game.bgg.minAge }} ans +</span>
          </el-col>
          <el-col :span="12">
            <span v-if="game.bgg.averageWeight && game.bgg.averageWeight < 2">jeu léger</span>
            <span v-else-if="game.bgg.averageWeight && game.bgg.averageWeight > 3">jeu dense</span>
            <span v-else-if="game.bgg.averageWeight">jeu intermédiaire</span>
          </el-col>
        </el-row>
        <el-row class="game-main-specs">
          <el-col :span="12">
            <span v-if="game.ownedByClub">Jeu du club</span>
          </el-col>
          <el-col :span="12">
            <el-button size="small" @click="showDetails = !showDetails" class="toggle-details">
              <span v-if="showDetails">Masquer détails</span>
              <span v-else>Voir détails</span>
            </el-button>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <div class="more-details" v-if="showDetails">
      <span v-if="game.bgg.categories.length">
        <span class="more-details-label">Catégories</span>: {{ game.bgg.categories.join(', ')
        }}<br />
      </span>
      <span v-if="game.bgg.mechanics.length">
        <span class="more-details-label">Mécaniques</span>: {{ game.bgg.mechanics.join(', ')
        }}<br />
      </span>
      <span v-if="game.bgg.designers.length">
        <span class="more-details-label">Créateurs</span>: {{ game.bgg.designers.join(', ') }}<br />
      </span>
      <span v-if="game.bgg.artists.length">
        <span class="more-details-label">Artistes</span>: {{ game.bgg.artists.join(', ') }}<br />
      </span>
      <span v-if="game.bgg.averageRating">
        <span class="more-details-label">Note</span>: {{ formatNumber(game.bgg.averageRating) }} /
        10<br />
      </span>
      <span v-if="game.bgg.averageWeight">
        <span class="more-details-label">Complexité</span>:
        {{ formatNumber(game.bgg.averageWeight) }} / 5<br />
      </span>
      <span class="more-details-label">Code conjuré</span>: {{ game.clubCode }}<br />
      <span v-if="game.lastPlayed">
        <span class="more-details-label">Parties enregistrées</span>: {{ game.totalPlays }}<br />
        <span class="more-details-label">Dernière partie</span>: {{ formatDate(game.lastPlayed) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.game-item {
  border-top: thin #26294e solid;
  padding-top: 5px;
  padding-bottom: 5px;
}

.game-name {
  margin: 0;
  font-size: 1.1em;
}

.game-image {
  width: 100%;
  max-height: 200px;
  object-fit: scale-down;
}

.more-details-label {
  font-size: 1em;
  font-weight: bold;
}

.game-main-specs {
  margin-top: 5px;
}
</style>
