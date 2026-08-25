<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number | null | undefined
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
  <div class="flex items-center gap-2">
    <label class="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden border-1 border-white/10 rounded-md">
      <span class="absolute inset-0" :style="{ background: colorValue }" />
      <input
        v-model="colorValue"
        type="color"
        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        @input="updateColor(colorValue)"
      >
    </label>
    <input
      v-model="colorValue"
      type="text"
      spellcheck="false"
      class="min-w-0 flex-1 border-1 border-white/10 rounded-md bg-#141414 px-2.5 py-2 font-mono text-xs text-white outline-none focus:border-teal-400"
      @change="updateColor(colorValue)"
    >
  </div>
</template>
