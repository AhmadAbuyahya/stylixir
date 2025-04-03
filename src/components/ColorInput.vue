<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const colorValue = ref(String(props.modelValue))

watch(() => props.modelValue, (newValue) => {
  colorValue.value = String(newValue)
})

function updateColor(value: string) {
  colorValue.value = value
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="color-input">
    <input
      v-model="colorValue"
      type="color"
      class="color-picker"
      @input="updateColor(colorValue)"
    >
    <input
      v-model="colorValue"
      type="text"
      class="color-text"
      @input="updateColor(colorValue)"
    >
  </div>
</template>

<style scoped>
.color-input {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  outline: 1px solid #2e2e2e;
  outline-offset: -1px;
}

.color-text {
  flex: 1;
  padding: 8px;
  border: 1px solid #343434;
  border-radius: 4px;
  background: #242424;
  color: white;
  font-family: inherit;
}

.color-text:focus {
  outline: none;
  border-color: #60a5fa;
}
</style>
