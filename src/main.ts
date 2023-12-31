import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'

import 'quasar/src/css/index.sass'
import './assets/main.css'

import App from './App.vue'
import { createApp, type Ref, ref } from 'vue'
import { Quasar } from 'quasar'
import quasarLang from 'quasar/lang/fr'
import { Database, type Game, type Translations } from '@/database'
import router from '@/router'

const app = createApp(App)

app.use(router)
app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
  lang: quasarLang
})

const db = new Database()
const games: Ref<Game[]> = ref([])
const translations: Ref<Translations> = ref({
  categories: new Map(),
  mechanics: new Map()
})

app.provide('db', db)
app.provide('games', games)
app.provide('translations', translations)

app.mount('#app')

// Preload games
db.getGames()
  .then((loadedGames) => {
    games.value = loadedGames
  })
  .catch((error) => {
    console.error(`Failed to load games: ${error}`)
  })

db.getTranslations()
  .then((loadedTranslations) => {
    translations.value = loadedTranslations
  })
  .catch((error) => {
    console.error(`Failed to load translations: ${error}`)
  })
