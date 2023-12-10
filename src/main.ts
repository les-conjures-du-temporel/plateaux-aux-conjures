import '~/styles/index.scss'

import { createApp } from 'vue'
import router from './router'
import App from '@/App.vue'
import { Database } from '@/database'
import ElementPlus from 'element-plus'

const app = createApp(App)

app.use(router)
app.use(ElementPlus)

const db = new Database()
app.provide('db', db)

app.mount('#app')
