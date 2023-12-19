<script setup lang="ts">
import { inject, type Ref, ref, watch } from 'vue'
import SearchGame from '@/components/SearchGame.vue'
import { Database, type Game } from '@/database'
import GameItem from '@/components/GameItem.vue'
import { pluralS } from '@/helpers'

type Interval = [number, number]

const db: Database = inject('db')!
const tab = ref('players')

// Declare possible options
type Option = { label: string; value: Interval }
type MaybeOption = { label: string; value: Interval | null }
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
const criteriaAgeOptions: MaybeOption[] = []
for (let i = 4; i <= 16; i += 2) {
  criteriaAgeOptions.push({ label: String(i), value: [0, i] })
}
criteriaAgeOptions.push({ label: 'Peu importe', value: null })
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

type BonusKind = 'category' | 'mechanic' | 'designer' | 'artist'
type SuggestedGame = { game: Game; bonus: BonusKind[] }
const suggestionResults: Ref<SuggestedGame[] | null> = ref(null)
const loadingSuggestionResults: Ref<boolean> = ref(false)
const tooManyResults: Ref<boolean> = ref(false)

watch(
  [criteriaPlayers, criteriaPlayTime, criteriaAge, criteriaWeight, criteriaFavoriteGames],
  async () => {
    if (
      !criteriaPlayers.value.length &&
      !criteriaPlayTime.value.length &&
      !criteriaAge.value &&
      !criteriaWeight.value.length &&
      !criteriaFavoriteGames.value.length
    ) {
      suggestionResults.value = null
      tooManyResults.value = false
      return
    }

    loadingSuggestionResults.value = true
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

    suggestionResults.value = validGames.slice(0, 50)
    loadingSuggestionResults.value = false
    tooManyResults.value = validGames.length > 50
  }
)

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
  <div class="q-pa-md">
    <p>
      Envie de lancer une partie, mais tu ne sais pas trop quel jeu ?<br />
      Laisse-moi t'aider à trouver ton bonheur dans notre bibliothèque
    </p>

    <q-card>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
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
          :alert="criteriaPlayTime.length ? 'accent' : false"
        />
        <q-tab
          name="age"
          label="Age"
          icon="family_restroom"
          no-caps
          :alert="criteriaAge ? 'accent' : false"
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
          <q-option-group
            v-model="criteriaPlayTime"
            :options="criteriaPlayTimeOptions"
            type="checkbox"
          />
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
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>

  <div class="text-center" v-if="loadingSuggestionResults">
    <q-spinner color="primary" size="3em" />
  </div>

  <div class="q-ma-md" v-if="suggestionResults">
    <q-banner class="bg-secondary text-white" v-if="!suggestionResults.length">
      Aucun résultat n'a été trouvé. Essaye de changer les critères de la recherche
    </q-banner>

    <div v-else>
      <p v-if="tooManyResults">
        Voici les {{ suggestionResults.length }} premières suggéstions. Il y a trop de résultats à
        afficher, essaye de raffiner un peu tes critères
      </p>
      <p v-else>Voici {{ pluralS(suggestionResults.length, 'suggéstion') }}</p>

      <template v-for="(suggestion, index) in suggestionResults" :key="suggestion.game.bgg.id">
        <q-separator v-if="index > 0" color="secondary" />
        <div v-if="suggestion.bonus.length">{{ suggestion.bonus }}</div>
        <game-item :game="suggestion.game" />
      </template>
    </div>
  </div>
</template>

<style scoped></style>
