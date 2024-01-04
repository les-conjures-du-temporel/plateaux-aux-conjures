<script setup lang="ts">
import SearchGame from '@/components/SearchGame.vue'
import { computed, inject, type Ref, ref } from 'vue'
import type { CloudFunctions } from '@/cloud_functions'
import type { Game, PlayLocation } from '@/database'
import GameItem from '@/components/GameItem.vue'

const MAX_PAST_DAYS = 30

function dateToCalendarStr(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '/')
}

const cloudFunctions: CloudFunctions = inject('cloudFunctions')!
const automaticPassCode = cloudFunctions.automaticPassCode
const manualPassCode = cloudFunctions.manualPassCode

const game: Ref<Game | null> = ref(null)

const today = dateToCalendarStr(new Date())
const minDate = dateToCalendarStr(new Date(Date.now() - MAX_PAST_DAYS * 24 * 3600e3))
const minMonth = minDate.slice(0, 7)
const maxMonth = today.slice(0, 7)
const pickingDate: Ref<boolean> = ref(false)
const playDate: Ref<string> = ref(today)

function isDateValid(date: string): boolean {
  return date <= today && date >= minDate
}

const humanPlayDate = computed(() => {
  const [year, month, day] = playDate.value.split('/')
  return `${day}/${month}/${year}`
})

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
    label: 'À la maison avec un jeu emprunté du club',
    value: 'home'
  },
  {
    label: 'Autre cas',
    value: 'other'
  }
]
const location: Ref<PlayLocation> = ref('club')

const saving: Ref<boolean> = ref(false)
const saveError: Ref<string | null> = ref(null)

function save() {
  saving.value = true
  saveError.value = ''

  doSave()
    .catch((error) => {
      saveError.value = String(error)
    })
    .finally(() => {
      saving.value = false
    })
}

async function doSave() {
  if (!game.value) {
    return
  }

  // Convert to YYYY-MM-DD
  const [year, month, day] = playDate.value.split('/')
  const playDateYyyyMmDd = `${year}-${month}-${day}`

  await cloudFunctions.recordPlayActivity(game.value.bgg.id, playDateYyyyMmDd, location.value)
}
</script>

<template>
  <div class="q-pa-md">
    <p>
      Tu as joué avec nous ? Enregistre ta partie sur cette page pour que nous le sachions.<br />
      Ça nous aide à mieux connaître les jeux tendance :)
    </p>

    <div class="text-h6 q-mt-sm">Quel jeu ?</div>
    <search-game v-if="!game" @input="(selectedGame) => (game = selectedGame)" />
    <div v-if="game">
      <game-item v-if="game" :game="game"></game-item>
      <q-btn unelevated label="Changer" @click="game = null" color="secondary" no-caps />
    </div>

    <div class="text-h6 q-mt-sm">Quand ?</div>
    <p v-if="!pickingDate">
      {{ humanPlayDate }}
      <q-btn
        label="Changer"
        size="sm"
        unelevated
        no-caps
        icon="edit"
        color="secondary"
        class="q-mx-sm"
        @click="pickingDate = true"
      />
    </p>
    <q-date
      v-if="pickingDate"
      v-model="playDate"
      :options="isDateValid"
      no-unset
      :navigation-min-year-month="minMonth"
      :navigation-max-year-month="maxMonth"
      bordered
      flat
      @update:model-value="pickingDate = false"
    />

    <div class="text-h6">Où ?</div>
    <q-option-group v-model="location" :options="locationOptions" type="radio" />

    <div v-if="!automaticPassCode" class="q-my-sm">
      <q-input
        v-model="manualPassCode"
        label="Clé d'accès"
        hint="ce code est affiché dans nos locaux"
      />
    </div>

    <q-banner class="text-white bg-accent" v-if="saveError">
      Erreur dans la requête : {{ saveError }}
    </q-banner>
    <q-btn
      label="Enregistrer"
      @click="save"
      unelevated
      color="primary"
      no-caps
      class="q-my-sm"
      :loading="saving"
      :disable="game === null"
    />
  </div>
</template>

<style scoped></style>
