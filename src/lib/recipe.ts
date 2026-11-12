import { DEFAULT_EFFECTS, type Effects, effectsToParams, parseEffects } from '~/lib/effects'
import { clampOverlayOpacity, overlayTypes } from '~/lib/overlays'
import { defaultVariables, paramToValue, valueToParam } from '~/lib/pattern'
import templates from '~/lib/templates'

/**
 * A recipe is the whole look in one URL-safe string, carried as `?p=`:
 *
 *   1.<slug>.<key>-<value>_<key>-<value>…
 *
 * `1` is the format version. Only values that differ from their defaults are
 * written. Keys: a dial's position in the template (`0`, `1`, …), `ot`/`oc`/
 * `oo`/`ob` for the overlay, and effect params without their `fx` prefix
 * (`Grain`, `ColorMode`, …) so new effect fields serialize with no change here.
 *
 * Free of Vue, the router and the DOM so other clients can share it.
 */

export interface Overlay {
  overlayType: string
  overlayColor: string
  overlayOpacity: number
  overlayBlur: number
}

export const DEFAULT_OVERLAY: Overlay = {
  overlayType: 'radial-gradient-center',
  overlayColor: '#000000',
  overlayOpacity: 0.5,
  overlayBlur: 0,
}

export interface Look {
  template: string
  values: Record<string, string | number>
  overlay: Overlay
  effects: Effects
}

const VERSION = '1'
const OVERLAY_KEYS: Record<keyof Overlay, string> = {
  overlayType: 'ot',
  overlayColor: 'oc',
  overlayOpacity: 'oo',
  overlayBlur: 'ob',
}
const MAX_BLUR = 20

const effectKey = (param: string) => param.replace(/^fx/, '')

// Own keys only, so `__proto__` or `constructor` in a link never pass as a name.
function isKey(record: object, key: unknown): key is string {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(record, key)
}

export function isTemplate(slug: unknown): slug is string {
  return isKey(templates, slug)
}

// Only A–Z a–z 0–9 `.` `-` survive both encodeURIComponent and URLSearchParams untouched;
// anything else (including the `_` separator) becomes `*XX`, `*` being safe in both too.
function escapeValue(value: string) {
  return encodeURIComponent(value)
    .replace(/[!'()*_~]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%/g, '*')
}

function unescapeValue(value: string) {
  return decodeURIComponent(value.replace(/\*/g, '%'))
}

function numberFrom(raw: unknown, fallback: number) {
  if (raw === undefined || raw === null || raw === '')
    return fallback
  const parsed = parseFloat(String(raw))
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseOverlay(read: (key: keyof Overlay) => unknown, fallback: Overlay): Overlay {
  const type = read('overlayType')
  return {
    overlayType: isKey(overlayTypes, type) ? type : fallback.overlayType,
    overlayColor: String(paramToValue(read('overlayColor'), { type: 'color', value: fallback.overlayColor })),
    overlayOpacity: clampOverlayOpacity(numberFrom(read('overlayOpacity'), fallback.overlayOpacity)),
    overlayBlur: Math.min(MAX_BLUR, Math.max(0, numberFrom(read('overlayBlur'), fallback.overlayBlur))),
  }
}

/** Dial values for a template from a param reader, in the template's dial order. */
function parseValues(slug: string, read: (key: string, index: number) => unknown) {
  return Object.entries(templates[slug].variables).reduce((acc, [key, variable], index) => {
    acc[key] = paramToValue(read(key, index), variable)
    return acc
  }, {} as Record<string, string | number>)
}

export function encodeRecipe(look: Look) {
  const entries: string[] = []
  const add = (key: string, value: string, fallback: string) => {
    if (value !== fallback)
      entries.push(`${key}-${escapeValue(value)}`)
  }

  const defaults = defaultVariables(templates[look.template]?.variables ?? {})
  Object.keys(defaults).forEach((key, index) => {
    if (key in look.values)
      add(String(index), valueToParam(look.values[key]), valueToParam(defaults[key]))
  })
  for (const [field, key] of Object.entries(OVERLAY_KEYS) as [keyof Overlay, string][])
    add(key, valueToParam(look.overlay[field]), valueToParam(DEFAULT_OVERLAY[field]))
  // Effect values go through as effectsToParams writes them, so parseEffects reads back exactly that.
  const effectDefaults = effectsToParams(DEFAULT_EFFECTS)
  for (const [param, value] of Object.entries(effectsToParams(look.effects)))
    add(effectKey(param), String(value), String(effectDefaults[param]))

  return [VERSION, look.template, ...(entries.length ? [entries.join('_')] : [])].join('.')
}

/** Never throws: returns undefined for anything that is not a recipe for a known template. */
export function decodeRecipe(recipe: unknown): Look | undefined {
  try {
    if (typeof recipe !== 'string')
      return undefined
    const match = /^(\w+)\.([a-z0-9_]+)(?:\.(.*))?$/.exec(recipe)
    if (!match || match[1] !== VERSION || !isTemplate(match[2]))
      return undefined
    const [, , slug, body = ''] = match

    const entries = new Map<string, string>()
    for (const entry of body.split('_')) {
      const split = entry.indexOf('-')
      try {
        if (split > 0)
          entries.set(entry.slice(0, split), unescapeValue(entry.slice(split + 1)))
      }
      catch {} // A broken escape (say, a link cut short) drops that entry, not the look.
    }

    return {
      template: slug,
      values: parseValues(slug, (_, index) => entries.get(String(index))),
      overlay: parseOverlay(field => entries.get(OVERLAY_KEYS[field]), DEFAULT_OVERLAY),
      effects: parseEffects(param => entries.get(effectKey(param)), DEFAULT_EFFECTS),
    }
  }
  catch {
    return undefined
  }
}

/**
 * The look an old per-dial link (`?template=…&size=…&fxGrain=…`) carried.
 * Fields the link leaves out come from `fallback`, except dials, which start at the template's defaults.
 */
export function lookFromParams(read: (key: string) => unknown, fallback: Look): Look {
  const slug = read('template')
  const template = isTemplate(slug) ? slug : fallback.template
  return {
    template,
    values: parseValues(template, key => read(key)),
    overlay: parseOverlay(read, fallback.overlay),
    effects: parseEffects(read, fallback.effects),
  }
}
