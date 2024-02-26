<script setup lang="ts">
import { Database, type Game, RECENT_GAMES_DAYS, type Translations } from '@/database'
import { computed, inject, type Ref, ref } from 'vue'
import { formatNumber, pluralS } from '@/helpers'
import GameItemTerms from '@/components/GameItemTerms.vue'
import type { ScoreKind } from '@/game_scorer'
import { dayToHumanString, pastDay } from '@/day'

export type Highlights = {
  categories: Set<string>
  mechanics: Set<string>
  designers: Set<string>
  artists: Set<string>
}

const props = defineProps<{
  game: Game
  simple?: boolean
  highlights?: Highlights
  relevantScores?: ScoreKind[]
  showTotalPlays?: boolean
  showOwnedByClub?: boolean
}>()

const showDetails = ref(false)
const translations: Ref<Translations> = inject<Database>('db')!.translations

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
    return 'jeu facile'
  } else if (averageWeight > 3) {
    return 'jeu difficile'
  } else {
    return 'jeu intermédiaire'
  }
})

const sortedRelevantScores = computed(() => props.relevantScores?.slice()?.sort())

const isNewClubGame = computed(() => {
  const game = props.game
  if (!game.ownedByClub || !game.ownedSince) {
    return false
  }

  return game.ownedSince >= pastDay(RECENT_GAMES_DAYS)
})

function getIconForScoreKind(scoreKind: ScoreKind): string {
  return {
    players: 'groups',
    playTime: 'schedule',
    favoriteMatch: 'thumb_up',
    bggRating: 'emoji_events',
    randomDaily: 'today',
    recentlyPlayed: 'flare'
  }[scoreKind]
}

function getLabelForScoreKind(scoreKind: ScoreKind): string {
  return {
    players: 'recommandé pour ce nombre de joueurs',
    playTime: 'probablement dans le temps demandé',
    favoriteMatch: 'similaire aux jeux favoris',
    bggRating: 'une bonne note sur Board Game Geek',
    randomDaily: 'suggestions aléatoires du jour',
    recentlyPlayed: 'joué récemment'
  }[scoreKind]
}

function onClickHeader() {
  if (!props.simple) {
    showDetails.value = !showDetails.value
  }
}
</script>

<template>
  <q-card flat class="q-my-sm">
    <q-card-section horizontal @click="onClickHeader">
      <q-img
        v-if="game.bgg.thumbnail"
        :src="game.bgg.thumbnail"
        class="col-3"
        fit="scale-down"
        height="140px"
      />

      <q-card-section class="col-9">
        <span class="text-h6">{{ game.name }}</span>
        <span class="text-caption" v-if="game.bgg.yearPublished">
          ({{ game.bgg.yearPublished }})</span
        >

        <div v-if="showTotalPlays && game.lastPlayed" class="row">
          <div class="col-6">{{ pluralS(game.totalPlays, 'partie') }}</div>
          <div class="col-6">dernière le {{ dayToHumanString(game.lastPlayed) }}</div>
        </div>

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
            <q-icon
              v-for="scoreKind in sortedRelevantScores"
              :key="scoreKind"
              :name="getIconForScoreKind(scoreKind)"
              class="q-mx-xs"
              size="1.25em"
            />
            <q-badge
              color="primary"
              label="jeu du club"
              v-if="showOwnedByClub && game.ownedByClub"
            />
            <q-badge color="primary" label="arrivé récemment" v-if="isNewClubGame" />
          </div>
          <div class="col-6" v-if="!simple">
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
      @enter="(element) => ((element as HTMLElement).style.height = `${element.scrollHeight}px`)"
      @after-enter="(element) => ((element as HTMLElement).style.height = '')"
      @before-leave="
        (element) => ((element as HTMLElement).style.height = `${element.scrollHeight}px`)
      "
      @leave="(element) => ((element as HTMLElement).style.height = '0px')"
    >
      <q-card-section v-if="showDetails" class="q-pa-xs details-grid-container">
        <template v-if="sortedRelevantScores?.length">
          <div>Bon match</div>
          <div>
            <template v-for="(scoreKind, index) in sortedRelevantScores" :key="scoreKind">
              <br v-if="index > 0" />
              <q-icon :name="getIconForScoreKind(scoreKind)" class="q-mx-xs" size="1.25em" />
              {{ getLabelForScoreKind(scoreKind) }}
            </template>
          </div>
        </template>

        <div class="details-span-2">
          Informations retirées du site
          <a
            :href="'https://boardgamegeek.com/boardgame/' + encodeURIComponent(game.bgg.id)"
            target="_blank"
            >boardgamegeek.com</a
          >
          <q-separator spaced inset size="2px" />
        </div>

        <game-item-terms
          :highlights="highlights?.categories"
          :terms="game.bgg.categories"
          :translations="translations.categories"
          label="Catégories"
        />

        <game-item-terms
          :highlights="highlights?.mechanics"
          :terms="game.bgg.mechanics"
          :translations="translations.mechanics"
          label="Mécaniques"
        />

        <game-item-terms
          :highlights="highlights?.designers"
          :terms="game.bgg.designers"
          label="Créateurs"
        />

        <game-item-terms
          :highlights="highlights?.artists"
          :terms="game.bgg.artists"
          label="Artistes"
        />

        <template v-if="game.bgg.averageRating">
          <div>Note</div>
          <div>{{ formatNumber(game.bgg.averageRating) }} / 10</div>
        </template>

        <template v-if="game.bgg.averageWeight">
          <div>Complexité</div>
          <div>{{ formatNumber(game.bgg.averageWeight) }} / 5</div>
        </template>

        <div class="details-span-2">
          Informations du club
          <q-separator spaced inset size="2px" />
        </div>

        <template v-if="game.lastPlayed">
          <div>Parties jouées</div>
          <div>{{ game.totalPlays }}</div>
          <div>Dernière partie</div>
          <div>{{ dayToHumanString(game.lastPlayed) }}</div>
        </template>
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

.details-grid-container {
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-gap: 5px;
}

.details-span-2 {
  grid-column-end: span 2;
  text-align: center;
}
</style>
