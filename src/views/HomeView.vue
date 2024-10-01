<script setup lang="ts">
import { useRouter } from 'vue-router'
import { inject, type Ref } from 'vue'

const router = useRouter()

const festivalMode = inject<Ref<boolean>>('festivalMode')
</script>

<template>
  <div class="text-center">
    <img style="height: 150px" src="/logo-conjures.png" alt="Logo des conjurés du temporel" />
  </div>

  <p class="text-h5">Nos outils pour les jeux de plateau</p>

  <q-card class="q-my-sm cursor-pointer" @click="router.push({ name: 'suggest' })">
    <q-card-section>
      <div class="text-h6"><q-icon name="tips_and_updates" /> L'assistant</div>
      <div>Laisse-moi t'aider à choisir un jeu dans notre bibliothèque</div>
    </q-card-section>
  </q-card>

  <q-card class="q-my-sm cursor-pointer" @click="router.push({ name: 'collection' })">
    <q-card-section>
      <div class="text-h6"><q-icon name="widgets" /> Ludothèque</div>
      <div>La liste complète de nos jeux</div>
    </q-card-section>
  </q-card>

  <q-card class="q-my-sm cursor-pointer" @click="router.push({ name: 'games' })">
    <q-card-section>
      <div class="text-h6"><q-icon name="flare" /> Les jeux du moment</div>
      <div>Vois à quoi on joue en ce moment</div>
    </q-card-section>
  </q-card>

  <q-card class="q-my-sm cursor-pointer" @click="router.push({ name: 'record-play' })">
    <q-card-section>
      <div class="text-h6"><q-icon name="rate_review" /> Enregistre ta partie</div>
      <div>Dis-nous à quoi tu as joué avec nous</div>
    </q-card-section>
  </q-card>

  <div class="q-ma-md">
    <q-icon name="festival" />
    <q-toggle v-model="festivalMode" label="Montrer seulement les jeux du festival" />
  </div>
</template>

<style scoped></style>
