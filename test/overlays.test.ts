import { describe, expect, it } from 'vitest'
import {
  buildOverlayBackground,
  clampOverlayOpacity,
  overlayPaint,
  overlayPaintAlpha,
  overlaySpread,
} from '~/lib/overlays'

describe('overlay intensity', () => {
  it('clamps opacity to 0–1 and treats half as the classic overlay', () => {
    expect(clampOverlayOpacity(-2)).toBe(0)
    expect(clampOverlayOpacity(1.4)).toBe(1)
    expect(clampOverlayOpacity(0.42)).toBe(0.42)
    expect(overlayPaintAlpha(0.5)).toBe(1)
    expect(overlaySpread(0.5)).toBe(0)
    expect(overlaySpread(1)).toBe(1)
  })

  it('uses the old gradient at 50% and a fuller cover at 100%', () => {
    expect(overlayPaint('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)')
    expect(buildOverlayBackground('opacity', '#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)')
    expect(buildOverlayBackground('radial-gradient-center', '#000000', 0.5))
      .toBe('radial-gradient(circle, transparent, rgb(0, 0, 0))')
    expect(buildOverlayBackground('radial-gradient-center', '#000000', 1))
      .toBe('radial-gradient(circle, transparent, rgb(0, 0, 0) 50%)')
    expect(buildOverlayBackground('linear-gradient-bottom', '#ff0000', 0.5))
      .toBe('linear-gradient(to bottom, transparent, rgb(255, 0, 0))')
    expect(buildOverlayBackground('linear-gradient-bottom', '#ff0000', 0.25))
      .toBe('linear-gradient(to bottom, transparent, rgba(255, 0, 0, 0.5))')
  })

  it('drops the overlay when type is none', () => {
    expect(buildOverlayBackground('none', '#000000', 1)).toBe('none')
  })
})
