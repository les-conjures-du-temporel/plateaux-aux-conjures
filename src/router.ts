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
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/record-play',
      name: 'record-play',
      component: LogPlayView
    },
    {
      path: '/suggest',
      name: 'suggest',
      component: SuggestView
    }
  ]
})

export default router
