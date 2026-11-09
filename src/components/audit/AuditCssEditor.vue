<script setup lang="ts">
import { parseLiteral, suggestVariableName } from '~/lib/audit'

const props = defineProps<{
  template: Record<string, string>
  /** Existing dial names, for the suggested name and for linking to a dial that already exists. */
  variableNames: string[]
}>()

const emit = defineEmits<{
  update: [property: string, value: string]
  /** The box was left after edits; `before` is its text when it got focus. */
  commit: [property: string, before: string]
  makeVariable: [property: string, start: number, end: number, name: string]
  addProperty: [property: string]
  removeProperty: [property: string]
}>()

const newProperty = ref('')

const properties = computed(() => Object.keys(props.template).sort())

/** Each box's text when it got focus, so leaving it can tell what was typed over. */
const focusedFrom: Record<string, string> = {}

/** A plain number selected in one of the boxes, waiting for a dial name. */
const pending = ref<{ property: string; start: number; end: number; literal: string } | null>(null)
const pendingName = ref('')
const nameInput = ref<HTMLInputElement[]>([])

const linksExisting = computed(() => props.variableNames.includes(pendingName.value.trim()))
const nameValid = computed(() => /^[a-zA-Z]\w*$/.test(pendingName.value.trim()))

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

function readSelection(property: string, el: HTMLTextAreaElement) {
  const { selectionStart: start, selectionEnd: end } = el
  const literal = el.value.slice(start, end)
  const parsed = start !== end ? parseLiteral(literal) : null
  if (!parsed) {
    if (pending.value?.property === property)
      pending.value = null
    return false
  }
  const same = pending.value?.property === property && pending.value.start === start && pending.value.end === end
  if (!same) {
    pending.value = { property, start, end, literal: literal.trim() }
    pendingName.value = suggestVariableName(parsed.unit, props.variableNames)
  }
  return true
}

function onSelect(property: string, event: Event) {
  readSelection(property, event.target as HTMLTextAreaElement)
}

/**
 * `{` over a selected number starts naming it instead of replacing it.
 * beforeinput, not keydown: it fires however the character arrives (layouts, IMEs, paste-like input).
 */
function onBeforeInput(property: string, event: Event) {
  if ((event as InputEvent).data !== '{' || !readSelection(property, event.target as HTMLTextAreaElement))
    return
  event.preventDefault()
  nextTick(() => {
    nameInput.value[0]?.focus()
    nameInput.value[0]?.select()
  })
}

function confirmName() {
  const current = pending.value
  const name = pendingName.value.trim()
  if (!current || !nameValid.value)
    return
  emit('makeVariable', current.property, current.start, current.end, name)
  pending.value = null
  // Back to the box with the new placeholder selected, so the change is easy to spot and keep typing after.
  nextTick(() => {
    const el = document.getElementById(`css-${current.property}`) as HTMLTextAreaElement | null
    const at = el?.value.indexOf(`{${name}}`, current.start) ?? -1
    if (!el || at < 0)
      return
    el.focus()
    el.setSelectionRange(at, at + name.length + 2)
  })
}

function cancelName() {
  const property = pending.value?.property
  pending.value = null
  if (property)
    document.getElementById(`css-${property}`)?.focus()
}
</script>

<template>
  <div class="min-h-0 flex flex-col gap-3">
    <div class="flex items-center justify-between gap-2">
      <p class="font-mono text-10px tracking-widest uppercase text-teal-400/80">
        Live CSS
      </p>
      <p class="text-10px text-white/35">
        Select a number, then press <kbd class="audit-kbd">{</kbd> to make it a dial
      </p>
    </div>

    <div
      v-for="property in properties"
      :key="property"
      class="border-1 border-white/8 rounded-xl bg-black/25"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 border-b-1 border-white/8 px-3 py-2">
        <label class="font-mono text-xs text-white/70" :for="`css-${property}`">
          {{ property }}
        </label>
        <form
          v-if="pending?.property === property"
          class="convert"
          @submit.prevent="confirmName"
        >
          <span class="convert-from">{{ pending.literal }} →</span>
          <span class="convert-brace" aria-hidden="true">{</span>
          <input
            ref="nameInput"
            v-model="pendingName"
            class="convert-name"
            spellcheck="false"
            aria-label="Dial name"
            :size="Math.max(4, pendingName.length)"
            @keydown.esc.prevent="cancelName"
          >
          <span class="convert-brace" aria-hidden="true">}</span>
          <button
            type="submit"
            class="convert-btn"
            :disabled="!nameValid"
            :title="linksExisting ? `Use the existing ${pendingName.trim()} dial here` : 'Replace the number with a new dial that defaults to it'"
          >
            {{ linksExisting ? 'Link dial' : 'Make dial' }}
          </button>
        </form>
        <button
          v-else
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
        @focus="focusedFrom[property] = template[property]"
        @input="onInput(property, $event)"
        @change="emit('commit', property, focusedFrom[property] ?? template[property])"
        @select="onSelect(property, $event)"
        @mouseup="onSelect(property, $event)"
        @keyup="onSelect(property, $event)"
        @beforeinput="onBeforeInput(property, $event)"
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

.audit-kbd {
  padding: 0 0.3em;
  border: 1px solid rgb(255 255 255 / 0.25);
  border-radius: 3px;
  font-family: ui-monospace, monospace;
  color: rgb(153 246 228);
}

.convert {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-family: ui-monospace, monospace;
  font-size: 11px;
}

.convert-from {
  margin-right: 0.25rem;
  color: rgb(255 255 255 / 0.5);
}

.convert-brace {
  color: rgb(94 234 212 / 0.7);
}

.convert-name {
  min-width: 4ch;
  padding: 0.15rem 0.3rem;
  border: 1px solid rgb(45 212 191 / 0.45);
  border-radius: 0.3rem;
  background: rgb(45 212 191 / 0.08);
  color: rgb(204 251 241);
  font: inherit;
  outline: none;
}

.convert-name:focus {
  border-color: rgb(94 234 212);
}

.convert-btn {
  margin-left: 0.3rem;
  padding: 0.2rem 0.5rem;
  border: 1px solid rgb(45 212 191 / 0.4);
  border-radius: 0.3rem;
  background: rgb(45 212 191 / 0.15);
  color: rgb(153 246 228);
  font: inherit;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
}

.convert-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.audit-btn:hover {
  background: rgb(45 212 191 / 0.2);
}
</style>
