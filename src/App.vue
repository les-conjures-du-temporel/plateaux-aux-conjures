<script setup lang="ts">
import { RouterView } from 'vue-router'
import { useRouter } from 'vue-router'

import { ref } from 'vue'
const leftDrawerOpen = ref(false)
const router = useRouter()

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<template>
  <q-layout view="hHh Lpr fff">
    <q-header class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />

        <q-toolbar-title>
          <span v-if="router.currentRoute.value.name == 'home'">Accueil</span>
          <span v-if="router.currentRoute.value.name == 'suggest'">L'assistant</span>
          <span v-if="router.currentRoute.value.name == 'collection'">Ludothèque</span>
          <span v-if="router.currentRoute.value.name == 'games'">Les jeux du moment</span>
          <span v-if="router.currentRoute.value.name == 'record-play'">Enregistre ta partie</span>
          <span v-if="router.currentRoute.value.name == 'about'">A propos</span>
          <span v-if="router.currentRoute.value.name == 'translations'">Modifier traductions</span>
          <span v-if="router.currentRoute.value.name == 'festival'">L'assistant du festival</span>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" overlay elevated no-swipe-open>
      <q-scroll-area class="fit">
        <div class="text-center q-pa-sm">
          <img style="height: 100px" src="/logo-conjures.png" alt="Logo des conjurés du temporel" />
        </div>

        <q-separator spaced />

        <q-tabs vertical no-caps inline-label active-bg-color="primary">
          <q-route-tab :to="{ name: 'home' }" label="Accueil" icon="home" />
          <q-route-tab :to="{ name: 'suggest' }" label="L'assistant" icon="tips_and_updates" />
          <q-route-tab :to="{ name: 'collection' }" label="Ludothèque" icon="widgets" />
          <q-route-tab :to="{ name: 'games' }" label="Les jeux du moment" icon="flare" />
          <q-route-tab
            :to="{ name: 'record-play' }"
            label="Enregistre ta partie"
            icon="rate_review"
          />
          <q-route-tab :to="{ name: 'about' }" label="A propos" icon="info" />
        </q-tabs>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <q-page padding class="page">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </q-page>
    </q-page-container>

    <q-footer class="bg-grey-8 text-white">
      <q-toolbar>
        <q-toolbar-title>
          <span class="footer">&copy; 2023 les conjurés du temporel</span>
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<style scoped>
.page {
  max-width: 1024px;
  margin-left: auto;
  margin-right: auto;
}

.footer {
  font-size: 0.5em;
}
</style>
