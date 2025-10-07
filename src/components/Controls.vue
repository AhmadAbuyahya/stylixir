<script setup lang="ts">
import startCase from 'lodash.startcase'
import { storeToRefs } from 'pinia'
import ColorPaletteSelector from './ColorPaletteSelector.vue'
import { useActiveTemplateStore } from '~/stores/activeTemplate'

const activeTemplateStore = useActiveTemplateStore()
const { variables, variablesRef } = storeToRefs(activeTemplateStore)
</script>

<template>
  <div
    class="h-full flex flex-col transform gap-2 overflow-y-scroll border-t-1 bg-[#171717] p-6 md:h-100dvh md:border-l-1 md:border-t-0"
  >
    <!-- Color Palette Selector -->
    <ColorPaletteSelector />

    <div class="mb-10 flex flex-col gap-4">
      <!-- Non-color variables only -->
      <div v-for="(value, key) in variables" :key="key" class="mb-4">
        <template v-if="value.type !== 'color'">
          <label class="block w-full text-left" :for="String(key)">
            {{ startCase(String(key)) }}
          </label>
          <input
            :id="String(key)" v-model="variablesRef[key]" :type="value.type" :min="value.min" :max="value.max"
            :step="value.step"
          >
        </template>
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
</template>

<style lang="css" scoped>
input {
  width: 100%;
  padding: 5px
}

input[type="color"] {
  padding: 0px;
}
</style>
