<script setup lang="ts">
import type { Variable } from '~/types'
import AuditAddVariable from '~/components/audit/AuditAddVariable.vue'
import AuditCssEditor from '~/components/audit/AuditCssEditor.vue'
import AuditPreviewTile from '~/components/audit/AuditPreviewTile.vue'
import AuditVariableRow from '~/components/audit/AuditVariableRow.vue'
import {
  buildPreviewStyle,
  exportTemplatePatch,
  isDraftDirty,
  previewValuesForVariable,
} from '~/lib/audit'
import { usePatternAudit } from '~/composables/usePatternAudit'
import { useToastStore } from '~/stores/toast'

defineOptions({
  name: 'AuditPage',
})

const {
  templates,
  slug,
  draft,
  liveValues,
  slugs,
  validation,
  loadSlug,
  resetDraft,
  updateTemplateProperty,
  commitTemplateProperty,
  convertToVariable,
  addTemplateProperty,
  removeTemplateProperty,
  addVariable,
  updateVariable,
  removeVariable,
  shuffleLiveValues,
  defineMissingPlaceholders,
} = usePatternAudit()

const route = useRoute()
const router = useRouter()
const { addToast } = useToastStore()

const search = ref('')
const exportOpen = ref(false)
const copied = ref(false)
const promoting = ref(false)

onMounted(() => {
  const fromQuery = typeof route.query.template === 'string' ? route.query.template : ''
  if (fromQuery && templates[fromQuery])
    loadSlug(fromQuery)
})

const bookNumber = (s: string) => String(slugs.value.indexOf(s) + 1).padStart(3, '0')
const wildCount = (s: string) => Object.values(templates[s].variables).filter(v => v.breaking).length

const filteredSlugs = computed(() => {
  const q = search.value.trim().toLowerCase().replace(/^no\.?\s*/, '')
  if (!q)
    return slugs.value
  return slugs.value.filter(s => s.includes(q) || s.replace(/_/g, ' ').includes(q) || bookNumber(s).includes(q))
})

const dirty = computed(() => isDraftDirty(slug.value, draft.value, templates))
/** Set right before the post-promote reload, so the unsaved-changes guard stays quiet. */
let leaving = false

function confirmDiscard() {
  // eslint-disable-next-line no-alert -- a native confirm is enough for a dev-only page
  return !dirty.value || leaving || window.confirm(`Discard your unsaved changes to ${slug.value.replace(/_/g, ' ')}?`)
}

function goTo(next: string) {
  if (next === slug.value || !templates[next] || !confirmDiscard())
    return
  loadSlug(next)
  // Keeps the pattern in the URL, so a reload or a shared link lands on it.
  router.replace({ query: { template: next } })
}

/** Steps through the visible list, so a search narrows what [ and ] walk through. */
function step(by: number) {
  const list = filteredSlugs.value.length ? filteredSlugs.value : slugs.value
  const at = list.indexOf(slug.value)
  const next = at < 0 ? (by > 0 ? 0 : list.length - 1) : (at + by + list.length) % list.length
  goTo(list[next])
}

watch(slug, async (current) => {
  await nextTick()
  document.querySelector(`[data-slug="${current}"]`)?.scrollIntoView({ block: 'nearest' })
})

useEventListener('keydown', (event: KeyboardEvent) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    promoteDraft()
    return
  }
  const target = event.target as HTMLElement
  if (event.metaKey || event.ctrlKey || event.altKey || target.closest('input, textarea, select, [contenteditable]'))
    return
  if (event.key === ']')
    step(1)
  else if (event.key === '[')
    step(-1)
})

useEventListener('beforeunload', (event: BeforeUnloadEvent) => {
  if (dirty.value && !leaving)
    event.preventDefault()
})

onBeforeRouteLeave(() => confirmDiscard())

const canPromote = computed(() =>
  dirty.value && validation.value.ok && !promoting.value,
)

const liveStyle = computed(() =>
  buildPreviewStyle(draft.value.template, liveValues.value),
)

const exportSnippet = computed(() =>
  exportTemplatePatch(slug.value, draft.value, templates),
)

