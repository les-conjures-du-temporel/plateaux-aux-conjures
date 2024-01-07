<script setup lang="ts">
import { inject, onBeforeMount, ref, type Ref } from 'vue'
import type { Database } from '@/database'

const db: Database = inject('db')!

const categories: Ref<Map<string, string | null>> = ref(new Map([['a', ref('b')]]))
</script>

<template>
  <p class="text-h5">Catégories</p>
  <template v-for="[en, fr] in categories" :key="en">
    {{ en }} = <input v-model="fr" /><br />
  </template>
</template>

<style scoped></style>
