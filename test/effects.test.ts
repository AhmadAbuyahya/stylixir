import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EFFECTS,
  EFFECT_DIALS,
  buildFrame,
  buildSnippet,
  effectsToParams,
  numberTarget,
  parseEffects,
  templateWithVars,
  tileSize,
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
    const effects = { ...DEFAULT_EFFECTS, grain: 0.3, warp: 40, liquid: 0.5, colorMode: 'swap' as const, moveMode: 'spin' as const, shapeHold: ['size', 'step'] }
    const params = effectsToParams(effects)
    expect(parseEffects(key => params[key])).toEqual(effects)

    const clamped = parseEffects(key => ({ fxGrain: '7', fxWarp: '-3', fxColorMode: 'nope' } as Record<string, string>)[key])
    expect(clamped.grain).toBe(EFFECT_DIALS.grain.max)
    expect(clamped.warp).toBe(EFFECT_DIALS.warp.min)
    expect(clamped.colorMode).toBe(DEFAULT_EFFECTS.colorMode)
  })

  it('translates old single-preset motion links into channels', () => {
    const legacy = (params: Record<string, string>) => parseEffects(key => params[key])
    expect(legacy({ fxMotion: 'morph', fxAmount: '0.5' })).toMatchObject({ shape: 0.5, color: 0.5 })
    expect(legacy({ fxMotion: 'breathe' })).toMatchObject({ shape: 0.35, color: 0 })
    expect(legacy({ fxMotion: 'hue' })).toMatchObject({ color: 1, shape: 0 })
    expect(legacy({ fxMotion: 'flow' })).toMatchObject({ liquid: 0.35 })
    // New keys win over a stale preset.
    expect(legacy({ fxMotion: 'breathe', fxShape: '0' }).shape).toBe(0)
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
})

