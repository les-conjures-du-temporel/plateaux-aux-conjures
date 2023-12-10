import './assets/main.css'

import { createApp } from 'vue'
import router from './router'
import App from '@/App.vue'
import { Database } from '@/database'

const app = createApp(App)

app.use(router)

const db = new Database()
app.provide('db', db)

app.mount('#app')
