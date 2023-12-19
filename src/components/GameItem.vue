<script setup lang="ts">
import type { Game } from '@/database'
import { computed, ref } from 'vue'
import { formatDate, formatNumber, pluralS } from '@/helpers'

const props = defineProps<{
  game: Game
}>()

const showDetails = ref(false)

const numPlayers = computed(() => {
  const game = props.game.bgg
  if (!game.minPlayers || !game.maxPlayers) {
    return
  } else if (game.minPlayers === game.maxPlayers) {
    return pluralS(game.minPlayers, 'joueur')
  } else {
    return `${game.minPlayers} - ${game.maxPlayers} joueurs`
  }
})

const playTime = computed(() => {
  const game = props.game.bgg
  if (!game.minPlayTimeMinutes || !game.maxPlayTimeMinutes) {
    return
  } else if (game.minPlayTimeMinutes === game.maxPlayTimeMinutes) {
    return `${game.minPlayTimeMinutes} min`
  } else {
    return `${game.minPlayTimeMinutes} - ${game.maxPlayTimeMinutes} min`
  }
})

const weight = computed(() => {
  const averageWeight = props.game.bgg.averageWeight
  if (!averageWeight) {
    return
  } else if (averageWeight < 2) {
    return 'jeu léger'
  } else if (averageWeight > 3) {
    return 'jeu dense'
  } else {
    return 'jeu intermédiaire'
  }
})
</script>

<template>
  <q-card flat class="q-my-sm">
    <q-card-section horizontal @click="showDetails = !showDetails">
      <q-img v-if="game.bgg.thumbnail" :src="game.bgg.thumbnail" class="col-3" fit="scale-down" />

      <q-card-section class="col-9">
        <span class="text-h6">{{ game.name }}</span>

        <div class="row">
          <div class="col-6">{{ numPlayers }}</div>
          <div class="col-6">{{ playTime }}</div>
        </div>

        <div class="row">
          <div class="col-6">
            <span v-if="game.bgg.minAge">{{ game.bgg.minAge }} ans +</span>
          </div>
          <div class="col-6">{{ weight }}</div>
        </div>

        <div class="row">
          <div class="col-6">
            <span v-if="game.ownedByClub">jeu du club</span>
          </div>
          <div class="col-6">
            <q-btn
              color="white"
              text-color="black"
              :label="showDetails ? 'Masquer détails' : 'Voir détail'"
              size="sm"
              outline
              class="q-my-xs"
              no-caps
            />
          </div>
        </div>
      </q-card-section>
    </q-card-section>

    <transition
      name="expand"
      @enter="(element) => (element.style.height = `${element.scrollHeight}px`)"
      @leave="(element) => (element.style.height = '0px')"
    >
      <q-card-section v-if="showDetails" class="q-pa-xs">
        <span v-if="game.bgg.categories.length">
          <q-badge>Catégories</q-badge> {{ game.bgg.categories.join(', ') }}<br />
        </span>
        <span v-if="game.bgg.mechanics.length">
          <q-badge>Mécaniques</q-badge> {{ game.bgg.mechanics.join(', ') }}<br />
        </span>
        <span v-if="game.bgg.designers.length">
          <q-badge>Créateurs</q-badge> {{ game.bgg.designers.join(', ') }}<br />
        </span>
        <span v-if="game.bgg.artists.length">
          <q-badge>Artistes</q-badge> {{ game.bgg.artists.join(', ') }}<br />
        </span>
        <span v-if="game.bgg.averageRating">
          <q-badge>Note</q-badge> {{ formatNumber(game.bgg.averageRating) }} / 10<br />
        </span>
        <span v-if="game.bgg.averageWeight">
          <q-badge>Complexité</q-badge> {{ formatNumber(game.bgg.averageWeight) }} / 5<br />
        </span>
        <span v-if="game.clubCode">
          <q-badge>Code conjuré</q-badge> {{ game.clubCode }}<br />
          <span class="text-caption">(utile pour enregistrer tes parties rapidement)</span>
          <br />
        </span>
        <span v-if="game.lastPlayed">
          <q-badge>Parties enregistrées</q-badge> {{ game.totalPlays }}<br />
          <q-badge>Dernière partie</q-badge> {{ formatDate(game.lastPlayed) }}<br />
        </span>
        Aller à la page sur
        <a
          :href="'https://boardgamegeek.com/boardgame/' + encodeURIComponent(game.bgg.id)"
          target="_blank"
          >boardgamegeek.com</a
        >
      </q-card-section>
    </transition>
  </q-card>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: height 0.25s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  height: 0;
}
</style>
