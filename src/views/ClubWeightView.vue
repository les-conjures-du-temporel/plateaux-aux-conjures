<script setup lang="ts">
import { inject, onBeforeMount, ref, type Ref, watch } from 'vue'
import type { ClubWeight, Database, Game } from '@/database'
import type { CloudFunctions } from '@/cloud_functions'
import { notifyError, notifySuccess } from '@/helpers'
import { useRouter } from 'vue-router'

const db: Database = inject('db')!
const cloudFunctions: CloudFunctions = inject('cloudFunctions')!

interface Option {
  label: string
  value: ClubWeight | null
}
const clubWeightOptions: Option[] = [
  {
    label: 'aucun',
    value: null
  },
  {
    label: 'vert',
    value: 'green'
  },
  {
    label: 'bleu',
    value: 'blue'
  },
  {
    label: 'jaune',
    value: 'yellow'
  },
  {
    label: 'rouge',
    value: 'red'
  }
]
const inputs: Ref<{ gameId: string; name: string; clubWeight: Option }[]> = ref([])
const router = useRouter()

function prepareInputs(games: Game[]) {
  const currentByGameId = new Map(inputs.value.map((each) => [each.gameId, each.clubWeight]))

  const newValue = []
  for (const game of games) {
    if (game.ownedByClub) {
      newValue.push({
        gameId: game.bgg.id,
        name: game.name,
        clubWeight: currentByGameId.get(game.bgg.id) || game.clubWeight
      })
    }
  }
  newValue.sort((a, b) => a.name.localeCompare(b.name))

  inputs.value = newValue
}

onBeforeMount(() => {
  prepareInputs(db.games.value)
})

watch([db.games], ([games]) => {
  prepareInputs(games)
})

const submitting = ref(false)

function onSubmit() {
  submitting.value = true

  const gameById = new Map(db.games.value.map((game) => [game.bgg.id, game]))

  const updates = []
  for (const input of inputs.value) {
    if (input.clubWeight !== gameById.get(input.gameId)?.clubWeight) {
      updates.push({ id: input.gameId, updates: { clubWeight: input.clubWeight } })
    }
  }

  console.log(updates)

  cloudFunctions
    .batchUpdateGames([], updates)
    .then(() => {
      router.push({ name: 'home' })
      notifySuccess('Enregistré')
    })
    .catch((error) => {
      notifyError(error)
    })
    .finally(() => {
      submitting.value = false
    })
}
</script>

<template>
  <p>Sur cette page tu trouves le "code couleur" que nous utilisons au club pour noter les jeux:</p>
  <ul>
    <li><q-badge label="vert" color="green" /> : TODO describe these levels</li>
    <li><q-badge label="bleu" color="blue" /> : TODO describe these levels</li>
    <li><q-badge label="jaune" color="yellow" /> : TODO describe these levels</li>
    <li><q-badge label="rouge" color="red" /> : TODO describe these levels</li>
  </ul>

  <div class="text-center" v-if="inputs.length === 0">
    <q-spinner color="primary" size="5em" />
  </div>

  <q-form @submit="onSubmit" class="q-gutter-md q-my-md">
    <div v-for="input in inputs" :key="input.gameId" class="row">
      <div class="col-9">{{ input.name }}</div>
      <q-select
        v-model="input.clubWeight"
        :options="clubWeightOptions"
        outlined
        dense
        class="col-3"
      />
    </div>

    <div style="height: 40px"></div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn label="Sauvegarder" color="primary" type="submit" no-caps :loading="submitting" />
    </q-page-sticky>
  </q-form>
</template>

<style scoped></style>
