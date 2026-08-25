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

export function randomNumber(min: number, max: number) {
  return parseFloat((Math.random() * (max - min + 1) + min).toFixed(2))
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
 */
export function randomVariables(
  template: Template | Variables,
  options: { colors?: boolean; numbers?: boolean } = {},
) {
  const { colors = true, numbers = true } = options
  const isTemplate = 'variables' in template && 'template' in template
  const variables = isTemplate ? template.variables : template
  const harmony = isTemplate ? template.harmony : undefined

  const next = Object.entries(variables).reduce((acc, [key, variable]) => {
    if ((variable.type === 'range' || variable.type === 'number') && numbers)
      acc[key] = randomNumber(variable.min ?? 0, variable.max ?? 100)
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

/** Query object for opening the generator on a specific roll (slug + every dial). */
export function patternToQuery(slug: string, variables: Record<string, string | number>) {
  return {
    template: slug,
    ...Object.fromEntries(
      Object.entries(variables).map(([key, value]) => [key, valueToParam(value)]),
    ),
  }
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
