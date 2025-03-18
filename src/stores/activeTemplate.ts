import { acceptHMRUpdate, defineStore } from 'pinia'
import tinycolor from 'tinycolor2'
import { overlayTypes } from '~/lib/overlays'
import templates from '~/lib/templates'

// Utility functions
const utils = {
  randomNumber: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min),
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
  // State
  const activeTemplate = ref(Object.keys(templates)[0])
  const variablesRef = ref<Record<string, string | number>>({})

  // Overlay variables
  const overlayVariables = ref({
    overlayType: 'none',
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    overlayBlur: 0,
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
    activeTemplate.value = slug
    initVariablesRef()
  }

  function initVariablesRef() {
    variablesRef.value = Object.entries(variables.value).reduce((acc, [key, variable]) => {
      acc[key] = variable.value
      return acc
    }, {} as Record<string, string | number>)
  }

  function reset() {
    Object.entries(variables.value).forEach(([key, variable]) => {
      variablesRef.value[key] = variable.value
    })
  }

  function randomizeNumberValues() {
    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.type === 'range' || variable.type === 'number') {
        const min = variable.min ?? 0
        const max = variable.max ?? 0
        variablesRef.value[key] = utils.randomNumber(min, max)
      }
    })
  }

  function randomizeColors() {
    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.type === 'color' && typeof variable.value === 'string') {
        const alpha = tinycolor(variable.value).getAlpha()
        variablesRef.value[key] = utils.randomColor(alpha)
      }
    })
  }

  function randomizeAll() {
    randomizeColors()
    randomizeNumberValues()
  }

  function getRandomTemplateCss(): string {
    const randomTemplateKey = Object.keys(templates)[utils.randomNumber(0, Object.keys(templates).length - 1)]
    const randomTemplate = templates[randomTemplateKey]

    const randomVariables = Object.entries(randomTemplate.variables).reduce((acc, [key, variable]) => {
      if (variable.type === 'color')
        acc[key] = utils.randomColor(tinycolor(variable.value as string).getAlpha())
      else if (variable.type === 'range' || variable.type === 'number')
        acc[key] = utils.randomNumber(variable.min ?? 0, variable.max ?? 0)
      else
        acc[key] = variable.value

      return acc
    }, {} as Record<string, string | number>)

    const randomStyle = Object.entries(randomTemplate.template).reduce((acc, [key, value]) => {
      acc[key] = utils.interpolateTemplate(value, randomVariables)
      return acc
    }, {} as Record<string, string>)

    return utils.generateCss(randomStyle)
  }

  // Watchers
  watch(activeTemplate, initVariablesRef)

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
    getRandomTemplateCss,
    overlayVariables,
    overlayStyle,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useActiveTemplateStore as any, import.meta.hot))
