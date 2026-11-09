<script setup lang="ts">
import tinycolor from 'tinycolor2'
import { buildSnippet } from '~/lib/effects'
import { randomTemplateSlug } from '~/lib/pattern'
import templates from '~/lib/templates'
import { useActiveTemplateStore } from '~/stores/activeTemplate'
import { useToastStore } from '~/stores/toast'

defineOptions({
  name: 'StudioPage',
})

const slugs = Object.keys(templates)
const isDev = import.meta.env.DEV
const store = useActiveTemplateStore()
const { addToast } = useToastStore()

const tuneOpen = ref(false)
const bookOpen = ref(false)
const exportOpen = ref(false)
/** Every control hidden so the pattern can be looked at, or shown, on its own. */
const bare = ref(false)

const index = computed(() => Math.max(0, slugs.indexOf(store.activeTemplate)))
const number = computed(() => String(index.value + 1).padStart(3, '0'))
const name = computed(() => store.activeTemplate.replace(/_/g, ' '))

function chroma(color: tinycolor.Instance) {
  const { s, l } = color.toHsl()
  return s * (1 - Math.abs(2 * l - 1))
}

// The roll's most saturated color dyes the Shuffle button, so it changes with every press.
const dye = computed(() => {
  const colors = Object.entries(store.variables)
    .filter(([, variable]) => variable.type === 'color')
    .map(([key]) => tinycolor(String(store.variablesRef[key])))
    .filter(color => color.isValid())
    .sort((a, b) => chroma(b) - chroma(a))
  const vivid = colors[0] ?? tinycolor('#131313')
  return {
    '--dye': vivid.toHexString(),
    '--dye-ink': tinycolor.mostReadable(vivid, ['#131313', '#ffffff']).toHexString(),
  }
})

function go(step: number) {
  store.updateActiveTemplate(slugs[(index.value + step + slugs.length) % slugs.length])
}

async function shuffle() {
  store.updateActiveTemplate(randomTemplateSlug(templates, store.activeTemplate))
  // The store resets dials to defaults in a watcher; roll after it has run.
  await nextTick()
  store.randomizeAll()
}

function pick(slug: string) {
  store.updateActiveTemplate(slug)
  bookOpen.value = false
}

async function copyCss() {
  try {
    await navigator.clipboard.writeText(buildSnippet(store.frame()))
  }
  catch {
    addToast({ variant: 'error', title: 'Couldn\'t copy the code. Allow clipboard access and try again.' })
    return
  }
  addToast({ variant: 'success', title: 'Code copied' })
}

const { isFullscreen, enter: enterFullscreen, exit: exitFullscreen } = useFullscreen()

function present() {
  bare.value = true
  tuneOpen.value = false
  enterFullscreen().catch(() => {})
}

function unpresent() {
  bare.value = false
  if (isFullscreen.value)
    exitFullscreen()
}

watch(isFullscreen, (full) => {
  if (!full)
    bare.value = false
})

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.metaKey || event.ctrlKey || event.altKey || exportOpen.value)
    return
  if (bare.value) {
    unpresent()
    return
  }
  if (event.key === 'Escape') {
    if (bookOpen.value)
      bookOpen.value = false
    else
      tuneOpen.value = false
    return
  }
  const target = event.target as HTMLElement
  if (bookOpen.value || target.closest('input, select, textarea, [contenteditable]'))
    return
  if (event.key === ' ' && !target.closest('button, a')) {
    event.preventDefault()
    shuffle()
  }
  else if (event.key === 'ArrowRight') {
    go(1)
  }
  else if (event.key === 'ArrowLeft') {
    go(-1)
  }
})

onMounted(() => {
  if (window.matchMedia('(min-width: 1100px)').matches)
    tuneOpen.value = true
  // A bare visit opens on a fresh roll; shared links keep theirs. Runs after the store reads the URL.
  const shared = new URLSearchParams(location.search).has('template') || location.hash.includes('template=')
  if (!shared)
    setTimeout(shuffle, 0)
})
</script>

