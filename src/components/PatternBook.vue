<script setup lang="ts">
import templates from '~/lib/templates'
import { buildStyle, defaultVariables } from '~/lib/pattern'

const props = defineProps<{
  open: boolean
  active: string
}>()

const emit = defineEmits<{
  pick: [slug: string]
  close: []
}>()

const entries = Object.keys(templates).map((slug, i) => ({
  slug,
  number: String(i + 1).padStart(3, '0'),
  name: slug.replace(/_/g, ' '),
  style: buildStyle(slug, templates, defaultVariables(templates[slug].variables)),
}))

const query = ref('')
const search = ref<HTMLInputElement>()
const root = ref<HTMLElement>()

const shown = computed(() => {
  const q = query.value.trim().toLowerCase().replace(/^no\.?\s*/, '')
  return q ? entries.filter(entry => entry.name.includes(q) || entry.number.includes(q)) : entries
})

watch(() => props.open, async (open) => {
  if (!open)
    return
  await nextTick()
  root.value?.querySelector<HTMLElement>(`[data-slug="${props.active}"]`)?.scrollIntoView({ block: 'center' })
  // Skip on touch so the keyboard doesn't cover the book.
  if (window.matchMedia('(pointer: fine)').matches)
    search.value?.focus({ preventScroll: true })
})
</script>

<template>
  <div ref="root" class="book" role="dialog" aria-modal="true" aria-labelledby="book-title">
    <header class="book-head">
      <div class="book-heading">
        <h2 id="book-title" class="book-title">
          Pattern book
        </h2>
        <p class="eyebrow">
          {{ entries.length }} patterns. Pick one to start your wallpaper.
        </p>
      </div>
      <input
        ref="search"
        v-model="query"
        type="search"
        class="book-search"
        placeholder="Find a pattern"
        aria-label="Find a pattern"
      >
      <button class="book-close" type="button" @click="emit('close')">
        Close <kbd>Esc</kbd>
      </button>
    </header>

    <ol class="book-grid">
      <li v-for="entry in shown" :key="entry.slug" class="book-item">
        <button
          type="button"
          class="swatch"
          :data-slug="entry.slug"
          :aria-current="entry.slug === active || undefined"
          @click="emit('pick', entry.slug)"
        >
          <span class="cloth pinked-bottom">
            <span class="cloth-fill" :style="entry.style" />
          </span>
          <span class="swatch-label">
            <span class="eyebrow">No. {{ entry.number }}<template v-if="entry.slug === active"> · Current</template></span>
            <span class="swatch-name">{{ entry.name }}</span>
          </span>
        </button>
      </li>
    </ol>

    <p v-if="!shown.length" class="book-empty">
      Nothing matches “{{ query }}”. Try a shape, like circle, wave or brick.
    </p>
  </div>
</template>

<style scoped>
.book {
  position: absolute;
  z-index: 30;
  inset: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--paper);
  color: var(--ink);
}

.book-head {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px max(24px, (100% - 1360px) / 2);
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}

.book-heading {
  margin-right: auto;
}

.book-title {
  font-family: 'Big Shoulders Display', sans-serif;
  font-size: 34px;
  font-weight: 900;
  line-height: 0.9;
  text-transform: uppercase;
}

.book-heading .eyebrow {
  margin-top: 6px;
}

.book-search {
  width: min(320px, 40vw);
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--sheet);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  outline: none;
}

.book-search:focus {
  border-color: var(--ink);
}

.book-close {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  background: var(--ink);
  color: var(--sheet);
  font-size: 13px;
  font-weight: 500;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 30px 18px;
  padding: 28px max(24px, (100% - 1360px) / 2) 64px;
  list-style: none;
}

.book-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 250px;
}

.swatch {
  display: block;
  width: 100%;
  text-align: left;
  border-radius: 4px;
}

.cloth {
  --tooth: 9px;
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 4px 4px 0 0;
  transition: transform 0.25s var(--ease-out);
}

.cloth-fill {
  position: absolute;
  inset: 0;
  zoom: 0.5;
}

.swatch:hover .cloth {
  transform: translateY(-4px) rotate(-0.6deg);
}

.swatch[aria-current] .cloth {
  transform: translateY(-4px);
}

.swatch-label {
  display: block;
  padding-top: 8px;
}

.swatch[aria-current] .eyebrow {
  color: var(--ink);
}

.swatch-name {
  display: block;
  margin-top: 3px;
  font-family: 'Big Shoulders Display', sans-serif;
  font-size: 19px;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
}

.book-empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--muted);
}

@media (max-width: 720px) {
  .book-head {
    flex-wrap: wrap;
    gap: 12px;
    padding: 14px 16px;
  }

  /* The long subtitle pushed Close onto its own row, and this header is sticky. */
  .book-heading .eyebrow {
    display: none;
  }

  .book-title {
    font-size: 28px;
  }

  .book-search {
    order: 3;
    width: 100%;
  }

  .book-close kbd {
    display: none;
  }

  .book-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px 14px;
    padding: 20px 16px 48px;
  }
}
</style>
