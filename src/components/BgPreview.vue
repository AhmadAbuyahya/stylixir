<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { buildSnippet } from '~/lib/effects'
import { useActiveTemplateStore } from '~/stores/activeTemplate'
import { useToastStore } from '~/stores/toast'

const activeTemplateStore = useActiveTemplateStore()
const { style, activeTemplate } = storeToRefs(activeTemplateStore)
const { addToast } = useToastStore()

const copied = ref(false)
const exportOpen = ref(false)
const card = ref<HTMLElement>()
const { isFullscreen, isSupported: canFullscreen, toggle: toggleFullscreen } = useFullscreen(card)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const patternName = computed(() => activeTemplate.value.replace(/_/g, ' '))

async function copyStyle() {
  const html = buildSnippet(activeTemplateStore.frame())

  try {
    await navigator.clipboard.writeText(html)
  }
  catch {
    addToast({ variant: 'error', title: 'Couldn\'t copy the CSS. Allow clipboard access and try again.', id: Date.now() })
    return
  }
  addToast({
    variant: 'success',
    title: 'CSS copied',
    id: Date.now(),
  })
  copied.value = true
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copied.value = false
  }, 1600)
}

onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <section class="relative min-h-50vh overflow-hidden md:h-full md:min-h-0">
    <div
      class="pointer-events-none absolute inset-0"
      :style="{
        ...style,
        filter: 'blur(5px) brightness(0.45) saturate(1.2)',
      }"
    />

    <div ref="card" class="preview-card absolute inset-3 overflow-hidden border-1 border-white/10 rounded-2xl shadow-2xl shadow-black/50 md:inset-[8%] sm:inset-5">
      <PatternLayers />

      <button
        v-if="isFullscreen"
        class="absolute right-4 top-4 z-10 items-center gap-1.5 px-3 py-2 text-xs btn !flex"
        type="button"
        @click="toggleFullscreen"
      >
        <div class="i-carbon-minimize" />
        Exit full screen
      </button>

      <div v-else class="absolute inset-x-0 bottom-0 z-10 from-black/75 to-transparent bg-gradient-to-t p-3 pt-10 sm:p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-mono text-xs tracking-widest uppercase text-white/80">
            {{ patternName }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="canFullscreen"
              class="items-center px-2.5 py-2 text-xs btn !flex"
              type="button"
              title="Full screen"
              aria-label="Full screen"
              @click="toggleFullscreen"
            >
              <div class="i-carbon-maximize" />
            </button>
            <button
              class="button px-3 py-2 text-xs !gap-1.5"
              type="button"
              @click="copyStyle"
            >
              <div :class="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" />
              {{ copied ? 'Copied' : 'Copy CSS' }}
            </button>
            <button
              class="items-center gap-1.5 px-3 py-2 text-xs btn !flex"
              type="button"
              @click="exportOpen = true"
            >
              <div class="i-carbon-image" />
              Export image
            </button>
          </div>
        </div>
      </div>
    </div>

    <ExportDialog v-model:open="exportOpen" />
  </section>
</template>

<style scoped>
.preview-card:fullscreen {
  border: 0;
  border-radius: 0;
}
</style>
