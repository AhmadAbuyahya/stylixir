import type { Template, Templates, Variable, Variables } from '~/types'
import { defaultVariables, interpolateTemplate } from '~/lib/pattern'
import { formatTemplateEntry } from '~/lib/audit-promote'

const PLACEHOLDER_RE = /\{(\w+)\}/g

export interface AuditValidation {
  ok: boolean
  missingInVariables: string[]
  unusedVariables: string[]
}

export function extractPlaceholders(template: Record<string, string>): string[] {
  const found = new Set<string>()
  for (const value of Object.values(template)) {
    for (const match of value.matchAll(PLACEHOLDER_RE))
      found.add(match[1])
  }
  return [...found].sort()
}

export function validateAuditDraft(
  template: Record<string, string>,
  variables: Variables,
): AuditValidation {
  const placeholders = new Set(extractPlaceholders(template))
  const defined = new Set(Object.keys(variables))

  const missingInVariables = [...placeholders].filter(key => !defined.has(key))
  const unusedVariables = [...defined].filter(key => !placeholders.has(key))

  return {
    ok: missingInVariables.length === 0,
    missingInVariables,
    unusedVariables,
  }
}

export function previewValuesForVariable(
  key: string,
  variables: Variables,
): { min: Record<string, string | number>; default: Record<string, string | number>; max: Record<string, string | number> } | null {
  const variable = variables[key]
  if (!variable || variable.type === 'color')
    return null

  const base = defaultVariables(variables)
  const minVal = variable.min ?? variable.value
  const maxVal = variable.max ?? variable.value

  return {
    min: { ...base, [key]: minVal },
    default: base,
    max: { ...base, [key]: maxVal },
  }
}

export function buildPreviewStyle(
  template: Record<string, string>,
  values: Record<string, string | number>,
): Record<string, string> {
  return Object.entries(template).reduce((acc, [property, value]) => {
    acc[property] = interpolateTemplate(value, values)
    return acc
  }, {} as Record<string, string>)
}

export function cloneTemplateEntry(entry: Template): Template {
  return {
    ...(entry.harmony ? { harmony: entry.harmony } : {}),
    template: { ...entry.template },
    variables: Object.fromEntries(
      Object.entries(entry.variables).map(([key, variable]) => [key, { ...variable }]),
    ),
  }
}

export function createStubVariable(name: string, type: Variable['type'] = 'range'): Variable {
  if (type === 'color')
    return { type: 'color', value: '#888888' }

  return {
    type,
    value: type === 'range' ? 50 : 50,
    min: 0,
    max: 100,
    step: type === 'range' ? 1 : undefined,
  }
}

/** Replace every `{name}` placeholder in template CSS with a literal value. */
export function inlineVariableInTemplate(
  template: Record<string, string>,
  name: string,
  value: string | number,
): Record<string, string> {
  const token = `{${name}}`
  const literal = String(value)
  return Object.fromEntries(
    Object.entries(template).map(([property, css]) => [
      property,
      css.split(token).join(literal),
    ]),
  )
}

/** TypeScript snippet to paste into templates.ts manually (fallback when promote is unavailable). */
export function exportTemplatePatch(
  slug: string,
  draft: Template,
  _source: Templates,
): string {
  return [
    `// Paste into src/lib/templates.ts — replace the '${slug}' entry:`,
    '',
    formatTemplateEntry(slug, draft),
  ].join('\n')
}

export function isDraftDirty(slug: string, draft: Template, source: Templates): boolean {
  const original = source[slug]
  if (!original)
    return true
  return JSON.stringify(draft) !== JSON.stringify(cloneTemplateEntry(original))
}

/** Evenly spaced values across a variable's range (or an override), snapped to its step. */
export function sampleRange(variable: Variable, steps: number, range?: [number, number]): number[] {
  const lo = range?.[0] ?? variable.min ?? Number(variable.value)
  const hi = range?.[1] ?? variable.max ?? Number(variable.value)
  const snap = (n: number) => {
    const stepped = variable.step ? Math.round(n / variable.step) * variable.step : n
    return Number(stepped.toFixed(variable.step ? 4 : 2))
  }
  if (steps < 2 || lo === hi)
    return [snap(lo)]
  return [...new Set(Array.from({ length: steps }, (_, i) => snap(lo + (hi - lo) * i / (steps - 1))))]
}

/** Translation-invariant summary of a rendered tile. */
export interface TileStats {
  /** Quantized color -> fraction of pixels. */
  hist: Record<string, number>
  /** Most common quantized color's fraction (1 = solid fill). */
  dominant: number
  /** Mean neighbour-pixel difference, 0..1 (how much detail/edges). */
  edge: number
}

export type SweepFlagKind = 'dead' | 'periodic' | 'subtle' | 'collapse' | 'busy' | 'jump'