const shapeVariables = computed(() =>
  Object.entries(draft.value.variables).filter(([key, v]) =>
    v.type !== 'color' && key !== 'size',
  ),
)
const wildShapeCount = computed(() => shapeVariables.value.filter(([, v]) => v.breaking).length)

const unusedAuditVariables = computed(() =>
  validation.value.unusedVariables.filter((key) => {
    if (key === 'size')
      return false
    const variable = draft.value.variables[key]
    return variable?.type !== 'color'
  }),
)

const showValidation = computed(() =>
  !validation.value.ok || unusedAuditVariables.value.length > 0,
)

function previewTriplet(varName: string) {
  const triplet = previewValuesForVariable(varName, draft.value.variables)
  if (!triplet)
    return null
  return {
    min: buildPreviewStyle(draft.value.template, triplet.min),
    default: buildPreviewStyle(draft.value.template, triplet.default),
    max: buildPreviewStyle(draft.value.template, triplet.max),
  }
}

type Triplet = NonNullable<ReturnType<typeof previewTriplet>>

/** Min / default / max previews per dial, built once per draft change instead of per render call. */
const triplets = computed(() => Object.fromEntries(
  shapeVariables.value.flatMap(([key]) => {
    const triplet = previewTriplet(key)
    return triplet ? [[key, triplet]] : []
  }),
) as Record<string, Triplet>)

function formatMissingPlaceholders(names: string[]) {
  return names.map(n => `{${n}}`).join(', ')
}

function handleCssUpdate(property: string, value: string) {
  updateTemplateProperty(property, value)
}

function handleCssCommit(property: string, before: string) {
  const created = commitTemplateProperty(property, before)
  if (created.length)
    addToast({ id: Date.now(), variant: 'success', title: `Added dial ${created.map(name => `{${name}}`).join(', ')}` })
}

function handleMakeVariable(property: string, start: number, end: number, name: string) {
  const result = convertToVariable(property, start, end, name)
  if (result === 'created')
    addToast({ id: Date.now(), variant: 'success', title: `Made {${name}} a dial, default ${draft.value.variables[name].value}` })
  else if (result === 'linked')
    addToast({ id: Date.now(), variant: 'success', title: `Linked to the {${name}} dial` })
  else
    addToast({ id: Date.now(), variant: 'warning', title: 'Select a plain number, like 45, 12px or 37.5%' })
}

function handleAddProperty(property: string) {
  if (!addTemplateProperty(property)) {
    addToast({ id: Date.now(), variant: 'warning', title: 'Property already exists' })
    return
  }
  addToast({ id: Date.now(), variant: 'success', title: `Added ${property}` })
}

function handleAddVariable(name: string, variable: Variable) {
  if (!addVariable(name, variable)) {
    addToast({ id: Date.now(), variant: 'warning', title: `"${name}" already exists` })
    return
  }
  addToast({ id: Date.now(), variant: 'success', title: `Added variable ${name}` })
}

function handleRemoveVariable(name: string) {
  const value = draft.value.variables[name]?.value
  if (!removeVariable(name))
    return
  addToast({
    id: Date.now(),
    variant: 'info',
    title: `Inlined {${name}} → ${value} and removed dial`,
  })
}

async function copyExport() {
  await navigator.clipboard.writeText(exportSnippet.value)
  copied.value = true
  addToast({ id: Date.now(), variant: 'success', title: 'Patch copied — paste into templates.ts' })
  setTimeout(() => {
    copied.value = false
  }, 1600)
}

async function promoteDraft() {
  if (!canPromote.value)
    return

  if (!validation.value.ok) {
    addToast({ id: Date.now(), variant: 'warning', title: 'Fix missing placeholders before promoting' })
    return
  }

  promoting.value = true
  try {
    const response = await fetch('/__audit/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: slug.value,
        draft: {
          template: draft.value.template,
          variables: draft.value.variables,
          ...(draft.value.harmony ? { harmony: draft.value.harmony } : {}),
        },
      }),
    })

    const result = await response.json().catch(() => ({ ok: false, error: 'Invalid response' }))

    if (!response.ok || !result.ok) {
      addToast({
        id: Date.now(),
        variant: 'error',
        title: result.error || 'Promote failed — is the dev server running?',
      })
      return
    }

    addToast({ id: Date.now(), variant: 'success', title: `Promoted ${slug.value} → templates.ts` })
    // Let Vite HMR pick up the file write, then re-sync the draft baseline.
    leaving = true
    setTimeout(() => window.location.reload(), 400)
  }
  catch {
    addToast({
      id: Date.now(),
      variant: 'error',
      title: 'Promote unavailable — use Export patch, or run pnpm dev',
    })
  }
  finally {
    promoting.value = false
  }
}
</script>

