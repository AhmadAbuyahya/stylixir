<script setup lang="ts">
import type { Toast } from '~/types'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{ toast: Toast }>()
const { clearToast } = useToastStore()

const DURATION_MS = 3200
const leaving = ref(false)
const paused = ref(false)
const progress = ref(100)

let frame = 0
let endsAt = 0
let remaining = DURATION_MS

const labels: Record<Toast['variant'], string> = {
  success: 'Done',
  info: 'Note',
  warning: 'Heads up',
  error: 'Error',
}

function dismiss() {
  if (leaving.value)
    return
  leaving.value = true
  cancelAnimationFrame(frame)
  clearToast(props.toast.id)
}

function tick(now: number) {
  if (paused.value)
    return

  remaining = Math.max(0, endsAt - now)
  progress.value = (remaining / DURATION_MS) * 100

  if (remaining <= 0) {
    dismiss()
    return
  }

  frame = requestAnimationFrame(tick)
}

function pause() {
  if (paused.value || leaving.value)
    return
  paused.value = true
  remaining = Math.max(0, endsAt - performance.now())
  cancelAnimationFrame(frame)
}

function resume() {
  if (!paused.value || leaving.value)
    return
  paused.value = false
  endsAt = performance.now() + remaining
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  endsAt = performance.now() + DURATION_MS
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
})
</script>

<template>
  <div
    class="toast"
    :class="`toast--${toast.variant}`"
    role="status"
    :aria-live="toast.variant === 'error' ? 'assertive' : 'polite'"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <div class="toast__body">
      <span class="toast__icon" aria-hidden="true">
        <div v-if="toast.variant === 'success'" class="i-carbon-checkmark-outline" />
        <div v-else-if="toast.variant === 'info'" class="i-carbon-information" />
        <div v-else-if="toast.variant === 'warning'" class="i-carbon-warning-alt" />
        <div v-else class="i-carbon-misuse-outline" />
      </span>

      <div class="toast__copy">
        <p class="toast__eyebrow">
          {{ labels[toast.variant] }}
        </p>
        <p class="toast__title">
          {{ toast.title }}
        </p>
      </div>

      <button
        type="button"
        class="toast__close"
        aria-label="Dismiss notification"
        @click="dismiss"
      >
        <div class="i-carbon-close-outline" aria-hidden="true" />
      </button>
    </div>

    <div class="toast__track" aria-hidden="true">
      <div class="toast__bar" :style="{ transform: `scaleX(${progress / 100})` }" />
    </div>
  </div>
</template>

<style scoped>
.toast {
  --toast-accent: #2dd4bf;
  --toast-glow: rgba(45, 212, 191, 0.22);

  width: min(22rem, calc(100vw - 1.5rem));
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.85rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 42%),
    rgba(18, 18, 18, 0.92);
  color: #fafafa;
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.toast--success {
  --toast-accent: #2dd4bf;
  --toast-glow: rgba(45, 212, 191, 0.22);
}

.toast--info {
  --toast-accent: #7dd3fc;
  --toast-glow: rgba(125, 211, 252, 0.18);
}

.toast--warning {
  --toast-accent: #fbbf24;
  --toast-glow: rgba(251, 191, 36, 0.18);
}

.toast--error {
  --toast-accent: #fb7185;
  --toast-glow: rgba(251, 113, 133, 0.2);
}

.toast__body {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 0.75rem 0.75rem 0.85rem;
}

.toast__icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--toast-accent) 35%, transparent);
  border-radius: 0.55rem;
  background: color-mix(in srgb, var(--toast-accent) 14%, transparent);
  box-shadow: 0 0 18px var(--toast-glow);
  color: var(--toast-accent);
  font-size: 0.95rem;
}

.toast__copy {
  min-width: 0;
  flex: 1;
}

.toast__eyebrow {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.625rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--toast-accent) 80%, white);
}

.toast__title {
  margin: 0.15rem 0 0;
  font-size: 0.9rem;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: rgba(250, 250, 250, 0.95);
}

.toast__close {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: 0.45rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.toast__close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.toast__close:focus-visible {
  outline: none;
  color: #fff;
  border-color: var(--toast-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--toast-accent) 35%, transparent);
}

.toast__track {
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
}

.toast__bar {
  height: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, var(--toast-accent), color-mix(in srgb, var(--toast-accent) 40%, white));
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .toast__bar {
    display: none;
  }
}
</style>
