<script setup lang="ts">
import SearchGame from '@/components/SearchGame.vue'
import { computed, inject, type Ref, ref } from 'vue'
import type { CloudFunctions } from '@/cloud_functions'
import { Database, type Game, type PlayLocation } from '@/database'
import GameItem from '@/components/GameItem.vue'
import { useRouter } from 'vue-router'
import { notifyError, notifySuccess } from '@/helpers'

const router = useRouter()

const MAX_PAST_DAYS = 30

function dateToCalendarStr(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '/')
}

const db: Database = inject('db')!
const cloudFunctions: CloudFunctions = inject('cloudFunctions')!

const game: Ref<Game | null> = ref(null)

const today = dateToCalendarStr(new Date())
const minDate = dateToCalendarStr(new Date(Date.now() - MAX_PAST_DAYS * 24 * 3600e3))
const minMonth = minDate.slice(0, 7)
const maxMonth = today.slice(0, 7)
const isPickingDate: Ref<boolean> = ref(false)
const pickingDate: Ref<string | null> = ref(null)
const playDate: Ref<string> = ref(today)

function isDateValid(date: string): boolean {
  return date <= today && date >= minDate
}

const humanPlayDate = computed(() => {
  const [year, month, day] = playDate.value.split('/')
  return `${day}/${month}/${year}`
})

function startDatePick() {
  isPickingDate.value = true
  pickingDate.value = null
}

function endDatePick() {
  if (pickingDate.value) {
    playDate.value = pickingDate.value
    isPickingDate.value = false
  }
}

const locationOptions: { label: string; value: PlayLocation }[] = [
  {
    label: 'Dans les locaux du club',
    value: 'club'
  },
  {
    label: 'Dans un festival avec les animateurs du club',
    value: 'festival'
  },
  {
    label: 'Autre part avec un jeu emprunté au club',
    value: 'home'
  },
  {
    label: 'Autre cas',
    value: 'other'
  }
]
const location: Ref<PlayLocation> = ref('club')

const passCode: Ref<string | null> = inject('passCode')!
const isChangingPassCode: Ref<boolean> = ref(!passCode.value)

const saving: Ref<boolean> = ref(false)

function save() {
  saving.value = true

  doSave()
    .catch((error) => {
      if ('code' in error && error.code === 'functions/unauthenticated') {
        notifyError(error, "Clé d'accès invalide")
      } else {
        notifyError(error)
      }
    })
    .finally(() => {
      saving.value = false
    })
}

/**
 * Convert from YYYY/MM/DD to YYYY-MM-DD
 */
function convertCalendarToIso(date: string): string {
  return date.replace(/\//g, '-')
}

async function doSave() {
  if (!game.value) {
    return
  }

  const gameId = game.value.bgg.id
  if (db.games.value.every((dbGame) => dbGame.bgg.id !== gameId)) {
    // Insert new game
    await cloudFunctions.batchUpdateGames([{ id: gameId, value: game.value }], [])
  }

  await cloudFunctions.recordPlayActivity(
    gameId,
    convertCalendarToIso(playDate.value),
    location.value
  )

  notifySuccess('Partie enregistrée')

  game.value = null

  db.reloadGames()
  await router.push({ name: 'home' })
}
</script>

<template>
  <div class="q-pa-md">
    <p>
      Tu as joué avec nous ? Enregistre ta partie sur cette page pour que nous le sachions.<br />
      Ça nous aide à mieux connaître les jeux tendance :)
    </p>

    <div class="text-h6 q-my-sm">
      Quel jeu ?
      <q-btn
        v-if="game"
        label="Changer"
        size="sm"
        unelevated
        no-caps
        icon="edit"
        color="secondary"
        class="q-mx-sm"
        @click="game = null"
      />
    </div>
    <search-game v-if="!game" @input="(selectedGame) => (game = selectedGame)" />
    <game-item v-if="game" :game="game" show-total-plays></game-item>

    <div class="text-h6 q-my-sm">
      Quand ?
      <q-btn
        v-if="!isPickingDate"
        label="Changer"
        size="sm"
        unelevated
        no-caps
        icon="edit"
        color="secondary"
        class="q-mx-sm"
        @click="startDatePick"
      />
    </div>
    <p v-if="!isPickingDate">
      {{ humanPlayDate }}
    </p>
    <q-date
      v-if="isPickingDate"
      v-model="pickingDate"
      :options="isDateValid"
      :navigation-min-year-month="minMonth"
      :navigation-max-year-month="maxMonth"
      bordered
      flat
      minimal
      @update:model-value="endDatePick"
    />

    <q-banner
      class="bg-warning q-my-sm"
      v-if="game && game.lastPlayed === convertCalendarToIso(playDate)"
    >
      <div class="row q-gutter-sm">
        <div class="col-auto"><q-icon name="warning" size="sm" /></div>
        <div class="col">
          Quelqu'un a déjà enregistré une partie de ce jeu à cette date.<br />
          Si vous avez joué ensemble, inutile de l'enregistrer aussi.
        </div>
      </div>
    </q-banner>

    <div class="text-h6">Où ?</div>
    <q-option-group v-model="location" :options="locationOptions" type="radio" />

    <div class="text-h6 q-my-sm">
      Clé d'accès
      <q-btn
        v-if="!isChangingPassCode"
        label="Changer"
        size="sm"
        unelevated
        no-caps
        icon="edit"
        color="secondary"
        class="q-mx-sm"
        @click="isChangingPassCode = true"
      />
    </div>
    <div v-if="isChangingPassCode">
      <q-input v-model="passCode" label="Saisis la clé de 8 caractères" outlined mask="XXXX XXXX" />
    </div>
    <div v-else>
      <code>{{ passCode }}</code>
    </div>
    <div class="text-caption">
      Ce code est affiché dans nos locaux et on l'utilise pour nous assurer que seulement nos
      membres peuvent enregistrer ses parties
    </div>

    <q-btn
      label="Enregistrer"
      @click="save"
      unelevated
      color="primary"
      no-caps
      class="q-my-sm"
      :loading="saving"
      :disable="game === null || !passCode"
    />
  </div>
</template>

<style scoped></style>
