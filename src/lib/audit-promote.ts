import type { Template, Variable } from '../types'

function escapeTemplateLiteral(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

/** Always quoted, as nearly every key in templates.ts is. */
function formatCssPropertyKey(key: string) {
  return `'${key}'`
}

function formatVariableBlock(name: string, variable: Variable): string {
  if (name === 'size' && variable.type === 'range' && !variable.breaking) {
    const step = variable.step !== undefined ? `, ${variable.step}` : ''
    return `      size: size(${variable.value}, ${variable.min}, ${variable.max}${step}),`
  }

  if (variable.type === 'color') {
    const lines = [
      `      ${name}: {`,
      '        type: \'color\',',
      `        value: '${variable.value}',`,
    ]
    if (variable.role)
      lines.push(`        role: '${variable.role}',`)
    lines.push('      },')
    return lines.join('\n')
  }

  const lines = [
    `      ${name}: {`,
    `        type: '${variable.type}',`,
  ]
  // Same spot templates.ts uses, so a promote doesn't reshuffle untouched dials.
  if (variable.breaking)
    lines.push('        breaking: true,')
  lines.push(`        value: ${variable.value},`)

  if (variable.min !== undefined)
    lines.push(`        min: ${variable.min},`)
  if (variable.max !== undefined)
    lines.push(`        max: ${variable.max},`)
  if (variable.step !== undefined)
    lines.push(`        step: ${variable.step},`)
  if (variable.role)
    lines.push(`        role: '${variable.role}',`)

  lines.push('      },')
  return lines.join('\n')
}

/** Formats one pattern as a `templates.ts` object entry (including trailing comma). */
export function formatTemplateEntry(slug: string, draft: Template): string {
  const templateBlock = Object.entries(draft.template)
    .map(([key, value]) => {
      // templates.ts quotes one-line CSS with '…' and multi-line CSS with `…`; match it so promotes stay minimal.
      const css = /[\n'\\`]|\$\{/.test(value) ? `\`${escapeTemplateLiteral(value)}\`` : `'${value}'`
      return `      ${formatCssPropertyKey(key)}: ${css},`
    })
    .join('\n')

  const variablesBlock = Object.entries(draft.variables)
    .map(([key, variable]) => formatVariableBlock(key, variable))
    .join('\n')

  const harmonyLine = draft.harmony ? `\n    harmony: '${draft.harmony}',` : ''

  return [
    `  '${slug}': {`,
    '    template: {',
    templateBlock,
    '    },',
    harmonyLine,
    '    variables: {',
    variablesBlock,
    '    },',
    '  },',
  ].filter(line => line !== '').join('\n')
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Finds the character range of `'slug': { ... },` in templates.ts source.
 * Handles strings, template literals (with `${}`), and comments.
 */
export function findTemplateEntryRange(
  source: string,
  slug: string,
): { start: number; end: number } | null {
  const re = new RegExp(`(['"])${escapeRegExp(slug)}\\1\\s*:\\s*\\{`)
  const match = re.exec(source)
  if (!match)
    return null

  const start = match.index
  const openBrace = match.index + match[0].length - 1
  const closeBrace = findMatchingBrace(source, openBrace)
  if (closeBrace < 0)
    return null

  let end = closeBrace + 1
  while (end < source.length && /\s/.test(source[end]))
    end++
  if (source[end] === ',')
    end++

  return { start, end }
}

export function findMatchingBrace(source: string, openIndex: number): number {
  let i = openIndex
  let depth = 0
  type Mode = 'code' | 'sq' | 'dq' | 'bt'
  let mode: Mode = 'code'
  // When inside a template literal `${...}`, track brace depth of the expression.
  const exprStack: number[] = []

  while (i < source.length) {
    const c = source[i]
    const next = source[i + 1]

    if (mode === 'code') {
      if (c === '/' && next === '/') {
        i += 2
        while (i < source.length && source[i] !== '\n')
          i++
        continue
      }
      if (c === '/' && next === '*') {
        i += 2
        while (i < source.length && !(source[i] === '*' && source[i + 1] === '/'))
          i++
        i += 2
        continue
      }
      if (c === '\'') {
        mode = 'sq'
        i++
        continue
      }
      if (c === '"') {
        mode = 'dq'
        i++
        continue
      }
      if (c === '`') {
        mode = 'bt'
        i++
        continue
      }
      if (c === '{') {
        if (exprStack.length)
          exprStack[exprStack.length - 1]++
        else
          depth++
        i++
        continue
      }
      if (c === '}') {
        if (exprStack.length) {
          exprStack[exprStack.length - 1]--
          if (exprStack[exprStack.length - 1] === 0) {
            exprStack.pop()
            mode = 'bt'
          }
          i++
          continue
        }
        depth--
        if (depth === 0)
          return i
        i++
        continue
      }
      i++
      continue
    }

    if (mode === 'sq') {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === '\'')
        mode = 'code'
      i++
      continue
    }

    if (mode === 'dq') {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === '"')
        mode = 'code'
      i++
      continue
    }

    // template literal body
    if (c === '\\') {
      i += 2
      continue
    }
    if (c === '`') {
      mode = 'code'
      i++
      continue
    }
    if (c === '$' && next === '{') {
      exprStack.push(1)
      mode = 'code'
      i += 2
      continue
    }
    i++
  }

  return -1
}

/** Replaces an existing slug entry, or appends before the closing `}` of the templates object. */
export function replaceTemplateEntry(
  source: string,
  slug: string,
  draft: Template,
): string {
  const entry = formatTemplateEntry(slug, draft)
  const range = findTemplateEntryRange(source, slug)

  if (range) {
    // Drop the entry's own indent, which the formatted entry brings back.
    const before = source.slice(0, range.start).replace(/[ \t]+$/, '')
    const after = source.slice(range.end)
    const prefix = before.endsWith('\n') ? '' : '\n'
    const suffix = after.startsWith('\n') ? '' : '\n'
    return `${before}${prefix}${entry}${suffix}${after}`
  }

  const anchor = /\n\}\s*\nexport default templates/
  const m = anchor.exec(source)
  if (!m)
    throw new Error('Could not find templates object closing brace')

  return `${source.slice(0, m.index)}\n\n${entry}${source.slice(m.index)}`
}
