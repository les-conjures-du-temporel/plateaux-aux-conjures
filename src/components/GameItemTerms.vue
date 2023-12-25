<script setup lang="ts">
defineProps<{
  label: string
  terms: string[]
  highlights?: Set<string>
}>()
</script>

<template>
  <span v-if="terms.length">
    <q-badge>{{ label }}</q-badge
    >&nbsp;

    <template v-for="(term, index) in terms" :key="term">
      <span v-if="index > 0">, </span>
      <span :class="{ highlight: highlights?.has(term) }">{{ term }}</span>
    </template>

    <br />
  </span>
</template>

<style scoped>
.highlight {
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-decoration-color: #ca5843;
  text-decoration-thickness: 2px;
  text-decoration-skip-ink: none;
}
</style>
