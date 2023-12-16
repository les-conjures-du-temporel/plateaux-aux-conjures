<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QStepper } from 'quasar'

const stepper = ref<InstanceType<typeof QStepper> | null>(null)
const step = ref('players')

const criteriaPlayers = ref([])
const criteriaPlayTime = ref([])
const criteriaAge = ref([])
const criteriaWeight = ref([])

const nextButtonLabel = computed(() => {
  let criteria

  if (step.value === 'players') {
    criteria = criteriaPlayers.value
  } else if (step.value === 'playTime') {
    criteria = criteriaPlayTime.value
  } else if (step.value === 'age') {
    criteria = criteriaAge.value
  } else if (step.value === 'weight') {
    criteria = criteriaWeight.value
  } else {
    return 'Continuer'
  }

  return criteria.length ? 'Continuer' : 'Peu importe'
})

/*
criteria:
- number of players
- play time
- min age
- weight

game criteria:
- categories
- mechanics
- designers
- artists

- must be owned by the club

- bonus for:
- recent play
- good rating

 */
</script>

<template>
  <p>Explain the concept</p>

  <div class="q-pa-md">
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
          <q-checkbox v-model="criteriaPlayers" :val="1" label="1" />
          <q-checkbox v-model="criteriaPlayers" :val="2" label="2" />
          <q-checkbox v-model="criteriaPlayers" :val="3" label="3" />
          <q-checkbox v-model="criteriaPlayers" :val="4" label="4" />
          <q-checkbox v-model="criteriaPlayers" :val="5" label="5" />
          <q-checkbox v-model="criteriaPlayers" :val="6" label="6" />
          <q-checkbox v-model="criteriaPlayers" :val="7" label="7" />
          <q-checkbox v-model="criteriaPlayers" :val="8" label="8" />
          <q-checkbox v-model="criteriaPlayers" :val="9" label="9" />
          <q-checkbox v-model="criteriaPlayers" :val="10" label="10+" />
        </div>
      </q-step>

      <q-step name="playTime" title="Temps de jeu" icon="schedule">
        <p>Vous avez combien de temps ?</p>
        <q-checkbox v-model="criteriaPlayTime" :val="0" label="moins de 15 minutes" /><br />
        <q-checkbox v-model="criteriaPlayTime" :val="15" label="entre 15 et 30 minutes" /><br />
        <q-checkbox v-model="criteriaPlayTime" :val="30" label="entre 30 et 60 minutes" /><br />
        <q-checkbox v-model="criteriaPlayTime" :val="60" label="entre 60 et 120 minutes" /><br />
        <q-checkbox v-model="criteriaPlayTime" :val="120" label="plus de 120 minutes" />
      </q-step>

      <q-step name="age" title="Age minimum" icon="family_restroom">
        <p>A partir de quel âge ?</p>
        <div class="q-gutter-sm">
          <q-checkbox v-model="criteriaAge" :val="4" label="4" />
          <q-checkbox v-model="criteriaAge" :val="6" label="6" />
          <q-checkbox v-model="criteriaAge" :val="8" label="8" />
          <q-checkbox v-model="criteriaAge" :val="10" label="10" />
          <q-checkbox v-model="criteriaAge" :val="12" label="12" />
          <q-checkbox v-model="criteriaAge" :val="14" label="14" />
          <q-checkbox v-model="criteriaAge" :val="16" label="16" />
        </div>
      </q-step>

      <q-step name="weight" title="Complexité" icon="psychology">
        <p>Quel niveau de complexité ?</p>
        <div class="q-gutter-sm">
          <q-checkbox v-model="criteriaWeight" :val="0" label="léger" />
          <q-checkbox v-model="criteriaWeight" :val="2" label="intermédiaire" />
          <q-checkbox v-model="criteriaWeight" :val="3" label="dense" />
        </div>
      </q-step>

      <q-step name="favoriteGames" title="Jeux favoris" icon="thumb_up">
        <p>Quels sont vos jeux favoris ?</p>
      </q-step>

      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            @click="stepper?.next()"
            color="primary"
            unelevated
            no-caps
            :label="nextButtonLabel"
          />
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
</template>

<style scoped></style>
