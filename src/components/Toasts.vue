<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '~/stores/toast'

const store = useToastStore()
const { toasts } = storeToRefs(store)
</script>

<template>
  <Teleport to="body">
    <div class="toasts" role="status" aria-live="polite">
      <TransitionGroup name="toast">
        <button
          v-for="toast of toasts"
          :key="toast.id"
          type="button"
          class="toast"
          :class="`toast-${toast.variant}`"
          title="Dismiss"
          @click="store.clearToast(toast.id)"
        >
          <span :class="toast.variant === 'error' || toast.variant === 'warning' ? 'i-carbon-warning-alt' : 'i-carbon-checkmark'" aria-hidden="true" />
          {{ toast.title }}
        </button>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toasts {
  position: fixed;
  z-index: 80;
  top: 72px;
  left: 50%;
  display: flex;
  width: min(24rem, calc(100vw - 24px));
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transform: translateX(-50%);
  pointer-events: none;
}

.toast {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--ink);
  color: var(--sheet);
  font-family: 'Schibsted Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  box-shadow: var(--lift);
  pointer-events: auto;
}

.toast-error {
  background: #b3261e;
  color: #fff;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.22s var(--ease-out), transform 0.22s var(--ease-out);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
