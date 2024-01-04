import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import LogPlayView from '@/views/RecordPlayView.vue'
import SuggestView from '@/views/SuggestView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/a-propos',
      name: 'about',
      component: AboutView
    },
    {
      path: '/enregistrer-partie',
      name: 'record-play',
      component: LogPlayView
    },
    {
      path: '/assistant',
      name: 'suggest',
      component: SuggestView
    }
  ]
})

export default router
