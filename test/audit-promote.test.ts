import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  findMatchingBrace,
  findTemplateEntryRange,
  formatTemplateEntry,
  replaceTemplateEntry,
} from '~/lib/audit-promote'
import templates from '~/lib/templates'

describe('audit promote', () => {
  it('formats a size variable with the size() helper', () => {
    const entry = formatTemplateEntry('demo', {
      template: { 'background-size': '{size}px' },
      variables: {
        size: { type: 'range', value: 40, min: 10, max: 80, step: 2 },
      },
    })
    expect(entry).toContain('size: size(40, 10, 80, 2),')
    expect(entry).toContain('\'background-size\':')
  })

  it('keeps the wild (breaking) flag when formatting', () => {
    const entry = formatTemplateEntry('demo', {
      template: { background: '{angle}deg {size}px' },
      variables: {
        size: { type: 'range', value: 40, min: 10, max: 80, breaking: true },
        angle: { type: 'range', breaking: true, value: 45, min: 0, max: 90, step: 1 },
        weight: { type: 'range', value: 5, min: 1, max: 9 },
      },
    })
    expect(entry).toContain('angle: {\n        type: \'range\',\n        breaking: true,\n        value: 45,')
    expect(entry).not.toContain('size(40')
    expect(entry.match(/breaking: true/g)).toHaveLength(2)
  })

  it('round-trips every wild flag in templates.ts', () => {
    for (const [slug, entry] of Object.entries(templates)) {
      const wild = Object.values(entry.variables).filter(variable => variable.breaking).length
      expect(formatTemplateEntry(slug, entry).match(/breaking: true/g)?.length ?? 0, slug).toBe(wild)
    }
  })

  it('leaves templates.ts untouched when promoting an unchanged pattern', () => {
    const source = readFileSync('src/lib/templates.ts', 'utf8')
    // zigzag mixes '…' and `…` CSS values and has a wild dial, so it covers the quirks promote used to rewrite.
    expect(replaceTemplateEntry(source, 'zigzag', templates.zigzag)).toBe(source)
  })

  it('finds matching braces through template literals with interpolation', () => {
    const interpolation = ['${', 'foo}'].join('')
    const source = `x: { a: \`calc(${interpolation} + {bar})\`, b: { c: 1 } }`
    const open = source.indexOf('{')
    const close = findMatchingBrace(source, open)
    expect(source.slice(open, close + 1)).toBe(`{ a: \`calc(${interpolation} + {bar})\`, b: { c: 1 } }`)
  })

  it('locates an existing pattern entry in templates.ts', () => {
    // Read via replace round-trip on a miniature source
    const mini = `
const templates = {
  'zigzag': {
    template: {
      background: \`linear-gradient({colorOne})\`,
    },
    variables: {
      size: size(100, 20, 200),
      colorOne: { type: 'color', value: '#fff' },
    },
  },

  'other': {
    template: { background: '{bg}' },
    variables: { bg: { type: 'color', value: '#000' } },
  },
}
export default templates
`
    const range = findTemplateEntryRange(mini, 'zigzag')
    expect(range).not.toBeNull()
    expect(mini.slice(range!.start, range!.end)).toContain('\'zigzag\'')
    expect(mini.slice(range!.start, range!.end)).toContain('colorOne')
    expect(mini.slice(range!.start, range!.end)).not.toContain('\'other\'')
  })

  it('replaces a slug entry without touching neighbors', () => {
    const original = templates.zigzag
    const draft = {
      ...original,
      variables: {
        ...original.variables,
        position: {
          type: 'range' as const,
          value: 0.25,
          min: 0,
          max: 1,
          step: 0.01,
        },
      },
    }

    const source = `
const templates: Templates = {
  'zigzag': {
    template: {
      'background-color': '{bgColor}',
    },
    variables: {
      size: size(100, 20, 200),
      position: {
        type: 'range',
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
  },

  'keep_me': {
    template: { background: 'red' },
    variables: {},
  },
}
export default templates
`

    const next = replaceTemplateEntry(source, 'zigzag', draft)
    expect(next).toContain('value: 0.25')
    expect(next).toContain('\'keep_me\'')
    expect(next).toContain('background: \'red\'')
    expect(findTemplateEntryRange(next, 'zigzag')).not.toBeNull()
  })
})
