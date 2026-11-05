<script setup lang="ts">
const props = defineProps<{
  label: string
  modelValue: string | number | undefined
  min: number
  max: number
  step?: number
  /** Double-clicking the label restores this. */
  defaultValue?: string | number
  /** Value is 0–1 but the number field reads 0–100. */
  percent?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const id = `slider-${Math.random().toString(36).slice(2, 8)}`
const value = computed(() => Number(props.modelValue ?? props.min))
const scale = computed(() => props.percent ? 100 : 1)

const fieldValue = computed(() => {
  const n = value.value * scale.value
  return Number.isInteger(n) ? n : Number(n.toFixed(2))
})

function commit(raw: string | number, fromField = false) {
  const n = Number(raw) / (fromField ? scale.value : 1)
  if (Number.isFinite(n))
    emit('update:modelValue', Math.min(props.max, Math.max(props.min, n)))
}

function reset() {
  if (props.defaultValue !== undefined)
    commit(props.defaultValue)
}
</script>

<template>
  <div class="slider-row">
    <label
      :for="id"
      class="truncate font-mono text-11px text-white/60"
      :title="defaultValue !== undefined ? `${label} — double-click to reset` : label"
      @dblclick="reset"
    >{{ label }}</label>
    <input
      :id="id"
      type="range"
      :min="min"
      :max="max"
      :step="step ?? 'any'"
      :value="value"
      class="slider-track"
      @input="commit(($event.target as HTMLInputElement).value)"
    >
    <input
      type="number"
      :aria-label="label"
      :min="min * scale"
      :max="max * scale"
      :step="(step ?? 1) * scale"
      :value="fieldValue"
      class="slider-field"
      @change="commit(($event.target as HTMLInputElement).value, true)"
    >
  </div>
</template>

<style scoped>
.slider-row {
  display: grid;
  grid-template-columns: 5.75rem minmax(0, 1fr) 3.25rem;
  align-items: center;
  gap: 0.75rem;
  min-height: 1.75rem;
}

.slider-track {
  width: 100%;
  height: 4px;
  padding: 0;
  appearance: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  accent-color: #2dd4bf;
}

.slider-track::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #2dd4bf;
  cursor: pointer;
}

.slider-track:focus-visible {
  outline: 2px solid #2dd4bf;
  outline-offset: 4px;
}

.slider-field {
  width: 100%;
  padding: 0.25rem 0.35rem;
  border: 1px solid transparent;
  border-radius: 0.35rem;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  font-family: ui-monospace, monospace;
  font-size: 11px;
  text-align: right;
  outline: none;
  appearance: textfield;
}

.slider-field::-webkit-inner-spin-button,
.slider-field::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}

.slider-field:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.slider-field:focus {
  border-color: #2dd4bf;
}
</style>
