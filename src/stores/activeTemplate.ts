import { acceptHMRUpdate, defineStore } from 'pinia'
import { useDebounceFn, useUrlSearchParams } from '@vueuse/core'
import { buildOverlayBackground } from '~/lib/overlays'
import { DEFAULT_EFFECTS, type Effects, type FrameOptions, buildFrame, effectParamKeys, effectsToParams, legacyEffectParamKeys, parseEffects } from '~/lib/effects'
import {
  defaultVariables,
  generateCss,
  interpolateTemplate,
  paramToValue,
  randomNumber,
  randomVariables,
  valueToParam,
} from '~/lib/pattern'
import templates from '~/lib/templates'

// Utility functions
const utils = {
  randomNumber,
  interpolateTemplate,
  generateCss,
}

function numberFromParam(raw: unknown, fallback: number) {
  if (raw === undefined || raw === null || raw === '')
    return fallback
  const parsed = parseFloat(String(raw))
  return Number.isFinite(parsed) ? parsed : fallback
}

function queryValue(raw: unknown): string | undefined {
  if (raw === undefined || raw === null || raw === '')
    return undefined
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value : undefined
}

export const useActiveTemplateStore = defineStore('activeTemplate', () => {
  // URL state management with proper client-side handling.
  // True immediately on the client so SPA navigations from `/` don't wait on
  // a store-level onMounted (which only runs the first time the store is used).
  const isClient = ref(!import.meta.env.SSR)
  const route = useRoute()
  const router = useRouter()

  onMounted(() => {
    isClient.value = true
  })

  // useUrlSearchParams tracks its own history writes. Vue Router `route.query`
  // is only trusted for inbound navigations (hero link, refresh, shared URL).
  const hashParams = useUrlSearchParams('hash')
  const queryParams = useUrlSearchParams('history')

  function templateSlugFromRoute(): string | undefined {
    const slug = queryValue(route.query.template)
    if (slug && Object.keys(templates).includes(slug))
      return slug
    return undefined
  }

  const getParam = (key: string) => {
    if (!isClient.value)
      return undefined
    return hashParams[key] || queryParams[key]
  }

  const setParam = (key: string, value: string) => {
    if (!isClient.value)
      return
    hashParams[key] = value
    queryParams[key] = value
  }

  const deleteParam = (key: string) => {
    if (!isClient.value)
      return
    delete hashParams[key]
    delete queryParams[key]
  }

  function clearDialParams() {
    const keys = new Set([
      ...Object.keys(hashParams),
      ...Object.keys(queryParams),
    ])
    keys.forEach(key => deleteParam(key))
  }

  // Updates are merged until the debounce fires, so a dial drag and an
  // overlay/effect change in the same window don't drop each other.
  let pendingParams: Record<string, string | number> = {}

  const flushUrlParams = useDebounceFn(() => {
    const updates = pendingParams
    pendingParams = {}
    if (!isClient.value)
      return

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null)
        return
      setParam(key, valueToParam(value))
    })
  }, 300)

  function updateUrlParams(updates: Record<string, string | number>) {
    Object.assign(pendingParams, updates)
    flushUrlParams()
  }

  const activeTemplate = ref('')
  const variablesRef = ref<Record<string, string | number>>({})

  const overlayVariables = ref({
    overlayType: 'radial-gradient-center',
    overlayColor: '#000000',
    overlayOpacity: 0.5,
    overlayBlur: 0,
  })

  const effectVariables = ref<Effects>({ ...DEFAULT_EFFECTS })

  /** Shows, shuffles and animates breaking dials too. A viewer preference, so it lives in storage, not the URL. */
  const storedWildShapes = useStorage('stylixir-wild-shapes', false)
  // Starts off and loads after mount so the prerendered controls hydrate cleanly.
  const wildShapes = ref(false)
  onMounted(() => {
    wildShapes.value = storedWildShapes.value
  })
  watch(wildShapes, (wild) => {
    storedWildShapes.value = wild
  })

  function initVariablesRef() {
    const defs = templates[activeTemplate.value]?.variables || {}
    variablesRef.value = Object.entries(defs).reduce((acc, [key, variable]) => {
      acc[key] = paramToValue(isClient.value ? getParam(key) : undefined, variable)
      return acc
    }, {} as Record<string, string | number>)
  }

  /** Apply dials from Vue Router query (inbound links), falling back to search params / defaults. */
  function applyRouteQueryToVariables() {
    const defs = templates[activeTemplate.value]?.variables || {}
    variablesRef.value = Object.entries(defs).reduce((acc, [key, variable]) => {
      const fromRoute = queryValue(route.query[key])
      acc[key] = paramToValue(fromRoute ?? getParam(key), variable)
      return acc
    }, {} as Record<string, string | number>)
  }

  function applyRouteQueryToOverlay() {
    overlayVariables.value = {
      overlayType: queryValue(route.query.overlayType)
        || (getParam('overlayType') as string)
        || overlayVariables.value.overlayType
        || 'radial-gradient-center',
      overlayColor: String(paramToValue(
        queryValue(route.query.overlayColor) ?? getParam('overlayColor'),
        { type: 'color', value: overlayVariables.value.overlayColor || '#000000' },
      )),
      overlayOpacity: numberFromParam(
        queryValue(route.query.overlayOpacity) ?? getParam('overlayOpacity'),
        overlayVariables.value.overlayOpacity ?? 0.5,
      ),
      overlayBlur: numberFromParam(
        queryValue(route.query.overlayBlur) ?? getParam('overlayBlur'),
        overlayVariables.value.overlayBlur ?? 0,
      ),
    }
  }

  function applyRouteQueryToEffects() {
    effectVariables.value = parseEffects(
      key => queryValue(route.query[key]) ?? getParam(key),
      effectVariables.value,
    )
    // Old single-preset motion links are translated above; drop their keys so they cannot shadow later edits.
    legacyEffectParamKeys().forEach(key => deleteParam(key))
  }

  const initializeFromUrl = () => {
    if (!isClient.value)
      return

    const templateParam = templateSlugFromRoute() || queryValue(getParam('template'))
    activeTemplate.value = (templateParam && Object.keys(templates).includes(templateParam))
      ? templateParam
      : Object.keys(templates)[0]

    applyRouteQueryToOverlay()
    applyRouteQueryToEffects()
    applyRouteQueryToVariables()
  }

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

    return {
      'background': buildOverlayBackground(overlayType, overlayColor, overlayOpacity),
      'backdrop-filter': `blur(${overlayBlur}px)`,
    }
  })

  /** Every layer for the current roll — pattern, light, overlay, grain, warp filter, motion rules. */
  function frame(options: Partial<Omit<FrameOptions, 'template' | 'variables' | 'values' | 'effects' | 'overlay'>> & { overlay?: boolean } = {}) {
    const { overlay = true, ...rest } = options
    return buildFrame({
      template: template.value,
      variables: variables.value,
      values: variablesRef.value,
      effects: effectVariables.value,
      overlay: overlay ? overlayStyle.value : undefined,
      breaking: wildShapes.value,
      ...rest,
    })
  }

  function resetEffects() {
    effectVariables.value = { ...DEFAULT_EFFECTS }
    effectParamKeys().forEach(key => deleteParam(key))
  }

  function updateActiveTemplate(slug: string) {
    if (!isClient.value)
      return
    if (!templates[slug])
      return

    // Drop every previous dial so same-named keys (size, colorOne, …) cannot
    // leak into the next pattern via route.query or search params.
    // Unflushed writes from the old pattern would bring them back, so drop those too.
    pendingParams = {}
    clearDialParams()
    activeTemplate.value = slug
    variablesRef.value = defaultVariables(templates[slug].variables)
    setParam('template', slug)
    // Overlay and effects belong to the canvas, not the pattern — carry them over.
    updateUrlParams({ ...overlayVariables.value, ...effectsToParams(effectVariables.value) })

    if (route.path === '/')
      router.replace({ path: '/', query: { template: slug } })
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
        variablesRef.value[key] = (variable.breaking && !wildShapes.value)
          ? variable.value
          : utils.randomNumber(min, max, variable.step)
        updates[key] = variablesRef.value[key]
      }
    })
    updateUrlParams(updates)
  }

  // Turning wild shapes off puts the hidden breaking dials back to their defaults.
  watch(wildShapes, (wild) => {
    if (wild)
      return
    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.breaking)
        variablesRef.value[key] = variable.value
    })
  })

  function randomizeColors() {
    if (!isClient.value)
      return

    const next = randomVariables(templates[activeTemplate.value], {
      colors: true,
      numbers: false,
    })
    const updates: Record<string, string | number> = {}
    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.type === 'color') {
        variablesRef.value[key] = next[key]
        updates[key] = next[key]
      }
    })
    updateUrlParams(updates)
  }

  function randomizeAll() {
    randomizeColors()
    randomizeNumberValues()
  }

  function applyTemplateFromRoute() {
    if (!isClient.value || route.path !== '/')
      return

    const slug = templateSlugFromRoute()
    if (!slug)
      return

    // Inbound navigation only (hero / shared URL). Do not clear the query —
    // it carries the roll we want to restore.
    if (slug !== activeTemplate.value)
      activeTemplate.value = slug

    applyRouteQueryToVariables()
    applyRouteQueryToOverlay()
    applyRouteQueryToEffects()
  }

  watch(activeTemplate, initVariablesRef)

  watch(variablesRef, (newVars) => {
    updateUrlParams(newVars)
  }, { deep: true })

  watch(overlayVariables, (newVars) => {
    updateUrlParams(newVars)
  }, { deep: true })

  watch(effectVariables, (newVars) => {
    updateUrlParams(effectsToParams(newVars))
  }, { deep: true })

  if (!activeTemplate.value)
    activeTemplate.value = Object.keys(templates)[0]
  initVariablesRef()

  watch(isClient, (clientReady) => {
    if (clientReady) {
      nextTick(() => {
        initializeFromUrl()
      })
    }
  }, { immediate: true })

  watch(() => route.fullPath, () => {
    applyTemplateFromRoute()
  })

  return {
    activeTemplate,
    variablesRef,
    variables,
    style,
    css,
    updateActiveTemplate,
    applyTemplateFromRoute,
    reset,
    randomizeNumberValues,
    randomizeColors,
    randomizeAll,
    wildShapes,
    overlayVariables,
    overlayStyle,
    effectVariables,
    resetEffects,
    frame,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useActiveTemplateStore as any, import.meta.hot))
