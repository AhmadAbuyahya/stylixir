<script setup lang="ts">
import startCase from 'lodash.startcase'
import { storeToRefs } from 'pinia'
import ColorInput from './ColorInput.vue'
import SliderRow from './SliderRow.vue'
import { DEFAULT_EFFECTS, EFFECT_DIALS, type Effects, type MotionType, motionTypes } from '~/lib/effects'
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

const tabs = [
  { id: 'pattern', label: 'Pattern' },
  { id: 'effects', label: 'Effects' },
  { id: 'motion', label: 'Motion' },
] as const

type TabId = typeof tabs[number]['id']

const activeTab = ref<TabId>('pattern')

const activeTemplateStore = useActiveTemplateStore()
const { variables, variablesRef, overlayVariables, effectVariables } = storeToRefs(activeTemplateStore)
const reducedMotion = usePreferredReducedMotion()

type EffectDialKey = keyof typeof EFFECT_DIALS

const effectDials: { key: EffectDialKey; label: string; percent?: boolean; show?: (effects: Effects) => boolean }[] = [
  { key: 'grain', label: 'Grain', percent: true },
  { key: 'grainSize', label: 'Grain size', show: effects => effects.grain > 0 },
  { key: 'warp', label: 'Warp' },
  { key: 'warpSize', label: 'Ripple size', show: effects => effects.warp > 0 },
  { key: 'light', label: 'Light', percent: true },
]

const visibleEffectDials = computed(() =>
  effectDials.filter(dial => !dial.show || dial.show(effectVariables.value)),
)

const motionLabels: Record<MotionType, string> = {
  none: 'Still',
  breathe: 'Breathe',
  morph: 'Morph',
  hue: 'Hue cycle',
  flow: 'Flow',
}

const motionHints: Record<MotionType, string> = {
  none: 'Pick a motion to bring the pattern to life.',
  breathe: 'The pattern\'s own dials swing back and forth.',
  morph: 'Shape and colors drift toward a sibling roll.',
  hue: 'Every color rotates around the wheel.',
  flow: 'The warp churns like liquid.',
}

const shapeVars = computed(() =>
  Object.entries(variables.value).filter(([, variable]) => variable.type !== 'color'),
)
const colorVars = computed(() =>
  Object.entries(variables.value).filter(([, variable]) => variable.type === 'color'),
)

// Which palette swatch the editor below the strip is bound to; falls back to
// the first color when a template switch removes the selected key.
const pickedColor = ref('')
const activeColor = computed(() =>
  colorVars.value.some(([key]) => key === pickedColor.value) ? pickedColor.value : colorVars.value[0]?.[0],
)
</script>

