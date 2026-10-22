import { describe, expect, it } from 'vitest'
import {
  MAX_SIDE,
  SIZE_PRESETS,
  canUsePixelRatio,
  clampDimension,
  exportFilename,
  outputPixels,
} from '~/lib/exportImage'

describe('exportImage helpers', () => {
  it('builds a download name from the pattern and size', () => {
    expect(exportFilename('hearts_pattern', 1920, 1080, 'png', 1))
      .toBe('stylixir-hearts_pattern-1920x1080.png')
    expect(exportFilename('stars', 1080, 1080, 'jpeg', 2))
      .toBe('stylixir-stars-1080x1080@2x.jpg')
  })

  it('clamps dimensions to a safe range', () => {
    expect(clampDimension(0)).toBe(1)
    expect(clampDimension(-20)).toBe(1)
    expect(clampDimension(MAX_SIDE + 100)).toBe(MAX_SIDE)
    expect(clampDimension(1920.4)).toBe(1920)
  })

  it('includes a phone lock-screen size', () => {
    expect(SIZE_PRESETS.find(preset => preset.id === 'phone')).toEqual({
      id: 'phone',
      label: 'Phone',
      hint: '1170 × 2532',
      width: 1170,
      height: 2532,
    })
  })

  it('rejects 2x density when the raster would overflow', () => {
    expect(canUsePixelRatio(1920, 1080, 2)).toBe(true)
    expect(canUsePixelRatio(3840, 2160, 1)).toBe(true)
    expect(canUsePixelRatio(3840, 2160, 2)).toBe(false)
    expect(outputPixels(1080, 1080, 1)).toBe(1080 * 1080)
  })
})
