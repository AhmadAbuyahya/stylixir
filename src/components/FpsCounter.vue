<script setup lang="ts">
const fps = useFps()
</script>

<template>
  <div class="pointer-events-none fixed bottom-2 right-2 z-90 rounded bg-black/70 px-1.5 py-0.5 font-mono text-10px tabular-nums text-teal-200" aria-hidden="true">
    {{ fps }} fps
  </div>
</template>
