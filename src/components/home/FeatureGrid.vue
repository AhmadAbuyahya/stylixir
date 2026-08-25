<script setup lang="ts">
import { overlayTypes } from '~/lib/overlays'
import templates from '~/lib/templates'

const patternCount = Object.keys(templates).length
const overlayCount = Object.keys(overlayTypes).filter(type => type !== 'none').length

const features = [
  {
    tag: 'Library',
    title: `${patternCount} patterns, and growing`,
    body: 'Zigzags, braided lines, illusioned cubes, hearts, mesh — every one built from layered gradients, not a single external asset.',
  },
  {
    tag: 'Controls',
    title: 'Every number is a dial',
    body: 'Color, size, spacing, angle — even the trig factor behind the triangles — exposed as live sliders and color pickers. Nothing is hardcoded.',
  },
  {
    tag: 'Random',
    title: 'Shuffle colors, geometry, or both',
    body: 'One button rerolls only the palette, one rerolls only the shape math, one rerolls everything. Pick your level of chaos.',
  },
  {
    tag: 'Overlays',
    title: `${overlayCount} ways to fade it out`,
    body: 'Layer a vignette, a directional gradient, or a plain blur on top — for text legibility, or just mood.',
  },
  {
    tag: 'State',
    title: 'The link remembers everything',
    body: 'Every slider drag updates the URL. Copy it mid-tweak and whoever opens it sees your exact pattern, not the default.',
  },
  {
    tag: 'Output',
    title: 'Copy-paste, no build step',
    body: 'One click copies ready-to-drop CSS and HTML. No image export, no canvas, nothing to install.',
  },
]
</script>

<template>
  <section class="border-b-1 border-white/10 bg-#0d0d0d px-6 py-20">
    <div class="mx-auto max-w-1200px">
      <div class="mb-12 max-w-xl">
        <p class="mb-2 font-mono text-xs tracking-widest uppercase text-teal-400">
          What's in the box
        </p>
        <h2 class="font-federo text-2xl tracking-tight uppercase sm:text-3xl">
          Six things worth knowing before you open it
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-px overflow-hidden border-1 border-white/10 rounded-xl bg-white/10 lg:grid-cols-3 sm:grid-cols-2">
        <div v-for="feature in features" :key="feature.tag" class="bg-#0d0d0d p-6">
          <p class="mb-3 font-mono text-xs tracking-widest uppercase text-teal-400/80">
            {{ feature.tag }}
          </p>
          <h3 class="mb-2 text-lg font-semibold text-white">
            {{ feature.title }}
          </h3>
          <p class="text-sm leading-relaxed text-white/60">
            {{ feature.body }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
