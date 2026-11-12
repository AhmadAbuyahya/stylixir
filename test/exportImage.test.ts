import { describe, expect, it } from 'vitest'
import {
  MAX_PIXELS,
  MAX_SIDE,
  SIZE_PRESETS,
  canUsePixelRatio,
  clampDimension,
  exportFilename,
  outputPixels,
  screenSize,
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

  it('sizes "This screen" in physical pixels', () => {
    expect(screenSize(1920, 1080, 1, true)).toEqual({ width: 1920, height: 1080 })
    expect(screenSize(1440, 900, 2, true)).toEqual({ width: 2880, height: 1800 })
    expect(screenSize(390, 844, 3, false)).toEqual({ width: 1170, height: 2532 })
    expect(screenSize(412.5, 915, 2.625, false)).toEqual({ width: 1083, height: 2402 })
  })

  it('turns "This screen" to match the orientation', () => {
    // iOS keeps reporting the portrait size after rotating to landscape.
    expect(screenSize(390, 844, 3, true)).toEqual({ width: 2532, height: 1170 })
    expect(screenSize(1920, 1080, 1, false)).toEqual({ width: 1080, height: 1920 })
  })

  it('shrinks a huge screen to fit the export limits', () => {
    const { width, height } = screenSize(7680, 4320, 2, true)
    expect(width).toBeLessThanOrEqual(MAX_SIDE)
    expect(width * height).toBeLessThanOrEqual(MAX_PIXELS)
    expect(width / height).toBeCloseTo(16 / 9, 2)
    expect(canUsePixelRatio(width, height, 1)).toBe(true)
    expect(screenSize(5120, 1440, 2, true)).toEqual({ width: MAX_SIDE, height: 2160 })
  })
})
