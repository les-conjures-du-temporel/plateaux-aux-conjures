<script setup lang="ts">
defineProps<{
  label: string
  terms: string[]
  highlights?: Set<string>
}>()
</script>

<template>
  <template v-if="terms.length">
    <div>{{ label }}</div>

    <div>
      <template v-for="(term, index) in terms" :key="term">
        <br v-if="index > 0" />
        <span :class="{ highlight: highlights?.has(term) }">{{ term }}</span>
      </template>
    </div>
  </template>
</template>

<style scoped>
.highlight {
  text-decoration-line: underline;
  text-decoration-style: solid;
  text-decoration-color: #ca5843;
  text-decoration-thickness: 1px;
  text-decoration-skip-ink: none;
  background-color: rgba(202, 88, 67, 0.2);
}
</style>