<template>
  <aside class="min-h-0 flex flex-col overflow-hidden border-t-1 border-white/10 bg-#0d0d0d text-left md:h-full md:border-l-1 md:border-t-0">
    <div class="shrink-0 border-b-1 border-white/10 p-3">
      <div class="flex gap-2">
        <button class="desk-action desk-action-accent flex-1" type="button" @click="activeTemplateStore.randomizeAll">
          <div class="i-carbon-shuffle" />
          Shuffle
        </button>
        <button class="desk-action px-3" type="button" title="Reset pattern" aria-label="Reset pattern" @click="activeTemplateStore.reset">
          <div class="i-carbon-restart" />
        </button>
      </div>

      <div class="tabs mt-3" role="tablist" aria-label="Editor sections">
        <button
          v-for="tab in tabs"
          :id="`tab-${tab.id}`"
          :key="tab.id"
          type="button"
          role="tab"
          class="tab"
          :class="{ 'tab-active': activeTab === tab.id }"
          :aria-selected="activeTab === tab.id"
          :aria-controls="`panel-${tab.id}`"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span
            v-if="(tab.id === 'motion' && effectVariables.motion !== 'none')
              || (tab.id === 'effects' && (effectVariables.grain > 0 || effectVariables.warp > 0 || effectVariables.light > 0))"
            class="tab-dot"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>

    <div
      :id="`panel-${activeTab}`"
      class="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      role="tabpanel"
      :aria-labelledby="`tab-${activeTab}`"
    >
      <template v-if="activeTab === 'pattern'">
        <section v-if="shapeVars.length" class="mb-6">
          <div class="section-head">
            <p>Shape</p>
            <button type="button" class="icon-action" title="Shuffle shape" aria-label="Shuffle shape" @click="activeTemplateStore.randomizeNumberValues">
              <div class="i-carbon-shuffle" />
            </button>
          </div>
          <div class="flex flex-col gap-1.5">
            <SliderRow
              v-for="[key, variable] in shapeVars"
              :key="key"
              v-model="variablesRef[key]"
              :label="startCase(String(key))"
              :min="variable.min ?? 0"
              :max="variable.max ?? 100"
              :step="variable.step"
              :default-value="variable.value"
            />
          </div>
        </section>

        <section v-if="colorVars.length">
          <div class="section-head">
            <p>Colors</p>
            <button type="button" class="icon-action" title="Shuffle colors" aria-label="Shuffle colors" @click="activeTemplateStore.randomizeColors">
              <div class="i-carbon-shuffle" />
            </button>
          </div>
          <div class="palette" role="radiogroup" aria-label="Pattern colors">
            <button
              v-for="[key] in colorVars"
              :key="key"
              type="button"
              role="radio"
              class="swatch"
              :class="{ 'swatch-active': activeColor === key }"
              :style="{ background: String(variablesRef[key]) }"
              :title="startCase(String(key))"
              :aria-label="startCase(String(key))"
              :aria-checked="activeColor === key"
              @click="pickedColor = key"
            />
          </div>
          <template v-if="activeColor">
            <p class="mb-1.5 mt-3 font-mono text-11px text-white/50">
              {{ startCase(activeColor) }}
            </p>
            <ColorInput v-model="variablesRef[activeColor]" />
          </template>
        </section>
      </template>

      <template v-else-if="activeTab === 'effects'">
        <section class="mb-6">
          <div class="section-head">
            <p>Finish</p>
            <button class="text-action" type="button" @click="activeTemplateStore.resetEffects">
              Clear
            </button>
          </div>
          <div class="flex flex-col gap-1.5">
            <SliderRow
              v-for="dial in visibleEffectDials"
              :key="dial.key"
              v-model="effectVariables[dial.key]"
              :label="dial.label"
              :min="EFFECT_DIALS[dial.key].min"
              :max="EFFECT_DIALS[dial.key].max"
              :step="EFFECT_DIALS[dial.key].step"
              :default-value="DEFAULT_EFFECTS[dial.key]"
              :percent="dial.percent"
            />
          </div>
        </section>

        <section>
          <div class="section-head">
            <p>Overlay</p>
          </div>
          <select v-model="overlayVariables.overlayType" class="desk-select" aria-label="Overlay">
            <option v-for="(_, type) in overlayTypes" :key="type" :value="type">
              {{ overlayLabels[type] ?? type }}
            </option>
          </select>
          <div class="mt-3 flex flex-col gap-1.5">
            <SliderRow
              v-if="overlayVariables.overlayType !== 'none'"
              v-model="overlayVariables.overlayOpacity"
              label="Intensity"
              :min="0"
              :max="1"
              :step="0.01"
              :default-value="0.5"
              percent
            />
            <SliderRow
              v-model="overlayVariables.overlayBlur"
              label="Blur"
              :min="0"
              :max="20"
              :step="1"
              :default-value="0"
            />
          </div>
          <div v-if="overlayVariables.overlayType !== 'none'" class="mt-3">
            <p class="mb-1.5 font-mono text-11px text-white/50">
              Overlay color
            </p>
            <ColorInput v-model="overlayVariables.overlayColor" />
          </div>
        </section>
      </template>

      <template v-else>
        <div class="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Motion">
          <button
            v-for="motion in motionTypes"
            :key="motion"
            type="button"
            role="radio"
            class="motion-option"
            :class="{ 'motion-option-active': effectVariables.motion === motion }"
            :aria-checked="effectVariables.motion === motion"
            @click="effectVariables.motion = motion"
          >
            {{ motionLabels[motion] }}
          </button>
        </div>
        <p class="mt-2 font-mono text-10px text-white/35">
          <template v-if="effectVariables.motion === 'flow' && effectVariables.warp <= 0">
            Flow moves the warp. Turn Warp up on the Effects tab to see it.
          </template>
          <template v-else>
            {{ motionHints[effectVariables.motion] }}
          </template>
          <template v-if="effectVariables.motion !== 'none' && reducedMotion === 'reduce'">
            Paused here because your system asks for reduced motion.
          </template>
        </p>

        <div v-if="effectVariables.motion !== 'none'" class="mt-4 flex flex-col gap-1.5">
          <SliderRow
            v-model="effectVariables.speed"
            label="Loop (s)"
            :min="EFFECT_DIALS.speed.min"
            :max="EFFECT_DIALS.speed.max"
            :step="EFFECT_DIALS.speed.step"
            :default-value="DEFAULT_EFFECTS.speed"
          />
          <SliderRow
            v-if="effectVariables.motion === 'breathe' || effectVariables.motion === 'morph'"
            v-model="effectVariables.motionAmount"
            label="Amount"
            :min="EFFECT_DIALS.motionAmount.min"
            :max="EFFECT_DIALS.motionAmount.max"
            :step="EFFECT_DIALS.motionAmount.step"
            :default-value="DEFAULT_EFFECTS.motionAmount"
            percent
          />
        </div>
      </template>
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
  font-size: 0.75rem;
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

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  padding: 3px;
  border-radius: 0.55rem;
  background: rgba(255, 255, 255, 0.05);
}

.tab {
  position: relative;
  padding: 0.4rem 0.25rem;
  border-radius: 0.4rem;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab:hover {
  color: #fff;
}

.tab-active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.tab:focus-visible,
.icon-action:focus-visible,
.text-action:focus-visible,
.swatch:focus-visible,
.motion-option:focus-visible,
.desk-select:focus-visible {
  outline: 2px solid #2dd4bf;
  outline-offset: 1px;
}

.tab-dot {
  position: absolute;
  top: 0.35rem;
  right: 0.45rem;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #2dd4bf;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 1.5rem;
  margin-bottom: 0.6rem;
}

.section-head p {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(45, 212, 191, 0.85);
}

.icon-action {
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.35rem;
  color: rgba(255, 255, 255, 0.5);
  transition: background 0.15s ease, color 0.15s ease;
}

.icon-action:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.text-action {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.text-action:hover {
  color: rgba(255, 255, 255, 0.75);
}

.palette {
  display: flex;
  height: 2.5rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.55rem;
}

.swatch {
  flex: 1;
  min-width: 0;
  transition: flex 0.2s ease;
}

.swatch-active {
  flex: 1.6;
  box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 3px rgba(0, 0, 0, 0.5);
}

.desk-select {
  width: 100%;
  padding: 0.5rem 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  background: #141414;
  color: #fff;
  font-size: 0.75rem;
}

.motion-option {
  padding: 0.45rem 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.4rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.motion-option:hover {
  border-color: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.motion-option-active {
  border-color: rgba(45, 212, 191, 0.55);
  background: rgba(45, 212, 191, 0.1);
  color: #5eead4;
}

@media (prefers-reduced-motion: reduce) {
  .desk-action,
  .tab,
  .icon-action,
  .swatch,
  .motion-option {
    transition: none;
  }
}
</style>
