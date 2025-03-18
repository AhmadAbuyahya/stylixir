<script setup lang="ts">
import startCase from 'lodash.startcase'
import { storeToRefs } from 'pinia'
import { overlayTypes } from '~/lib/overlays'
import { useActiveTemplateStore } from '~/stores/activeTemplate'

const activeTemplateStore = useActiveTemplateStore()
const { variables, variablesRef, overlayVariables } = storeToRefs(activeTemplateStore)

function setOverlayType(type: string) {
  overlayVariables.value.overlayType = type
}
</script>

<template>
  <div
    class="h-full flex flex-col transform justify-center gap-2 overflow-y-scroll border-t-1 bg-[#171717] p-6 md:h-100dvh md:border-l-1 md:border-t-0"
  >
    <div class="mb-5 flex flex-col gap-2">
      <button class="button" @click="activeTemplateStore.randomizeNumberValues">
        <div class="i-carbon-tornado" />
        Randomize Pattern
      </button>

      <button class="button w-full" @click="activeTemplateStore.randomizeColors">
        <div class="i-carbon-paint-brush" />
        Randomize Colors
      </button>
      <button class="button" @click="activeTemplateStore.randomizeAll">
        <div class="i-carbon-tornado" />
        Randomize All
        <div class="i-carbon-paint-brush" />
      </button>

      <button class="button" @click="activeTemplateStore.reset">
        <div class="i-carbon-restart" />
        Reset
      </button>
    </div>

    <!-- Overlay Controls -->

    <div class="overflow-y-auto md:max-h-300px md:max-h-unset">
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
          <input v-model="overlayVariables.overlayColor" type="color" class="w-full">
        </div>
        <div v-for="(value, key) in variables" :key="key" class="mb-4">
          <label class="block w-full text-left" :for="String(key)">
            {{ startCase(String(key)) }}
          </label>
          <input
            :id="String(key)" v-model="variablesRef[key]" :type="value.type" :min="value.min" :max="value.max"
            :step="value.step"
          >
        </div>
      </div>

      <div class="flex">
        <a
          href="https://www.producthunt.com/posts/stylixir?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-stylixir"
          target="_blank" class="m-auto"
        ><img
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=488516&theme=dark"
          alt="Stylixir - CSS&#0032;Pattern&#0032;Generator | Product Hunt" style="width: 250px; height: 54px;"
          width="250" height="54"
        ></a>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
input {
  width: 100%;
  padding: 5px
}

input[type="color"] {
  padding: 0px;
}

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
