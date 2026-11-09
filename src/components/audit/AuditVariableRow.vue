<script setup lang="ts">
import startCase from 'lodash.startcase'
import type { Variable } from '~/types'

const props = defineProps<{
  name: string
  variable: Variable
  liveValue: string | number
}>()

const emit = defineEmits<{
  updateLive: [value: string | number]
  updateVariable: [patch: Partial<Variable>]
  remove: []
}>()

const isColor = computed(() => props.variable.type === 'color')

type NumberField = 'min' | 'value' | 'max' | 'step'

const fields: { key: NumberField; label: string }[] = [
  { key: 'min', label: 'Min' },
  { key: 'value', label: 'Default' },
  { key: 'max', label: 'Max' },
  { key: 'step', label: 'Step' },
]

function commitNumber(key: NumberField, event: Event) {
  const raw = (event.target as HTMLInputElement).value.trim()
  // An emptied step means "no step"; other fields ignore blanks and junk.
  if (raw === '' && key === 'step') {
    emit('updateVariable', { step: undefined })
    return
  }
  const n = Number(raw)
  if (raw !== '' && Number.isFinite(n))
    emit('updateVariable', { [key]: n })
}
</script>

<template>
  <div class="row" :class="{ 'row-wild': variable.breaking }">
    <div class="row-head">
      <div class="min-w-0">
        <p class="row-name">
          {{ name }}
        </p>
        <p class="row-label">
          {{ startCase(name) }}
        </p>
      </div>
      <div class="row-acts">
        <button
          v-if="!isColor"
          type="button"
          class="wild"
          :aria-pressed="!!variable.breaking"
          title="Wild dials reshape the motif (angles, positions, wedges, splits). The studio hides them and leaves them out of Shuffle until its Wild switch is on."
          @click="emit('updateVariable', { breaking: !variable.breaking })"
        >
          <span class="wild-track" aria-hidden="true" />
          Wild
        </button>
        <button
          type="button"
          class="remove"
          title="Remove this dial and write its default straight into the CSS"
          @click="emit('remove')"
        >
          Remove
        </button>
      </div>
    </div>

    <div v-if="isColor" class="grid gap-3">
      <label class="audit-field">
        <span>Value</span>
        <input
          type="color"
          class="h-8 w-full cursor-pointer border-1 border-white/10 rounded bg-transparent"
          :value="String(variable.value)"
          @input="emit('updateVariable', { value: ($event.target as HTMLInputElement).value })"
        >
      </label>
      <slot name="previews" />
    </div>

    <div v-else class="grid gap-3">
      <div class="grid grid-cols-4 gap-2">
        <label v-for="field in fields" :key="field.key" class="audit-field">
          <span>{{ field.label }}</span>
          <input
            type="number"
            class="audit-input"
            :value="variable[field.key]"
            :placeholder="field.key === 'step' ? 'any' : undefined"
            @change="commitNumber(field.key, $event)"
          >
        </label>
      </div>

      <label class="audit-field">
        <span>Live · {{ liveValue }}</span>
        <input
          type="range"
          class="w-full accent-teal-400"
          :min="variable.min ?? 0"
          :max="variable.max ?? 100"
          :step="variable.step ?? 'any'"
          :value="Number(liveValue)"
          @input="emit('updateLive', Number(($event.target as HTMLInputElement).value))"
        >
      </label>

      <slot name="previews" />
    </div>
  </div>
</template>

<style scoped>
.row {
  padding: 0.75rem;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-left-width: 3px;
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.02);
}

.row-wild {
  border-left-color: rgb(251 191 36 / 0.7);
}

.row-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}

.row-name {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: rgb(94 234 212);
}

.row-label {
  font-size: 10px;
  color: rgb(255 255 255 / 0.4);
}

.row-acts {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.wild,
.remove {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 1.75rem;
  padding: 0 0.5rem;
  border-radius: 0.375rem;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: rgb(255 255 255 / 0.45);
  transition: background-color 0.15s ease, color 0.15s ease;
}

.wild:hover {
  background: rgb(255 255 255 / 0.06);
  color: white;
}

.wild[aria-pressed='true'] {
  color: rgb(252 211 77);
}

.wild-track {
  position: relative;
  width: 1.5rem;
  height: 0.85rem;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.18);
  transition: background-color 0.15s ease;
}

.wild-track::after {
  content: '';
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  background: white;
  transition: transform 0.15s ease;
}

.wild[aria-pressed='true'] .wild-track {
  background: rgb(245 158 11);
}

.wild[aria-pressed='true'] .wild-track::after {
  transform: translateX(0.65rem);
}

.remove:hover {
  background: rgb(239 68 68 / 0.15);
  color: rgb(252 165 165);
}

.wild:focus-visible,
.remove:focus-visible {
  outline: 2px solid rgb(45 212 191);
  outline-offset: 1px;
}

.audit-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.45);
}

.audit-input {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.04);
  padding: 0.35rem 0.5rem;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: white;
}

.audit-input::placeholder {
  color: rgb(255 255 255 / 0.25);
}
</style>
