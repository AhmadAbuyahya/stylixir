<script setup lang="ts">
import startCase from 'lodash.startcase'
import { storeToRefs } from 'pinia'
import { CHANNEL_ON, DEFAULT_EFFECTS, EFFECT_DIALS, type Effects, type MotionChannel, isMoving, materials } from '~/lib/effects'
import { overlayTypes } from '~/lib/overlays'
import { useActiveTemplateStore } from '~/stores/activeTemplate'

defineEmits<{ close: [] }>()

const store = useActiveTemplateStore()
const { variables, variablesRef, overlayVariables, effectVariables, wildShapes } = storeToRefs(store)
const reducedMotion = usePreferredReducedMotion()

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
  'linear-gradient-outer': 'Center fade, vertical',
  'linear-gradient-inner-horizontal': 'Pillarbox',
  'linear-gradient-outer-horizontal': 'Center fade, horizontal',
}

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

const motionChannels: { key: MotionChannel; label: string; hint: string }[] = [
  { key: 'shape', label: 'Shape', hint: 'Dials wander, each on its own clock' },
  { key: 'color', label: 'Color', hint: 'Colors shift hue or trade places' },
  { key: 'move', label: 'Move', hint: 'The pattern drifts or spins' },
  { key: 'liquid', label: 'Liquid', hint: 'The surface churns like water' },
]

const colorModeLabels = { shift: 'Shift hue', swap: 'Swap colors' } as const
const moveModeLabels = { drift: 'Drift', spin: 'Spin' } as const
const directions = [
  { angle: 270, icon: 'i-carbon-arrow-up', label: 'Up' },
  { angle: 315, icon: 'i-carbon-arrow-up-right', label: 'Up right' },
  { angle: 0, icon: 'i-carbon-arrow-right', label: 'Right' },
  { angle: 45, icon: 'i-carbon-arrow-down-right', label: 'Down right' },
  { angle: 90, icon: 'i-carbon-arrow-down', label: 'Down' },
  { angle: 135, icon: 'i-carbon-arrow-down-left', label: 'Down left' },
  { angle: 180, icon: 'i-carbon-arrow-left', label: 'Left' },
  { angle: 225, icon: 'i-carbon-arrow-up-left', label: 'Up left' },
]

function toggleShapeHold(key: string) {
  const hold = effectVariables.value.shapeHold
  // A new array each time, so DEFAULT_EFFECTS' shared one is never mutated.
  effectVariables.value.shapeHold = hold.includes(key) ? hold.filter(held => held !== key) : [...hold, key]
}

function toggleChannel(channel: MotionChannel) {
  effectVariables.value[channel] = effectVariables.value[channel] > 0 ? 0 : CHANNEL_ON
}

const hasBreakingVars = computed(() => Object.values(variables.value).some(variable => variable.breaking))
// A breaking dial a shared link moved off its default stays visible, so nothing hidden is in effect.
const shapeVars = computed(() =>
  Object.entries(variables.value).filter(([key, variable]) =>
    variable.type !== 'color'
    && (!variable.breaking || wildShapes.value || variablesRef.value[key] !== variable.value)),
)
const colorVars = computed(() => Object.entries(variables.value).filter(([, variable]) => variable.type === 'color'))
</script>

