import '@quasar/extras/roboto-font/roboto-font.css'
import '@quasar/extras/material-icons/material-icons.css'

import 'quasar/src/css/index.sass'
import './assets/main.css'

import App from './App.vue'
import { createApp } from 'vue'
import { Quasar } from 'quasar'
import quasarLang from 'quasar/lang/fr'
import { Database } from '@/database'
import router from '@/router'
import { GameSeacher } from '@/game_searcher'

const app = createApp(App)

app.use(router)
app.use(Quasar, {
  plugins: {}, // import Quasar plugins and add here
  lang: quasarLang
})

const db = new Database()
app.provide('db', db)
app.provide('gameSearcher', new GameSeacher(db))

app.mount('#app')
