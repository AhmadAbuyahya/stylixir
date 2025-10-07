<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useActiveTemplateStore } from '~/stores/activeTemplate'
import { useToastStore } from '~/stores/toast'
import { overlayTypes } from '~/lib/overlays'

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
    title: 'Copied Code to clipboard',
    id: Date.now(),
  })
}

const { overlayVariables } = storeToRefs(activeTemplateStore)

function setOverlayType(type: string) {
  overlayVariables.value.overlayType = type
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
      <div
        class="absolute inset-0"
        :style="{
          ...overlayStyle,
        }"
      />

      <div class="mb-10 flex flex-col gap-4">
        <div>
          <label class="block w-full text-left">Blur Amount</label>
          <input v-model="overlayVariables.overlayBlur" type="range" min="0" max="20" step="1" class="w-full">
        </div>

        <label class="block w-full text-left">Overlay Type</label>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="(config, type) in overlayTypes"
            :key="type"
            class="button border-2 border-transparent bg-white p-0 hover-bg-white"
            :class="{
              '!border-#60a5fa': overlayVariables.overlayType === type,
            }"
            @click="setOverlayType(type)"
          >
            <div
              v-if="type !== 'none'"
              class="overlay-preview"
              :style="{ background: config.preview }"
            />
            <span
              v-else
              class="overlay-preview bg-#171717"
            >None</span>
          </button>
        </div>

        <div v-if="overlayVariables.overlayType === 'opacity'">
          <label class="block w-full text-left">Overlay Opacity</label>
          <input v-model="overlayVariables.overlayOpacity" type="range" min=".1" max=".9" step=".05" class="w-full">
        </div>
        <div>
          <label class="block w-full text-left">Overlay Color</label>
          <ColorInput v-model="overlayVariables.overlayColor" />
        </div>
      </div>

      <div class="absolute bottom-0 flex gap-1">
        <button
          class="button z-1"
          @click="copyStyle"
        >
          <div class="i-carbon-copy" />
          Copy Code
        </button>
        <button class="button z-1" @click="activeTemplateStore.randomizeNumberValues">
          <div class="i-carbon-tornado" />
          Randomize Pattern
        </button>

        <button class="button z-1" @click="activeTemplateStore.randomizeColors">
          <div class="i-carbon-paint-brush" />
          Randomize Colors
        </button>
        <button class="button z-1" @click="activeTemplateStore.randomizeAll">
          <div class="i-carbon-tornado" />
          Randomize All
          <div class="i-carbon-paint-brush" />
        </button>

        <button class="button z-1" @click="activeTemplateStore.reset">
          <div class="i-carbon-restart" />
          Reset
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay-preview {
  width: 50px;
  height: 50px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #171717;
}
</style>
