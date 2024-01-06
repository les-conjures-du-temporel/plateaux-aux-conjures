<script setup lang="ts">
import type { CloudFunctions } from '@/cloud_functions'
import { inject, type Ref } from 'vue'

const passCode: Ref<string | null> = inject('passCode')!
</script>

<template>
  <p>
    Ce site a été créé par les conjurés du temporel. Nous somme une association de jeux de plateaux
    et jeux de rôle à Angers, France. Visite notre site
    <a href="https://lesconjuresdutemporel.fr" target="_blank">lesconjuresdutemporel.fr</a> pour en
    savoir plus. Et si tu habites dans le coins, viens nous voir !
  </p>

  <p>
    Une bonne partie des informations affichées dans ce site sont extraites du site Board Game Geek.
    Tu peux voir notre collection sur
    <a href="https://boardgamegeek.com/collection/user/lesconjures" target="_blank"
      >boardgamegeek.com/collection/user/lesconjures</a
    >.
  </p>

  <p>
    Le code source de cette application web est disponible sur
    <a href="https://github.com/sitegui/plateaux-aux-conjures" target="_blank">github.com</a>
  </p>

  <q-separator inset spaced />

  <p class="text-h5">Outils d'administration</p>

  <q-banner v-if="!passCode" class="bg-warning q-my-sm"
    >Pour accéder à ces fonctionnalités, il faut scanner le QR code affiché dans nos
    locaux</q-banner
  >

  <p class="q-my-sm">
    Pour remettre à jour les informations sur cette application à partir de notre collection sur
    Board Game Geek, c'est par ici. Ça doit être fait à chaque fois que nous ajoutons des jeux sur
    la plateforme.
  </p>
  <q-btn
    label="Mettre à jour la bibliothèque"
    no-caps
    color="primary"
    unelevated
    :disable="!passCode"
  />

  <p class="q-my-sm">
    Les catégories et mécaniques de chaque jeu sont écrites en anglais sur le site de Board Game
    Geek. Pour changer la traduction c'est par ici :
  </p>
  <q-btn label="Modifier les traductions" no-caps color="primary" unelevated :disable="!passCode" />

  <p class="q-my-sm">
    Pour extraire toutes les informations présentes sur l'application c'est par ici. Ceci est utile
    si tu veux faire des analyses des parties enregistrées :
  </p>
  <q-btn label="Télécharger les parties" no-caps color="primary" unelevated />
</template>

<style scoped></style>
