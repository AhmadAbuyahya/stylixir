import { describe, expect, it } from 'vitest'
import { DEFAULT_EFFECTS, EFFECT_DIALS } from '~/lib/effects'
import { defaultVariables, randomVariables } from '~/lib/pattern'
import { DEFAULT_OVERLAY, type Look, decodeRecipe, encodeRecipe, lookFromParams } from '~/lib/recipe'
import templates from '~/lib/templates'

function atDefaults(slug: string): Look {
  return {
    template: slug,
    values: defaultVariables(templates[slug].variables),
    overlay: { ...DEFAULT_OVERLAY },
    effects: { ...DEFAULT_EFFECTS },
  }
}

function customised(slug: string): Look {
  return {
    template: slug,
    values: randomVariables(templates[slug], { breaking: true }),
    overlay: { overlayType: 'linear-gradient-top', overlayColor: '#1a2b3c', overlayOpacity: 0.72, overlayBlur: 4 },
    effects: { ...DEFAULT_EFFECTS, grain: 0.3, light: 0.25, move: 0.4, moveMode: 'spin', colorMode: 'swap', shapeHold: ['size', 'colorOne'] },
  }
}

describe('recipe', () => {
  it('round-trips every template at its defaults as little more than the slug', () => {
    for (const slug of Object.keys(templates)) {
      const recipe = encodeRecipe(atDefaults(slug))
      expect(recipe).toBe(`1.${slug}`)
      expect(decodeRecipe(recipe)).toEqual(atDefaults(slug))
    }
  })

  it('round-trips non-default dials, overlay and effects', () => {
    for (const slug of Object.keys(templates)) {
      const look = customised(slug)
      const recipe = encodeRecipe(look)
      expect(recipe, slug).toMatch(/^[\w.*-]+$/)
      expect(encodeURIComponent(recipe)).toBe(recipe)
      expect(new URLSearchParams({ p: recipe }).toString()).toBe(`p=${recipe}`)
      expect(decodeRecipe(recipe), slug).toEqual(look)
    }
  })

  it('returns nothing for garbage, truncated input, unknown versions and unknown slugs', () => {
    const recipe = encodeRecipe(customised('zigzag'))
    for (const bad of [undefined, null, 42, ['1.zigzag'], '', '...', '1', '1.', '2.zigzag', '1.nope', '1.ZIGZAG', '1.__proto__', '1.constructor', '1.hasOwnProperty', '%%%', recipe.slice(0, 3)])
      expect(decodeRecipe(bad), String(bad)).toBeUndefined()
    // A cut-off body still loads the template, keeping whatever parsed cleanly.
    for (let end = 9; end < recipe.length; end++)
      expect(decodeRecipe(recipe.slice(0, end))?.template).toBe('zigzag')
    expect(decodeRecipe('1.zigzag.0-*ZZ_ot-*')).toEqual(atDefaults('zigzag'))
  })

  it('ignores unknown keys and validates values like the old params', () => {
    const look = decodeRecipe('1.zigzag.99-5_zz-1_Bogus-3_0-notanumber_ot-sideways_oc-xyz_ot-*5F*5Fproto*5F*5F')
    expect(look).toEqual(atDefaults('zigzag'))
  })

  it('clamps out-of-range values', () => {
    const look = decodeRecipe('1.zigzag.Grain-7_Warp--3_Speed-1000_oo-4_ob-500_ColorMode-nope')!
    expect(look.effects.grain).toBe(EFFECT_DIALS.grain.max)
    expect(look.effects.warp).toBe(EFFECT_DIALS.warp.min)
    expect(look.effects.speed).toBe(EFFECT_DIALS.speed.max)
    expect(look.effects.colorMode).toBe(DEFAULT_EFFECTS.colorMode)
    expect(look.overlay.overlayOpacity).toBe(1)
    expect(look.overlay.overlayBlur).toBe(20)
  })

  it('reads an old per-dial link as the same look it loaded before', () => {
    const slug = 'zigzag'
    const keys = Object.keys(templates[slug].variables)
    const colorKey = keys.find(key => templates[slug].variables[key].type === 'color')!
    const numberKey = keys.find(key => templates[slug].variables[key].type !== 'color')!
    const old = new URLSearchParams({
      template: slug,
      [colorKey]: 'abcdef',
      [numberKey]: '7.5',
      overlayType: 'opacity',
      overlayColor: '123456',
      overlayOpacity: '0.3',
      overlayBlur: '2',
      fxGrain: '0.4',
      fxColorMode: 'swap',
      fxShapeHold: 'size',
      fxMotion: 'morph',
      fxAmount: '0.6',
    })
    const look = lookFromParams(key => old.get(key) || undefined, atDefaults(Object.keys(templates)[0]))
    expect(look).toEqual({
      template: slug,
      values: { ...defaultVariables(templates[slug].variables), [colorKey]: '#abcdef', [numberKey]: 7.5 },
      overlay: { overlayType: 'opacity', overlayColor: '#123456', overlayOpacity: 0.3, overlayBlur: 2 },
      effects: { ...DEFAULT_EFFECTS, grain: 0.4, colorMode: 'swap', shapeHold: ['size'], shape: 0.6, color: 0.6 },
    })
    expect(decodeRecipe(encodeRecipe(look))).toEqual(look)
  })

  it('keeps a typical customised link short', () => {
    // A shuffled roll with a finish on it; every template, so the longest dial list counts too.
    for (const slug of Object.keys(templates)) {
      const look = { ...atDefaults(slug), values: randomVariables(templates[slug]), effects: { ...DEFAULT_EFFECTS, grain: 0.3, move: 0.35 } }
      expect(encodeRecipe(look).length, slug).toBeLessThan(150)
    }
  })
})
