import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'

import 'quasar/src/css/index.sass'

import App from './App.vue'
import { createApp, type Ref, ref, watch } from 'vue'
import { Notify, Quasar } from 'quasar'
import quasarLang from 'quasar/lang/fr'
import { Database } from '@/database'
import router from '@/router'
import { initializeApp } from 'firebase/app'
import { CloudFunctions } from '@/cloud_functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

const app = createApp(App)

app.use(router)
app.use(Quasar, {
  plugins: { Notify },
  lang: quasarLang
})

const firebaseConfig = {
  apiKey: 'AIzaSyBg8ecSB_ogiqWAWCZgWRcOKtkrRFu6fOE',
  authDomain: 'plateaux-aux-conjures.firebaseapp.com',
  databaseURL: 'https://plateaux-aux-conjures-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'plateaux-aux-conjures',
  storageBucket: 'plateaux-aux-conjures.appspot.com',
  messagingSenderId: '656580485619',
  appId: '1:656580485619:web:edaa857b984e6e1bc57286'
}

const firebaseApp = initializeApp(firebaseConfig)

declare global {
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: string
  }
}
if (import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN) {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN
}
initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaV3Provider('6LdgekYpAAAAAM7LSJeKJ5zMaUEYVaswk519D3eV'),
  isTokenAutoRefreshEnabled: true
})

const db = new Database(firebaseApp)

const passCode: Ref<string | null> = ref(localStorage.getItem('passCode'))
const cloudFunctions = new CloudFunctions(firebaseApp, passCode)
const isFestivalMode = ref<boolean>(localStorage.getItem('isFestivalMode') !== null)

app.provide('db', db)
app.provide('cloudFunctions', cloudFunctions)
app.provide('passCode', passCode)
app.provide('isFestivalMode', isFestivalMode)

app.mount('#app')

// Store and recover the pass code from local storage
watch(passCode, (passCode) => {
  if (passCode) {
    localStorage.setItem('passCode', passCode)
  }
})

// Store and recover the festival mode from local storage
watch(isFestivalMode, (isFestivalMode) => {
  if (isFestivalMode) {
    localStorage.setItem('isFestivalMode', 'true')
  } else {
    localStorage.removeItem('isFestivalMode')
  }
})

// Try to get the code from the current url, like '/some-page#yada'
router.beforeEach((to) => {
  if (to.name === 'festival') {
    isFestivalMode.value = true
  }

  const hash = to.hash
  if (hash.startsWith('#') && hash.length > 1) {
    passCode.value = hash.slice(1)

    // Reload route to remove the hash value
    router.replace({ ...to, hash: '' }).then(() => {})
  }
})
