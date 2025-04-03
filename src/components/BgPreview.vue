<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useActiveTemplateStore } from '~/stores/activeTemplate'
import { useToastStore } from '~/stores/toast'

const activeTemplateStore = useActiveTemplateStore()
const { overlayStyle, css, style } = storeToRefs(activeTemplateStore)
const { addToast } = useToastStore()

function copyStyle() {
  const html = `
      <div class="background"></div>
      <style>
        .background {
         height: 100%;
        width: 100%;
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
    title: 'Copied Code to clipboard',
    id: Date.now(),
  })
}
</script>

<template>
  <div class="relative h-50vh md:h-unset">
    <div
      class="overflow-hidden md:h-screen"
      :style="{
        ...style,
        filter: 'blur(5px) brightness(0.5)',
        inset: 0,
        position: 'absolute',
        transition: 'all 0.2s ease-in-out',
      }"
    />
    <div
      class="absolute inset-15px my-auto h-auto flex items-center justify-center gap-4 overflow-hidden border-1 rounded-lg bg-[#171717] bg-opacity-90 p-4 md:inset-8%"

      :style="{
        ...style,
        transition: 'all 0.2s ease-in-out',

      }"
    >
      <button
        class="button z-1"
        @click="copyStyle"
      >
        <div class="i-carbon-copy" />
        Copy Code
      </button>
      <div
        class="absolute inset-0"
        :style="{
          ...overlayStyle,
        }"
      />
    </div>
  </div>
</template>
