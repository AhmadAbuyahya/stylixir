<script setup lang="ts">
import type { Template, Templates, Variable } from '~/types'
import AuditPreviewTile from '~/components/audit/AuditPreviewTile.vue'
import { type TemplateEntryDiff, buildPreviewStyle, diffTemplateEntry, sampleRange } from '~/lib/audit'
import { defaultVariables } from '~/lib/pattern'
import templates from '~/lib/templates'
import { useToastStore } from '~/stores/toast'

defineOptions({
  name: 'AuditReviewPage',
})

const STEPS = 7

const route = useRoute()
const router = useRouter()
const { addToast } = useToastStore()

const baseRef = ref(typeof route.query.base === 'string' ? route.query.base : 'main')
const baseline = ref<Templates | null>(null)
const loadError = ref('')
const loading = ref(false)
const selected = ref(typeof route.query.template === 'string' ? route.query.template : '')
const showAll = ref(false)
const reverting = ref(false)

async function loadBaseline() {
  loading.value = true
  loadError.value = ''
  try {
    const response = await fetch(`/__audit/baseline?ref=${encodeURIComponent(baseRef.value)}`)
    const result = await response.json().catch(() => ({ ok: false, error: 'Baseline unavailable — run pnpm dev' }))
    if (!response.ok || !result.ok)
      throw new Error(result.error)
    baseline.value = result.templates
  }
  catch (error) {
    baseline.value = null
    loadError.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    loading.value = false
  }
}

onMounted(loadBaseline)

interface PatternChange {
  slug: string
  status: 'changed' | 'added' | 'removed'
  diff: TemplateEntryDiff | null
}

const changes = computed<PatternChange[]>(() => {
  const before = baseline.value
  if (!before)
    return []
  return [...new Set([...Object.keys(before), ...Object.keys(templates)])].sort().flatMap((slug): PatternChange[] => {
    const b = before[slug]
    const a = templates[slug]
    if (!a)
      return [{ slug, status: 'removed', diff: null }]
    // New patterns diff against an empty entry so every dial gets a sweep.
    if (!b)
      return [{ slug, status: 'added', diff: diffTemplateEntry({ template: {}, variables: {} }, a) }]
    const diff = diffTemplateEntry(b, a)
    return diff.changed ? [{ slug, status: 'changed', diff }] : []
  })
})

watch(changes, (list) => {
  if (!list.some(c => c.slug === selected.value))
    selected.value = list[0]?.slug ?? ''
})

watch([selected, baseRef], () => {
  router.replace({ query: { base: baseRef.value, ...(selected.value ? { template: selected.value } : {}) } })
})

const current = computed(() => changes.value.find(c => c.slug === selected.value))
const before = computed(() => baseline.value?.[selected.value])
const after = computed(() => templates[selected.value] as Template | undefined)

function styleAtDefaults(entry?: Template) {
  return entry ? buildPreviewStyle(entry.template, defaultVariables(entry.variables)) : null
}

function sweep(entry: Template, name: string) {
  const defaults = defaultVariables(entry.variables)
  return sampleRange(entry.variables[name], STEPS).map(value => ({
    value,
    style: buildPreviewStyle(entry.template, { ...defaults, [name]: value }),
  }))
}

const rows = computed(() => {
  const diff = current.value?.diff
  if (!diff || !after.value)
    return []
  // A CSS edit can change how every dial looks, so show them all then.
  const showUnchanged = showAll.value || diff.cssChanged.length > 0
  return diff.variables
    .filter(v => (v.before ?? v.after)!.type !== 'color')
    .filter(v => showUnchanged || v.kind !== 'same')
    .map(v => ({
      ...v,
      beforeSweep: (v.before && before.value) ? sweep(before.value, v.name) : [],
      afterSweep: v.after ? sweep(after.value!, v.name) : [],
    }))
})

const colorChanges = computed(() =>
  current.value?.diff?.variables.filter(v => (v.before ?? v.after)!.type === 'color' && v.kind !== 'same') ?? [],
)

function rangeText(variable?: Variable) {
  if (!variable)
    return '—'
  if (variable.type === 'color')
    return String(variable.value)
  return `${variable.min}–${variable.max}${variable.step ? ` /${variable.step}` : ''} · default ${variable.value}`
}

function changeCount(change: PatternChange) {
  if (!change.diff || change.status !== 'changed')
    return change.status
  const vars = change.diff.variables.filter(v => v.kind !== 'same').length
  return [vars && `${vars} var${vars > 1 ? 's' : ''}`, change.diff.cssChanged.length && 'css'].filter(Boolean).join(' · ')
}

