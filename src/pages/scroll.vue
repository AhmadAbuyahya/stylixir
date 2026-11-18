<script setup lang="ts">
import { DEFAULT_EFFECTS, FRAME_LAYERS, buildFrame } from '~/lib/effects'
import { defaultVariables } from '~/lib/pattern'
import templates from '~/lib/templates'

defineOptions({
  name: 'ScrollPage',
})

const effects = { ...DEFAULT_EFFECTS, shape: 0.8, color: 0.25 }

// Each section is two screens tall and its pattern sticks while the page scrolls past,
// so the time-based loops buildFrame makes are re-timed onto the section's view timeline.
const scenes = Object.entries(templates).map(([slug, { template, variables }], index) => {
  const name = `sc${index}`
  const frame = buildFrame({ template, variables, values: defaultVariables(variables), effects, name, filterId: `${name}-warp` })
  const count = frame.pattern.animation?.split(', ').length ?? 0
  if (count) {
    Object.assign(frame.pattern, {
      'animation-duration': 'auto',
      'animation-delay': '0s',
      // Different swing counts per dial so they drift apart instead of moving in lockstep.
      'animation-iteration-count': Array.from({ length: count }, (_, i) => [2, 3, 1, 4][i % 4]).join(', '),
      'animation-direction': 'alternate',
      'animation-fill-mode': 'both',
      'animation-timeline': '--scene',
      'animation-range': 'cover',
    })
  }
  return {
    slug,
    number: String(index + 1).padStart(3, '0'),
    title: slug.replace(/_/g, ' '),
    frame,
    layers: FRAME_LAYERS.filter(layer => frame[layer]),
  }
})

useStyleTag(scenes.map(scene => scene.frame.css).join('\n'))
</script>

<template>
  <main class="bg-black">
    <section v-for="scene in scenes" :key="scene.slug" class="scene relative h-[200vh]">
      <div class="sticky top-0 isolate h-screen overflow-clip" style="container-type: size">
        <div v-for="layer in scene.layers" :key="layer" :style="scene.frame[layer]" />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="scene.frame.filterMarkup" class="contents" v-html="scene.frame.filterMarkup" />
        <p class="absolute bottom-6 left-6 font-mono text-sm tracking-widest uppercase text-white mix-blend-difference">
          {{ scene.number }} · {{ scene.title }}
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.scene {
  view-timeline: --scene block;
}
</style>

<route lang="yaml">
meta:
  layout: home
</route>
