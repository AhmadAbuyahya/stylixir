import tinycolor from 'tinycolor2'

export const overlayTypes = {
  'none': {
    type: 'none',
    preview: 'none',
  },
  'opacity': {
    type: 'opacity',
    preview: '#00000050',
  },
  'linear-gradient-top': {
    type: 'linear',
    direction: 'to top',
    preview: 'linear-gradient(to top, transparent, black)',
  },
  'linear-gradient-right': {
    type: 'linear',
    direction: 'to right',
    preview: 'linear-gradient(to right, transparent, black)',
  },
  'linear-gradient-bottom': {
    type: 'linear',
    direction: 'to bottom',
    preview: 'linear-gradient(to bottom, transparent, black)',
  },
  'linear-gradient-left': {
    type: 'linear',
    direction: 'to left',
    preview: 'linear-gradient(to left, transparent, black)',
  },
  'radial-gradient-center': {
    type: 'radial',
    position: 'circle',
    start: 'transparent',
    end: 'color',
    preview: 'radial-gradient(circle, transparent, black)',
  },
  'radial-gradient-center-out': {
    type: 'radial',
    position: 'circle',
    start: 'color',
    end: 'transparent',
    preview: 'radial-gradient(circle, black, transparent)',
  },
  'linear-gradient-inner': {
    type: 'inner',
    direction: 'to left',
    preview: 'linear-gradient(to left, black, transparent, black)',
  },
  'linear-gradient-outer': {
    type: 'outer',
    direction: 'to left',
    preview: 'linear-gradient(to left, transparent, black, transparent)',
  },
  'linear-gradient-inner-horizontal': {
    type: 'inner',
    direction: 'to top',
    preview: 'linear-gradient(to top, black, transparent, black)',
  },
  'linear-gradient-outer-horizontal': {
    type: 'outer',
    direction: 'to top',
    preview: 'linear-gradient(to top, transparent, black, transparent)',
  },
}

export function clampOverlayOpacity(value: number) {
  if (!Number.isFinite(value))
    return 0.5
  return Math.min(1, Math.max(0, value))
}

/** 0–50% fades the classic overlay in; 50% is the old look; 50–100% covers more. */
export function overlayPaintAlpha(intensity: number) {
  return Math.min(1, clampOverlayOpacity(intensity) * 2)
}

export function overlaySpread(intensity: number) {
  return Math.max(0, (clampOverlayOpacity(intensity) - 0.5) * 2)
}

export function overlayPaint(color: string, opacity: number) {
  return tinycolor(color).setAlpha(clampOverlayOpacity(opacity)).toRgbString()
}

function fadeToColor(paint: string, spread: number) {
  if (spread <= 0)
    return `transparent, ${paint}`
  return `transparent, ${paint} ${100 - spread * 50}%`
}

function fadeFromColor(paint: string, spread: number) {
  if (spread <= 0)
    return `${paint}, transparent`
  return `${paint} ${spread * 50}%, transparent`
}

export function buildOverlayBackground(
  overlayType: string,
  overlayColor: string,
  overlayOpacity: number,
) {
  if (overlayType === 'none' || !(overlayType in overlayTypes))
    return 'none'

  const intensity = clampOverlayOpacity(overlayOpacity)
  if (overlayType === 'opacity')
    return overlayPaint(overlayColor, intensity)

  const paint = overlayPaint(overlayColor, overlayPaintAlpha(intensity))
  const spread = overlaySpread(intensity)
  const typeConfig = overlayTypes[overlayType as keyof typeof overlayTypes]

  if (typeConfig.type === 'radial' && 'position' in typeConfig) {
    const stops = typeConfig.start === 'color'
      ? fadeFromColor(paint, spread)
      : fadeToColor(paint, spread)
    return `radial-gradient(${typeConfig.position}, ${stops})`
  }
  if (typeConfig.type === 'inner' && 'direction' in typeConfig) {
    const stops = spread <= 0
      ? `${paint}, transparent, ${paint}`
      : `${paint} ${spread * 30}%, transparent 50%, ${paint} ${100 - spread * 30}%`
    return `linear-gradient(${typeConfig.direction}, ${stops})`
  }
  if (typeConfig.type === 'outer' && 'direction' in typeConfig) {
    const stops = spread <= 0
      ? `transparent, ${paint}, transparent`
      : `transparent, ${paint} ${50 - spread * 35}%, ${paint} ${50 + spread * 35}%, transparent`
    return `linear-gradient(${typeConfig.direction}, ${stops})`
  }
  if ('direction' in typeConfig)
    return `linear-gradient(${typeConfig.direction}, ${fadeToColor(paint, spread)})`

  return 'none'
}
