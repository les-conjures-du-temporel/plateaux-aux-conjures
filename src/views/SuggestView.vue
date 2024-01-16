<script setup lang="ts">
import { computed, type ComputedRef, inject, type Ref, ref } from 'vue'
import SearchGame from '@/components/SearchGame.vue'
import { Database, type Game } from '@/database'
import GameItem, { type Highlights } from '@/components/GameItem.vue'
import { pluralS } from '@/helpers'
import { GameScorer } from '@/game_scorer'

type Interval = [number, number]

const games: Ref<Game[]> = inject<Database>('db')!.games
const tab = ref('players')

// Declare possible options
type Option = { label: string; value: Interval }
type MaybeOption = { label: string; value: Interval | null }
const criteriaPlayersOptions: Option[] = []
for (let i = 1; i <= 9; i++) {
  criteriaPlayersOptions.push({ label: String(i), value: [i, i] })
}
criteriaPlayersOptions.push({ label: '10+', value: [10, Number.POSITIVE_INFINITY] })
const MIN_PLAY_TIME_RANGE = 15
const MAX_PLAY_TIME_RANGE = 135
const criteriaPlayTimeRange: Ref<{ min: number; max: number }> = ref({
  min: MIN_PLAY_TIME_RANGE,
  max: MAX_PLAY_TIME_RANGE
})
function getPlayTimeLabel(value: number): string {
  if (value === MAX_PLAY_TIME_RANGE) {
    return 'Plus de 2h'
  }

  const hours = Math.floor(value / 60)
  const minutes = value % 60
  if (hours > 0 && minutes > 0) {
    return `${hours} h ${minutes} min`
  } else if (minutes > 0) {
    return `${minutes} min`
  } else {
    return `${hours} h`
  }
}
const criteriaPlayTime: ComputedRef<Interval | null> = computed(() => {
  const { min, max } = criteriaPlayTimeRange.value
  if (min === MIN_PLAY_TIME_RANGE && max === MAX_PLAY_TIME_RANGE) {
    return null
  }

  const actualMin = min === 15 ? 0 : min
  const actualMax = max === 135 ? Number.POSITIVE_INFINITY : max
  return [actualMin, actualMax]
})
const criteriaAgeOptions: MaybeOption[] = []
for (let i = 4; i <= 16; i += 2) {
  criteriaAgeOptions.push({ label: `${i} +`, value: [0, i] })
}
criteriaAgeOptions.push({ label: 'Peu importe', value: null })
const criteriaWeightOptions: Option[] = [
  { label: 'facile', value: [0, 2] },
  { label: 'intermédiaire', value: [2, 3] },
  { label: 'difficile', value: [3, 5] }
]

const criteriaPlayers: Ref<Interval[]> = ref([])
const criteriaAge: Ref<Interval | null> = ref(null)
const criteriaWeight: Ref<Interval[]> = ref([])
const criteriaFavoriteGames: Ref<Game[]> = ref([])

const gameScorer = computed(() => {
  return new GameScorer(games.value)
})

const highlights: ComputedRef<Highlights> = computed(() => {
  const games = criteriaFavoriteGames.value

  function collect(games: Game[], getter: (game: Game) => string[]): Set<string> {
    const values: Set<string> = new Set()
    for (const game of games) {
      for (const value of getter(game)) {
        values.add(value)
      }
    }
    return values
  }

  return {
    categories: collect(games, (game) => game.bgg.categories),
    mechanics: collect(games, (game) => game.bgg.mechanics),
    designers: collect(games, (game) => game.bgg.designers),
    artists: collect(games, (game) => game.bgg.artists)
  }
})

const MAX_SUGGESTIONS = 25

const suggestionResults = computed(() => {
  if (
    !criteriaPlayers.value.length &&
    !criteriaPlayTime.value &&
    !criteriaAge.value &&
    !criteriaWeight.value.length &&
    !criteriaFavoriteGames.value.length
  ) {
    return null
  }

  // Apply restrictions
  const favoriteGameIds = new Set(criteriaFavoriteGames.value.map((favorite) => favorite.bgg.id))
  const validGames: Game[] = []
  for (const game of games.value) {
    if (!game.ownedByClub || favoriteGameIds.has(game.bgg.id)) {
      continue
    }

    if (!checkCriteria([game.bgg.minPlayers, game.bgg.maxPlayers], criteriaPlayers.value)) {
      continue
    }

    if (
      criteriaPlayTime.value &&
      !checkCriteria(
        [game.bgg.minPlayTimeMinutes, game.bgg.maxPlayTimeMinutes],
        [criteriaPlayTime.value]
      )
    ) {
      continue
    }

    const age = criteriaAge.value ? [criteriaAge.value] : []
    if (!checkCriteria([game.bgg.minAge, game.bgg.minAge], age)) {
      continue
    }

    if (!checkCriteria([game.bgg.averageWeight, game.bgg.averageWeight], criteriaWeight.value)) {
      continue
    }

    validGames.push(game)
  }

  const playersSet: Set<number> = new Set()
  for (const [lower] of criteriaPlayers.value) {
    playersSet.add(lower)
  }

  return gameScorer.value.score(
    validGames,
    criteriaFavoriteGames.value,
    playersSet,
    criteriaPlayTime.value
  )
})

