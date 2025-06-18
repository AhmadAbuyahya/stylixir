import { acceptHMRUpdate, defineStore } from 'pinia'
import tinycolor from 'tinycolor2'
import { useDebounceFn, useUrlSearchParams } from '@vueuse/core'
import { overlayTypes } from '~/lib/overlays'
import templates from '~/lib/templates'

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
  const isClient = ref(false)

  // Initialize isClient on mount
  onMounted(() => {
    isClient.value = true
  })

  // Use both hash and query params for better compatibility
  const hashParams = useUrlSearchParams('hash')
  const queryParams = useUrlSearchParams('history')

  // Helper function to get param value from either hash or query
  const getParam = (key: string) => {
    if (!isClient.value)
      return undefined
    return hashParams[key] || queryParams[key]
  }

  // Helper function to set param value in both hash and query
  const setParam = (key: string, value: string) => {
    if (!isClient.value)
      return
    hashParams[key] = value
    queryParams[key] = value
  }

  // Helper function to delete param from both hash and query
  const deleteParam = (key: string) => {
    if (!isClient.value)
      return
    delete hashParams[key]
    delete queryParams[key]
  }

  // Debounced URL update function
  const updateUrlParams = useDebounceFn((updates: Record<string, string | number>) => {
    if (!isClient.value)
      return

    Object.entries(updates).forEach(([key, value]) => {
      setParam(key, String(value))
    })
  }, 300)

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

  // Initialize state from URL params or defaults
  const initializeFromUrl = () => {
    if (!isClient.value)
      return

    // Debug logging for production troubleshooting
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('Initializing from URL params:', {
        hashParams: Object.fromEntries(Object.entries(hashParams)),
        queryParams: Object.fromEntries(Object.entries(queryParams)),
        templateParam: getParam('template'),
        overlayParams: {
          type: getParam('overlayType'),
          color: getParam('overlayColor'),
          opacity: getParam('overlayOpacity'),
          blur: getParam('overlayBlur'),
        },
      })
    }

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

  const style = computed(() => {
    return Object.entries(template.value).reduce((acc, [key, value]) => {
      acc[key] = utils.interpolateTemplate(value, variablesRef.value)
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
      // Try to get value from URL params first, fallback to default
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
      variablesRef.value[key] = variable.value
      deleteParam(key)
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

    const updates: Record<string, string | number> = {}
    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.type === 'color' && typeof variable.value === 'string') {
        const alpha = tinycolor(variable.value).getAlpha()
        variablesRef.value[key] = utils.randomColor(alpha)
        updates[key] = variablesRef.value[key]
      }
    })
    updateUrlParams(updates)
  }

  function randomizeAll() {
    randomizeColors()
    randomizeNumberValues()
  }

  // Watchers
  watch(activeTemplate, initVariablesRef)

  // Watch variablesRef and sync with URL
  watch(variablesRef, (newVars) => {
    updateUrlParams(newVars)
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
