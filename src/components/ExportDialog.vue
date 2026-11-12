<script setup lang="ts">
import { storeToRefs } from 'pinia'
import {
  type ImageFormat,
  MAX_SIDE,
  SIZE_PRESETS,
  type SizePreset,
  canUsePixelRatio,
  clampDimension,
  copyImageBlob,
  downloadBlob,
  exportFilename,
  renderPatternBlob,
  screenSize,
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
const { activeTemplate } = storeToRefs(store)
const { addToast } = useToastStore()

const width = ref(1920)
const height = ref(1080)
const format = ref<ImageFormat>('png')
const quality = ref(0.92)
const pixelRatio = ref<1 | 2>(1)
const includeOverlay = ref(true)
const busy = ref(false)
const copied = ref(false)
// Measured when the dialog opens: `screen` does not exist during prerender.
const screenPreset = ref<SizePreset>()
const canShare = ref(false)
// An image whose share was refused because rendering outlasted the tap.
const pendingShare = ref<File>()

const presets = computed(() => screenPreset.value ? [screenPreset.value, ...SIZE_PRESETS] : SIZE_PRESETS)

const chosenPreset = ref('')

// A 3× iPhone's screen equals the Phone preset, so remember which one was tapped.
const selectedPreset = computed(() => {
  const matches = presets.value.filter(preset => preset.width === width.value && preset.height === height.value)
  return (matches.find(preset => preset.id === chosenPreset.value) ?? matches[0])?.id ?? 'custom'
})

// "This screen" is already in physical pixels, so 2× would only upscale past the display.
const densityAllowed = computed(() => selectedPreset.value !== 'screen' && canUsePixelRatio(width.value, height.value, 2))

const filename = computed(() =>
  exportFilename(activeTemplate.value, width.value, height.value, format.value, pixelRatio.value),
)

const outputLabel = computed(() => {
  const ratio = densityAllowed.value ? pixelRatio.value : 1
  return `${width.value * ratio} × ${height.value * ratio} px`
})

watch(() => props.open, (open) => {
  if (!open) {
    pendingShare.value = undefined
    return
  }
  copied.value = false
  const size = screenSize(screen.width, screen.height, window.devicePixelRatio || 1, matchMedia('(orientation: landscape)').matches)
  screenPreset.value = { id: 'screen', label: 'This screen', hint: `${size.width} × ${size.height}`, ...size }
  applyPreset('screen')
  canShare.value = matchMedia('(pointer: coarse)').matches
    && !!navigator.canShare?.({ files: [new File([], 'wallpaper.png', { type: 'image/png' })] })
  if (!densityAllowed.value)
    pixelRatio.value = 1
})

watch(densityAllowed, (allowed) => {
  if (!allowed)
    pixelRatio.value = 1
})

watch([filename, quality, includeOverlay], () => {
  pendingShare.value = undefined
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
  const preset = presets.value.find(item => item.id === id)
  if (!preset)
    return
  chosenPreset.value = id
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
    slug: activeTemplate.value,
    frame: store.frame({ animate: false, overlay: includeOverlay.value }),
  })
}

async function download() {
  busy.value = true
  try {
    const blob = await render()
    downloadBlob(blob, filename.value)
    addToast({ variant: 'success', title: 'Wallpaper downloaded', id: Date.now() })
  }
  catch {
    addToast({ variant: 'error', title: 'Couldn\'t make the wallpaper. Try a smaller size or turn off 2×.', id: Date.now() })
  }
  finally {
    busy.value = false
  }
}

async function shareFile(file: File) {
  try {
    await navigator.share({ files: [file] })
    pendingShare.value = undefined
  }
  catch (error) {
    const name = (error as DOMException).name
    if (name === 'AbortError') {
      pendingShare.value = undefined
    }
    else if (name === 'NotAllowedError' && !pendingShare.value) {
      pendingShare.value = file
      addToast({ variant: 'info', title: 'Wallpaper ready. Tap Save image to finish.', id: Date.now() })
    }
    else {
      pendingShare.value = undefined
      downloadBlob(file, file.name)
      addToast({ variant: 'warning', title: 'Couldn\'t open sharing, so the wallpaper was downloaded instead.', id: Date.now() })
    }
  }
}