/**
 * Check if at least one of the criteria is respected, that is, there is a non-empty intersection
 */
function checkCriteria(value: [number | null, number | null], criteria: Interval[]): boolean {
  const [valueMin, valueMax] = value
  if (!criteria.length) {
    return true
  }

  if (valueMin === null || valueMax == null) {
    return false
  }

  for (const [ruleMin, ruleMax] of criteria) {
    if (ruleMin <= valueMax && ruleMax >= valueMin) {
      return true
    }
  }

  return false
}

function addFavoriteGame(game: Game): void {
  if (criteriaFavoriteGames.value.every((favorite) => favorite.bgg.id !== game.bgg.id)) {
    criteriaFavoriteGames.value.push(game)
  }
}
</script>

<template>
  <p>
    Envie de lancer une partie, mais tu ne sais pas trop quel jeu choisir ?<br />
    Laisse-moi t'aider à trouver ton bonheur dans notre bibliothèque !
  </p>

  <q-card>
    <q-tabs
      v-model="tab"
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
      mobile-arrows
      outside-arrows
    >
      <q-tab
        name="players"
        label="Joueurs"
        icon="groups"
        no-caps
        :alert="criteriaPlayers.length ? 'accent' : false"
      />
      <q-tab
        name="playTime"
        label="Temps"
        icon="schedule"
        no-caps
        :alert="criteriaPlayTime ? 'accent' : false"
      />
      <q-tab
        name="weight"
        label="Complexité"
        icon="psychology"
        no-caps
        :alert="criteriaWeight.length ? 'accent' : false"
      />
      <q-tab
        name="favoriteGames"
        label="Favoris"
        icon="thumb_up"
        no-caps
        :alert="criteriaFavoriteGames.length ? 'accent' : false"
      />
      <q-tab
        name="age"
        label="Age"
        icon="family_restroom"
        no-caps
        :alert="criteriaAge ? 'accent' : false"
      />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="players">
        <p>Vous êtes combien ?</p>
        <div class="q-gutter-sm">
          <q-option-group
            v-model="criteriaPlayers"
            :options="criteriaPlayersOptions"
            inline
            type="checkbox"
          />
        </div>
      </q-tab-panel>

      <q-tab-panel name="playTime">
        <p>Vous avez combien de temps ?</p>

        <div class="time-range">
          <q-range
            v-model="criteriaPlayTimeRange"
            :min="15"
            :max="135"
            :step="15"
            label
            snap
            markers
            label-always
            :marker-labels="{ 30: '30min', 60: '1h', 120: '2h' }"
            :left-label-value="getPlayTimeLabel(criteriaPlayTimeRange.min)"
            :right-label-value="getPlayTimeLabel(criteriaPlayTimeRange.max)"
          />
        </div>
      </q-tab-panel>

      <q-tab-panel name="age">
        <p>A partir de quel âge ?</p>
        <div class="q-gutter-sm">
          <q-option-group v-model="criteriaAge" :options="criteriaAgeOptions" inline />
        </div>
      </q-tab-panel>

      <q-tab-panel name="weight">
        <p>Quel niveau de complexité ?</p>
        <div class="q-gutter-sm">
          <q-option-group
            v-model="criteriaWeight"
            :options="criteriaWeightOptions"
            type="checkbox"
          />
        </div>
      </q-tab-panel>

      <q-tab-panel name="favoriteGames">
        <p>
          Quels sont vos jeux favoris ?<br />
          <span class="text-caption"
            >La recherche privilégiera les jeux avec une mécanique, théme ou créateurs
            similaires</span
          >
        </p>

        <ul v-for="(game, index) in criteriaFavoriteGames" :key="game.bgg.id">
          <li>
            {{ game.name }}
            <q-btn
              icon="cancel"
              unelevated
              size="sm"
              @click="criteriaFavoriteGames.splice(index, 1)"
            ></q-btn>
          </li>
        </ul>

        <p v-if="criteriaFavoriteGames.length">Tu peux en ajouter d'autres si tu veux :</p>

        <search-game @input="addFavoriteGame" />
      </q-tab-panel>
    </q-tab-panels>
  </q-card>

  <div class="text-center" v-if="games.length === 0">
    <q-spinner color="primary" size="5em" />
  </div>

  <div class="q-ma-md" v-if="suggestionResults">
    <q-banner class="bg-secondary text-white" v-if="!suggestionResults.length">
      Aucun résultat n'a été trouvé. Essaye de changer les critères de la recherche
    </q-banner>

    <div v-else>
      <p v-if="suggestionResults.length > MAX_SUGGESTIONS">
        Voici les {{ MAX_SUGGESTIONS }} meilleures suggestions
      </p>
      <p v-else>Voici {{ pluralS(suggestionResults.length, 'suggestion') }}</p>

      <template
        v-for="(suggestion, index) in suggestionResults.slice(0, MAX_SUGGESTIONS)"
        :key="suggestion.game.bgg.id"
      >
        <q-separator v-if="index > 0" color="secondary" />
        <game-item
          :game="suggestion.game"
          :highlights="highlights"
          :relevant-scores="suggestion.relevantScores"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.time-range {
  margin-top: 40px;
  margin-left: 20px;
  margin-right: 20px;
}
</style>
