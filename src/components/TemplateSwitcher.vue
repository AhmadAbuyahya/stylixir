<script setup lang="ts">
// import { storeToRefs } from 'pinia'
import templates from '~/lib/templates'
import { useActiveTemplateStore } from '~/stores/activeTemplate'
import { useColorPaletteStore } from '~/stores/colorPalette'

const activeTemplateStore = useActiveTemplateStore()
const colorPaletteStore = useColorPaletteStore()
// const { variablesWithPaletteColors } = storeToRefs(activeTemplateStore)

function getStyle(slug: string) {
  const style: { [x: string]: string } = {}
  const template = templates[slug].template
  Object.entries(template).forEach(([key, value]) => {
    const regex = /{(\w+)}/g
    const matches = value.matchAll(regex)
    let newValue = value
    for (const match of matches) {
      const varName = match[1]
      let finalValue

      // Check if it's a color variable (c1, c2, c3, c4, etc.)
      if (varName.startsWith('c') && /^c[1-9]$/.test(varName)) {
        finalValue = colorPaletteStore.getColorForTemplate(slug, varName)
      }
      else if (templates[slug].variables[varName]) {
        // For non-color variables, use the default value from template variables
        finalValue = templates[slug].variables[varName]?.value
      }
      else {
        // Fallback for any other variables
        finalValue = ''
      }

      newValue = newValue.replace(match[0], String(finalValue))
    }

    style[key] = newValue
  })
  return style
}
</script>

<template>
  <div class="relative z-10 overflow-hidden border-b-1 md:h-screen md:border-b-0 md:border-r-1">
    <div class="logo z-1 flex items-center gap-4 border-b-1 bg-#242424 p-4">
      <Logo />
    </div>
    <div
      class="h-[fit-content] flex justify-between gap-10 overflow-y-scroll bg-[#171717] p-4 md:h-[calc(100vh-90px)] md:flex-col"
    >
      <button
        v-for="(_, key) in templates" :key="key" :title="String(key)"
        class="relative min-h-100px min-w-150px inline-flex select-none items-center justify-center overflow-hidden rounded-lg bg-transparent px-4 py-2 align-middle text-lg font-semibold capitalize text-white outline-1 outline transition-all duration-250 md:min-h-110px md:w-auto hover:outline-4"
        :class="{
          'outline-6 outline-blue': activeTemplateStore.activeTemplate === key,
        }"
        @click="() => activeTemplateStore.updateActiveTemplate(String(key))"
      >
        <div
          :style="getStyle(String(key))"

          class="absolute inset-0"
          style="zoom: .5"
        />
        <span
          class="absolute bottom-0 left-0 right-0 top-0 z-0 flex items-center justify-center rounded-lg bg-[#171717] bg-opacity-60 transition-all duration-250 hover:bg-opacity-80"
        >
          {{ String(key).replace(/_/g, ' ') }}
        </span>
      </button>
    </div>
  </div>
</template>

<style>
</style>
