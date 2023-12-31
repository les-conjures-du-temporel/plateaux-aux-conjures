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
// Note: the region must be the same one for the deployed function
const functions = getFunctions(firebaseApp, 'europe-west1')
const recordPlayActivity = httpsCallable(functions, 'recordPlayActivity')

const db = new Database(firebaseApp)
const games: Ref<Game[]> = ref([])
const translations: Ref<Translations> = ref({
  categories: new Map(),
  mechanics: new Map()
})

const passCode: Ref<string | null> = ref(null)

app.provide('db', db)
app.provide('games', games)
app.provide('translations', translations)
app.provide('passCode', passCode)

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

// Try to get the code from the current url, like '/some-page#yada'
const hash = window.location.hash
if (hash.startsWith('#') && hash.length > 1) {
  passCode.value = hash.slice(1)

  // Reload route to remove the hash value
  router.replace(router.currentRoute.value).then(() => {})
}
