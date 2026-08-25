<script setup lang="ts">
import templates from '~/lib/templates'
import { buildStyle, defaultVariables } from '~/lib/pattern'

const slugs = Object.keys(templates)

function styleFor(slug: string) {
  return buildStyle(slug, templates, defaultVariables(templates[slug].variables))
}
</script>

<template>
  <section class="border-b-1 border-white/10 bg-#0d0d0d px-6 py-20">
    <div class="mx-auto max-w-1200px">
      <div class="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="mb-2 font-mono text-xs tracking-widest uppercase text-teal-400">
            Library
          </p>
          <h2 class="font-federo text-2xl tracking-tight uppercase sm:text-3xl">
            {{ slugs.length }} starting points, all yours to bend
          </h2>
        </div>
        <p class="max-w-sm text-sm text-white/60">
          Click any of these to open it straight in the generator — every color, size and angle underneath is still a live dial.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3">
        <RouterLink
          v-for="slug in slugs"
          :key="slug"
          :to="`/generator?template=${slug}`"
          class="group relative aspect-square overflow-hidden border-1 border-white/10 rounded-lg transition-all duration-200 hover:scale-105 hover:border-teal-400/60"
        >
          <div class="absolute inset-0" :style="styleFor(slug)" />
          <span class="absolute inset-0 flex items-end from-black/85 via-black/5 to-transparent bg-gradient-to-t p-2">
            <span class="font-mono text-xs capitalize text-white/90">{{ slug.replace(/_/g, ' ') }}</span>
          </span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
