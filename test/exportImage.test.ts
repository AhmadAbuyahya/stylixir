import { describe, expect, it } from 'vitest'
import {
  MAX_PIXELS,
  MAX_SIDE,
  SIZE_PRESETS,
  canUsePixelRatio,
  clampDimension,
  exportFilename,
  outputPixels,
  renderSize,
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

  it('includes a phone lock-screen size, laid out at phone scale', () => {
    expect(SIZE_PRESETS.find(preset => preset.id === 'phone')).toEqual({
      id: 'phone',
      label: 'Phone',
      hint: '1170 × 2532',
      width: 390,
      height: 844,
      scale: 3,
    })
  })

  it('labels every preset with the size of the file it makes', () => {
    for (const preset of SIZE_PRESETS) {
      const { width, height } = renderSize(preset.width, preset.height, preset.scale)
      expect(preset.hint).toBe(`${width} × ${height}`)
    }
  })

  it('truncates fractional render sizes like the canvas does', () => {
    expect(renderSize(412, 915, 2.625)).toEqual({ width: 1081, height: 2401 })
    expect(renderSize(390, 844, 3)).toEqual({ width: 1170, height: 2532 })
  })

  it('rejects 2x density when the raster would overflow', () => {
    expect(canUsePixelRatio(1920, 1080, 2)).toBe(true)
    expect(canUsePixelRatio(3840, 2160, 1)).toBe(true)
    expect(canUsePixelRatio(3840, 2160, 2)).toBe(false)
    expect(outputPixels(1080, 1080, 1)).toBe(1080 * 1080)
  })

  it('lays "This screen" out at its CSS size and renders at its pixel ratio', () => {
    expect(screenSize(1920, 1080, 1, true)).toEqual({ width: 1920, height: 1080, scale: 1 })
    expect(screenSize(1440, 900, 2, true)).toEqual({ width: 1440, height: 900, scale: 2 })
    expect(screenSize(390, 844, 3, false)).toEqual({ width: 390, height: 844, scale: 3 })
    expect(screenSize(412, 915, 2.625, false)).toEqual({ width: 412, height: 915, scale: 2.625 })
    expect(renderSize(1440, 900, 2)).toEqual({ width: 2880, height: 1800 })
  })

  it('turns "This screen" to match the orientation', () => {
    // iOS keeps reporting the portrait size after rotating to landscape.
    expect(screenSize(390, 844, 3, true)).toEqual({ width: 844, height: 390, scale: 3 })
    expect(screenSize(1920, 1080, 1, false)).toEqual({ width: 1080, height: 1920, scale: 1 })
  })

  it('lowers the ratio of a huge screen to fit the export limits', () => {
    const big = screenSize(7680, 4320, 2, true)
    expect(big).toMatchObject({ width: 7680, height: 4320 })
    const { width, height } = renderSize(big.width, big.height, big.scale)
    expect(width).toBe(5461)
    expect(width * height).toBeLessThanOrEqual(MAX_PIXELS)
    const wide = screenSize(5120, 1440, 2, true)
    expect(wide.scale).toBe(1.5)
    expect(renderSize(wide.width, wide.height, wide.scale)).toEqual({ width: MAX_SIDE, height: 2160 })
  })

  it('never gives a screen ratio the renderer would refuse', () => {
    // A refused ratio makes renderPatternBlob fall back to 1×, so the labels would lie.
    for (const [w, h] of [[7680, 4320], [5120, 1440], [6016, 3384], [3440, 1440], [4096, 2304]]) {
      for (const dpr of [1, 1.25, 1.5, 2, 2.625, 3]) {
        const s = screenSize(w, h, dpr, true)
        expect(canUsePixelRatio(s.width, s.height, s.scale)).toBe(true)
      }
    }
  })
})
