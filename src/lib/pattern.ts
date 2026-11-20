import type { Template, Templates, Variables } from '~/types'
import { rollPalette } from '~/lib/palette'

/**
 * Shared pattern-engine primitives.
 *
 * This is the same math the generator (`stores/activeTemplate.ts`) runs on every
 * slider drag and "Randomize" click — pulled out so the marketing page can spin
 * up its own independent, throwaway pattern instances (for live demos) without
 * touching the generator's URL-synced state.
 */

/** Uniform value in [min, max], snapped to `step` when given (else 2 decimals). */
export function randomNumber(min: number, max: number, step?: number) {
  const raw = Math.random() * (max - min)
  const offset = step ? Math.round(raw / step) * step : raw
  return parseFloat(Math.min(min + offset, max).toFixed(step ? 4 : 2))
}

export function interpolateTemplate(template: string, variables: Record<string, string | number>) {
  return template.replace(/{(\w+)}/g, (_, p1) => String(variables[p1]))
}

export function generateCss(style: Record<string, string>) {
  return Object.entries(style)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n')
}

/** The template's own defaults, untouched. */
export function defaultVariables(variables: Variables) {
  return Object.entries(variables).reduce((acc, [key, variable]) => {
    acc[key] = variable.value
    return acc
  }, {} as Record<string, string | number>)
}

/**
 * A fresh random roll for a template's variables.
 * Colors are rolled as one related palette (not independent random hexes).
 * Breaking dials stay at their defaults unless `breaking` is set.
 */
export function randomVariables(
  template: Template | Variables,
  options: { colors?: boolean; numbers?: boolean; breaking?: boolean } = {},
) {
  const { colors = true, numbers = true, breaking = false } = options
  const full = ('variables' in template && 'template' in template) ? template as Template : undefined
  const variables = full ? full.variables : template as Variables
  const harmony = full?.harmony

  const next = Object.entries(variables).reduce((acc, [key, variable]) => {
    if ((variable.type === 'range' || variable.type === 'number') && numbers && (breaking || !variable.breaking))
      acc[key] = randomNumber(variable.min ?? 0, variable.max ?? 100, variable.step)
    else
      acc[key] = variable.value
    return acc
  }, {} as Record<string, string | number>)

  if (colors)
    Object.assign(next, rollPalette(variables, { harmony }))

  return next
}

/** Interpolates a template's CSS declarations against a set of variable values. */
export function buildStyle(slug: string, templates: Templates, variables: Record<string, string | number>) {
  return Object.entries(templates[slug].template).reduce((acc, [property, value]) => {
    acc[property] = interpolateTemplate(value, variables)
    return acc
  }, {} as Record<string, string>)
}

/** Picks a random template slug, optionally excluding one or more (so "shuffle" doesn't repeat itself). */
export function randomTemplateSlug(templates: Templates, exclude?: string | string[]) {
  const skipped = new Set(Array.isArray(exclude) ? exclude : exclude ? [exclude] : [])
  const keys = Object.keys(templates).filter(key => !skipped.has(key))
  return keys[Math.floor(Math.random() * keys.length)] ?? Object.keys(templates)[0]
}

/** Store colors without `#` so a raw `#rrggbb` cannot truncate the query at the hash. */
export function valueToParam(value: string | number) {
  const raw = String(value)
  return raw.startsWith('#') ? raw.slice(1) : raw
}

/** Rehydrate a URL/query param into a usable variable value. */
export function paramToValue(
  raw: unknown,
  variable: { type: string; value: string | number },
) {
  if (raw === undefined || raw === null || raw === '' || raw === 'undefined')
    return variable.value

  if (variable.type === 'range' || variable.type === 'number') {
    const parsed = parseFloat(String(raw))
    return Number.isFinite(parsed) ? parsed : variable.value
  }

  if (variable.type === 'color') {
    const hex = String(raw).trim().replace(/^#/, '')
    if (!/^[0-9a-fA-F]{3,8}$/.test(hex))
      return variable.value
    return `#${hex}`
  }

  return String(raw)
}

function rgbOf(color: string) {
  const hex = color.replace(/^#/, '')
  const full = hex.length === 3 ? hex.replace(/./g, '$&$&') : hex
  return /^[0-9a-fA-F]{6}$/.test(full) ? [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) : undefined
}

/**
 * Values part-way (0..1) between two rolls of the same pattern: numbers and colors blend,
 * anything else (or a color that isn't plain hex) jumps to the target.
 * shortcut: colors blend in sRGB, so a hue-far pair dips through grey; upgrade to OKLab if that shows.
 */
export function blendValues(from: Record<string, string | number>, to: Record<string, string | number>, t: number, variables: Variables) {
  const out = { ...to }
  for (const [key, variable] of Object.entries(variables)) {
    const a = from[key]
    const b = to[key]
    if (typeof a === 'number' && typeof b === 'number') {
      out[key] = +(a + (b - a) * t).toFixed(3)
    }
    else if (variable.type === 'color') {
      const x = rgbOf(String(a))
      const y = rgbOf(String(b))
      if (x && y)
        out[key] = `#${x.map((c, i) => Math.round(c + (y[i] - c) * t).toString(16).padStart(2, '0')).join('')}`
    }
  }
  return out
}

/** Runs `onFrame` with eased 0..1 progress until it reaches 1; returns a stop function. */
export function tween(ms: number, onFrame: (t: number) => void) {
  const start = performance.now()
  let id = 0
  const step = (now: number) => {
    const p = Math.min((now - start) / ms, 1)
    onFrame(1 - (1 - p) ** 3)
    if (p < 1)
      id = requestAnimationFrame(step)
  }
  id = requestAnimationFrame(step)
  return () => cancelAnimationFrame(id)
}
