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
