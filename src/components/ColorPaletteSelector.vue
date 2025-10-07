<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ColorInput from './ColorInput.vue'
import { useColorPaletteStore } from '~/stores/colorPalette'

const colorPaletteStore = useColorPaletteStore()
const { activePalette, allPalettes, activePaletteId } = storeToRefs(colorPaletteStore)

// const showCustomPaletteEditor = ref(false)
const customPaletteName = ref('')
const customPaletteColors = ref(['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'])

function selectPalette(paletteId: string) {
  colorPaletteStore.setActivePalette(paletteId)
}

// function createNewPalette() {
//   if (!customPaletteName.value.trim())
//     customPaletteName.value = 'Custom Palette'

//   const newPaletteId = colorPaletteStore.createCustomPalette(
//     customPaletteName.value,
//     [...customPaletteColors.value],
//   )

//   colorPaletteStore.setActivePalette(newPaletteId)
//   showCustomPaletteEditor.value = false
//   customPaletteName.value = ''
// }

function updateCustomPalette() {
  if (activePalette.value?.isCustom)
    colorPaletteStore.updateCustomPalette(activePaletteId.value, [...customPaletteColors.value])
}

function deleteCurrentPalette() {
  if (activePalette.value?.isCustom)
    colorPaletteStore.deleteCustomPalette(activePaletteId.value)
}

function randomizeCurrentPalette() {
  colorPaletteStore.randomizeColors()
}

// Watch for active palette changes to update custom editor
watch(activePalette, (newPalette) => {
  if (newPalette?.isCustom) {
    customPaletteColors.value = [...newPalette.colors]
    customPaletteName.value = newPalette.name
  }
}, { immediate: true })
</script>

<template>
  <div class="color-palette-selector">
    <div class="mb-4">
      <label class="mb-2 block w-full text-left">Color Palette</label>

      <!-- Palette Selection -->
      <div class="grid grid-cols-2 mb-4 gap-2">
        <button
          v-for="(palette, id) in allPalettes"
          :key="id"
          class="palette-button border-2 rounded p-2 transition-all"
          :class="{
            'border-blue-500 bg-blue-50 dark:bg-blue-900/20': activePaletteId === id,
            'border-gray-300 dark:border-gray-600 hover:border-gray-400': activePaletteId !== id,
          }"
          @click="selectPalette(id as string)"
        >
          <div class="palette-preview mb-1 flex gap-1">
            <div
              v-for="(color, index) in palette.colors"
              :key="index"
              class="h-4 w-4 border border-gray-300 rounded dark:border-gray-600"
              :style="{ backgroundColor: color }"
            />
          </div>
          <div class="truncate text-center text-xs">
            {{ palette.name }}
          </div>
        </button>
      </div>

      <!-- Active Palette Display -->
      <div v-if="activePalette" class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-medium">{{ activePalette.name }}</span>
          <div class="flex gap-1">
            <button
              v-if="activePalette.isCustom"
              class="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
              @click="deleteCurrentPalette"
            >
              Delete
            </button>
            <button
              class="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
              @click="randomizeCurrentPalette"
            >
              Randomize
            </button>
          </div>
        </div>

        <div class="palette-colors grid grid-cols-6 gap-2">
          <div
            v-for="(color, index) in activePalette.colors"
            :key="index"
            class="color-swatch group relative"
          >
            <div
              class="h-8 w-full cursor-pointer border border-gray-300 rounded dark:border-gray-600"
              :style="{ backgroundColor: color }"
              @click="() => { if (activePalette.isCustom) customPaletteColors[index] = color }"
            />
            <span class="absolute left-1/2 transform rounded bg-gray-800 px-1 py-0.5 text-xs text-white opacity-0 transition-opacity -top-6 -translate-x-1/2 group-hover:opacity-100">
              {{ color }}
            </span>
          </div>
        </div>
      </div>

      <!-- Custom Palette Editor -->
      <div v-if="activePalette?.isCustom" class="mb-4">
        <div class="mb-2">
          <label class="mb-1 block text-sm">Palette Name</label>
          <input
            v-model="customPaletteName"
            type="text"
            class="w-full border border-gray-300 rounded bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
            @input="updateCustomPalette"
          >
        </div>

        <div class="mb-2">
          <label class="mb-1 block text-sm">Colors</label>
          <div class="flex flex-col gap-2">
            <ColorInput
              v-for="(_, index) in customPaletteColors"
              :key="index"
              v-model="customPaletteColors[index]"
              @update:model-value="updateCustomPalette"
            />
          </div>
        </div>
      </div>

      <!-- Create New Palette Button -->
      <!-- <button
        v-if="!showCustomPaletteEditor"
        class="button w-full"
        @click="showCustomPaletteEditor = true"
      >
        <div class="i-carbon-add" />
        Create Custom Palette
      </button> -->

      <!-- New Palette Form -->
      <!-- <div v-if="showCustomPaletteEditor" class="mb-4 border border-gray-300 rounded p-4 dark:border-gray-600">
        <div class="mb-2">
          <label class="mb-1 block text-sm">Palette Name</label>
          <input
            v-model="customPaletteName"
            type="text"
            placeholder="Enter palette name"
            class="w-full border border-gray-300 rounded bg-white px-2 py-1 dark:border-gray-600 dark:bg-gray-800"
          >
        </div>

        <div class="mb-4">
          <label class="mb-1 block text-sm">Colors</label>
          <div class="flex flex-col gap-2">
            <ColorInput
              v-for="(_, index) in customPaletteColors"
              :key="index"
              v-model="customPaletteColors[index]"
            />
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="button flex-1"
            @click="createNewPalette"
          >
            Create Palette
          </button>
          <button
            class="button flex-1"
            @click="showCustomPaletteEditor = false"
          >
            Cancel
          </button>
        </div>
      </div> -->
    </div>
  </div>
</template>

<style scoped>
.palette-button {
  min-height: 60px;
}

.palette-preview {
  justify-content: center;
}

.color-swatch {
  transition: transform 0.1s ease;
}

.color-swatch:hover {
  transform: scale(1.05);
}
</style>
