<script setup lang="ts">
// Renders one interpolated pattern. Keyed on `version` so every shuffle
// destroys and remounts the node — the cheapest possible way to force the
// "materialize" animation to replay without hand-rolling a crossfade between
// two gradient layers (gradients don't interpolate reliably across browsers).
defineProps<{
  style: Record<string, string>
  version: number
}>()
</script>

<template>
  <div :key="version" class="pattern-pop h-full w-full" :style="style" />
</template>

<style>
@keyframes pattern-pop {
  from {
    opacity: 0;
    transform: scale(0.98);
    filter: saturate(0.4);
  }
  to {
    opacity: 1;
    transform: scale(1);
    filter: saturate(1);
  }
}

.pattern-pop {
  animation: pattern-pop 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .pattern-pop {
    animation: none;
  }
}
</style>
