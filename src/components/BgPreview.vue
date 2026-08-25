<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useActiveTemplateStore } from '~/stores/activeTemplate'
import { useToastStore } from '~/stores/toast'

const activeTemplateStore = useActiveTemplateStore()
const { overlayStyle, css, style, activeTemplate } = storeToRefs(activeTemplateStore)
const { addToast } = useToastStore()

const copied = ref(false)
const exportOpen = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const patternName = computed(() => activeTemplate.value.replace(/_/g, ' '))

function copyStyle() {
  const html = `
      <div class="background"></div>
      <style>
        .background {
         height: 100%;
         width: 100%;
         position: relative;
          ${css.value}
        }
        .background::before {
         content: "";
        position: absolute;
        inset: 0;
          ${Object.entries(overlayStyle.value).map(([key, value]) => `${key}: ${value};`).join('\n')}
        }
      </style>
    `

  navigator.clipboard.writeText(html)
  addToast({
    variant: 'success',
    title: 'Copied CSS',
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

    <div class="absolute inset-3 overflow-hidden border-1 border-white/10 rounded-2xl shadow-2xl shadow-black/50 md:inset-[8%] sm:inset-5">
      <div class="absolute inset-0" :style="style" />
      <div class="pointer-events-none absolute inset-0" :style="overlayStyle" />

      <div class="absolute inset-x-0 bottom-0 z-10 from-black/75 to-transparent bg-gradient-to-t p-3 pt-10 sm:p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-mono text-xs tracking-widest uppercase text-white/80">
            {{ patternName }}
          </p>
          <div class="flex flex-wrap items-center gap-2">
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
