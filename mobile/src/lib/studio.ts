import { File, Paths } from 'expo-file-system'
import { create } from 'zustand'
import { DEFAULT_EFFECTS, type Effects, buildFrame } from '~/lib/effects'
import { pushHistory } from '~/lib/looks'
import { buildOverlayBackground } from '~/lib/overlays'
import { defaultVariables, randomNumber, randomTemplateSlug, randomVariables } from '~/lib/pattern'
import { DEFAULT_OVERLAY, type Look, type Overlay, decodeRecipe, encodeRecipe } from '~/lib/recipe'
import templates from '~/lib/templates'

/** "nested_triangles_3d" reads as "Nested triangles 3d"; a trailing variant number is dropped. */
export function patternName(slug: string) {
  const words = slug.replace(/_/g, ' ').replace(/\s+\d+$/, '')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** The pattern's own dials, minus the ones that reshape the motif (the site hides those unless "wild shapes" is on). */
export function dialsOf(slug: string) {
  return Object.entries(templates[slug].variables)
    .filter(([, v]) => (v.type === 'range' || v.type === 'number') && !v.breaking)
}

export function colorsOf(slug: string) {
  return Object.entries(templates[slug].variables).filter(([, v]) => v.type === 'color')
}

/** Same roll as the site's Shuffle: a new pattern, new colors, new dials; finish and vignette carry over. */
function shuffled(look: Look): Look {
  const slug = randomTemplateSlug(templates, look.template)
  return { ...look, template: slug, values: rolled(slug, defaultVariables(templates[slug].variables)) }
}

function rolled(slug: string, values: Look['values'], numbers = true): Look['values'] {
  const template = templates[slug]
  const colors = randomVariables(template, { colors: true, numbers: false })
  const next = { ...values }
  for (const [key, v] of Object.entries(template.variables)) {
    if (v.type === 'color')
      next[key] = colors[key]
    else if (numbers && !v.breaking)
      next[key] = randomNumber(v.min ?? 0, v.max ?? 0, v.step)
  }
  return next
}

/** Every layer of a still frame, ready for the renderer page. */
export function frameFor(look: Look) {
  const { template, variables } = templates[look.template]
  const { overlayType, overlayColor, overlayOpacity, overlayBlur } = look.overlay
  return buildFrame({
    template,
    variables,
    values: look.values,
    effects: look.effects,
    overlay: { 'background': buildOverlayBackground(overlayType, overlayColor, overlayOpacity), 'backdrop-filter': `blur(${overlayBlur}px)` },
    animate: false,
  })
}

const saved = new File(Paths.document, 'look.txt')

function firstLook(): Look {
  try {
    const look = saved.exists ? decodeRecipe(saved.textSync()) : undefined
    if (look)
      return look
  }
  catch {}
  return shuffled({ template: Object.keys(templates)[0], values: {}, overlay: { ...DEFAULT_OVERLAY }, effects: { ...DEFAULT_EFFECTS } })
}

interface Studio {
  look: Look
  /** Looks from before each jump (shuffle, colors, pattern, load), newest last. */
  history: string[]
  shuffle: () => void
  rollColors: () => void
  setPattern: (slug: string) => void
  setValue: (key: string, value: number) => void
  setEffects: (patch: Partial<Effects>) => void
  setOverlay: (patch: Partial<Overlay>) => void
  load: (recipe: string) => void
  undo: () => void
}

export const useStudio = create<Studio>((set, get) => {
  /** Replaces the look wholesale and remembers the old one for Undo. Dial drags skip this, like on the site. */
  const jump = (next: Look) => set(({ look, history }) => ({ look: next, history: pushHistory(history, encodeRecipe(look)) }))
  return {
    look: firstLook(),
    history: [],
    shuffle: () => jump(shuffled(get().look)),
    rollColors: () => {
      const { look } = get()
      jump({ ...look, values: rolled(look.template, look.values, false) })
    },
    setPattern: (slug) => {
      const { look } = get()
      if (slug !== look.template)
        jump({ ...look, template: slug, values: defaultVariables(templates[slug].variables) })
    },
    setValue: (key, value) => set(({ look }) => ({ look: { ...look, values: { ...look.values, [key]: value } } })),
    setEffects: patch => set(({ look }) => ({ look: { ...look, effects: { ...look.effects, ...patch } } })),
    setOverlay: patch => set(({ look }) => ({ look: { ...look, overlay: { ...look.overlay, ...patch } } })),
    load: (recipe) => {
      const next = decodeRecipe(recipe)
      if (next)
        jump(next)
    },
    undo: () => {
      const { history } = get()
      const previous = history.at(-1)
      const look = previous && decodeRecipe(previous)
      if (look)
        set({ look, history: history.slice(0, -1) })
    },
  }
})

// Reopening the app picks up where you left off.
let pending: ReturnType<typeof setTimeout> | undefined
useStudio.subscribe(({ look }) => {
  clearTimeout(pending)
  pending = setTimeout(() => saved.writeSync(encodeRecipe(look)), 500)
})