export interface SweepFlag {
  kind: SweepFlagKind
  /** Sampled values the flag applies to. */
  at: number[]
  detail: string
}

// Starting guesses; tune these against hand-labelled good/bad examples.
export const SWEEP_THRESHOLDS = {
  deadPixelDiff: 0.001,
  subtleSignature: 0.05,
  collapseDominant: 0.98,
  busyEdgeRatio: 3,
  jumpRatio: 3,
  jumpMin: 0.3,
}

export function tileDistance(a: TileStats, b: TileStats): number {
  let hist = 0
  for (const key of new Set([...Object.keys(a.hist), ...Object.keys(b.hist)]))
    hist += Math.abs((a.hist[key] ?? 0) - (b.hist[key] ?? 0))
  const edge = Math.abs(a.edge - b.edge) / Math.max(a.edge, b.edge, 0.01)
  return hist / 2 + edge
}

/**
 * Flags suspicious behaviour in one variable's sweep.
 * `pixelDiffs[i]` is the fraction of pixels that visibly differ between sample i and the first sample.
 */
export function flagSweep(
  values: number[],
  stats: TileStats[],
  defaultStats: TileStats,
  pixelDiffs: number[],
  t = SWEEP_THRESHOLDS,
): SweepFlag[] {
  const flags: SweepFlag[] = []
  const first = values[0]
  const last = values[values.length - 1]

  const maxDiff = Math.max(...pixelDiffs)
  if (maxDiff < t.deadPixelDiff) {
    flags.push({ kind: 'dead', at: [first, last], detail: `at most ${(maxDiff * 100).toFixed(2)}% of pixels change` })
    return flags
  }

  // An interior sample identical to the first means the range wraps around (angles, offsets).
  const repeat = pixelDiffs.findIndex((d, i) => i > 0 && i < values.length - 1 && d < t.deadPixelDiff)
  if (repeat > 0)
    flags.push({ kind: 'periodic', at: [values[repeat]], detail: `looks identical to ${first} — range wraps` })

  const maxSig = Math.max(...stats.map(s => tileDistance(s, defaultStats)))
  if (maxSig < t.subtleSignature)
    flags.push({ kind: 'subtle', at: [first, last], detail: `barely changes colours or detail (signature Δ ${maxSig.toFixed(3)})` })

  if (defaultStats.dominant < t.collapseDominant - 0.03) {
    const collapsed = values.filter((_, i) => stats[i].dominant >= t.collapseDominant)
    if (collapsed.length)
      flags.push({ kind: 'collapse', at: collapsed, detail: 'near-solid fill' })
  }

  const busy = values.filter((_, i) => stats[i].edge > defaultStats.edge * t.busyEdgeRatio && stats[i].edge > 0.05)
  if (busy.length)
    flags.push({ kind: 'busy', at: busy, detail: `edge density > ${t.busyEdgeRatio}x default` })

  if (stats.length >= 4) {
    const steps = stats.slice(1).map((s, i) => tileDistance(stats[i], s))
    const median = [...steps].sort((a, b) => a - b)[Math.floor(steps.length / 2)]
    const peak = Math.max(...steps)
    const i = steps.indexOf(peak)
    if (peak >= t.jumpMin && peak > median * t.jumpRatio)
      flags.push({ kind: 'jump', at: [values[i], values[i + 1]], detail: `step Δ ${peak.toFixed(2)} vs median ${median.toFixed(2)}` })
  }

  return flags
}

export interface VariableChange {
  name: string
  kind: 'added' | 'removed' | 'changed' | 'same'
  before?: Variable
  after?: Variable
}

export interface TemplateEntryDiff {
  changed: boolean
  /** CSS properties whose value differs (whitespace ignored). */
  cssChanged: string[]
  variables: VariableChange[]
}

const squash = (css?: string) => css?.replace(/\s+/g, ' ').trim()

/** What differs between two versions of one pattern entry. */
export function diffTemplateEntry(before: Template, after: Template): TemplateEntryDiff {
  const cssChanged = [...new Set([...Object.keys(before.template), ...Object.keys(after.template)])]
    .filter(prop => squash(before.template[prop]) !== squash(after.template[prop]))

  const variables = [...new Set([...Object.keys(before.variables), ...Object.keys(after.variables)])]
    .map((name): VariableChange => {
      const b = before.variables[name]
      const a = after.variables[name]
      const kind = !b ? 'added' : !a ? 'removed' : JSON.stringify(b) === JSON.stringify(a) ? 'same' : 'changed'
      return { name, kind, before: b, after: a }
    })

  return {
    changed: cssChanged.length > 0 || variables.some(v => v.kind !== 'same') || before.harmony !== after.harmony,
    cssChanged,
    variables,
  }
}
