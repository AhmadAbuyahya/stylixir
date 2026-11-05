import { describe, expect, it } from 'vitest'
import {
  buildPreviewStyle,
  exportTemplatePatch,
  extractPlaceholders,
  flagSweep,
  inlineVariableInTemplate,
  sampleRange,
  validateAuditDraft,
} from '~/lib/audit'
import templates from '~/lib/templates'

describe('audit helpers', () => {
  it('extracts placeholders from template properties', () => {
    expect(extractPlaceholders({
      'background': 'linear-gradient({colorOne}, {colorTwo})',
      'background-size': '{size}px {size}px',
    })).toEqual(['colorOne', 'colorTwo', 'size'])
  })

  it('reports missing and unused variables', () => {
    const result = validateAuditDraft(
      { background: '{size}px {missing}' },
      {
        size: { type: 'range', value: 10, min: 1, max: 20 },
        orphan: { type: 'range', value: 1, min: 0, max: 2 },
      },
    )
    expect(result.ok).toBe(false)
    expect(result.missingInVariables).toEqual(['missing'])
    expect(result.unusedVariables).toEqual(['orphan'])
  })

  it('builds interpolated preview styles', () => {
    const style = buildPreviewStyle(
      { 'background-color': '{bg}', 'background-size': '{size}px' },
      { bg: '#000', size: 32 },
    )
    expect(style).toEqual({
      'background-color': '#000',
      'background-size': '32px',
    })
  })

  it('inlines a variable default into every placeholder mention', () => {
    const next = inlineVariableInTemplate(
      {
        'background': 'linear-gradient({wedge}deg, {color} 0, #0000 {wedge}%)',
        'background-size': '{size}px',
      },
      'wedge',
      30,
    )
    expect(next).toEqual({
      'background': 'linear-gradient(30deg, {color} 0, #0000 30%)',
      'background-size': '{size}px',
    })
  })

  it('exports a paste-ready templates.ts snippet', () => {
    const slug = 'zigzag'
    const patch = exportTemplatePatch(slug, templates[slug], templates)
    expect(patch).toContain(`'${slug}': {`)
    expect(patch).toContain('background-size')
    expect(patch).toContain('variables: {')
  })
})

describe('audit sweeps', () => {
  const tile = (dominant: number, edge = 0.1) => ({ hist: { a: dominant, b: 1 - dominant }, dominant, edge })

  it('samples a range evenly, snapped to step', () => {
    expect(sampleRange({ type: 'range', value: 1, min: 0, max: 1, step: 0.25 }, 5)).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(sampleRange({ type: 'range', value: 5, min: 0, max: 10, step: 3 }, 3)).toEqual([0, 6, 9])
    expect(sampleRange({ type: 'range', value: 5, min: 0, max: 100 }, 4, [10, 20])).toEqual([10, 13.33, 16.67, 20])
  })

  it('flags dead, periodic, collapse and jump sweeps', () => {
    const kinds = (stats: ReturnType<typeof tile>[], diffs: number[]) =>
      flagSweep([0, 1, 2, 3, 4], stats, tile(0.6), diffs).map(f => f.kind)

    expect(kinds(Array(5).fill(tile(0.6)), [0, 0, 0, 0, 0])).toEqual(['dead'])
    expect(kinds([tile(0.6), tile(0.7), tile(0.6), tile(0.7), tile(0.8)], [0, 0.2, 0, 0.2, 0.3])).toContain('periodic')
    expect(kinds([tile(0.6), tile(0.65), tile(0.7), tile(0.75), tile(0.99, 0.01)], [0, 0.1, 0.2, 0.3, 0.9])).toEqual(['collapse', 'jump'])
  })
})