async function share() {
  if (pendingShare.value)
    return shareFile(pendingShare.value)
  busy.value = true
  let file: File
  try {
    const blob = await render()
    file = new File([blob], filename.value, { type: blob.type })
  }
  catch {
    addToast({ variant: 'error', title: 'Couldn\'t make the wallpaper. Try a smaller size or turn off 2×.', id: Date.now() })
    return
  }
  finally {
    busy.value = false
  }
  if (navigator.canShare({ files: [file] }))
    return shareFile(file)
  downloadBlob(file, file.name)
  addToast({ variant: 'success', title: 'Wallpaper downloaded', id: Date.now() })
}

async function copy() {
  busy.value = true
  try {
    const blob = await render()
    await copyImageBlob(blob)
    copied.value = true
    addToast({ variant: 'success', title: 'Wallpaper copied', id: Date.now() })
    window.setTimeout(() => {
      copied.value = false
    }, 1600)
  }
  catch {
    addToast({ variant: 'error', title: 'Couldn\'t copy the image. Your browser may block this, so use Download instead.', id: Date.now() })
  }
  finally {
    busy.value = false
  }
}

// On the window, since focus stays on the button that opened the dialog.
useEventListener('keydown', (event: KeyboardEvent) => {
  if (props.open && event.key === 'Escape')
    close()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div
        v-if="open"
        class="export"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        <button class="export-scrim" type="button" aria-label="Close" @click="close" />

        <div class="export-sheet">
          <header class="export-head">
            <h2 id="export-title" class="export-title">
              Download wallpaper
            </h2>
            <button class="export-x" type="button" title="Close (Esc)" aria-label="Close" @click="close">
              <span class="i-carbon-close" aria-hidden="true" />
            </button>
          </header>

          <div class="export-preview">
            <div
              class="export-frame"
              :style="{
                aspectRatio: `${width} / ${height}`,
                width: width >= height ? '100%' : 'auto',
                height: height > width ? '100%' : 'auto',
              }"
            >
              <PatternLayers :animate="false" :overlay="includeOverlay" />
            </div>
          </div>

          <section class="export-group">
            <h3 class="eyebrow">
              Screen
            </h3>
            <div class="presets">
              <button
                v-for="preset in presets"
                :key="preset.id"
                type="button"
                class="option"
                :aria-pressed="selectedPreset === preset.id"
                @click="applyPreset(preset.id)"
              >
                <span class="option-name">{{ preset.label }}</span>
                <span class="option-hint">{{ preset.hint }}</span>
              </button>
            </div>
            <div class="dims">
              <label class="dim">
                <span class="eyebrow">Width</span>
                <input :value="width" type="number" min="1" :max="MAX_SIDE" class="input" @change="onWidth">
              </label>
              <span class="dims-x" aria-hidden="true">×</span>
              <label class="dim">
                <span class="eyebrow">Height</span>
                <input :value="height" type="number" min="1" :max="MAX_SIDE" class="input" @change="onHeight">
              </label>
            </div>
          </section>

          <section class="export-group">
            <h3 class="eyebrow">
              Format
            </h3>
            <div class="row">
              <button
                v-for="option in (['png', 'jpeg', 'webp'] as ImageFormat[])"
                :key="option"
                type="button"
                class="option option-mono"
                :aria-pressed="format === option"
                @click="format = option"
              >
                {{ option === 'jpeg' ? 'JPG' : option.toUpperCase() }}
              </button>
            </div>
            <SliderRow
              v-if="format !== 'png'"
              v-model="quality"
              label="Quality"
              :min="0.5"
              :max="1"
              :step="0.02"
              :default-value="0.92"
              percent
            />
          </section>

          <section class="export-group export-split">
            <div>
              <h3 class="eyebrow">
                Density
              </h3>
              <div class="row">
                <button type="button" class="option option-mono" :aria-pressed="pixelRatio === 1" @click="pixelRatio = 1">
                  1×
                </button>
                <button
                  type="button"
                  class="option option-mono"
                  :aria-pressed="pixelRatio === 2"
                  :disabled="!densityAllowed"
                  :title="densityAllowed ? 'Double resolution for sharp screens' : selectedPreset === 'screen' ? 'This screen is already at full resolution.' : `2× would go past ${MAX_SIDE} px. Pick a smaller size.`"
                  @click="pixelRatio = 2"
                >
                  2×
                </button>
              </div>
            </div>
            <label class="check">
              <input v-model="includeOverlay" type="checkbox">
              Include overlay
            </label>
          </section>

          <p class="export-file">
            {{ filename }} · {{ outputLabel }}
          </p>

          <!-- On phones the share sheet's Save Image puts it in Photos; a download lands in Files. -->
          <div v-if="canShare" class="export-actions">
            <button class="action" type="button" :disabled="busy" @click="download">
              <span class="i-carbon-download" aria-hidden="true" />
              Download
            </button>
            <button class="action action-ink" type="button" :disabled="busy" @click="share">
              <span :class="busy ? 'i-carbon-renew animate-spin' : 'i-carbon-share'" aria-hidden="true" />
              {{ busy ? 'Rendering…' : 'Save image' }}
            </button>
          </div>
          <div v-else class="export-actions">
            <button class="action" type="button" :disabled="busy" @click="copy">
              <span :class="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" aria-hidden="true" />
              {{ copied ? 'Copied' : 'Copy image' }}
            </button>
            <button class="action action-ink" type="button" :disabled="busy" @click="download">
              <span :class="busy ? 'i-carbon-renew animate-spin' : 'i-carbon-download'" aria-hidden="true" />
              {{ busy ? 'Rendering…' : 'Download' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.export {
  position: fixed;
  z-index: 50;
  inset: 0;
  /* Same Firefox Android toolbar fix as the studio. */
  height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--ink);
}

.export-scrim {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 0.45);
  backdrop-filter: blur(4px);
}

.export-sheet {
  position: relative;
  width: 100%;
  max-width: 30rem;
  max-height: 92svh;
  overflow-y: auto;
  padding: 18px 20px 20px;
  border-radius: 16px;
  background: var(--sheet);
  box-shadow: var(--lift);
}

.export-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.export-title {
  font-family: 'Big Shoulders Display', sans-serif;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
}

.export-x {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--muted);
}

