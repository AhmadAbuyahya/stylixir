<script setup lang="ts">
import startCase from 'lodash.startcase'
import { storeToRefs } from 'pinia'
import ColorInput from './ColorInput.vue'
import { overlayTypes } from '~/lib/overlays'
import { useActiveTemplateStore } from '~/stores/activeTemplate'

const overlayLabels: Record<string, string> = {
  'none': 'None',
  'opacity': 'Wash',
  'linear-gradient-top': 'Fade up',
  'linear-gradient-right': 'Fade right',
  'linear-gradient-bottom': 'Fade down',
  'linear-gradient-left': 'Fade left',
  'radial-gradient-center': 'Vignette',
  'radial-gradient-center-out': 'Spotlight',
  'linear-gradient-inner': 'Letterbox',
  'linear-gradient-outer': 'Center fade',
  'linear-gradient-inner-horizontal': 'Pillarbox',
  'linear-gradient-outer-horizontal': 'Center fade H',
}

const activeTemplateStore = useActiveTemplateStore()
const { variables, variablesRef, overlayVariables } = storeToRefs(activeTemplateStore)

const shapeVars = computed(() =>
  Object.entries(variables.value).filter(([, variable]) => variable.type !== 'color'),
)
const colorVars = computed(() =>
  Object.entries(variables.value).filter(([, variable]) => variable.type === 'color'),
)

function setOverlayType(type: string) {
  overlayVariables.value.overlayType = type
}

function formatDial(value: string | number) {
  const n = Number(value)
  if (Number.isNaN(n))
    return String(value)
  if (Number.isInteger(n))
    return String(n)
  return n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}
</script>

<template>
  <aside class="min-h-0 flex flex-col overflow-hidden border-t-1 border-white/10 bg-#0d0d0d text-left md:h-full md:border-l-1 md:border-t-0">
    <div class="grid grid-cols-2 shrink-0 gap-2 border-b-1 border-white/10 p-4">
      <button class="desk-action" type="button" @click="activeTemplateStore.randomizeNumberValues">
        <div class="i-carbon-grid" />
        Shuffle shape
      </button>
      <button class="desk-action" type="button" @click="activeTemplateStore.randomizeColors">
        <div class="i-carbon-color-palette" />
        Shuffle colors
      </button>
      <button class="desk-action desk-action-accent" type="button" @click="activeTemplateStore.randomizeAll">
        <div class="i-carbon-shuffle" />
        Shuffle both
      </button>
      <button class="desk-action" type="button" @click="activeTemplateStore.reset">
        <div class="i-carbon-restart" />
        Reset
      </button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 py-5">
      <section v-if="shapeVars.length" class="mb-7">
        <p class="mb-3 font-mono text-10px tracking-widest uppercase text-teal-400/80">
          Shape
        </p>
        <div class="flex flex-col gap-4">
          <div v-for="[key, value] in shapeVars" :key="key">
            <div class="mb-1.5 flex items-baseline justify-between gap-3">
              <label class="font-mono text-xs text-white/60" :for="String(key)">
                {{ startCase(String(key)) }}
              </label>
              <span class="font-mono text-xs text-white/40">{{ formatDial(variablesRef[key]) }}</span>
            </div>
            <input
              :id="String(key)"
              v-model="variablesRef[key]"
              :type="value.type"
              :min="value.min"
              :max="value.max"
              :step="value.step"
              class="desk-input"
            >
          </div>
        </div>
      </section>

      <section v-if="colorVars.length" class="mb-7">
        <p class="mb-3 font-mono text-10px tracking-widest uppercase text-teal-400/80">
          Color
        </p>
        <div class="flex flex-col gap-4">
          <div v-for="[key] in colorVars" :key="key">
            <label class="mb-1.5 block font-mono text-xs text-white/60">
              {{ startCase(String(key)) }}
            </label>
            <ColorInput v-model="variablesRef[key]" />
          </div>
        </div>
      </section>

      <section class="mb-8">
        <p class="mb-3 font-mono text-10px tracking-widest uppercase text-teal-400/80">
          Overlay
        </p>
        <div class="mb-4">
          <label class="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-xs text-white/60">
            Blur
            <span class="text-white/40">{{ overlayVariables.overlayBlur }}</span>
          </label>
          <input
            v-model="overlayVariables.overlayBlur"
            type="range"
            min="0"
            max="20"
            step="1"
            class="desk-input"
          >
        </div>

        <p class="mb-2 font-mono text-xs text-white/60">
          Fade
        </p>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            v-for="(config, type) in overlayTypes"
            :key="type"
            type="button"
            class="overflow-hidden border-1 border-white/10 rounded-md bg-#ccc p-0 outline-none transition-all hover:border-white/25 focus-visible:ring-2 focus-visible:ring-teal-400"
            :class="{ 'border-teal-400 ring-1 ring-teal-400': overlayVariables.overlayType === type }"
            :title="overlayLabels[type] ?? type"
            @click="setOverlayType(type)"
          >
            <div
              v-if="type !== 'none'"
              class="overlay-preview"
              :style="{ background: config.preview }"
            />
            <span
              v-else
              class="overlay-preview flex items-center justify-center font-mono text-9px tracking-wide uppercase text-white/50"
            >None</span>
          </button>
        </div>
        <p class="mt-1.5 font-mono text-10px text-white/35">
          {{ overlayLabels[overlayVariables.overlayType] ?? overlayVariables.overlayType }}
        </p>

        <div v-if="overlayVariables.overlayType !== 'none'" class="mt-4">
          <label class="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-xs text-white/60">
            Intensity
            <span class="text-white/40">{{ Math.round(Number(overlayVariables.overlayOpacity) * 100) }}%</span>
          </label>
          <input
            v-model.number="overlayVariables.overlayOpacity"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="desk-input"
          >
        </div>
        <div class="mt-4">
          <label class="mb-1.5 block font-mono text-xs text-white/60">
            Overlay color
          </label>
          <ColorInput v-model="overlayVariables.overlayColor" />
        </div>
      </section>

      <a
        href="https://www.producthunt.com/posts/stylixir?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-stylixir"
        target="_blank"
        rel="noopener"
        class="block opacity-70 transition-opacity hover:opacity-100"
      >
        <img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=488516&theme=dark"
          alt="Stylixir - CSS Pattern Generator | Product Hunt"
          width="180"
          height="39"
          class="h-8 w-auto"
        >
      </a>
    </div>
  </aside>
</template>

<style scoped>
.desk-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.55rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  background: transparent;
  color: #fff;
  font-size: 0.7rem;
  letter-spacing: 0.01em;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.desk-action:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.22);
}

.desk-action-accent {
  border-color: rgba(45, 212, 191, 0.35);
  background: rgba(45, 212, 191, 0.08);
  color: #5eead4;
}

.desk-action-accent:hover {
  background: rgba(45, 212, 191, 0.14);
  border-color: rgba(45, 212, 191, 0.55);
}

.desk-input {
  width: 100%;
  accent-color: #2dd4bf;
}

input[type='range'] {
  appearance: none;
  height: 4px;
  padding: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}

input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #2dd4bf;
  cursor: pointer;
}

input[type='number'] {
  padding: 0.45rem 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  background: #141414;
  color: #fff;
  font-family: inherit;
}

.overlay-preview {
  width: 100%;
  height: 36px;
  background: #0d0d0d;
}

@media (prefers-reduced-motion: reduce) {
  .desk-action {
    transition: none;
  }
}
</style>