<template>
  <div class="audit-page min-h-100dvh flex flex-col bg-#0d0d0d text-white">
    <header class="shrink-0 border-b-1 border-white/10 bg-#0d0d0d/90 backdrop-blur-md">
      <div class="mx-auto max-w-1600px flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div class="flex flex-wrap items-center gap-3">
          <RouterLink :to="{ path: '/', query: { template: slug } }" class="font-display text-lg text-white/90">
            Stylixir
          </RouterLink>
          <span class="hidden text-white/20 sm:inline">/</span>
          <p class="font-mono text-xs tracking-widest uppercase text-teal-400/90">
            Pattern audit
          </p>
          <div class="audit-stepper" role="group" aria-label="Step through patterns">
            <button type="button" title="Previous pattern ( [ )" aria-label="Previous pattern" @click="step(-1)">
              <div class="i-carbon-chevron-left" />
            </button>
            <span>No. {{ bookNumber(slug) }} / {{ slugs.length }}</span>
            <button type="button" title="Next pattern ( ] )" aria-label="Next pattern" @click="step(1)">
              <div class="i-carbon-chevron-right" />
            </button>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <RouterLink :to="{ path: '/', query: { template: slug } }" class="audit-link-btn">
            Open in studio
          </RouterLink>
          <RouterLink to="/audit-review" class="audit-link-btn" title="Compare every changed pattern against main">
            Review changes
          </RouterLink>
          <button type="button" class="audit-link-btn" :disabled="!dirty" @click="resetDraft">
            Reset draft
          </button>
          <button
            type="button"
            class="audit-link-btn"
            @click="exportOpen = true"
          >
            Export patch
          </button>
          <button
            type="button"
            class="audit-primary-btn"
            :disabled="!canPromote"
            :class="{ 'opacity-50': !canPromote }"
            title="Write this draft into src/lib/templates.ts (⌘S / Ctrl+S)"
            @click="promoteDraft"
          >
            <div :class="promoting ? 'i-carbon-circle-dash animate-spin' : 'i-carbon-checkmark'" />
            {{ promoting ? 'Promoting…' : 'Promote' }}
          </button>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-1600px w-full flex flex-1 flex-col gap-4 px-4 py-4 lg:flex-row lg:overflow-hidden md:px-6 md:py-5">
      <!-- Pattern picker -->
      <aside class="flex shrink-0 flex-col gap-2 lg:max-h-[calc(100dvh-5rem)] lg:w-52">
        <input
          v-model="search"
          class="audit-input"
          placeholder="Search name or number…"
          spellcheck="false"
        >
        <div class="min-h-0 flex-1 overflow-y-auto border-1 border-white/8 rounded-xl bg-white/2 lg:max-h-full">
          <button
            v-for="s in filteredSlugs"
            :key="s"
            type="button"
            :data-slug="s"
            :aria-current="s === slug || undefined"
            class="w-full flex items-baseline gap-2 border-b-1 border-white/5 px-3 py-2 text-left font-mono text-11px transition"
            :class="s === slug ? 'bg-teal-500/15 text-teal-200' : 'text-white/55 hover:bg-white/5 hover:text-white/80'"
            @click="goTo(s)"
          >
            <span class="shrink-0 text-white/30">{{ bookNumber(s) }}</span>
            <span class="min-w-0 flex-1">{{ s.replace(/_/g, ' ') }}</span>
            <span v-if="wildCount(s)" class="shrink-0 text-amber-300/70" :title="`${wildCount(s)} wild dial${wildCount(s) > 1 ? 's' : ''}`">{{ wildCount(s) }}w</span>
          </button>
        </div>
      </aside>

      <!-- CSS editor -->
      <section class="min-h-0 flex flex-col gap-3 lg:max-h-[calc(100dvh-5rem)] lg:w-[38%] lg:overflow-y-auto">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h1 class="font-display text-xl capitalize">
            {{ slug.replace(/_/g, ' ') }}
          </h1>
          <span
            v-if="dirty"
            class="rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-10px text-amber-300"
          >
            unsaved draft
          </span>
        </div>

        <div
          v-if="showValidation"
          class="border-1 rounded-xl px-3 py-2 text-11px leading-relaxed"
          :class="validation.ok ? 'border-white/10 bg-white/3 text-white/50' : 'border-amber-500/30 bg-amber-500/8 text-amber-100/90'"
        >
          <template v-if="validation.missingInVariables.length">
            <p class="mb-1 font-mono tracking-wider uppercase">
              Placeholders missing variables
            </p>
            <p class="mb-2 font-mono text-teal-200">
              {{ formatMissingPlaceholders(validation.missingInVariables) }}
            </p>
            <button type="button" class="audit-inline-btn" @click="defineMissingPlaceholders">
              Create stub variables
            </button>
          </template>
          <template v-if="unusedAuditVariables.length">
            <p class="mb-1 mt-2 font-mono tracking-wider uppercase">
              Unused variables
            </p>
            <p class="font-mono text-white/60">
              {{ unusedAuditVariables.join(', ') }}
            </p>
          </template>
        </div>

        <AuditCssEditor
          :template="draft.template"
          :variable-names="Object.keys(draft.variables)"
          @update="handleCssUpdate"
          @commit="handleCssCommit"
          @make-variable="handleMakeVariable"
          @add-property="handleAddProperty"
          @remove-property="removeTemplateProperty"
        />
      </section>

      <!-- Variables + previews -->
      <section class="min-h-0 flex flex-1 flex-col gap-4 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto">
        <!-- Live main preview -->
        <div class="sticky top-0 z-10 border-1 border-white/10 rounded-2xl bg-#0d0d0d p-3 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.85)]">
          <div class="mb-2 flex items-center justify-between gap-2">
            <p class="font-mono text-10px tracking-widest uppercase text-white/40">
              Live preview
            </p>
            <button
              type="button"
              class="audit-inline-btn items-center gap-1 !flex"
              title="Shuffle shape values"
              @click="shuffleLiveValues"
            >
              <div class="i-carbon-shuffle" />
              Shuffle
            </button>
          </div>
          <div class="aspect-[2/1] w-full overflow-hidden border-1 border-white/10 rounded-xl">
            <div class="h-full w-full" :style="liveStyle" />
          </div>
        </div>

        <div v-if="shapeVariables.length" class="flex flex-col gap-3">
          <p class="font-mono text-10px tracking-widest uppercase text-teal-400/80">
            Dials · {{ shapeVariables.length }}
            <span v-if="wildShapeCount" class="text-amber-300/80">· {{ wildShapeCount }} wild</span>
            <span class="text-white/30">· min / default / max</span>
          </p>
          <AuditVariableRow
            v-for="[key, variable] in shapeVariables"
            :key="key"
            :name="key"
            :variable="variable"
            :live-value="liveValues[key] ?? variable.value"
            @update-live="liveValues[key] = $event"
            @update-variable="updateVariable(key, $event)"
            @remove="handleRemoveVariable(key)"
          >
            <template #previews>
              <div
                v-if="triplets[key]"
                class="grid grid-cols-3 gap-2"
              >
                <AuditPreviewTile label="Min" accent="min" :style="triplets[key].min" />
                <AuditPreviewTile label="Default" accent="default" :style="triplets[key].default" />
                <AuditPreviewTile label="Max" accent="max" :style="triplets[key].max" />
              </div>
            </template>
          </AuditVariableRow>
        </div>
        <details class="audit-details" :open="validation.missingInVariables.length > 0">
          <summary>Add a variable</summary>
          <AuditAddVariable @add="handleAddVariable">
            <template #missing="{ quickAdd }">
              <div v-if="validation.missingInVariables.length" class="mt-3 border-t-1 border-white/8 pt-3">
                <p class="mb-2 text-10px tracking-wider uppercase text-white/40">
                  Quick define from CSS
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="missing in validation.missingInVariables"
                    :key="missing"
                    type="button"
                    class="audit-chip"
                    @click="quickAdd(missing)"
                  >
                    {{ missing }}
                  </button>
                </div>
              </div>
            </template>
          </AuditAddVariable>
        </details>
      </section>
    </div>

    <!-- Export dialog -->
    <Teleport to="body">
      <div
        v-if="exportOpen"
        class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
        @click.self="exportOpen = false"
      >
        <div class="max-h-[85vh] max-w-3xl w-full flex flex-col overflow-hidden border-1 border-white/10 rounded-2xl bg-#121212 shadow-2xl">
          <div class="flex items-center justify-between gap-3 border-b-1 border-white/10 px-4 py-3">
            <div>
              <p class="font-display text-lg">
                Manual export
              </p>
              <p class="text-xs text-white/45">
                Prefer <strong class="font-normal text-teal-300/80">Promote</strong> while
                <code class="text-teal-300/80">pnpm dev</code> is running. Or copy and paste into
                <code class="text-teal-300/80">src/lib/templates.ts</code>.
              </p>
            </div>
            <button type="button" class="text-white/40 hover:text-white" @click="exportOpen = false">
              <div class="i-carbon-close text-xl" />
            </button>
          </div>
          <pre class="min-h-0 flex-1 overflow-auto p-4 font-mono text-11px leading-relaxed text-white/80">{{ exportSnippet }}</pre>
          <div class="flex justify-end gap-2 border-t-1 border-white/10 p-4">
            <button type="button" class="audit-link-btn" @click="exportOpen = false">
              Close
            </button>
            <button type="button" class="audit-primary-btn" @click="copyExport">
              <div :class="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" />
              {{ copied ? 'Copied' : 'Copy patch' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
  <Toasts />
</template>

<route lang="yaml">
meta:
  layout: home
</route>

<style scoped>
.audit-input {
  width: 100%;
  border-radius: 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.04);
  padding: 0.5rem 0.65rem;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: white;
}

.audit-link-btn {
  border-radius: 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  background: transparent;
  padding: 0.4rem 0.75rem;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: rgb(255 255 255 / 0.65);
  cursor: pointer;
}

.audit-link-btn:hover:not(:disabled) {
  border-color: rgb(255 255 255 / 0.22);
  color: white;
}

.audit-link-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.audit-primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.5rem;
  border: 1px solid rgb(45 212 191 / 0.4);
  background: rgb(45 212 191 / 0.15);
  padding: 0.4rem 0.85rem;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(153 246 228);
  cursor: pointer;
}

