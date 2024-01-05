<script setup lang="ts">
import { computed, type ComputedRef } from 'vue'

const props = defineProps<{
  label: string
  terms: string[]
  highlights?: Set<string>
  translations?: Map<string, string>
}>()

const sortedTerms: ComputedRef<
  { text: string; isHighlight: boolean; isMissingTranslation: boolean }[]
> = computed(() => {
  const sortedTerms = []

  for (const term of props.terms) {
    sortedTerms.push({
      text: props.translations?.get(term) || term,
      isHighlight: props.highlights?.has(term) || false,
      isMissingTranslation: props.translations ? !props.translations.has(term) : false
    })
  }

  sortedTerms.sort(
    (a, b) => Number(b.isHighlight) - Number(a.isHighlight) || a.text.localeCompare(b.text)
  )

  return sortedTerms
})
</script>

<template>
  <template v-if="terms.length">
    <div>{{ label }}</div>

    <div>
      <template v-for="(term, index) in sortedTerms" :key="term">
        <br v-if="index > 0" />
        <span
          :class="{
            highlight: term.isHighlight,
            'text-italic': term.isMissingTranslation
          }"
          >{{ term.text }}</span
        >
      </template>
    </div>
  </template>
</template>

<style scoped>
.highlight {
  background-color: rgba(110, 190, 177, 0.25);
}
</style>