<template>
  <aside class="panel" aria-label="Tune">
    <header class="panel-head">
      <h2 class="panel-title">
        Tune
      </h2>
      <button class="text-btn" type="button" @click="store.reset()">
        Reset pattern
      </button>
      <button class="icon-btn-sm" type="button" title="Close (Esc)" aria-label="Close tune" @click="$emit('close')">
        <span class="i-carbon-close" aria-hidden="true" />
      </button>
    </header>

    <div class="panel-body">
      <section v-if="shapeVars.length" class="group">
        <div class="group-head">
          <h3 class="eyebrow">
            Shape
          </h3>
          <div class="group-acts">
            <span v-if="hasBreakingVars" class="wild">
              <button
                type="button"
                class="switch"
                :aria-pressed="wildShapes"
                aria-describedby="wild-tip"
                @click="wildShapes = !wildShapes"
              >
                <span class="switch-track" aria-hidden="true" />
                Wild
              </button>
              <span id="wild-tip" role="tooltip" class="tip">
                Adds dials that change the pattern's shape, not just its size. Shuffle and Motion use them too, so results get stranger. Turn it off to put them back.
              </span>
            </span>
            <button class="icon-btn-sm" type="button" title="Re-roll shape" aria-label="Re-roll shape" @click="store.randomizeNumberValues()">
              <span class="i-carbon-shuffle" aria-hidden="true" />
            </button>
          </div>
        </div>
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
      </section>

      <section v-if="colorVars.length" class="group">
        <div class="group-head">
          <h3 class="eyebrow">
            Colorway
          </h3>
          <button class="icon-btn-sm" type="button" title="Re-roll colorway" aria-label="Re-roll colorway" @click="store.randomizeColors()">
            <span class="i-carbon-shuffle" aria-hidden="true" />
          </button>
        </div>
        <ColorInput
          v-for="[key] in colorVars"
          :key="key"
          v-model="variablesRef[key]"
          :label="startCase(String(key))"
        />
      </section>

      <section class="group">
        <div class="group-head">
          <h3 class="eyebrow">
            Finish
          </h3>
          <button class="text-btn" type="button" @click="store.resetEffects()">
            Reset effects
          </button>
        </div>
        <div class="segmented materials" role="radiogroup" aria-label="Material">
          <button
            v-for="material in materials"
            :key="material"
            type="button"
            role="radio"
            class="segment"
            :aria-checked="effectVariables.material === material"
            @click="effectVariables.material = material"
          >
            {{ startCase(material) }}
          </button>
        </div>
        <SliderRow
          v-if="effectVariables.material !== 'none'"
          v-model="effectVariables.materialStrength"
          label="Strength"
          :min="0.05"
          :max="EFFECT_DIALS.materialStrength.max"
          :step="EFFECT_DIALS.materialStrength.step"
          :default-value="DEFAULT_EFFECTS.materialStrength"
          percent
        />
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

        <label class="field">
          <span class="field-label">Overlay</span>
          <select v-model="overlayVariables.overlayType" class="select">
            <option v-for="(_, type) in overlayTypes" :key="type" :value="type">
              {{ overlayLabels[type] ?? type }}
            </option>
          </select>
        </label>
        <template v-if="overlayVariables.overlayType !== 'none'">
          <SliderRow
            v-model="overlayVariables.overlayOpacity"
            label="Intensity"
            :min="0"
            :max="1"
            :step="0.01"
            :default-value="0.5"
            percent
          />
          <ColorInput v-model="overlayVariables.overlayColor" label="Overlay color" />
        </template>
        <SliderRow
          v-model="overlayVariables.overlayBlur"
          label="Blur"
          :min="0"
          :max="20"
          :step="1"
          :default-value="0"
        />
      </section>

      <section class="group">
        <div class="group-head">
          <h3 class="eyebrow">
            Motion
          </h3>
        </div>
        <p v-if="isMoving(effectVariables) && reducedMotion === 'reduce'" class="note">
          Paused here because your system asks for reduced motion. Copied CSS still moves.
        </p>

        <div v-for="channel in motionChannels" :key="channel.key" class="channel">
          <button
            type="button"
            class="channel-toggle"
            :aria-pressed="effectVariables[channel.key] > 0"
            @click="toggleChannel(channel.key)"
          >
            <span>
              <span class="channel-name">{{ channel.label }}</span>
              <span class="channel-hint">{{ channel.hint }}</span>
            </span>
            <span class="switch-track" aria-hidden="true" />
          </button>

          <div v-if="effectVariables[channel.key] > 0" class="channel-body">
            <div v-if="channel.key === 'shape' && shapeVars.length" class="chips" role="group" aria-label="Dials that move">
              <button
                v-for="[key] in shapeVars"
                :key="key"
                type="button"
                class="chip"
                :aria-pressed="!effectVariables.shapeHold.includes(key)"
                @click="toggleShapeHold(key)"
              >
                {{ startCase(String(key)) }}
              </button>
            </div>
            <div v-if="channel.key === 'color'" class="segmented" role="radiogroup" aria-label="Color motion">
              <button
                v-for="(label, mode) in colorModeLabels"
                :key="mode"
                type="button"
                role="radio"
                class="segment"
                :aria-checked="effectVariables.colorMode === mode"
                @click="effectVariables.colorMode = mode"
              >
                {{ label }}
              </button>
            </div>
            <div v-if="channel.key === 'move'" class="segmented" role="radiogroup" aria-label="Move motion">
              <button
                v-for="(label, mode) in moveModeLabels"
                :key="mode"
                type="button"
                role="radio"
                class="segment"
                :aria-checked="effectVariables.moveMode === mode"
                @click="effectVariables.moveMode = mode"
              >
                {{ label }}
              </button>
            </div>
            <div v-if="channel.key === 'move' && effectVariables.moveMode === 'drift'" class="compass" role="radiogroup" aria-label="Drift direction">
              <button
                v-for="direction in directions"
                :key="direction.angle"
                type="button"
                role="radio"
                class="segment"
                :aria-checked="effectVariables.driftAngle === direction.angle"
                :aria-label="direction.label"
                :title="direction.label"
                @click="effectVariables.driftAngle = direction.angle"
              >
                <span :class="direction.icon" aria-hidden="true" />
              </button>
            </div>
            <SliderRow
              v-model="effectVariables[channel.key]"
              :label="channel.key === 'color' && effectVariables.colorMode === 'swap' ? 'Pace' : channel.key === 'move' && effectVariables.moveMode === 'drift' ? 'Distance' : 'Amount'"
              :min="0.05"
              :max="EFFECT_DIALS[channel.key].max"
              :step="EFFECT_DIALS[channel.key].step"
              :default-value="CHANNEL_ON"
              percent
            />
          </div>
        </div>

        <SliderRow
          v-if="isMoving(effectVariables)"
          v-model="effectVariables.speed"
          label="Cycle (s)"
          :min="EFFECT_DIALS.speed.min"
          :max="EFFECT_DIALS.speed.max"
          :step="EFFECT_DIALS.speed.step"
          :default-value="DEFAULT_EFFECTS.speed"
        />
      </section>
    </div>
  </aside>
