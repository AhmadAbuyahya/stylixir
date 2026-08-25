<script setup lang="ts">
import templates from '~/lib/templates'
import { patternToQuery } from '~/lib/pattern'
import { useRandomPattern } from '~/composables/useRandomPattern'

const templateSlugs = Object.keys(templates)
const patternCount = templateSlugs.length

const {
  style: heroStyle,
  slug: heroSlug,
  variables: heroVariables,
  version: heroVersion,
  shuffle: shuffleHeroPattern,
} = useRandomPattern(templateSlugs[0])
const { style: backdropPatternStyle, slug: backdropSlug, version: backdropVersion, shuffle: shuffleBackdrop } = useRandomPattern(templateSlugs[1])

const backdropStyle = computed(() => ({
  ...backdropPatternStyle.value,
  filter: 'blur(5px) brightness(0.4) saturate(1.4)',
}))

const generatorTo = computed(() => ({
  path: '/generator',
  query: patternToQuery(heroSlug.value, heroVariables.value),
}))

function shuffleHero() {
  shuffleHeroPattern({ exclude: backdropSlug.value })
  shuffleBackdrop({ exclude: heroSlug.value })
}

onMounted(() => {
  if (heroSlug.value === backdropSlug.value)
    shuffleBackdrop({ exclude: heroSlug.value })
})
</script>

<template>
  <section class="relative overflow-hidden border-b-1 border-white/10">
    <!-- ambient, blurred pattern — independent of the featured square so
         the two layers never read as the same texture -->
    <div :key="backdropVersion" class="pointer-events-none absolute inset-0 opacity-70" :style="backdropStyle" />
    <div class="pointer-events-none absolute inset-0 from-#0d0d0d/10 via-#0d0d0d/70 to-#0d0d0d bg-gradient-to-b" />

    <div class="relative grid mx-auto max-w-1200px gap-14 px-6 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 md:py-28">
      <div>
        <p class="mb-5 inline-flex items-center gap-2 border-1 border-teal-400/30 rounded-full bg-teal-400/10 px-3 py-1 font-mono text-xs text-teal-300">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400" />
          {{ patternCount }} patterns · unlimited combinations
        </p>

        <h1 class="font-federo text-4xl leading-none tracking-tight uppercase lg:text-6xl sm:text-5xl">
          Random,
          <span class="block text-teal-400">but on purpose.</span>
        </h1>

        <p class="mt-6 max-w-md text-lg text-white/70">
          Stylixir builds backgrounds out of layered conic, radial and linear gradients doing all the work — no image files, no canvas, nothing to install. Mash shuffle for something new, or drag a slider until it's exactly yours.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <RouterLink :to="generatorTo" class="items-center gap-2 px-6 py-3 text-base btn !flex">
            Open the Generator
            <div class="i-carbon-arrow-up-right" />
          </RouterLink>
          <button class="button px-5 py-3" @click="shuffleHero()">
            <div class="i-carbon-shuffle" />
            Shuffle patterns
          </button>
        </div>
      </div>

      <div class="relative mx-auto aspect-4/3 max-w-lg w-full">
        <div class="absolute inset-0 overflow-hidden border-1 border-white/10 rounded-2xl shadow-2xl shadow-black/50">
          <PatternCanvas :style="heroStyle" :version="heroVersion" />
        </div>
      </div>
    </div>
  </section>
</template>
