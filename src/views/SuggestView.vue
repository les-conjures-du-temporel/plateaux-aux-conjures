<script setup lang="ts">
import { computed, inject, type Ref, ref, watch } from 'vue'
import type { QStepper } from 'quasar'
import SearchGame from '@/components/SearchGame.vue'
import { Database, type Game } from '@/database'
import GameItem from '@/components/GameItem.vue'

type Interval = [number, number]

const db: Database = inject('db')!
const stepper = ref<InstanceType<typeof QStepper> | null>(null)
const step = ref('players')

// Declare possible options
type Option = { label: string; value: Interval }
const criteriaPlayersOptions: Option[] = []
for (let i = 1; i <= 9; i++) {
  criteriaPlayersOptions.push({ label: String(i), value: [i, i] })
}
criteriaPlayersOptions.push({ label: '10+', value: [10, Number.POSITIVE_INFINITY] })
const criteriaPlayTimeOptions: Option[] = [
  { label: 'moins de 15 minutes', value: [0, 15] },
  { label: 'entre 15 et 30 minutes', value: [15, 30] },
  { label: 'entre 30 et 60 minutes', value: [30, 60] },
  { label: 'entre 60 et 120 minutes', value: [60, 120] },
  { label: 'plus de 120 minutes', value: [120, Number.POSITIVE_INFINITY] }
]
const criteriaAgeOptions: Option[] = []
for (let i = 4; i <= 16; i += 2) {
  criteriaAgeOptions.push({ label: String(i), value: [i, Number.POSITIVE_INFINITY] })
}
const criteriaWeightOptions: Option[] = [
  { label: 'léger', value: [0, 2] },
  { label: 'intermédiaire', value: [2, 3] },
  { label: 'dense', value: [3, 5] }
]

const criteriaPlayers: Ref<Interval[]> = ref([])
const criteriaPlayTime: Ref<Interval[]> = ref([])
const criteriaAge: Ref<Interval | null> = ref(null)
const criteriaWeight: Ref<Interval[]> = ref([])
const criteriaFavoriteGames: Ref<Game[]> = ref([])
const state: Ref<'setup' | 'results'> = ref('setup')

type BonusKind = 'category' | 'mechanic' | 'designer' | 'artist'
type SuggestedGame = { game: Game; bonus: BonusKind[] }
const suggestionResults: Ref<SuggestedGame[]> = ref([])

const nextButtonLabel = computed(() => {
  let isFilled

  if (step.value === 'players') {
    isFilled = Boolean(criteriaPlayers.value.length)
  } else if (step.value === 'playTime') {
    isFilled = Boolean(criteriaPlayTime.value.length)
  } else if (step.value === 'age') {
    isFilled = Boolean(criteriaAge.value)
  } else if (step.value === 'weight') {
    isFilled = Boolean(criteriaWeight.value.length)
  } else if (step.value === 'favoriteGames') {
    isFilled = Boolean(criteriaFavoriteGames.value.length)
  } else {
    isFilled = true
  }

  return isFilled ? 'Continuer' : 'Peu importe'
})

function nextStep() {
  if (step.value !== 'favoriteGames') {
    stepper.value?.next()
  } else {
    state.value = 'results'
  }
}

