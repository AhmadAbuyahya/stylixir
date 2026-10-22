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
