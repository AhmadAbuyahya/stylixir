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
  // URL state management
  const params = useUrlSearchParams('hash')

  // Debounced URL update function
  const updateUrlParams = useDebounceFn((updates: Record<string, string | number>) => {
    Object.entries(updates).forEach(([key, value]) => {
      params[key] = String(value)
    })
  }, 300)

  // State
  const activeTemplate = ref(params.template as string || Object.keys(templates)[0])
  const variablesRef = ref<Record<string, string | number>>({})

  // Overlay variables
  const overlayVariables = ref({
    overlayType: params.overlayType as string || 'radial-gradient-center',
    overlayColor: params.overlayColor as string || '#000000',
    overlayOpacity: parseFloat(params.overlayOpacity as string) || 0.5,
    overlayBlur: parseFloat(params.overlayBlur as string) || 0,
  })

  // Getters
  const variables = computed(() => templates[activeTemplate.value].variables)
  const template = computed(() => templates[activeTemplate.value].template)

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
    // Clear all URL parameters
    Object.keys(params).forEach((key) => {
      delete params[key]
    })
    // Set the new template
    activeTemplate.value = slug
    params.template = slug
    initVariablesRef()
  }

  function initVariablesRef() {
    variablesRef.value = Object.entries(variables.value).reduce((acc, [key, variable]) => {
      // Try to get value from URL params first, fallback to default
      const paramValue = params[key]
      acc[key] = paramValue !== undefined
        ? ((variable.type === 'range' || variable.type === 'number')
            ? parseFloat(String(paramValue))
            : String(paramValue))
        : variable.value
      return acc
    }, {} as Record<string, string | number>)
  }

  function reset() {
    Object.entries(variables.value).forEach(([key, variable]) => {
      variablesRef.value[key] = variable.value
      delete params[key]
    })
  }

  function randomizeNumberValues() {
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

  // Initialize
  initVariablesRef()

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
