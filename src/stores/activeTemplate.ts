import { acceptHMRUpdate, defineStore } from 'pinia'
import { useDebounceFn } from '@vueuse/core'
import { buildOverlayBackground } from '~/lib/overlays'
import { DEFAULT_EFFECTS, type Effects, type FrameOptions, buildFrame } from '~/lib/effects'
import {
  defaultVariables,
  generateCss,
  interpolateTemplate,
  randomNumber,
  randomTemplateSlug,
  randomVariables,
} from '~/lib/pattern'
import { parseKept, pushHistory, removeKept, toggleKept } from '~/lib/looks'
import { DEFAULT_OVERLAY, type Look, type Overlay, decodeRecipe, encodeRecipe, isTemplate, lookFromParams } from '~/lib/recipe'
import templates from '~/lib/templates'

const KEPT_KEY = 'stylixir-kept'

// Utility functions
const utils = {
  randomNumber,
  interpolateTemplate,
  generateCss,
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

  onMounted(() => {
    isClient.value = true
  })

  const firstTemplate = Object.keys(templates)[0]
  const activeTemplate = ref(firstTemplate)
  const variablesRef = ref<Record<string, string | number>>(defaultVariables(templates[firstTemplate].variables))
  const overlayVariables = ref<Overlay>({ ...DEFAULT_OVERLAY })
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

  const currentLook = (): Look => ({
    template: activeTemplate.value,
    values: variablesRef.value,
    overlay: overlayVariables.value,
    effects: effectVariables.value,
  })

  /** The whole look as one short string: the `?p=` share link, and a snapshot `applyRecipe` restores. */
  const recipe = computed(() => encodeRecipe(currentLook()))

  function applyLook(look: Look) {
    activeTemplate.value = look.template
    variablesRef.value = look.values
    overlayVariables.value = look.overlay
    effectVariables.value = look.effects
  }

  function applyRecipe(next: string) {
    const look = decodeRecipe(next)
    if (look)
      applyLook(look)
    return !!look
  }

  /** Looks from before each jump, newest last. In memory only. */
  const undoStack = ref<string[]>([])
  const canUndo = computed(() => undoStack.value.length > 0)
  let jumpDepth = 0

  // Wraps a public action that replaces the look wholesale. Composites nest (randomizeAll calls
  // randomizeColors), so only the outermost call records, holding the look from before it began.
  function jump<A extends unknown[], R>(action: (...args: A) => R) {
    return (...args: A): R => {
      const before = recipe.value
      jumpDepth++
      try {
        return action(...args)
      }
      finally {
        jumpDepth--
        if (!jumpDepth && recipe.value !== before)
          undoStack.value = pushHistory(undoStack.value, before)
      }
    }
  }

  function undo() {
    const previous = undoStack.value.at(-1)
    if (previous === undefined)
      return
    undoStack.value = undoStack.value.slice(0, -1)
    applyRecipe(previous)
  }

  /** Recipes the person kept, newest first. Entries for unknown patterns stay stored; the Book just skips them. */
  const kept = ref<string[]>([])
  const isKept = computed(() => kept.value.includes(recipe.value))

  // Not useStorage: it writes its parsed value back, which would wipe a stored value we could not read.
  function readKept() {
    try {
      return parseKept(localStorage.getItem(KEPT_KEY))
    }
    catch {
      return [] // Storage blocked.
    }
  }

  // Re-reads first, so a look kept in another tab is not lost.
  function changeKept(change: (list: string[]) => string[]) {
    kept.value = change(readKept())
    try {
      localStorage.setItem(KEPT_KEY, JSON.stringify(kept.value))
    }
    catch {}
  }

  // Loads after mount, like wildShapes, so the prerendered markup hydrates cleanly.
  onMounted(() => {
    kept.value = readKept()
  })

  function toggleKeep() {
    changeKept(list => toggleKept(list, recipe.value))
    return isKept.value
  }

  function unkeep(entry: string) {
    changeKept(list => removeKept(list, entry))
  }

  // Written straight to history, like useUrlSearchParams did, so dial drags don't run router navigations.
  // Replacing the whole query and hash also drops old per-dial params and their hash copy.
  function writeUrl() {
    if (!isClient.value || route.path !== '/')
      return
    const url = `${location.pathname}?p=${recipe.value}`
    if (url !== location.pathname + location.search + location.hash)
      history.replaceState(history.state, '', url)
  }

  const writeUrlSoon = useDebounceFn(writeUrl, 300)
  watch(recipe, writeUrlSoon)

  /** Inbound links: a `?p=` recipe, or an old per-dial link (query or hash, route query first). */
  function applyLink() {
    const p = queryValue(route.query.p)
    if (p && applyRecipe(p))
      return
    // Old links kept their hash copy as `#?key=value`, the shape useUrlSearchParams('hash') wrote and read.
    const hashQuery = location.hash.indexOf('?')
    const hash = new URLSearchParams(hashQuery > 0 ? location.hash.slice(hashQuery) : '')
    const search = new URLSearchParams(location.search)
    applyLook(lookFromParams(
      key => queryValue(route.query[key]) ?? (hash.get(key) || search.get(key) || undefined),
      currentLook(),
    ))
  }

  const initializeFromUrl = () => {
    if (!isClient.value)
      return
    applyLink()
    writeUrl()
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
  }

  function updateActiveTemplate(slug: string) {
    if (!isClient.value)
      return
    if (!templates[slug])
      return

    // Overlay and effects belong to the canvas, not the pattern — they carry over.
    activeTemplate.value = slug
    variablesRef.value = defaultVariables(templates[slug].variables)
  }

  function reset() {
    if (!isClient.value)
      return

    Object.entries(variables.value).forEach(([key, variable]) => {
      variablesRef.value[key] = variable.value
    })
  }

  function randomizeNumberValues() {
    if (!isClient.value)
      return

    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.type === 'range' || variable.type === 'number') {
        const min = variable.min ?? 0
        const max = variable.max ?? 0
        variablesRef.value[key] = (variable.breaking && !wildShapes.value)
          ? variable.value
          : utils.randomNumber(min, max, variable.step)
      }
    })
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
    Object.entries(variables.value).forEach(([key, variable]) => {
      if (variable.type === 'color')
        variablesRef.value[key] = next[key]
    })
  }

  function randomizeAll() {
    randomizeColors()
    randomizeNumberValues()
  }

  function shuffle() {
    // Switching templates resets the dials synchronously, so the roll lands on the new pattern.
    updateActiveTemplate(randomTemplateSlug(templates, activeTemplate.value))
    randomizeAll()
  }

  function applyTemplateFromRoute() {
    if (!isClient.value || route.path !== '/')
      return

    // Inbound navigation only (a shared link, or the audit pages' `?template=`). Our own URL writes skip the router.
    const slug = queryValue(route.query.template)
    if (route.query.p || isTemplate(slug)) {
      applyLink()
      writeUrl()
    }
  }

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
    updateActiveTemplate: jump(updateActiveTemplate),
    applyTemplateFromRoute,
    recipe,
    applyRecipe: jump(applyRecipe),
    undoStack,
    canUndo,
    undo,
    kept,
    isKept,
    toggleKeep,
    unkeep,
    reset: jump(reset),
    randomizeNumberValues: jump(randomizeNumberValues),
    randomizeColors: jump(randomizeColors),
    randomizeAll: jump(randomizeAll),
    shuffle: jump(shuffle),
    wildShapes,
    overlayVariables,
    overlayStyle,
    effectVariables,
    resetEffects: jump(resetEffects),
    frame,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useActiveTemplateStore as any, import.meta.hot))
