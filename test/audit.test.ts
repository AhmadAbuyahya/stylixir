import { describe, expect, it } from 'vitest'
import {
  buildPreviewStyle,
  cloneTemplateEntry,
  diffTemplateEntry,
  exportTemplatePatch,
  extractPlaceholders,
  flagSweep,
  inlineVariableInTemplate,
  parseLiteral,
  replacedSegment,
  sampleRange,
  suggestVariableName,
  validateAuditDraft,
} from '~/lib/audit'
import templates from '~/lib/templates'
import { usePatternAudit } from '~/composables/usePatternAudit'

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

describe('diffTemplateEntry', () => {
  const entry = templates.zigzag

  it('reports no change for identical entries, ignoring CSS whitespace', () => {
    const copy = cloneTemplateEntry(entry)
    copy.template['background-size'] = '  {size}px   {size}px '
    expect(diffTemplateEntry(entry, copy).changed).toBe(false)
  })

  it('reports changed, removed and added variables and CSS', () => {
    const after = cloneTemplateEntry(entry)
    after.variables.width = { ...after.variables.width, min: 70 }
    after.template = inlineVariableInTemplate(after.template, 'position', 0.5)
    delete after.variables.position
    after.variables.extra = { type: 'range', value: 1, min: 0, max: 2 }

    const diff = diffTemplateEntry(entry, after)
    const kinds = Object.fromEntries(diff.variables.map(v => [v.name, v.kind]))
    expect(diff.changed).toBe(true)
    expect(diff.cssChanged).toEqual(['background-position'])
    expect(kinds).toMatchObject({ width: 'changed', position: 'removed', extra: 'added', size: 'same' })
  })
})

describe('making dials from CSS values', () => {
  it('reads a number and its unit into a dial', () => {
    expect(parseLiteral('45deg')).toEqual({ number: '45', unit: 'deg', variable: { type: 'range', value: 45, min: 0, max: 360, step: 1 } })
    expect(parseLiteral(' 37.5% ')).toMatchObject({ number: '37.5', unit: '%', variable: { value: 37.5, min: 0, max: 100, step: 0.1 } })
    expect(parseLiteral('0.25')).toMatchObject({ variable: { value: 0.25, min: 0, max: 1, step: 0.01 } })
    expect(parseLiteral('12px')).toMatchObject({ variable: { value: 12, min: 0, max: 24, step: 1 } })
    expect(parseLiteral('-8px')).toMatchObject({ variable: { value: -8, min: -16, max: 0 } })
    expect(parseLiteral('{size}')).toBeNull()
    expect(parseLiteral('calc(2px)')).toBeNull()
  })

  it('suggests an unused name from the unit', () => {
    expect(suggestVariableName('deg', ['angle', 'angle2'])).toBe('angle3')
    expect(suggestVariableName('%', [])).toBe('stop')
    expect(suggestVariableName('', [])).toBe('amount')
  })

  it('finds what a placeholder was typed over', () => {
    expect(replacedSegment('rotate(45deg)', 'rotate({angle}deg)')).toEqual({ removed: '45', inserted: '{angle}' })
  })

  it('turns a selected number into a dial, keeping the unit, or links it to an existing one', () => {
    const audit = usePatternAudit()
    const css = 'linear-gradient(45deg, red 30%, blue 0)'
    audit.draft.value = { template: { background: css }, variables: {} }
    const at = css.indexOf('45deg')
    expect(audit.convertToVariable('background', at, at + 5, 'angle')).toBe('created')
    expect(audit.draft.value.template.background).toBe('linear-gradient({angle}deg, red 30%, blue 0)')
    expect(audit.draft.value.variables.angle).toEqual({ type: 'range', value: 45, min: 0, max: 360, step: 1 })

    const stop = audit.draft.value.template.background.indexOf('30%')
    expect(audit.convertToVariable('background', stop, stop + 3, 'angle')).toBe('linked')
    expect(audit.draft.value.template.background).toBe('linear-gradient({angle}deg, red {angle}%, blue 0)')
    expect(Object.keys(audit.draft.value.variables)).toEqual(['angle'])
  })

  it('creates one dial when typing ends, not one per keystroke', () => {
    const audit = usePatternAudit()
    const before = 'rotate(45deg)'
    audit.draft.value = { template: { transform: before }, variables: {} }
    for (const typed of ['{}', '{a}', '{an}', '{ang}', '{angl}', '{angle}'])
      audit.updateTemplateProperty('transform', `rotate(${typed}deg)`)
    expect(audit.draft.value.variables).toEqual({})

    expect(audit.commitTemplateProperty('transform', before)).toEqual(['angle'])
    expect(audit.draft.value.variables).toEqual({ angle: { type: 'range', value: 45, min: 0, max: 360, step: 1 } })
  })
})
