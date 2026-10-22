<script setup lang="ts">
defineProps<{
  label: string
  style: Record<string, string>
  accent?: 'min' | 'default' | 'max' | 'live'
}>()

const accentClass: Record<string, string> = {
  min: 'ring-amber-400/50',
  default: 'ring-teal-400/60',
  max: 'ring-violet-400/50',
  live: 'ring-white/20',
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <p class="font-mono text-9px tracking-widest uppercase" :class="accent === 'default' ? 'text-teal-400/80' : 'text-white/35'">
      {{ label }}
    </p>
    <div
      class="aspect-square w-full overflow-hidden border-1 border-white/10 rounded-lg ring-1"
      :class="accent ? accentClass[accent] : 'ring-transparent'"
    >
      <div class="h-full w-full" :style="style" />
    </div>
  </div>
</template>