const kindClass: Record<string, string> = {
  changed: 'bg-amber-500/15 text-amber-300',
  added: 'bg-teal-500/15 text-teal-300',
  removed: 'bg-rose-500/15 text-rose-300',
  same: 'bg-white/5 text-white/40',
}

async function revert() {
  const slug = selected.value
  const draft = before.value
  if (!draft || current.value?.status !== 'changed')
    return
  reverting.value = true
  try {
    const response = await fetch('/__audit/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, draft }),
    })
    const result = await response.json().catch(() => ({ ok: false, error: 'Invalid response' }))
    if (!response.ok || !result.ok) {
      addToast({ id: Date.now(), variant: 'error', title: result.error || 'Revert failed — is the dev server running?' })
      return
    }
    addToast({ id: Date.now(), variant: 'success', title: `Reverted ${slug} to ${baseRef.value}` })
    // Let Vite HMR pick up the file write, then re-read templates.
    setTimeout(() => window.location.reload(), 400)
  }
  catch {
    addToast({ id: Date.now(), variant: 'error', title: 'Revert unavailable — run pnpm dev' })
  }
  finally {
    reverting.value = false
  }
}
</script>

<template>
  <div class="min-h-100dvh flex flex-col bg-#0d0d0d text-white">
    <header class="shrink-0 border-b-1 border-white/10 bg-#0d0d0d/90 backdrop-blur-md">
      <div class="mx-auto max-w-1600px flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div class="flex flex-wrap items-center gap-3">
          <RouterLink to="/" class="font-federo text-lg text-white/90">
            Stylixir
          </RouterLink>
          <span class="hidden text-white/20 sm:inline">/</span>
          <p class="font-mono text-xs tracking-widest uppercase text-teal-400/90">
            Pattern review
          </p>
        </div>
        <form class="flex flex-wrap items-center gap-2" @submit.prevent="loadBaseline">
          <label for="review-base" class="font-mono text-11px text-white/45">Before =</label>
          <input
            id="review-base"
            v-model="baseRef"
            class="review-input w-36"
            spellcheck="false"
            placeholder="git ref"
          >
          <button type="submit" class="review-link-btn" :disabled="loading">
            {{ loading ? 'Loading…' : 'Compare' }}
          </button>
          <RouterLink :to="{ path: '/audit', query: selected ? { template: selected } : {} }" class="review-link-btn">
            Audit
          </RouterLink>
        </form>
      </div>
    </header>

    <div class="mx-auto max-w-1600px w-full flex flex-1 flex-col gap-4 px-4 py-4 lg:flex-row md:px-6 md:py-5">
      <aside class="flex shrink-0 flex-col gap-2 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] lg:w-60 lg:self-start">
        <p class="font-mono text-10px tracking-widest uppercase text-white/40">
          {{ changes.length }} changed vs {{ baseRef }}
        </p>
        <div class="min-h-0 flex-1 overflow-y-auto border-1 border-white/8 rounded-xl bg-white/2">
          <button
            v-for="change in changes"
            :key="change.slug"
            type="button"
            class="w-full flex items-baseline justify-between gap-2 border-b-1 border-white/5 px-3 py-2 text-left font-mono text-11px transition"
            :class="change.slug === selected ? 'bg-teal-500/15 text-teal-200' : 'text-white/55 hover:bg-white/5 hover:text-white/80'"
            @click="selected = change.slug"
          >
            <span>{{ change.slug.replace(/_/g, ' ') }}</span>
            <span class="shrink-0 text-10px text-white/35">{{ changeCount(change) }}</span>
          </button>
          <p v-if="baseline && !changes.length" class="px-3 py-3 text-11px text-white/45">
            No differences from {{ baseRef }}.
          </p>
        </div>
      </aside>

      <main class="min-w-0 flex flex-1 flex-col gap-5">
        <p v-if="loadError" role="alert" class="border-1 border-rose-500/30 rounded-xl bg-rose-500/8 px-3 py-2 font-mono text-12px text-rose-200">
          {{ loadError }}
        </p>

        <template v-if="current">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h1 class="font-federo text-xl capitalize">
              {{ current.slug.replace(/_/g, ' ') }}
              <span class="ml-2 rounded-full px-2 py-0.5 align-middle font-mono text-10px normal-case" :class="kindClass[current.status]">
                {{ current.status }}
              </span>
            </h1>
            <div class="flex flex-wrap items-center gap-3">
              <label class="flex items-center gap-1.5 font-mono text-11px text-white/55">
                <input v-model="showAll" type="checkbox">
                Show unchanged dials
              </label>
              <button
                type="button"
                class="review-link-btn"
                :disabled="current.status !== 'changed' || reverting"
                title="Write the before version back into src/lib/templates.ts"
                @click="revert"
              >
                {{ reverting ? 'Reverting…' : `Revert to ${baseRef}` }}
              </button>
            </div>
          </div>

          <!-- Defaults side by side -->
          <section class="grid grid-cols-2 max-w-xl gap-3">
            <AuditPreviewTile v-if="styleAtDefaults(before)" label="Before · defaults" :style="styleAtDefaults(before)!" accent="min" />
            <p v-else class="self-center text-center font-mono text-11px text-white/35">
              not in {{ baseRef }}
            </p>
            <AuditPreviewTile v-if="styleAtDefaults(after)" label="After · defaults" :style="styleAtDefaults(after)!" accent="default" />
            <p v-else class="self-center text-center font-mono text-11px text-white/35">
              removed
            </p>
          </section>

          <p v-if="current.diff && !rows.length" class="font-mono text-11px text-white/45">
            No dial changes{{ colorChanges.length ? ' (colours only)' : '' }}.
          </p>

          <!-- Per-dial sweeps -->
          <section
            v-for="row in rows"
            :key="row.name"
            class="flex flex-col gap-2 border-1 border-white/8 rounded-xl bg-white/2 p-3"
          >
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 class="font-mono text-13px text-white/90">
                {{ row.name }}
              </h2>
              <span class="rounded-full px-2 py-0.5 font-mono text-10px" :class="kindClass[row.kind]">
                {{ row.kind === 'removed' ? 'removed · inlined' : row.kind }}
              </span>
              <p class="font-mono text-11px text-white/50">
                {{ rangeText(row.before) }}
                <template v-if="row.kind !== 'same'">
                  <span class="text-white/30">→</span>
                  <span class="text-teal-200/90">{{ rangeText(row.after) }}</span>
                </template>
              </p>
            </div>
            <div
              v-for="side in (['before', 'after'] as const)"
              :key="side"
              class="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] items-end gap-2"
            >
              <p class="pb-6 font-mono text-10px tracking-widest uppercase" :class="side === 'after' ? 'text-teal-400/80' : 'text-white/35'">
                {{ side }}
              </p>
              <AuditPreviewTile
                v-for="tile in (side === 'before' ? row.beforeSweep : row.afterSweep)"
                :key="tile.value"
                :label="String(tile.value)"
                :style="tile.style"
              />
              <p
                v-if="!(side === 'before' ? row.beforeSweep : row.afterSweep).length"
                class="col-span-7 pb-6 font-mono text-11px text-white/35"
              >
                {{ side === 'before' ? 'not a dial yet' : 'no longer a dial' }}
              </p>
            </div>
          </section>

          <!-- Colour defaults -->
          <section v-if="colorChanges.length" class="flex flex-wrap gap-2 font-mono text-11px text-white/60">
            <span v-for="c in colorChanges" :key="c.name" class="rounded-md bg-white/5 px-2 py-1">
              {{ c.name }}: {{ rangeText(c.before) }} → {{ rangeText(c.after) }}
            </span>
          </section>

          <!-- CSS changes -->
          <section v-for="prop in current.diff?.cssChanged ?? []" :key="prop" class="flex flex-col gap-2">
            <h2 class="font-mono text-11px tracking-widest uppercase text-white/45">
              {{ prop }}
            </h2>
            <div class="grid gap-2 md:grid-cols-2">
              <pre class="review-code">{{ before?.template[prop] ?? '—' }}</pre>
              <pre class="review-code border-teal-500/25!">{{ after?.template[prop] ?? '—' }}</pre>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>

<style scoped>
.review-input {
  border-radius: 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  background: rgb(255 255 255 / 0.04);
  padding: 0.4rem 0.65rem;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: white;
}

.review-link-btn {
  border-radius: 0.5rem;
  border: 1px solid rgb(255 255 255 / 0.12);
  background: transparent;
  padding: 0.4rem 0.75rem;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: rgb(255 255 255 / 0.65);
  cursor: pointer;
}

.review-link-btn:hover:not(:disabled) {
  border-color: rgb(255 255 255 / 0.22);
  color: white;
}

.review-link-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.review-code {
  margin: 0;
  overflow-x: auto;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 0.5rem;
  background: rgb(255 255 255 / 0.03);
  padding: 0.6rem 0.75rem;
  font-size: 11px;
  line-height: 1.5;
  color: rgb(255 255 255 / 0.75);
  white-space: pre-wrap;
}
</style>
