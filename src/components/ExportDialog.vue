<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  type ImageFormat,
  MAX_SIDE,
  SIZE_PRESETS,
  canUsePixelRatio,
  clampDimension,
  copyImageBlob,
  downloadBlob,
  exportFilename,
  renderPatternBlob,
} from '~/lib/exportImage'
import { useActiveTemplateStore } from '~/stores/activeTemplate'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

defineOptions({
  name: 'ExportDialog',
})

const store = useActiveTemplateStore()
const { style, overlayStyle, activeTemplate } = storeToRefs(store)
const { addToast } = useToastStore()

const width = ref(1920)
const height = ref(1080)
const format = ref<ImageFormat>('png')
const quality = ref(0.92)
const pixelRatio = ref<1 | 2>(1)
const includeOverlay = ref(true)
const busy = ref(false)
const copied = ref(false)

const selectedPreset = computed(() => {
  return SIZE_PRESETS.find(preset => preset.width === width.value && preset.height === height.value)?.id ?? 'custom'
})

const densityAllowed = computed(() => canUsePixelRatio(width.value, height.value, 2))

const filename = computed(() =>
  exportFilename(activeTemplate.value, width.value, height.value, format.value, pixelRatio.value),
)

const outputLabel = computed(() => {
  const ratio = densityAllowed.value ? pixelRatio.value : 1
  return `${width.value * ratio} × ${height.value * ratio} px`
})

const previewOverlay = computed(() => {
  if (!includeOverlay.value)
    return undefined
  const blur = overlayStyle.value['backdrop-filter']
  return {
    background: overlayStyle.value.background,
    ...(blur ? { 'backdrop-filter': blur } : {}),
  }
})

watch(() => props.open, (open) => {
  if (!open)
    return
  copied.value = false
  if (!densityAllowed.value)
    pixelRatio.value = 1
})

watch(densityAllowed, (allowed) => {
  if (!allowed)
    pixelRatio.value = 1
})

watch(() => props.open, (open) => {
  if (typeof document === 'undefined')
    return
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined')
    document.body.style.overflow = ''
})

function close() {
  if (busy.value)
    return
  emit('update:open', false)
}

function applyPreset(id: string) {
  const preset = SIZE_PRESETS.find(item => item.id === id)
  if (!preset)
    return
  width.value = preset.width
  height.value = preset.height
}

function onWidth(event: Event) {
  width.value = clampDimension(Number((event.target as HTMLInputElement).value))
}

function onHeight(event: Event) {
  height.value = clampDimension(Number((event.target as HTMLInputElement).value))
}

async function render() {
  return renderPatternBlob({
    width: width.value,
    height: height.value,
    format: format.value,
    quality: quality.value,
    pixelRatio: densityAllowed.value ? pixelRatio.value : 1,
    includeOverlay: includeOverlay.value,
    slug: activeTemplate.value,
    patternStyle: style.value,
    overlayStyle: overlayStyle.value,
  })
}

async function download() {
  busy.value = true
  try {
    const blob = await render()
    downloadBlob(blob, filename.value)
    addToast({ variant: 'success', title: 'Image downloaded', id: Date.now() })
  }
  catch {
    addToast({ variant: 'error', title: 'Could not export the image', id: Date.now() })
  }
  finally {
    busy.value = false
  }
}

