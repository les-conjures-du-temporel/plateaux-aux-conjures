<script setup lang="ts">
import { inject, ref, type Ref, watch } from 'vue'
import { GameSearcher } from '@/game_searcher'
import { Database, type Game } from '@/database'
import GameItem from '@/components/GameItem.vue'
import { notifyWarn } from '@/helpers'

const emit = defineEmits<{
  input: [input: Game]
}>()

const games: Ref<Game[]> = inject<Database>('db')!.games
const selectedItem: Ref<Item | null> = ref(null)
const state: Ref<'input' | 'full-search' | 'loading'> = ref('input')
const fullSearchResults: Ref<Game[]> = ref([])

const gameSearcher = new GameSearcher(games)

type Item = {
  label: string
  caption?: string
  value: string
  disable?: boolean
  icon?: string
  badge?: string
  showSpinner: boolean
  class?: string
}
const items: Ref<Item[]> = ref([])
let abortController = new AbortController()
let lastFilterSearchTerm: string | null = null

function filterGameSearch(term: string, doneFn: (callbackFn: () => void) => void) {
  lastFilterSearchTerm = term
  abortController.abort()
  abortController = new AbortController()

  gameSearcher.searchForAutoComplete(term, abortController.signal, (results, searchingBgg) => {
    doneFn(() => {
      const newItems: Item[] = []

      for (const result of results) {
        newItems.push({
          label: result.name,
          caption: result.yearPublished ? `(${result.yearPublished})` : undefined,
          value: result.id,
          badge: result.ownedByClub ? 'jeu du club' : undefined,
          showSpinner: false
        })
      }

      if (searchingBgg) {
        newItems.push({
          label: 'Recherche externe en cours',
          value: '',
          disable: true,
          showSpinner: true
        })
      }

      items.value = newItems
    })
  })
}

function abortGameSearch() {
  abortController.abort()
}

watch(selectedItem, async (newItem) => {
  selectedItem.value = null
  if (!newItem) {
    return
  } else {
    state.value = 'loading'
    try {
      const game = await gameSearcher.loadGame(newItem.value)
      emit('input', game)
      state.value = 'input'
    } catch (error) {
      notifyWarn(error as Error)
      state.value = 'input'
    }
  }
})

function displayFullSearch() {
  if (lastFilterSearchTerm) {
    state.value = 'loading'
    gameSearcher
      .doFullSearch(lastFilterSearchTerm)
      .then((result) => {
        fullSearchResults.value = result
        state.value = 'full-search'
      })
      .catch((error) => {
        notifyWarn(error as Error)
        state.value = 'input'
      })
  }
}

function choseGame(game: Game): void {
  emit('input', game)
  state.value = 'input'
  selectedItem.value = null
}
</script>

<template>
  <q-select
    v-model="selectedItem"
    label="Saisir le nom ou le code conjuré"
    hide-dropdown-icon
    use-input
    fill-input
    hide-selected
    outlined
    input-debounce="100"
    :options="items"
    @filter="filterGameSearch"
    @filter-abort="abortGameSearch"
    v-if="state === 'input'"
    dense
  >
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps" :class="['auto-complete-item', scope.opt.class]">
        <q-item-section>
          <q-item-label>
            {{ scope.opt.label }}
            <span class="text-caption" v-if="scope.opt.caption">{{ scope.opt.caption }}</span>
          </q-item-label>
        </q-item-section>

        <q-item-section avatar v-if="scope.opt.icon || scope.opt.showSpinner">
          <q-icon :name="scope.opt.icon" v-if="scope.opt.icon" />
          <q-spinner color="primary" size="2em" v-if="scope.opt.showSpinner" />
        </q-item-section>

        <q-item-section side v-if="scope.opt.badge">
          <q-badge color="primary" :label="scope.opt.badge" />
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:after-options>
      <q-item class="bg-secondary text-white cursor-pointer" @click.capture="displayFullSearch">
        <q-item-section>
          <q-item-label>Montrer tous les résultats</q-item-label>
        </q-item-section>

        <q-item-section avatar>
          <q-icon name="search" />
        </q-item-section>
      </q-item>
    </template>
  </q-select>

  <div class="text-center" v-if="state === 'loading'">
    <q-spinner color="primary" size="3em" />
  </div>

  <div v-if="state === 'full-search'">
    <q-btn
      unelevated
      label="Faire autre recherche"
      @click="state = 'input'"
      color="primary"
      no-caps
      icon="arrow_back"
    />

    <q-banner class="bg-secondary text-white q-my-sm" v-if="!fullSearchResults.length">
      Aucun résultat n'a été trouvé
    </q-banner>

    <template v-for="(game, index) in fullSearchResults" :key="game.bgg.id">
      <q-separator v-if="index > 0" color="secondary" />
      <game-item :game="game" class="cursor-pointer" @click="choseGame(game)" simple />
    </template>
  </div>
</template>

<style scoped></style>