<template>
  <div class="studio" :class="{ 'is-bare': bare }" :style="dye">
    <div class="canvas" @click="bare && unpresent()">
      <PatternLayers />
    </div>

    <header class="bar chrome">
      <div class="brand">
        <span class="wordmark">Stylixir</span>
        <h1 class="eyebrow">
          Wallpaper generator
        </h1>
      </div>

      <nav class="tools" aria-label="Studio">
        <button class="tool" type="button" title="Browse all the patterns" @click="bookOpen = true">
          <span class="i-carbon-catalog" aria-hidden="true" />
          <span class="tool-label">Book</span>
          <span class="tool-count">{{ slugs.length }}</span>
        </button>
        <button class="tool" type="button" title="Tune shape, colors, finish and motion" :aria-pressed="tuneOpen" @click="tuneOpen = !tuneOpen">
          <span class="i-carbon-settings-adjust" aria-hidden="true" />
          <span class="tool-label">Tune</span>
        </button>
        <span class="tool-sep" aria-hidden="true" />
        <button class="tool tool-ink" type="button" title="Download as a wallpaper for any screen" @click="exportOpen = true">
          <span class="i-carbon-download" aria-hidden="true" />
          <span class="tool-label">Download</span>
        </button>
        <button class="tool" type="button" title="Copy the HTML and CSS, to use it on a website" @click="copyCss">
          <span class="i-carbon-code" aria-hidden="true" />
          <span class="tool-label">Copy Code</span>
        </button>
        <span class="tool-sep" aria-hidden="true" />
        <button class="tool tool-wide-only" type="button" title="Preview it full screen, like a wallpaper" aria-label="Preview full screen" @click="present">
          <span class="i-carbon-maximize" aria-hidden="true" />
        </button>
        <button class="tool" type="button" :title="isDark ? 'Switch to light' : 'Switch to dark'" :aria-label="isDark ? 'Switch to light' : 'Switch to dark'" @click="toggleDark()">
          <span class="i-carbon-sun dark:i-carbon-moon" aria-hidden="true" />
        </button>
        <template v-if="isDev">
          <span class="tool-sep" aria-hidden="true" />
          <RouterLink class="tool" :to="{ path: '/audit', query: { template: store.activeTemplate } }" title="Audit this pattern's dials (dev only)">
            <span class="i-carbon-debug" aria-hidden="true" />
            <span class="tool-label">Audit</span>
          </RouterLink>
        </template>
      </nav>
    </header>

    <section class="chrome tag-wrap" aria-label="Current pattern">
      <div class="tag pinked-top">
        <p class="eyebrow">
          No. {{ number }} <span class="tag-of">of {{ slugs.length }}</span>
        </p>
        <Transition name="stamp" mode="out-in">
          <h2 :key="store.activeTemplate" class="stamp" :class="{ 'stamp-long': name.length > 14 }">
            {{ name }}
          </h2>
        </Transition>
        <div class="tag-nav">
          <button class="step" type="button" title="Previous pattern (←)" aria-label="Previous pattern" @click="go(-1)">
            <span class="i-carbon-arrow-left" aria-hidden="true" />
          </button>
          <button class="shuffle" type="button" @click="shuffle">
            <span class="i-carbon-shuffle" aria-hidden="true" />
            Shuffle
            <kbd class="shuffle-kbd">Space</kbd>
          </button>
          <button class="step" type="button" title="Next pattern (→)" aria-label="Next pattern" @click="go(1)">
            <span class="i-carbon-arrow-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>

    <Transition name="panel">
      <TunePanel v-if="tuneOpen && !bare" @close="tuneOpen = false" />
    </Transition>

    <Transition name="book">
      <PatternBook v-show="bookOpen" :open="bookOpen" :active="store.activeTemplate" @pick="pick" @close="bookOpen = false" />
    </Transition>

    <ExportDialog v-model:open="exportOpen" />
    <Toasts />
  </div>
</template>

<route lang="yaml">
meta:
  layout: home
</route>

<style scoped>
.studio {
  position: fixed;
  inset: 0;
  overflow: hidden;
  color: var(--ink);
}

.canvas {
  position: absolute;
  inset: 0;
}

.is-bare .canvas {
  cursor: pointer;
}

.chrome {
  transition: opacity 0.3s var(--ease-out), transform 0.3s var(--ease-out);
}

.is-bare .chrome {
  opacity: 0;
  pointer-events: none;
}