async function copy() {
  busy.value = true
  try {
    const blob = await render()
    await copyImageBlob(blob)
    copied.value = true
    addToast({ variant: 'success', title: 'Image copied', id: Date.now() })
    window.setTimeout(() => {
      copied.value = false
    }, 1600)
  }
  catch {
    addToast({ variant: 'error', title: 'Could not copy the image', id: Date.now() })
  }
  finally {
    busy.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape')
    close()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
      @keydown="onKeydown"
    >
      <button
        class="absolute inset-0 bg-black/70 backdrop-blur-sm"
        type="button"
        aria-label="Close export"
        @click="close"
      />

      <div class="relative max-h-[92dvh] max-w-lg w-full overflow-y-auto border-1 border-white/10 rounded-2xl bg-#0d0d0d p-5 text-left text-white shadow-2xl sm:p-6">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <p class="font-mono text-10px tracking-widest uppercase text-teal-400/80">
              Export
            </p>
            <h2 id="export-title" class="mt-1 font-federo text-2xl tracking-tight uppercase">
              Save as image
            </h2>
          </div>
          <button
            class="text-xl icon-btn"
            type="button"
            title="Close"
            @click="close"
          >
            <div class="i-carbon-close" />
          </button>
        </div>

        <div class="mb-5 h-40 flex items-center justify-center overflow-hidden border-1 border-white/10 rounded-xl bg-#141414 p-3">
          <div
            class="relative max-h-full max-w-full overflow-hidden border-1 border-white/10 rounded-md"
            :style="{
              aspectRatio: `${width} / ${height}`,
              width: width >= height ? '100%' : 'auto',
              height: height > width ? '100%' : 'auto',
            }"
          >
            <div class="absolute inset-0" :style="style" />
            <div
              v-if="includeOverlay"
              class="pointer-events-none absolute inset-0"
              :style="previewOverlay"
            />
          </div>
        </div>

        <section class="mb-5">
          <p class="mb-2 font-mono text-10px tracking-widest uppercase text-teal-400/80">
            Size
          </p>
          <div class="grid grid-cols-3 gap-1.5">
            <button
              v-for="preset in SIZE_PRESETS"
              :key="preset.id"
              type="button"
              class="border-1 rounded-lg px-2 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-400"
              :class="selectedPreset === preset.id
                ? 'border-teal-400 bg-teal-400/10'
                : 'border-white/10 hover:border-white/25'"
              @click="applyPreset(preset.id)"
            >
              <span class="block text-xs">{{ preset.label }}</span>
              <span class="block font-mono text-10px text-white/40">{{ preset.hint }}</span>
            </button>
          </div>
          <div class="grid grid-cols-[1fr_auto_1fr] mt-3 items-center gap-2">
            <label class="font-mono text-xs text-white/50">
              W
              <input
                :value="width"
                type="number"
                min="1"
                :max="MAX_SIDE"
                class="mt-1 w-full border-1 border-white/10 rounded-md bg-#141414 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-teal-400"
                @change="onWidth"
              >
            </label>
            <span class="mt-5 text-white/30">×</span>
            <label class="font-mono text-xs text-white/50">
              H
              <input
                :value="height"
                type="number"
                min="1"
                :max="MAX_SIDE"
                class="mt-1 w-full border-1 border-white/10 rounded-md bg-#141414 px-2 py-1.5 font-mono text-xs text-white outline-none focus:border-teal-400"
                @change="onHeight"
              >
            </label>
          </div>
        </section>

        <section class="mb-5">
          <p class="mb-2 font-mono text-10px tracking-widest uppercase text-teal-400/80">
            Format
          </p>
          <div class="flex gap-1.5">
            <button
              v-for="option in (['png', 'jpeg', 'webp'] as ImageFormat[])"
              :key="option"
              type="button"
              class="flex-1 border-1 rounded-lg py-2 font-mono text-xs uppercase outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-400"
              :class="format === option
                ? 'border-teal-400 bg-teal-400/10 text-teal-200'
                : 'border-white/10 text-white/70 hover:border-white/25'"
              @click="format = option"
            >
              {{ option === 'jpeg' ? 'JPG' : option }}
            </button>
          </div>
          <div v-if="format !== 'png'" class="mt-3">
            <label class="mb-1.5 flex items-baseline justify-between font-mono text-xs text-white/60">
              Quality
              <span class="text-white/40">{{ Math.round(quality * 100) }}%</span>
            </label>
            <input
              v-model.number="quality"
              type="range"
              min="0.5"
              max="1"
              step="0.02"
              class="w-full accent-teal-400"
            >
          </div>
        </section>

        <section class="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="mb-2 font-mono text-10px tracking-widest uppercase text-teal-400/80">
              Density
            </p>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="border-1 rounded-lg px-3 py-1.5 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                :class="pixelRatio === 1 ? 'border-teal-400 bg-teal-400/10' : 'border-white/10'"
                @click="pixelRatio = 1"
              >
                1×
              </button>
              <button
                type="button"
                class="border-1 rounded-lg px-3 py-1.5 font-mono text-xs outline-none disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-teal-400"
                :class="pixelRatio === 2 ? 'border-teal-400 bg-teal-400/10' : 'border-white/10'"
                :disabled="!densityAllowed"
                :title="densityAllowed ? 'Retina' : 'Too large for 2×'"
                @click="pixelRatio = 2"
              >
                2×
              </button>
            </div>
          </div>
          <label class="mt-4 flex items-center gap-2 font-mono text-xs text-white/70">
            <input
              v-model="includeOverlay"
              type="checkbox"
              class="accent-teal-400"
            >
            Include overlay
          </label>
        </section>

        <p class="mb-4 font-mono text-xs text-white/40">
          {{ filename }}
          <span class="text-white/25">·</span>
          {{ outputLabel }}
        </p>

        <div class="flex flex-col gap-2 sm:flex-row">
          <button
            class="button flex-1 px-4 py-2.5"
            type="button"
            :disabled="busy"
            @click="copy"
          >
            <div :class="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" />
            {{ copied ? 'Copied' : 'Copy image' }}
          </button>
          <button
            class="flex-1 items-center justify-center gap-2 px-4 py-2.5 btn !flex"
            type="button"
            :disabled="busy"
            @click="download"
          >
            <div :class="busy ? 'i-carbon-renew' : 'i-carbon-download'" />
            {{ busy ? 'Rendering…' : 'Download' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
