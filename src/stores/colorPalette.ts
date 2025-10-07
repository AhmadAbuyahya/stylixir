import { acceptHMRUpdate, defineStore } from 'pinia'
import tinycolor from 'tinycolor2'
import { useUrlStore } from '~/composables/url'
import { colorPalettes, defaultPaletteId } from '~/lib/colorPalettes'
import type { ColorPalette } from '~/types'

export const useColorPaletteStore = defineStore('colorPalette', () => {
  // State
  const activePaletteId = ref(defaultPaletteId)
  const customPalettes = ref<Record<string, ColorPalette>>({})

  const {
    getParam,
    // setParam,
    deleteParam,
    updateUrlParams,
    isClient,
  } = useUrlStore()

  // Initialize from URL
  const initializeFromUrl = () => {
    if (!isClient.value)
      return

    const paletteParam = getParam('palette') as string
    if (paletteParam && (colorPalettes[paletteParam] || customPalettes.value[paletteParam]))
      activePaletteId.value = paletteParam
  }

  // Getters
  const allPalettes = computed(() => ({
    ...colorPalettes,
    ...customPalettes.value,
  }))

  const activePalette = computed(() => allPalettes.value[activePaletteId.value])

  const getColorForTemplate = (templateKey: string, colorVarName: string): string => {
    // Unified color system: c1, c2, c3, c4, etc. (starting from index 1)
    const colorIndex = parseInt(colorVarName.slice(1)) - 1 // Extract number from c1, c2, etc. and subtract 1 for 0-based index

    if (isNaN(colorIndex) || colorIndex < 0 || colorIndex >= 6)
      return '#000000' // fallback

    const palette = activePalette.value
    if (!palette || !palette.colors[colorIndex])
      return '#000000' // fallback

    return palette.colors[colorIndex]
  }

  // Actions
  function setActivePalette(paletteId: string) {
    if (!isClient.value)
      return

    // Remove previous palette param and set new one
    deleteParam('palette')
    activePaletteId.value = paletteId
    updateUrlParams({ palette: paletteId })
  }

  function createCustomPalette(name: string, colors: string[]): string {
    const id = `custom_${Date.now()}`
    const newPalette: ColorPalette = {
      id,
      name,
      colors,
      isCustom: true,
    }

    customPalettes.value[id] = newPalette
    return id
  }

  function updateCustomPalette(paletteId: string, colors: string[]) {
    if (customPalettes.value[paletteId])
      customPalettes.value[paletteId].colors = colors
  }

  function deleteCustomPalette(paletteId: string) {
    if (customPalettes.value[paletteId]) {
      delete customPalettes.value[paletteId]

      // If the active palette was deleted, switch to default
      if (activePaletteId.value === paletteId) {
        setActivePalette(defaultPaletteId)
        updateUrlParams({ palette: defaultPaletteId })
      }
    }
  }

  function randomizeColors() {
    const currentPalette = activePalette.value
    if (!currentPalette)
      return

    const newColors = currentPalette.colors.map(() => {
      const color = tinycolor.random()
      return color.toHexString()
    })

    if (currentPalette.isCustom) {
      updateCustomPalette(currentPalette.id, newColors)
    }
    else {
      // Create a new custom palette with randomized colors
      const newPaletteId = createCustomPalette('Randomized', newColors)
      setActivePalette(newPaletteId)
    }
  }

  // Initialize when client is ready
  watch(isClient, (clientReady) => {
    if (clientReady) {
      // Small delay to ensure URL is fully available
      nextTick(() => {
        initializeFromUrl()
      })
    }
  }, { immediate: true })

  return {
    // State
    activePaletteId,
    customPalettes,

    // Getters
    allPalettes,
    activePalette,
    getColorForTemplate,

    // Actions
    setActivePalette,
    createCustomPalette,
    updateCustomPalette,
    deleteCustomPalette,
    randomizeColors,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useColorPaletteStore, import.meta.hot))