watch(state, async (newState) => {
  if (newState === 'results') {
    const games = await db.getGamesWithCache()

    // Apply restrictions
    const validGames: SuggestedGame[] = []
    for (const game of games) {
      if (!game.ownedByClub) {
        continue
      }

      if (!checkCriteria([game.bgg.minPlayers, game.bgg.maxPlayers], criteriaPlayers.value)) {
        continue
      }

      if (
        !checkCriteria(
          [game.bgg.minPlayTimeMinutes, game.bgg.maxPlayTimeMinutes],
          criteriaPlayTime.value
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

      validGames.push({ game, bonus: [] })
    }

    // Detect similarities
    applyBonus(validGames, criteriaFavoriteGames.value, 'category')
    applyBonus(validGames, criteriaFavoriteGames.value, 'mechanic')
    applyBonus(validGames, criteriaFavoriteGames.value, 'designer')
    applyBonus(validGames, criteriaFavoriteGames.value, 'artist')

    // TODO give bonus for recent play and good rating
    // TODO: random sort by day

    validGames.sort((a, b) => b.bonus.length - a.bonus.length)

    suggestionResults.value = validGames
  }
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

function applyBonus(games: SuggestedGame[], favoriteGames: Game[], kind: BonusKind) {
  const extract = (game: Game): string[] => {
    if (kind === 'category') {
      return game.bgg.categories
    } else if (kind === 'mechanic') {
      return game.bgg.mechanics
    } else if (kind === 'designer') {
      return game.bgg.designers
    } else if (kind === 'artist') {
      return game.bgg.artists
    }
    throw Error('Not implemented')
  }

  const favoriteValues = new Set()
  for (const favoriteGame of favoriteGames) {
    for (const value of extract(favoriteGame)) {
      favoriteValues.add(value)
    }
  }

  for (const game of games) {
    const values = extract(game.game)
    if (values.some((value) => favoriteValues.has(value))) {
      game.bonus.push(kind)
    }
  }
}
</script>

<template>
  <div class="q-pa-md" v-if="state === 'setup'">
    <p>
      Envie de lancer une partie, mais tu ne sais pas trop quel jeu ? Laisse-moi t'aider à trouver
      ton bonheur dans notre bibliothèque
    </p>

    <q-stepper
      v-model="step"
      ref="stepper"
      color="primary"
      animated
      contracted
      bordered
      flat
      header-nav
      active-icon="none"
    >
      <q-step name="players" title="Nombre de joueurs" icon="groups">
        <p>Vous êtes combien ?</p>
        <div class="q-gutter-sm">
          <q-option-group
            v-model="criteriaPlayers"
            :options="criteriaPlayersOptions"
            inline
            type="checkbox"
          />
        </div>
      </q-step>

      <q-step name="playTime" title="Temps de jeu" icon="schedule">
        <p>Vous avez combien de temps ?</p>
        <q-option-group
          v-model="criteriaPlayTime"
          :options="criteriaPlayTimeOptions"
          type="checkbox"
        />
      </q-step>

      <q-step name="age" title="Age minimum" icon="family_restroom">
        <p>A partir de quel âge ?</p>
        <div class="q-gutter-sm">
          <q-option-group v-model="criteriaAge" :options="criteriaAgeOptions" inline />
        </div>
      </q-step>

      <q-step name="weight" title="Complexité" icon="psychology">
        <p>Quel niveau de complexité ?</p>
        <div class="q-gutter-sm">
          <q-option-group
            v-model="criteriaWeight"
            :options="criteriaWeightOptions"
            type="checkbox"
          />
        </div>
      </q-step>

      <q-step name="favoriteGames" title="Jeux favoris" icon="thumb_up">
        <p>
          Quels sont vos jeux favoris ?<br />
          <span class="text-caption"
            >Peut-être on aura un jeu avec une mécanique, théme ou créateurs similaires</span
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

        <search-game @input="(game) => criteriaFavoriteGames.push(game)" />
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn @click="nextStep" color="primary" unelevated no-caps :label="nextButtonLabel" />
          <q-btn
            v-if="step !== 'players'"
            flat
            color="primary"
            @click="stepper?.previous()"
            label="Retour"
            no-caps
            class="q-ml-sm"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </div>

  <div v-if="state === 'results'" class="q-pa-md">
    <p>Voilà les résultats</p>

    <q-btn
      unelevated
      label="Faire autre recherche"
      @click="state = 'setup'"
      color="primary"
      no-caps
      icon="arrow_back"
    />

    <template v-for="(suggestion, index) in suggestionResults" :key="suggestion.game.bgg.id">
      <q-separator v-if="index > 0" color="secondary" />
      <div v-if="suggestion.bonus.length">{{ suggestion.bonus }}</div>
      <game-item :game="suggestion.game" />
    </template>
  </div>
</template>

<style scoped></style>
