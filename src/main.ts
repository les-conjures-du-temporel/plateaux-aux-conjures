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
import { initializeApp } from 'firebase/app'
import { getFunctions, httpsCallable } from 'firebase/functions'

const app = createApp(App)

app.use(router)
app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
  lang: quasarLang
})

const firebaseConfig = {
  apiKey: 'AIzaSyBg8ecSB_ogiqWAWCZgWRcOKtkrRFu6fOE',
  authDomain: 'plateaux-aux-conjures.firebaseapp.com',
  projectId: 'plateaux-aux-conjures',
  storageBucket: 'plateaux-aux-conjures.appspot.com',
  messagingSenderId: '656580485619',
  appId: '1:656580485619:web:edaa857b984e6e1bc57286'
}

const firebaseApp = initializeApp(firebaseConfig)
const functions = getFunctions(firebaseApp)
const recordPlayActivity = httpsCallable(functions, 'recordPlayActivity')

// TODO: remove debug
// TODO: set up app check: https://firebase.google.com/docs/app-check/cloud-functions
// TODO: set up region: https://firebase.google.com/docs/functions/locations
recordPlayActivity({ gameId: '262712', day: '2023-12-31', location: 'club' })
  .then((result) => {
    console.log(result)
  })
  .catch((error) => console.warn(error))

const db = new Database(firebaseApp)
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
