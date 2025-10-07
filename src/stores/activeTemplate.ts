import { acceptHMRUpdate, defineStore } from 'pinia'
import tinycolor from 'tinycolor2'
import { useColorPaletteStore } from './colorPalette'
import { overlayTypes } from '~/lib/overlays'
import templates from '~/lib/templates'
import { useUrlStore } from '~/composables/url'

// Utility functions
const utils = {
  randomNumber: (min: number, max: number) => parseFloat((Math.random() * (max - min + 1) + min).toFixed(2)),
  randomColor: (alpha: number) => {
    const color = tinycolor.random()
    color.setAlpha(alpha)
    return color.toHexString()
  },
  interpolateTemplate: (template: string, variables: Record<string, string | number>) => {
    return template.replace(/{(\w+)}/g, (_, p1) => String(variables[p1]))
  },
  generateCss: (style: Record<string, string>) => {
    return Object.entries(style)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n')
  },
}

export const useActiveTemplateStore = defineStore('activeTemplate', () => {
  // URL state management with proper client-side handling
  const {
    getParam,
    setParam,
    deleteParam,
    updateUrlParams,
    isClient,
    hashParams,
    queryParams,
  } = useUrlStore()

  // State with proper fallbacks
  const activeTemplate = ref('')
  const variablesRef = ref<Record<string, string | number>>({})

  // Overlay variables with proper fallbacks
  const overlayVariables = ref({
    overlayType: 'radial-gradient-center',
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    overlayBlur: 0,
  })

  // Get color palette store
  const colorPaletteStore = useColorPaletteStore()

  // Initialize state from URL params or defaults
  const initializeFromUrl = () => {
    if (!isClient.value)
      return

    // Initialize activeTemplate
    const templateParam = getParam('template') as string
    activeTemplate.value = (templateParam && Object.keys(templates).includes(templateParam))
      ? templateParam
      : Object.keys(templates)[0]

    // Initialize overlay variables
    overlayVariables.value = {
      overlayType: getParam('overlayType') as string || 'radial-gradient-center',
      overlayColor: getParam('overlayColor') as string || '#000000',
      overlayOpacity: parseFloat(getParam('overlayOpacity') as string) || 0.5,
      overlayBlur: parseFloat(getParam('overlayBlur') as string) || 0,
    }

    // Initialize variablesRef
    initVariablesRef()
  }

  // Getters
  const variables = computed(() => templates[activeTemplate.value]?.variables || {})
  const template = computed(() => templates[activeTemplate.value]?.template || {})

  // Get variables with colors replaced by palette colors
  const variablesWithPaletteColors = computed(() => {
    const templateVars = variables.value
    const result: Record<string, string | number> = {}

    Object.entries(templateVars).forEach(([key, variable]) => {
      // For non-color variables, use the value from variablesRef
      result[key] = variablesRef.value[key] ?? variable.value
    })

    // Add color variables from the palette system
    // Check the template string for color variables (c1, c2, c3, c4, etc.)
    const templateString = JSON.stringify(template.value)
    const colorMatches = templateString.match(/\{c[1-9]\}/g) || []

    colorMatches.forEach((match) => {
      const colorVar = match.slice(1, -1) // Remove { and }
      if (!result[colorVar])
        result[colorVar] = colorPaletteStore.getColorForTemplate(activeTemplate.value, colorVar)
    })

    return result
  })

  const style = computed(() => {
    return Object.entries(template.value).reduce((acc, [key, value]) => {
      acc[key] = utils.interpolateTemplate(value, variablesWithPaletteColors.value)
      return acc
    }, {} as Record<string, string>)
  })

  const css = computed(() => utils.generateCss(style.value))

  const overlayStyle = computed(() => {
    const { overlayType, overlayColor, overlayOpacity, overlayBlur } = overlayVariables.value

    if (overlayType === 'none')
      return { 'background': 'none', 'backdrop-filter': `blur(${overlayBlur}px)` }

    if (overlayType === 'opacity') {
      return {
        'background': tinycolor(overlayColor).setAlpha(overlayOpacity).toRgbString(),
        'backdrop-filter': `blur(${overlayBlur}px)`,
      }
    }

    const typeConfig = overlayTypes[overlayType as keyof typeof overlayTypes]

    let background = ''
    if (typeConfig.type === 'radial' && 'position' in typeConfig) {
      const start = typeConfig.start === 'transparent' ? 'transparent' : overlayColor
      const end = typeConfig.end === 'color' ? overlayColor : 'transparent'
      background = `radial-gradient(${typeConfig.position}, ${start}, ${end})`
    }
    else if (typeConfig.type === 'inner' && 'direction' in typeConfig) {
      background = `linear-gradient(${typeConfig.direction}, ${overlayColor}, transparent, ${overlayColor})`
    }
    else if (typeConfig.type === 'outer' && 'direction' in typeConfig) {
      background = `linear-gradient(${typeConfig.direction}, transparent, ${overlayColor}, transparent)`
    }
    else if ('direction' in typeConfig) {
      background = `linear-gradient(${typeConfig.direction}, transparent, ${overlayColor})`
    }

    return {
      background,
      'backdrop-filter': `blur(${overlayBlur}px)`,
    }
  })

  // Actions
  function updateActiveTemplate(slug: string) {
    if (!isClient.value)
      return

    // Clear all URL parameters
    Object.keys(hashParams).forEach((key) => {
      deleteParam(key)
    })
    // Set the new template
    activeTemplate.value = slug
    setParam('template', slug)
    initVariablesRef()
  }

  function initVariablesRef() {
    if (!isClient.value)
      return

    variablesRef.value = Object.entries(variables.value).reduce((acc, [key, variable]) => {
      const paramValue = getParam(key)
      acc[key] = paramValue !== undefined
        ? ((variable.type === 'range' || variable.type === 'number')
            ? parseFloat(String(paramValue))
            : String(paramValue))
        : variable.value
      return acc
    }, {} as Record<string, string | number>)
  }

  function reset() {
    if (!isClient.value)
      return

    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.type !== 'color') {
        variablesRef.value[key] = variable.value
        deleteParam(key)
      }
    })
  }

  function randomizeNumberValues() {
    if (!isClient.value)
      return

    const updates: Record<string, string | number> = {}
    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.type === 'range' || variable.type === 'number') {
        const min = variable.min ?? 0
        const max = variable.max ?? 0
        variablesRef.value[key] = utils.randomNumber(min, max)
        updates[key] = variablesRef.value[key]
      }
    })
    updateUrlParams(updates)
  }

  function randomizeColors() {
    if (!isClient.value)
      return

    // Use the color palette store's randomize function
    colorPaletteStore.randomizeColors()
  }

  function randomizeAll() {
    randomizeColors()
    randomizeNumberValues()
  }

  // Watchers
  watch(activeTemplate, initVariablesRef)

  // Watch variablesRef and sync with URL (only for non-color variables)
  watch(variablesRef, (newVars) => {
    const nonColorUpdates: Record<string, string | number> = {}
    Object.entries(newVars).forEach(([key, value]) => {
      if (variables.value[key]?.type !== 'color')
        nonColorUpdates[key] = value
    })
    updateUrlParams(nonColorUpdates)
  }, { deep: true })

  // Watch overlayVariables and sync with URL
  watch(overlayVariables, (newVars) => {
    updateUrlParams(newVars)
  }, { deep: true })

  // Initialize when client is ready
  watch(isClient, (clientReady) => {
    if (clientReady) {
      // Small delay to ensure URL is fully available
      nextTick(() => {
        initializeFromUrl()
      })
    }
  }, { immediate: true })

  // Also listen for URL changes (back/forward navigation)
  if (isClient.value) {
    watch([hashParams, queryParams], () => {
      if (isClient.value)
        initializeFromUrl()
    }, { deep: true })
  }

  // Fallback initialization for SSR
  if (!isClient.value) {
    activeTemplate.value = Object.keys(templates)[0]
    initVariablesRef()
  }

  return {
    activeTemplate,
    variablesRef,
    variables,
    variablesWithPaletteColors,
    style,
    css,
    updateActiveTemplate,
    reset,
    randomizeNumberValues,
    randomizeColors,
    randomizeAll,
    overlayVariables,
    overlayStyle,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useActiveTemplateStore as any, import.meta.hot))