.is-bare .bar {
  transform: translateY(-12px);
}

.is-bare .tag-wrap {
  transform: translateY(12px);
}

/* ---- top bar ---- */

.bar {
  position: absolute;
  z-index: 10;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;
}

.brand,
.tools {
  pointer-events: auto;
  border-radius: 12px;
  background: var(--sheet);
  box-shadow: var(--lift);
}

.brand {
  padding: 9px 14px 10px;
}

.wordmark {
  display: block;
  font-family: 'Big Shoulders Display', sans-serif;
  font-size: 24px;
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.brand .eyebrow {
  margin-top: 3px;
  font-size: 8.5px;
}

.tools {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
}

.tool {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 11px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: background-color 0.15s ease, transform 0.12s ease;
}

.tool:hover,
.tool[aria-pressed='true'] {
  background: var(--wash);
}

.tool-ink,
.tool-ink:hover {
  background: var(--ink);
  color: var(--sheet);
}

.tool-ink:hover {
  opacity: 0.86;
}

.tool-count {
  font-family: 'Martian Mono', monospace;
  font-size: 10px;
  color: var(--muted);
}

.tool-sep {
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: var(--line);
}

/* ---- bolt tag ---- */

.tag-wrap {
  position: absolute;
  z-index: 10;
  left: 16px;
  bottom: 16px;
  width: min(440px, calc(100% - 32px));
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.12)) drop-shadow(0 12px 24px rgb(0 0 0 / 0.22));
}

.tag {
  --tooth: 12px;
  padding: 22px 18px 16px;
  border-radius: 0 0 14px 14px;
  background: var(--sheet);
}

.tag-of {
  opacity: 0.6;
}

.stamp {
  margin: 10px 0 16px;
  font-family: 'Big Shoulders Display', sans-serif;
  font-size: clamp(3rem, 2rem + 3vw, 4.75rem);
  font-weight: 900;
  line-height: 0.86;
  letter-spacing: -0.005em;
  text-transform: uppercase;
  text-wrap: balance;
}

.stamp-long {
  font-size: clamp(2.25rem, 1.5rem + 2vw, 3.25rem);
}

.stamp-enter-active {
  transition: transform 0.32s var(--ease-out), opacity 0.2s ease;
}

.stamp-leave-active {
  transition: transform 0.12s ease-in, opacity 0.12s ease-in;
}

.stamp-enter-from {
  transform: translateY(0.35em);
  opacity: 0;
}

.stamp-leave-to {
  transform: translateY(-0.2em);
  opacity: 0;
}

.tag-nav {
  display: flex;
  gap: 6px;
}

.step,
.shuffle {
  height: 46px;
  border-radius: 10px;
  transition: background-color 0.45s var(--ease-out), color 0.45s var(--ease-out), transform 0.12s ease;
}

.step {
  display: grid;
  place-items: center;
  width: 46px;
  border: 1px solid var(--line);
}

.step:hover {
  background: var(--wash);
}

.shuffle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  background: var(--dye);
  color: var(--dye-ink);
  font-size: 15px;
  font-weight: 600;
  /* Keeps an edge when the dye is close to the tag's own color. */
  box-shadow: inset 0 0 0 1px var(--line);
}

.shuffle-kbd {
  margin-left: 2px;
}

.tool:active,
.step:active,
.shuffle:active {
  transform: scale(0.97);
}

/* ---- overlays ---- */

.panel-enter-active,
.panel-leave-active,
.book-enter-active,
.book-leave-active {
  transition: opacity 0.24s var(--ease-out), transform 0.24s var(--ease-out);
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.book-enter-from,
.book-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 720px) {
  .bar {
    top: 12px;
    left: 12px;
    right: 12px;
  }

  .brand .eyebrow,
  .tool-label,
  .tool-count,
  .tool-wide-only {
    display: none;
  }

  .brand {
    padding: 11px 12px;
  }

  .wordmark {
    font-size: 20px;
  }

  .tool {
    padding: 0 10px;
  }

  .tag-wrap {
    left: 12px;
    bottom: 12px;
    width: calc(100% - 24px);
  }

  .shuffle-kbd {
    display: none;
  }

  .panel-enter-from,
  .panel-leave-to {
    transform: translateY(32px);
  }
}
</style>