.export-x:hover {
  background: var(--wash);
  color: var(--ink);
}

.export-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 10rem;
  margin-bottom: 18px;
  padding: 12px;
  border-radius: 12px;
  background: var(--wash);
}

.export-frame {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 6px 16px -6px rgb(0 0 0 / 0.4);
}

.export-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.export-group .eyebrow {
  color: var(--ink);
}

.presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.row {
  display: flex;
  gap: 6px;
}

.row .option {
  flex: 1;
}

.option {
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 9px;
  text-align: left;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.option:hover {
  border-color: var(--muted);
}

.option[aria-pressed='true'] {
  border-color: var(--ink);
  box-shadow: inset 0 0 0 1px var(--ink);
}

.option:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.option-mono {
  min-width: 56px;
  text-align: center;
  font-family: 'Martian Mono', monospace;
  font-size: 11px;
}

.option-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
}

.option-hint {
  display: block;
  font-family: 'Martian Mono', monospace;
  font-size: 9.5px;
  color: var(--muted);
}

.dims {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 8px;
}

.dim {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dims-x {
  padding-bottom: 8px;
  color: var(--muted);
}

.input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: transparent;
  color: var(--ink);
  font-family: 'Martian Mono', monospace;
  font-size: 12px;
  outline: none;
}

.input:focus {
  border-color: var(--ink);
}

.export-split {
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  font-size: 13px;
  accent-color: var(--ink);
}

.export-file {
  margin-bottom: 14px;
  overflow-wrap: anywhere;
  font-family: 'Martian Mono', monospace;
  font-size: 10.5px;
  color: var(--muted);
}

.export-actions {
  display: flex;
  gap: 8px;
}

.action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.12s ease, opacity 0.15s ease;
}

.action:hover {
  background: var(--wash);
}

.action-ink,
.action-ink:hover {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--sheet);
}

.action:active {
  transform: scale(0.97);
}

.action:disabled {
  opacity: 0.6;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s var(--ease-out);
}

.sheet-enter-active .export-sheet,
.sheet-leave-active .export-sheet {
  transition: transform 0.24s var(--ease-out);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .export-sheet,
.sheet-leave-to .export-sheet {
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 640px) {
  .export {
    align-items: flex-end;
    padding: 0;
  }

  .export-sheet {
    max-width: none;
    border-radius: 16px 16px 0 0;
    padding-bottom: 0;
  }

  /* The sheet scrolls on phones; keep Download in reach instead of below the fold. */
  .export-actions {
    position: sticky;
    bottom: 0;
    margin: 0 -20px;
    padding: 12px 20px max(16px, env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: var(--sheet);
  }
}
</style>