describe('buildFrame', () => {
  it('is a plain interpolated pattern when every effect is off', () => {
    const frame = buildFrame({ template, variables, values, effects: DEFAULT_EFFECTS })
    expect(frame.pattern['background-size']).toBe('100px 100px')
    expect(frame.pattern.inset).toBe('0')
    expect(frame.light).toBeUndefined()
    expect(frame.grain).toBeUndefined()
    expect(frame.overlay).toBeUndefined()
    expect(frame.material).toBeUndefined()
    expect(frame.pattern.filter).toBeUndefined()
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

  it('gives each shape dial its own keyframes and clock, and drops them for a still frame', () => {
    const effects = { ...DEFAULT_EFFECTS, shape: 0.5 }
    const moving = buildFrame({ template, variables, values, effects, name: 'm' })
    expect(moving.css).toContain('@property --sx-size')
    expect(moving.css).toContain('@keyframes m-dial-size')
    expect(moving.css).toContain('@keyframes m-dial-step')
    expect(moving.css).not.toContain('@property --sx-colorOne')
    expect(moving.pattern['--sx-size']).toBe('100')
    expect(moving.pattern['--sx-colorOne']).toBe('#c02942')
    const [size, step] = moving.pattern.animation.split(', ')
    expect(size).toMatch(/^m-dial-size /)
    expect(size.split(' ')[1]).not.toBe(step.split(' ')[1])

    const still = buildFrame({ template, variables, values, effects, animate: false })
    expect(still.css).toBe('')
    expect(still.pattern['background-size']).toBe('100px 100px')
  })

  it('anchors shape motion at the frame centre, keeping the warp bleed', () => {
    const moving = buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, shape: 0.35, warp: 20 } })
    const b = warpBleed({ ...DEFAULT_EFFECTS, warp: 20 })
    expect(moving.pattern.inset).toBe(`-${b}px calc(-50cqw - 2 * ${b}px) calc(-50cqh - 2 * ${b}px) -${b}px`)
    expect(moving.pattern['border-left']).toBe(`calc(50cqw + ${b}px) solid transparent`)
    expect(buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, shape: 0.35 }, animate: false }).pattern['border-left'])
      .toBeUndefined()
  })

  it('holds breaking dials still under shape motion unless wild shapes is on', () => {
    const wildVars: Variables = { ...variables, step: { ...variables.step, breaking: true } }
    const effects = { ...DEFAULT_EFFECTS, shape: 1 }
    const css = (breaking: boolean) => buildFrame({ template, variables: wildVars, values, effects, breaking }).css
    expect(css(false)).not.toContain('dial-step')
    expect(css(true)).toContain('dial-step')
    expect(css(false)).toContain('dial-size')
  })

  it('leaves held dials still', () => {
    const frame = buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, shape: 0.5, shapeHold: ['size'] }, name: 'h' })
    expect(frame.css).not.toContain('h-dial-size')
    expect(frame.css).toContain('h-dial-step')
    expect(frame.pattern['--sx-size']).toBe('100')
    expect(parseEffects(key => ({ fxShapeHold: 'size,bad key,step' } as Record<string, string>)[key]).shapeHold).toEqual(['size', 'step'])
  })

  it('shifts hue through oklch, or swaps colors when asked', () => {
    const twoColors: Variables = { ...variables, colorTwo: { type: 'color', value: '#53777a' } }
    const twoTemplate = { ...template, color: '{colorTwo}' }
    const twoValues = { ...values, colorTwo: '#53777a' }

    const shift = buildFrame({ template: twoTemplate, variables: twoColors, values: twoValues, effects: { ...DEFAULT_EFFECTS, color: 0.5 }, name: 'c' })
    expect(shift.pattern.color).toBe('oklch(from var(--sx-colorTwo) l c calc(h + var(--sx-hue)))')
    expect(shift.css).toContain('@keyframes c-hue')
    expect(shift.pattern.filter).toBeUndefined()
    expect(buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, color: 1 } }).pattern.animation).toContain('linear infinite')

    const swap = buildFrame({ template: twoTemplate, variables: twoColors, values: twoValues, effects: { ...DEFAULT_EFFECTS, color: 0.5, colorMode: 'swap' }, name: 'c' })
    expect(swap.pattern.color).toBe('var(--sx-colorTwo)')
    expect(swap.css).toContain('@property --sx-colorOne')
    expect(swap.css).toMatch(/50% \{\n {4}--sx-colorOne: #53777a;\n {4}--sx-colorTwo: #c02942;/)
    expect(swap.css).toContain('25% {')

    // One color has nothing to trade with, so swap falls back to a hue shift.
    expect(buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, color: 0.5, colorMode: 'swap' }, name: 'c' }).css)
      .toContain('c-hue')
  })

  it('drifts by whole tiles, overhanging the trailing edges', () => {
    const drift = buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, move: 0.5, driftAngle: 315 }, name: 'd' })
    expect(drift.css).toContain('translate: calc(2 * 100px) calc(-1 * calc(2 * 100px));')
    expect(drift.pattern['margin-left']).toBe('calc(-1 * calc(2 * 100px))')
    expect(drift.pattern['margin-bottom']).toBe('calc(-1 * calc(2 * 100px))')
    expect(drift.pattern.animation).toBe('d-drift 8s linear infinite')

    const sway = buildFrame({ template: { background: 'red' }, variables, values, effects: { ...DEFAULT_EFFECTS, move: 0.5, driftAngle: 0 }, name: 'd' })
    expect(sway.pattern.animation).toContain('alternate')
    expect(sway.css).toContain('translate: 15cqmin 0px;')
  })

  it('spins around the frame centre with cover for the diagonal', () => {
    const spin = buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, move: 1, moveMode: 'spin' }, name: 's' })
    expect(spin.pattern.inset).toBe('calc(-1 * calc(0px + 50cqmax))')
    expect(spin.pattern['transform-origin']).toBe('calc(50cqw + calc(0px + 50cqmax)) calc(50cqh + calc(0px + 50cqmax))')
    expect(spin.css).toContain('rotate: 360deg;')
  })

  it('churns the warp for liquid, bringing its own when Warp is off', () => {
    const own = buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, liquid: 0.5 } })
    expect(own.filterMarkup).toContain('scale="40"')
    expect(own.filterMarkup).toContain('<animate attributeName="baseFrequency"')
    expect(own.css).toBe('')
    expect(buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, liquid: 0.5 }, animate: false }).filterMarkup).toBe('')
    expect(buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, liquid: 0.5, warp: 30 } }).filterMarkup).toContain('scale="30"')
  })

  it('stacks channels into one animation list', () => {
    const all = buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, shape: 0.35, color: 0.35, move: 0.35, liquid: 0.35 }, name: 'x' })
    expect(all.pattern.animation.split(', ').map(entry => entry.split(' ')[0]))
      .toEqual(['x-dial-size', 'x-dial-step', 'x-hue', 'x-drift'])
  })

  it('skips an overlay that paints nothing', () => {
    const overlay = { 'background': 'none', 'backdrop-filter': 'blur(0px)' }
    expect(buildFrame({ template, variables, values, effects: DEFAULT_EFFECTS, overlay }).overlay).toBeUndefined()
    expect(buildFrame({ template, variables, values, effects: DEFAULT_EFFECTS, overlay: { ...overlay, 'backdrop-filter': 'blur(4px)' } }).overlay)
      .toBeDefined()
  })
})

