<script setup lang="ts">
const props = defineProps<{
  template: Record<string, string>
}>()

const emit = defineEmits<{
  update: [property: string, value: string]
  addProperty: [property: string]
  removeProperty: [property: string]
}>()

const newProperty = ref('')

const properties = computed(() => Object.keys(props.template).sort())

function commitNewProperty() {
  const key = newProperty.value.trim()
  if (!key)
    return
  emit('addProperty', key)
  newProperty.value = ''
}

function onInput(property: string, event: Event) {
  emit('update', property, (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <div class="min-h-0 flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <p class="font-mono text-10px tracking-widest uppercase text-teal-400/80">
        Live CSS
      </p>
      <p class="text-10px text-white/35">
        Use <code class="text-teal-300/80">{{ '{name}' }}</code> for variables
      </p>
    </div>

    <div
      v-for="property in properties"
      :key="property"
      class="border-1 border-white/8 rounded-xl bg-black/25"
    >
      <div class="flex items-center justify-between gap-2 border-b-1 border-white/8 px-3 py-2">
        <label class="font-mono text-xs text-white/70" :for="`css-${property}`">
          {{ property }}
        </label>
        <button
          type="button"
          class="text-10px text-white/30 hover:text-red-300"
          @click="emit('removeProperty', property)"
        >
          Remove
        </button>
      </div>
      <textarea
        :id="`css-${property}`"
        class="audit-textarea"
        :value="template[property]"
        spellcheck="false"
        @input="onInput(property, $event)"
      />
    </div>

    <form class="flex gap-2" @submit.prevent="commitNewProperty">
      <input
        v-model="newProperty"
        class="audit-input flex-1"
        placeholder="background-size"
        spellcheck="false"
      >
      <button type="submit" class="audit-btn">
        Add property
      </button>
    </form>
  </div>
</template>

<style scoped>
.audit-textarea {
  display: block;
  width: 100%;
  min-height: 9rem;
  resize: vertical;
  border: 0;
  background: transparent;
  padding: 0.75rem;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  line-height: 1.55;
  color: rgb(255 255 255 / 0.88);
}

.audit-textarea:focus {
  outline: none;
}

.audit-input {
  border-radius: 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.04);
  padding: 0.45rem 0.65rem;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: white;
}

.audit-btn {
  border-radius: 0.5rem;
  border: 1px solid rgb(45 212 191 / 0.35);
  background: rgb(45 212 191 / 0.12);
  padding: 0.45rem 0.75rem;
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
