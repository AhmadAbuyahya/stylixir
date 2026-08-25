import { describe, expect, it } from 'vitest'
import { hueDistance, paletteMetrics, rollTemplatePalette } from '~/lib/palette'
import templates from '~/lib/templates'

function rngFrom(seed: number) {
  let s = seed % 2147483647
  if (s <= 0)
    s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

describe('rollTemplatePalette', () => {
  it('returns a hex for every color key', () => {
    Object.values(templates).forEach((template) => {
      const palette = rollTemplatePalette(template, rngFrom(42))
      Object.entries(template.variables).forEach(([key, variable]) => {
        if (variable.type === 'color')
          expect(palette[key]).toMatch(/^#[0-9a-f]{6}$/i)
      })
    })
  })

  it('keeps 3d ramps in one family with stepped lightness', () => {
    const palette = rollTemplatePalette(templates.overlapping_cubes, rngFrom(9))
    const dark = paletteMetrics(palette.colorDark)
    const mid = paletteMetrics(palette.colorMid)
    const light = paletteMetrics(palette.colorLight)

    expect(hueDistance(dark.h, mid.h)).toBeLessThan(16)
    expect(hueDistance(mid.h, light.h)).toBeLessThan(16)
    expect(dark.l).toBeLessThan(mid.l)
    expect(mid.l).toBeLessThan(light.l)
  })

  it('gives figure/ground pairs enough lightness contrast', () => {
    const palette = rollTemplatePalette(templates.zigzag, rngFrom(21))
    const delta = Math.abs(
      paletteMetrics(palette.bgColor).l - paletteMetrics(palette.colorOne).l,
    )
    expect(delta).toBeGreaterThan(25)
  })

  it('treats curved_lines colorTwo as the ground', () => {
    const palette = rollTemplatePalette(templates.curved_lines, rngFrom(7))
    const ground = paletteMetrics(palette.colorTwo).l
    expect(ground < 22 || ground > 85).toBe(true)
  })

  it('avoids dumping every flower color into the same lightness band', () => {
    const palette = rollTemplatePalette(templates.geometric_flowers, rngFrom(3))
    const lights = Object.values(palette).map(hex => paletteMetrics(hex).l)
    expect(Math.max(...lights) - Math.min(...lights)).toBeGreaterThan(20)
  })
})
