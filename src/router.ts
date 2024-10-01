import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AboutView from '@/views/AboutView.vue'
import LogPlayView from '@/views/RecordPlayView.vue'
import SuggestView from '@/views/SuggestView.vue'
import GamesView from '@/views/GamesView.vue'
import TranslationsView from '@/views/TranslationsView.vue'
import CollectionView from '@/views/CollectionView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/assistant',
      name: 'suggest',
      component: SuggestView
    },
    {
      path: '/jeux',
      name: 'games',
      component: GamesView
    },
    {
      path: '/partie',
      name: 'record-play',
      component: LogPlayView
    },
    {
      path: '/a-propos',
      name: 'about',
      component: AboutView
    },
    {
      path: '/traductions',
      name: 'translations',
      component: TranslationsView
    },
    {
      path: '/ludotheque',
      name: 'collection',
      component: CollectionView
    },
    {
      path: '/festival',
      name: 'festival',
      component: SuggestView
    }
  ]
})

export default router
