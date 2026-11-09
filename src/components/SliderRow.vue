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

/** Filled share of the track, for the ink fill. */
const fill = computed(() => `${((value.value - props.min) / ((props.max - props.min) || 1)) * 100}%`)

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
      class="slider-label"
      :title="defaultValue !== undefined ? `${label} (double-click to reset)` : label"
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
      :style="{ '--fill': fill }"
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
  grid-template-columns: 6rem minmax(0, 1fr) 3.25rem;
  align-items: center;
  gap: 12px;
  min-height: 32px;
}

.slider-label {
  overflow: hidden;
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: none;
}

.slider-track {
  width: 100%;
  height: 20px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.slider-track::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(var(--ink) 0 0) 0 / var(--fill) 100% no-repeat, var(--line);
}

.slider-track::-moz-range-track {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(var(--ink) 0 0) 0 / var(--fill) 100% no-repeat, var(--line);
}

.slider-track::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  margin-top: -5.5px;
  border: 2px solid var(--sheet);
  border-radius: 999px;
  background: var(--ink);
  box-shadow: 0 0 0 1px var(--ink);
  transition: transform 0.12s ease;
}

.slider-track::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border: 2px solid var(--sheet);
  border-radius: 999px;
  background: var(--ink);
  box-shadow: 0 0 0 1px var(--ink);
}

.slider-track:active::-webkit-slider-thumb {
  transform: scale(1.2);
}

.slider-track:focus-visible {
  outline-offset: 0;
  border-radius: 4px;
}

.slider-field {
  width: 100%;
  height: 26px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: var(--wash);
  color: var(--ink);
  font-family: 'Martian Mono', ui-monospace, monospace;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
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
  border-color: var(--line);
}

.slider-field:focus {
  border-color: var(--ink);
}

/* A 14px thumb is too small to catch with a finger. */
@media (pointer: coarse) {
  .slider-row {
    grid-template-columns: 6rem minmax(0, 1fr) 4rem;
    min-height: 44px;
  }

  .slider-track {
    height: 36px;
  }

  .slider-track::-webkit-slider-thumb {
    width: 24px;
    height: 24px;
    margin-top: -10.5px;
  }

  .slider-track::-moz-range-thumb {
    width: 20px;
    height: 20px;
  }

  .slider-field {
    height: 36px;
  }
}
</style>
