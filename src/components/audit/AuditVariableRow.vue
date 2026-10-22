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
</script>

<template>
  <div class="audit-var-row border-1 border-white/8 rounded-xl bg-white/2 p-3">
    <div class="mb-2 flex items-start justify-between gap-2">
      <div>
        <p class="font-mono text-xs text-teal-300">
          {{ name }}
        </p>
        <p class="text-10px text-white/40">
          {{ startCase(name) }}
        </p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded px-2 py-1 text-10px text-white/40 transition hover:bg-red-500/15 hover:text-red-300"
        title="Remove variable (wire manually in templates.ts)"
        @click="emit('remove')"
      >
        Remove
      </button>
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
      <div class="grid grid-cols-3 gap-2">
        <label class="audit-field">
          <span>Min</span>
          <input
            type="number"
            class="audit-input"
            :value="variable.min"
            @change="emit('updateVariable', { min: Number(($event.target as HTMLInputElement).value) })"
          >
        </label>
        <label class="audit-field">
          <span>Default</span>
          <input
            type="number"
            class="audit-input"
            :value="variable.value"
            @change="emit('updateVariable', { value: Number(($event.target as HTMLInputElement).value) })"
          >
        </label>
        <label class="audit-field">
          <span>Max</span>
          <input
            type="number"
            class="audit-input"
            :value="variable.max"
            @change="emit('updateVariable', { max: Number(($event.target as HTMLInputElement).value) })"
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
          :step="variable.step ?? 1"
          :value="Number(liveValue)"
          @input="emit('updateLive', Number(($event.target as HTMLInputElement).value))"
        >
      </label>

      <slot name="previews" />
    </div>
  </div>
</template>

<style scoped>
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
</style>