.audit-primary-btn:hover:not(:disabled) {
  background: rgb(45 212 191 / 0.25);
}

.audit-primary-btn:disabled {
  cursor: default;
}

.audit-inline-btn {
  border-radius: 0.375rem;
  border: 1px solid rgb(45 212 191 / 0.35);
  background: rgb(45 212 191 / 0.1);
  padding: 0.25rem 0.5rem;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  text-transform: uppercase;
  color: rgb(153 246 228);
  cursor: pointer;
}

.audit-chip {
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 0.12);
  background: rgb(255 255 255 / 0.05);
  padding: 0.2rem 0.55rem;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: rgb(255 255 255 / 0.75);
  cursor: pointer;
}

.audit-stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 0.5rem;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: rgb(255 255 255 / 0.7);
}

.audit-stepper button {
  display: grid;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.35rem;
  color: rgb(255 255 255 / 0.6);
}

.audit-stepper button:hover {
  background: rgb(255 255 255 / 0.08);
  color: white;
}

.audit-details > summary {
  cursor: pointer;
  padding: 0.5rem 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 0.45);
}

.audit-details > summary:hover {
  color: rgb(153 246 228);
}

.audit-chip:hover {
  border-color: rgb(45 212 191 / 0.4);
  color: rgb(153 246 228);
}
</style>
