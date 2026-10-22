<script setup lang="ts">
import type { Variable } from '~/types'
import { createStubVariable } from '~/lib/audit'

const emit = defineEmits<{
  add: [name: string, variable: Variable]
}>()

const name = ref('')
const type = ref<Variable['type']>('range')
const value = ref(50)
const min = ref(0)
const max = ref(100)
const step = ref(1)
const colorValue = ref('#888888')

function submit() {
  const key = name.value.trim().replace(/\s+/g, '')
  if (!key || !/^[a-zA-Z]\w*$/.test(key))
    return

  let variable: Variable
  if (type.value === 'color') {
    variable = { type: 'color', value: colorValue.value }
  }
  else {
    variable = {
      type: type.value,
      value: value.value,
      min: min.value,
      max: max.value,
      ...(type.value === 'range' ? { step: step.value } : {}),
    }
  }

  emit('add', key, variable)
  name.value = ''
  value.value = 50
  min.value = 0
  max.value = 100
}

function quickAddStub(stubName: string) {
  emit('add', stubName, createStubVariable(stubName))
}

const placeholderHint = computed(() => `{${name.value || 'varName'}}`)
</script>

<template>
  <div class="border-1 border-white/8 rounded-xl bg-white/2 p-3">
    <p class="mb-3 font-mono text-10px tracking-widest uppercase text-teal-400/80">
      Add variable
    </p>

    <form class="grid gap-3" @submit.prevent="submit">
      <div class="grid grid-cols-2 gap-2">
        <label class="audit-field col-span-2 sm:col-span-1">
          <span>Name</span>
          <input v-model="name" class="audit-input" placeholder="bandWidth" required>
        </label>
        <label class="audit-field col-span-2 sm:col-span-1">
          <span>Type</span>
          <select v-model="type" class="audit-input">
            <option value="range">
              range
            </option>
            <option value="number">
              number
            </option>
            <option value="color">
              color
            </option>
          </select>
        </label>
      </div>

      <template v-if="type === 'color'">
        <label class="audit-field">
          <span>Color</span>
          <input v-model="colorValue" type="color" class="h-9 w-full cursor-pointer border-1 border-white/10 rounded bg-transparent">
        </label>
      </template>

      <template v-else>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label class="audit-field">
            <span>Default</span>
            <input v-model.number="value" type="number" class="audit-input">
          </label>
          <label v-if="type === 'range'" class="audit-field">
            <span>Min</span>
            <input v-model.number="min" type="number" class="audit-input">
          </label>
          <label v-if="type === 'range'" class="audit-field">
            <span>Max</span>
            <input v-model.number="max" type="number" class="audit-input">
          </label>
          <label v-if="type === 'range'" class="audit-field">
            <span>Step</span>
            <input v-model.number="step" type="number" class="audit-input" min="0.01" step="0.01">
          </label>
        </div>
      </template>

      <p class="text-11px leading-relaxed text-white/40">
        Add <code class="text-teal-300/70">{{ placeholderHint }}</code> in the CSS editor, or create the variable first then wire it in.
      </p>

      <button type="submit" class="audit-btn w-fit">
        Add variable
      </button>
    </form>

    <slot name="missing" :quick-add="quickAddStub" />
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

.audit-btn {
  border-radius: 0.5rem;
  border: 1px solid rgb(45 212 191 / 0.35);
  background: rgb(45 212 191 / 0.12);
  padding: 0.45rem 0.85rem;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(153 246 228);
  cursor: pointer;
}

.audit-btn:hover {
  background: rgb(45 212 191 / 0.2);
}
</style>
