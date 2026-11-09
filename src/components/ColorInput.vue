<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number | null | undefined
  label?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function normalizeColor(value: string | number | null | undefined) {
  if (value === undefined || value === null || value === '' || value === 'undefined')
    return '#000000'
  const raw = String(value).trim()
  if (raw.startsWith('#'))
    return raw
  if (/^[0-9a-fA-F]{3,8}$/.test(raw))
    return `#${raw}`
  return '#000000'
}

const colorValue = ref(normalizeColor(props.modelValue))

watch(() => props.modelValue, (newValue) => {
  colorValue.value = normalizeColor(newValue)
})

function updateColor(value: string) {
  const next = normalizeColor(value)
  colorValue.value = next
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="color-row">
    <label class="chip" :title="label ? `Pick ${label.toLowerCase()}` : 'Pick a color'">
      <span class="chip-fill" :style="{ background: colorValue }" />
      <input
        v-model="colorValue"
        type="color"
        class="chip-input"
        :aria-label="label ? `${label} picker` : 'Color picker'"
        @input="updateColor(colorValue)"
      >
    </label>
    <span v-if="label" class="color-label">{{ label }}</span>
    <input
      v-model="colorValue"
      type="text"
      spellcheck="false"
      class="hex"
      :aria-label="label ? `${label} hex` : 'Hex color'"
      @change="updateColor(colorValue)"
    >
  </div>
</template>

<style scoped>
.color-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 6.5rem;
  align-items: center;
  gap: 10px;
  min-height: 36px;
}

.chip {
  position: relative;
  width: 28px;
  height: 28px;
  overflow: hidden;
  border-radius: 7px;
  box-shadow: inset 0 0 0 1px var(--line);
  cursor: pointer;
}

.chip-fill {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1);
}

.chip-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.chip:focus-within {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.color-label {
  overflow: hidden;
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.hex {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: transparent;
  color: var(--ink);
  font-family: 'Martian Mono', ui-monospace, monospace;
  font-size: 10.5px;
  text-transform: lowercase;
  outline: none;
}

.hex:focus {
  border-color: var(--ink);
}

.color-row:not(:has(.color-label)) {
  grid-template-columns: 28px minmax(0, 1fr);
}
</style>
