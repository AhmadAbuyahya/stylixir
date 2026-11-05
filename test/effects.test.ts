import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EFFECTS,
  EFFECT_DIALS,
  buildFrame,
  buildSnippet,
  colorTarget,
  effectsToParams,
  numberTarget,
  parseEffects,
  templateWithVars,
  warpBleed,
} from '~/lib/effects'
import type { Variables } from '~/types'

const variables: Variables = {
  size: { type: 'range', value: 100, min: 20, max: 200 },
  step: { type: 'range', value: 4, min: 2, max: 8 },
  colorOne: { type: 'color', value: '#c02942' },
}

const template = {
  'background': 'conic-gradient(from {size}deg, {colorOne} 0 {step}%, #0000 0) calc({size}px/-{step}) 0',
  'background-size': '{size}px {size}px',
}

const values = { size: 100, step: 4, colorOne: '#c02942' }

describe('effect params', () => {
  it('round-trips through the URL and clamps out-of-range values', () => {
    const effects = { ...DEFAULT_EFFECTS, grain: 0.3, warp: 40, motion: 'flow' as const }
    const params = effectsToParams(effects)
    expect(parseEffects(key => params[key])).toEqual(effects)

    const clamped = parseEffects(key => ({ fxGrain: '7', fxWarp: '-3', fxMotion: 'spin' } as Record<string, string>)[key])
    expect(clamped.grain).toBe(EFFECT_DIALS.grain.max)
    expect(clamped.warp).toBe(EFFECT_DIALS.warp.min)
    expect(clamped.motion).toBe(DEFAULT_EFFECTS.motion)
  })
})

describe('templateWithVars', () => {
  it('folds units into calc and keeps signs', () => {
    const rewritten = templateWithVars(template, variables)
    expect(rewritten['background-size']).toBe('calc(var(--sx-size) * 1px) calc(var(--sx-size) * 1px)')
    expect(rewritten.background).toBe(
      'conic-gradient(from calc(var(--sx-size) * 1deg), var(--sx-colorOne) 0 calc(var(--sx-step) * 1%), #0000 0) '
      + 'calc(calc(var(--sx-size) * 1px)/calc(var(--sx-step) * -1)) 0',
    )
  })

  it('leaves unknown placeholders alone', () => {
    expect(templateWithVars({ color: '{nope}' }, variables).color).toBe('{nope}')
  })
})

describe('motion targets', () => {
  it('swings numbers within their range', () => {
    const near = numberTarget('size', variables.size, 195, 0.5)
    expect(near).toBeGreaterThanOrEqual(20)
    expect(near).toBeLessThanOrEqual(200)
    expect(near).not.toBe(195)
  })

  it('rotates colors and keeps alpha', () => {
    expect(colorTarget('colorOne', '#c02942', 0.5)).not.toBe('#c02942')
    expect(colorTarget('colorOne', '#c0294280', 0.5)).toHaveLength(9)
  })
})

describe('buildFrame', () => {
  it('is a plain interpolated pattern when every effect is off', () => {
    const frame = buildFrame({ template, variables, values, effects: DEFAULT_EFFECTS })
    expect(frame.pattern['background-size']).toBe('100px 100px')
    expect(frame.pattern.inset).toBe('0')
    expect(frame.light).toBeUndefined()
    expect(frame.grain).toBeUndefined()
    expect(frame.overlay).toBeUndefined()
    expect(frame.filterMarkup).toBe('')
    expect(frame.css).toBe('')
  })

  it('oversizes the pattern for warp and references the filter', () => {
    const effects = { ...DEFAULT_EFFECTS, warp: 60 }
    const frame = buildFrame({ template, variables, values, effects, filterId: 'w' })
    expect(frame.pattern.inset).toBe(`-${warpBleed(effects)}px`)
    expect(frame.pattern.filter).toBe('url(#w)')
    expect(frame.filterMarkup).toContain('id="w"')
    expect(frame.filterMarkup).not.toContain('<animate')
  })

  it('registers dials and keyframes for morph, and drops them for a still frame', () => {
    const effects = { ...DEFAULT_EFFECTS, motion: 'morph' as const }
    const moving = buildFrame({ template, variables, values, effects, name: 'm' })
    expect(moving.css).toContain('@property --sx-size')
    expect(moving.css).toContain('@keyframes m-dials')
    expect(moving.pattern['--sx-size']).toBe('100')
    expect(moving.pattern.animation).toContain('m-dials')

    const still = buildFrame({ template, variables, values, effects, animate: false })
    expect(still.css).toBe('')
    expect(still.pattern['background-size']).toBe('100px 100px')
  })

  it('only animates the warp for flow', () => {
    const flow = buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, motion: 'flow', warp: 30 } })
    expect(flow.filterMarkup).toContain('<animate attributeName="baseFrequency"')
    expect(flow.css).toBe('')
  })

  it('skips an overlay that paints nothing', () => {
    const overlay = { 'background': 'none', 'backdrop-filter': 'blur(0px)' }
    expect(buildFrame({ template, variables, values, effects: DEFAULT_EFFECTS, overlay }).overlay).toBeUndefined()
    expect(buildFrame({ template, variables, values, effects: DEFAULT_EFFECTS, overlay: { ...overlay, 'backdrop-filter': 'blur(4px)' } }).overlay)
      .toBeDefined()
  })
})

describe('buildSnippet', () => {
  it('emits one element per active layer plus the filter and motion rules', () => {
    const frame = buildFrame({
      template,
      variables,
      values,
      effects: { ...DEFAULT_EFFECTS, grain: 0.2, warp: 20, motion: 'hue' },
      overlay: { 'background': 'radial-gradient(circle, transparent, black)', 'backdrop-filter': 'blur(0px)' },
    })
    const snippet = buildSnippet(frame)
    expect(snippet).toContain('<div class="background__pattern"></div>')
    expect(snippet).toContain('<div class="background__overlay"></div>')
    expect(snippet).toContain('<div class="background__grain"></div>')
    expect(snippet).not.toContain('background__light')
    expect(snippet).toContain('<filter id="stylixir-warp"')
    expect(snippet).toContain('@keyframes stylixir-hue')
    expect(snippet).toContain('prefers-reduced-motion')
  })
})
