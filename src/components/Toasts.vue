<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '~/stores/toast'

const { toasts } = storeToRefs(useToastStore())
</script>

<template>
  <Teleport to="body">
    <div class="toasts" aria-label="Notifications">
      <TransitionGroup name="toast">
        <Toast
          v-for="toast of toasts"
          :key="toast.id"
          :toast="toast"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toasts {
  position: fixed;
  z-index: 80;
  left: 50%;
  bottom: max(1rem, env(safe-area-inset-bottom));
  display: flex;
  width: min(22rem, calc(100vw - 1.5rem));
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.55rem;
  transform: translateX(-50%);
  pointer-events: none;
}

.toasts :deep(.toast) {
  pointer-events: auto;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(0.7rem) scale(0.98);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(0.4rem) scale(0.98);
}

.toast-move {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .toast-enter-active,
  .toast-leave-active,
  .toast-move {
    transition: opacity 0.15s ease;
  }

  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