describe('tileSize', () => {
  it('takes the largest layer per axis and gives up on unsized layers', () => {
    expect(tileSize('100px 100px')).toEqual(['100px', '100px'])
    expect(tileSize('calc(var(--sx-size) * 1px) calc(2 * 3px), 10px 20px'))
      .toEqual(['max(calc(var(--sx-size) * 1px), 10px)', 'max(calc(2 * 3px), 20px)'])
    expect(tileSize('100px')).toBeUndefined()
    expect(tileSize('50% 50%')).toBeUndefined()
    expect(tileSize(undefined)).toBeUndefined()
  })
})

describe('buildSnippet', () => {
  it('emits one element per active layer plus the filter and motion rules', () => {
    const frame = buildFrame({
      template,
      variables,
      values,
      effects: { ...DEFAULT_EFFECTS, grain: 0.2, warp: 20, color: 1 },
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

describe('materials', () => {
  const frame = (effects: Partial<typeof DEFAULT_EFFECTS>, options: { animate?: boolean } = {}) =>
    buildFrame({ template, variables, values, effects: { ...DEFAULT_EFFECTS, ...effects }, filterId: 'f', ...options })

  it('changes nothing at the default or at zero strength', () => {
    const plain = frame({})
    expect(frame({ materialStrength: 1 })).toEqual(plain)
    expect(frame({ material: 'riso', materialStrength: 0 })).toEqual(plain)
  })

  it('gives paper and linen a blended layer and leaves the pattern alone', () => {
    const paper = frame({ material: 'paper' })
    expect(paper.material?.['background-image']).toMatch(/^url\("data:image\/svg\+xml,.*feDiffuseLighting/)
    expect(paper.material?.['background-size']).toBe('512px 512px')
    expect(paper.material?.['mix-blend-mode']).toBe('hard-light')
    expect(paper.material?.opacity).toBe('0.5')
    expect(paper.pattern.filter).toBeUndefined()
    expect(paper.filterMarkup).toBe('')

    const linen = frame({ material: 'linen', materialStrength: 0.8 })
    expect(linen.material?.['background-image']).toContain('repeating-linear-gradient(90deg')
    expect(linen.material?.opacity).toBe('0.8')
    expect(linen.filterMarkup).toBe('')
  })

  it('embosses through a lighting filter on the pattern, overhanging the edges', () => {
    const embossed = frame({ material: 'embossed' })
    expect(embossed.material).toBeUndefined()
    expect(embossed.pattern.filter).toBe('url(#f-material)')
    expect(embossed.pattern.inset).toBe('-4px')
    expect(embossed.filterMarkup).toContain('<filter id="f-material"')
    expect(embossed.filterMarkup).toContain('feDiffuseLighting')
    expect(embossed.filterMarkup).toContain('luminanceToAlpha')
  })

  it('prints riso as offset ink plates plus an ink texture layer', () => {
    const riso = frame({ material: 'riso' })
    expect(riso.pattern.filter).toBe('url(#f-material)')
    expect(riso.filterMarkup.match(/<feOffset/g)).toHaveLength(3)
    expect(riso.filterMarkup).toContain('dx="2"')
    expect(riso.material?.['mix-blend-mode']).toBe('screen')
  })

  it('chains after warp, adding the bleeds, and survives a still frame', () => {
    const both = frame({ material: 'embossed', warp: 40 })
    expect(both.pattern.filter).toBe('url(#f) url(#f-material)')
    expect(both.pattern.inset).toBe(`-${warpBleed({ ...DEFAULT_EFFECTS, warp: 40 }) + 4}px`)
    expect(both.filterMarkup.indexOf('id="f"')).toBeLessThan(both.filterMarkup.indexOf('id="f-material"'))

    const still = frame({ material: 'riso', liquid: 0.5, shape: 0.5 }, { animate: false })
    expect(still.pattern.filter).toBe('url(#f-material)')
    expect(still.css).toBe('')
  })

  it('round-trips through the URL and ignores unknown materials', () => {
    const effects = { ...DEFAULT_EFFECTS, material: 'linen' as const, materialStrength: 0.7 }
    const params = effectsToParams(effects)
    expect(params.fxMaterial).toBe('linen')
    expect(params.fxMaterialStrength).toBe(0.7)
    expect(parseEffects(key => params[key])).toEqual(effects)
    expect(parseEffects(key => ({ fxMaterial: 'velvet' } as Record<string, string>)[key]).material).toBe('none')
  })

  it('puts its layer and filter in the snippet', () => {
    const riso = buildSnippet(frame({ material: 'riso' }))
    expect(riso).toContain('<div class="background__material"></div>')
    expect(riso).toContain('<filter id="f-material"')
    expect(riso).toContain('filter: url(#f-material);')
    expect(buildSnippet(frame({ material: 'embossed' }))).not.toContain('background__material')
  })
})
