<script setup lang="ts">
import { inject, onBeforeMount, ref, type Ref, watch } from 'vue'
import type { Database, Game, Translations } from '@/database'
import type { CloudFunctions } from '@/cloud_functions'
import { notifyError, notifySuccess } from '@/helpers'
import { useRouter } from 'vue-router'

const db: Database = inject('db')!
const cloudFunctions: CloudFunctions = inject('cloudFunctions')!

const categories: Ref<{ [key: string]: string }> = ref({})
const mechanics: Ref<{ [key: string]: string }> = ref({})
const router = useRouter()

function prepareInputs(translations: Translations, games: Game[]) {
  for (let [en, fr] of translations.categories) {
    categories.value[en] = fr
  }

  for (let [en, fr] of translations.mechanics) {
    mechanics.value[en] = fr
  }

  for (const game of games) {
    for (const category of game.bgg.categories) {
      if (!(category in categories.value)) {
        categories.value[category] = ''
      }
    }

    for (const mechanic of game.bgg.mechanics) {
      if (!(mechanic in mechanics.value)) {
        mechanics.value[mechanic] = ''
      }
    }
  }
}

onBeforeMount(() => {
  prepareInputs(db.translations.value, db.games.value)
})

watch([db.translations, db.games], ([translations, games]) => {
  prepareInputs(translations, games)
})

const submitting = ref(false)

function onSubmit() {
  submitting.value = true

  const newCategories: { [key: string]: string } = {}
  for (const [en, fr] of Object.entries(categories.value)) {
    if (fr) {
      newCategories[en] = fr
    }
  }
  const newMechanics: { [key: string]: string } = {}
  for (const [en, fr] of Object.entries(mechanics.value)) {
    if (fr) {
      newMechanics[en] = fr
    }
  }

  cloudFunctions
    .setTranslations({ categories: newCategories, mechanics: newMechanics })
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
  <p>
    Sur cette page tu trouves les termes en anglais extraits de Board Game Geek et leur traductions
    respectives.
  </p>

  <div class="text-center" v-if="Object.keys(categories).length === 0">
    <q-spinner color="primary" size="5em" />
  </div>

  <q-form @submit="onSubmit" class="q-gutter-md">
    <p class="text-h5 q-my-sm">Catégories</p>

    <q-input
      v-for="en in Object.keys(categories).sort()"
      :key="en"
      v-model="categories[en]"
      :label="en"
      outlined
      dense
    >
      <template v-slot:append>
        <q-icon name="new_releases" color="accent" v-if="!categories[en]" />
      </template>
    </q-input>

    <p class="text-h5 q-my-sm">Mécaniques</p>

    <q-input
      v-for="en in Object.keys(mechanics).sort()"
      :key="en"
      v-model="mechanics[en]"
      :label="en"
      outlined
      dense
    >
      <template v-slot:append>
        <q-icon name="new_releases" color="accent" v-if="!mechanics[en]" />
      </template>
    </q-input>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn label="Sauvegarder" color="primary" type="submit" no-caps :loading="submitting" />
    </q-page-sticky>
  </q-form>
</template>

<style scoped></style>