</template>

<style scoped>
.panel {
  position: absolute;
  z-index: 20;
  top: 76px;
  right: 16px;
  bottom: 16px;
  width: 340px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 14px;
  background: var(--sheet);
  color: var(--ink);
  box-shadow: var(--lift);
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 10px 10px 18px;
  border-bottom: 1px solid var(--line);
}

.panel-title {
  margin-right: auto;
  font-family: 'Big Shoulders Display', sans-serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 18px 20px;
  border-bottom: 1px solid var(--line);
}

.group:last-child {
  border-bottom: 0;
}

.group-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  margin: 0 -18px 2px;
  padding: 6px 12px 0 18px;
  background: var(--sheet);
}

/* Sticky headers each form a stacking context; lift the one holding the Wild tip so later headers can't cover it. */
.group-head:has(.wild) {
  z-index: 2;
}

.group-head .eyebrow {
  color: var(--ink);
}

.group-acts {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn-sm {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  color: var(--muted);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.icon-btn-sm:hover {
  background: var(--wash);
  color: var(--ink);
}

.text-btn {
  padding: 6px 8px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--muted);
}

.text-btn:hover {
  background: var(--wash);
  color: var(--ink);
}

/* ---- switches ---- */

/* Tooltip is a sibling, not a child, so it describes the button instead of joining its name. */
.wild {
  position: relative;
}

.tip {
  position: absolute;
  z-index: 2;
  top: calc(100% + 6px);
  right: 0;
  width: 15rem;
  padding: 9px 11px;
  border-radius: 9px;
  background: var(--ink);
  color: var(--sheet);
  font-size: 12px;
  line-height: 1.45;
  box-shadow: var(--lift);
  opacity: 0;
  transform: translateY(-3px);
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s var(--ease-out);
}

.wild:hover .tip,
.wild:focus-within .tip {
  opacity: 1;
  transform: none;
  /* A short wait so passing the cursor over it doesn't flash the tip. */
  transition-delay: 0.35s;
}

.wild:focus-within .tip {
  transition-delay: 0s;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 8px;
  border-radius: 7px;
  font-size: 12px;
  color: var(--muted);
}

.switch:hover {
  background: var(--wash);
}

.switch[aria-pressed='true'] {
  color: var(--ink);
}

.switch-track {
  position: relative;
  flex: none;
  width: 26px;
  height: 15px;
  border-radius: 999px;
  background: var(--line);
  transition: background-color 0.2s ease;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: var(--sheet);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  transition: transform 0.2s var(--ease-out);
}

[aria-pressed='true'] > .switch-track {
  background: var(--ink);
}

[aria-pressed='true'] > .switch-track::after {
  transform: translateX(11px);
}

/* ---- fields ---- */

.field {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 36px;
}

.field-label {
  font-size: 12.5px;
  color: var(--muted);
}

.select {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--sheet);
  color: var(--ink);
  font: inherit;
  font-size: 12.5px;
}

.note {
  font-size: 12px;
  line-height: 1.45;
  color: var(--muted);
}

/* ---- motion ---- */

.channel {
  border: 1px solid var(--line);
  border-radius: 10px;
}

.channel-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  text-align: left;
}

.channel-toggle:hover {
  background: var(--wash);
}

.channel-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
}

.channel-hint {
  display: block;
  margin-top: 1px;
  font-size: 11.5px;
  color: var(--muted);
}

.channel-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 12px 10px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.chip,
.segment {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-size: 12px;
  color: var(--muted);
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.chip:hover,
.segment:hover {
  color: var(--ink);
}

.chip[aria-pressed='true'],
.segment[aria-checked='true'] {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--sheet);
}

.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.materials {
  grid-template-columns: repeat(5, 1fr);
  margin-bottom: 2px;
}

.materials .segment {
  padding: 0 4px;
}

.compass {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 3px;
}

.compass .segment {
  display: grid;
  place-items: center;
  padding: 0;
}

@media (max-width: 720px) {
  .panel {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: auto;
    /* Leaves the top half for the pattern, so a dial's effect shows while it moves. */
    max-height: 52svh;
    border-radius: 16px 16px 0 0;
    padding-bottom: env(safe-area-inset-bottom);
  }
}

@media (pointer: coarse) {
  .icon-btn-sm {
    width: 40px;
    height: 40px;
  }

  .switch,
  .select {
    height: 40px;
  }

  .text-btn {
    padding: 11px 10px;
  }

  .chip,
  .segment {
    min-height: 40px;
  }
}
</style>
