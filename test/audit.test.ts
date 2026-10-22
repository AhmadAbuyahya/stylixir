import { describe, expect, it } from 'vitest'
import {
  buildPreviewStyle,
  exportTemplatePatch,
  extractPlaceholders,
  inlineVariableInTemplate,
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
