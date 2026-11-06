import tinycolor from 'tinycolor2'
import type { Variables } from '~/types'
import { interpolateTemplate } from '~/lib/pattern'

/**
 * Finishing effects layered on top of any template: film grain, an SVG
 * displacement warp, soft lighting, and motion.
 *
 * Everything here still compiles down to plain HTML + CSS (plus one inline
 * SVG filter for warp), so "Copy CSS" keeps working. Motion is driven by
 * registered custom properties (`@property`), which lets the browser
 * interpolate a template's own dials — the pattern itself morphs, not just
 * its position.
 */

export const motionTypes = ['none', 'breathe', 'morph', 'hue', 'flow'] as const
export type MotionType = typeof motionTypes[number]

export interface Effects {
  grain: number
  grainSize: number
  warp: number
  warpSize: number
  light: number
  motion: MotionType
  speed: number
  motionAmount: number
}

export const DEFAULT_EFFECTS: Effects = {
  grain: 0,
  grainSize: 1.5,
  warp: 0,
  warpSize: 4,
  light: 0,
  motion: 'none',
  speed: 8,
  motionAmount: 0.35,
}

type NumericEffect = Exclude<keyof Effects, 'motion'>

/** URL key and range for every numeric dial, so parsing and the controls share one source. */
export const EFFECT_DIALS: Record<NumericEffect, { param: string; min: number; max: number; step: number }> = {
  grain: { param: 'fxGrain', min: 0, max: 1, step: 0.01 },
  grainSize: { param: 'fxGrainSize', min: 0.5, max: 4, step: 0.1 },
  warp: { param: 'fxWarp', min: 0, max: 160, step: 1 },
  warpSize: { param: 'fxWarpSize', min: 1, max: 10, step: 0.1 },
  light: { param: 'fxLight', min: 0, max: 1, step: 0.01 },
  speed: { param: 'fxSpeed', min: 2, max: 30, step: 0.5 },
  motionAmount: { param: 'fxAmount', min: 0.05, max: 1, step: 0.01 },
}

export const MOTION_PARAM = 'fxMotion'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits))
}

/** Rehydrate effects from URL/query params, falling back to the current values. */
export function parseEffects(read: (param: string) => unknown, fallback: Effects = DEFAULT_EFFECTS): Effects {
  const next = { ...fallback }
  for (const [key, dial] of Object.entries(EFFECT_DIALS) as [NumericEffect, typeof EFFECT_DIALS[NumericEffect]][]) {
    const raw = read(dial.param)
    if (raw === undefined || raw === null || raw === '')
      continue
    const parsed = parseFloat(String(raw))
    if (Number.isFinite(parsed))
      next[key] = clamp(parsed, dial.min, dial.max)
  }
  const motion = read(MOTION_PARAM)
  if (typeof motion === 'string' && (motionTypes as readonly string[]).includes(motion))
    next.motion = motion as MotionType
  return next
}

export function effectsToParams(effects: Effects) {
  const params: Record<string, string | number> = { [MOTION_PARAM]: effects.motion }
  for (const [key, dial] of Object.entries(EFFECT_DIALS) as [NumericEffect, typeof EFFECT_DIALS[NumericEffect]][])
    params[dial.param] = effects[key]
  return params
}

export function effectParamKeys() {
  return [MOTION_PARAM, ...Object.values(EFFECT_DIALS).map(dial => dial.param)]
}

// ---------------------------------------------------------------------------
// Grain
// ---------------------------------------------------------------------------

export const GRAIN_TILE = 256

/** A seamless, monochrome, contrast-boosted noise tile as an SVG data URI. */
export function grainImage(size: number) {
  const frequency = round(0.9 / clamp(size, 0.1, 10))
  const curve = 'type="linear" slope="2.2" intercept="-0.6"'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${GRAIN_TILE}" height="${GRAIN_TILE}">`
    + `<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3" stitchTiles="stitch"/>`
    + '<feColorMatrix type="saturate" values="0"/>'
    + `<feComponentTransfer><feFuncR ${curve}/><feFuncG ${curve}/><feFuncB ${curve}/></feComponentTransfer></filter>`
    + '<rect width="100%" height="100%" filter="url(#g)"/></svg>'
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

export function grainStyle(effects: Effects): Record<string, string> | undefined {
  if (effects.grain <= 0)
    return undefined
  return {
    'position': 'absolute',
    'inset': '0',
    'background-image': grainImage(effects.grainSize),
    'background-size': `${GRAIN_TILE}px ${GRAIN_TILE}px`,
    'mix-blend-mode': 'overlay',
    'opacity': String(round(effects.grain, 2)),
    'pointer-events': 'none',
  }
}

// ---------------------------------------------------------------------------
// Light
// ---------------------------------------------------------------------------

/** A key light from the top-left and a soft shadow bottom-right, blended so it sculpts rather than tints. */
export function lightStyle(effects: Effects): Record<string, string> | undefined {
  if (effects.light <= 0)
    return undefined
  const highlight = round(0.9 * effects.light)
  const shadow = round(0.7 * effects.light)
  return {
    'position': 'absolute',
    'inset': '0',
    'background': `radial-gradient(circle at 22% 12%, rgba(255, 255, 255, ${highlight}), transparent 58%), `
      + `radial-gradient(circle at 82% 96%, rgba(0, 0, 0, ${shadow}), transparent 62%)`,
    'mix-blend-mode': 'soft-light',
    'pointer-events': 'none',
  }
}

// ---------------------------------------------------------------------------
// Warp
// ---------------------------------------------------------------------------

export const WARP_FILTER_ID = 'stylixir-warp'

/** Turbulence frequency for a "ripple size" dial: bigger dial → longer, lazier waves. */
export function warpFrequency(warpSize: number) {
  return round(0.03 / clamp(warpSize, 0.5, 20), 5)
}

/**
 * How far the pattern layer must overhang its frame so displaced pixels never
 * pull in transparency at the edges. Displacement moves a pixel by at most
 * half the filter's scale.
 */
export function warpBleed(effects: Effects) {
  return effects.warp > 0 ? Math.ceil(effects.warp / 2) + 2 : 0
}

export function warpFilterMarkup(effects: Effects, options: { id?: string; animate?: boolean } = {}) {
  if (effects.warp <= 0)
    return ''
  const { id = WARP_FILTER_ID, animate = true } = options
  const f = warpFrequency(effects.warpSize)
  // Stretching the noise on each axis out of phase reads as liquid churn
  // rather than the whole field zooming from one corner.
  const flow = (animate && effects.motion === 'flow')
    ? `<animate attributeName="baseFrequency" dur="${effects.speed}s" repeatCount="indefinite" `
      + `values="${f} ${f};${round(f * 1.35, 5)} ${round(f * 0.8, 5)};${round(f * 0.85, 5)} ${round(f * 1.3, 5)};${f} ${f}"/>`
    : ''
  return '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">'
    + `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`
    + `<feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="2" seed="7" result="noise">${flow}</feTurbulence>`
    + `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${effects.warp}" xChannelSelector="R" yChannelSelector="G"/>`
    + '</filter></svg>'
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

/** Motions that animate the template's own dials through registered custom properties. */
export function animatesDials(motion: MotionType) {
  return motion === 'breathe' || motion === 'morph'
}

export function dialVar(key: string) {
  return `--sx-${key}`
}

const PLACEHOLDER = /(-?)\{(\w+)\}(px|deg|%)?/g

/**
 * Rewrites a template's `{key}` placeholders into `var(--sx-key)` references
 * so the dials can be animated. Units are folded into `calc()` because
 * `var(--x)px` is not valid CSS.
 */
export function templateWithVars(template: Record<string, string>, variables: Variables) {
  return Object.entries(template).reduce((acc, [property, value]) => {
    acc[property] = value.replace(PLACEHOLDER, (match, sign: string, key: string, unit?: string) => {
      const variable = variables[key]
      if (!variable)
        return match
      const ref = `var(${dialVar(key)})`
      if (variable.type === 'color')
        return `${sign}${ref}${unit ?? ''}`
      if (unit)
        return `calc(${ref} * ${sign}1${unit})`
      return sign ? `calc(${ref} * -1)` : ref
    })
    return acc
  }, {} as Record<string, string>)
}

function hashKey(key: string) {
  let hash = 0
  for (const char of key)
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  return Math.abs(hash)
}

/** Where a number dial swings to: a share of its range, away from whichever bound is too close. */
export function numberTarget(key: string, variable: Variables[string], value: number, amount: number) {
  const min = variable.min ?? 0
  const max = variable.max ?? 100
  const span = (max - min) * clamp(amount, 0, 1) * 0.5
  let direction = hashKey(key) % 2 ? 1 : -1
  const next = value + direction * span
  if (next > max || next < min)
    direction = -direction
  return round(clamp(value + direction * span, min, max))
}

export function colorTarget(key: string, value: string, amount: number) {
  const direction = hashKey(key) % 2 ? 1 : -1
  const color = tinycolor(value).spin(direction * clamp(amount, 0, 1) * 120)
  return color.getAlpha() < 1 ? color.toHex8String() : color.toHexString()
}

function rule(selector: string, declarations: Record<string, string>) {
  const body = Object.entries(declarations).map(([key, value]) => `  ${key}: ${value};`).join('\n')
  return `${selector} {\n${body}\n}`
}

interface MotionParts {
  /** Extra declarations for the pattern layer (dial values + `animation`). */
  declarations: Record<string, string>
  /** Global `@property` and `@keyframes` rules. */
  css: string
}

function dialMotion(
  variables: Variables,
  values: Record<string, string | number>,
  effects: Effects,
  name: string,
): MotionParts {
  const properties: string[] = []
  const from: Record<string, string> = {}
  const to: Record<string, string> = {}

  for (const [key, variable] of Object.entries(variables)) {
    const value = values[key] ?? variable.value
    if (variable.type === 'color') {
      const color = String(value)
      properties.push(rule(`@property ${dialVar(key)}`, { 'syntax': '\'<color>\'', 'inherits': 'false', 'initial-value': 'transparent' }))
      from[dialVar(key)] = color
      to[dialVar(key)] = effects.motion === 'morph' ? colorTarget(key, color, effects.motionAmount) : color
    }
    else {
      const number = Number(value)
      properties.push(rule(`@property ${dialVar(key)}`, { 'syntax': '\'<number>\'', 'inherits': 'false', 'initial-value': '0' }))
      from[dialVar(key)] = String(number)
      to[dialVar(key)] = String(numberTarget(key, variable, number, effects.motionAmount))
    }
  }

  const keyframes = `@keyframes ${name}-dials {\n${rule('  from', from).replace(/\n/g, '\n  ')}\n${rule('  to', to).replace(/\n/g, '\n  ')}\n}`
  return {
    declarations: {
      ...from,
      animation: `${name}-dials ${round(effects.speed / 2, 2)}s ease-in-out infinite alternate`,
    },
    css: [...properties, keyframes].join('\n'),
  }
}

function hueMotion(effects: Effects, name: string): MotionParts {
  return {
    declarations: {
      '--sx-hue': '0deg',
      'animation': `${name}-hue ${effects.speed}s linear infinite`,
    },
    css: [
      rule('@property --sx-hue', { 'syntax': '\'<angle>\'', 'inherits': 'false', 'initial-value': '0deg' }),
      `@keyframes ${name}-hue {\n  to { --sx-hue: 360deg; }\n}`,
    ].join('\n'),
  }
}

// ---------------------------------------------------------------------------
// Frame: every layer, ready to render as DOM or to print as a snippet
// ---------------------------------------------------------------------------

export interface PatternFrame {
  pattern: Record<string, string>
  light?: Record<string, string>
  overlay?: Record<string, string>
  grain?: Record<string, string>
  /** Inline SVG holding the warp filter; empty when warp is off. */
  filterMarkup: string
  /** Global rules (`@property`, `@keyframes`); empty when nothing moves. */
  css: string
}

export interface FrameOptions {
  template: Record<string, string>
  variables: Variables
  values: Record<string, string | number>
  effects: Effects
  /** The overlay layer's declarations; omit to leave the overlay out. */
  overlay?: Record<string, string>
  /** False renders a still frame (image export, reduced motion). */
  animate?: boolean
  filterId?: string
  /** Prefix for keyframe names, so several frames can share a document. */
  name?: string
}

function hasOverlay(overlay?: Record<string, string>) {
  if (!overlay)
    return false
  const blur = overlay['backdrop-filter']
  return (overlay.background && overlay.background !== 'none') || (blur && !/blur\(0(px)?\)/.test(blur))
}

/**
 * Tiles grow from the background origin, the pattern layer's top-left, so
 * animated dials zoom out of that corner. A transparent top/left border
 * (painted under, since background-clip is border-box) parks the origin at
 * the frame's centre while the padding box keeps the frame's size, so `%`
 * sizes and positions mean the same. `cq*` units need the frame to be a size
 * container.
 */
function centeredOrigin(bleed: number): Record<string, string> {
  return {
    'inset': `-${bleed}px calc(-50cqw - ${2 * bleed}px) calc(-50cqh - ${2 * bleed}px) -${bleed}px`,
    'border-top': `calc(50cqh + ${bleed}px) solid transparent`,
    'border-left': `calc(50cqw + ${bleed}px) solid transparent`,
  }
}

export function buildFrame(options: FrameOptions): PatternFrame {
  const {
    template,
    variables,
    values,
    effects,
    overlay,
    animate = true,
    filterId = WARP_FILTER_ID,
    name = 'stylixir',
  } = options

  const motion = animate ? effects.motion : 'none'
  const bleed = warpBleed(effects)

  let declarations: Record<string, string>
  let css = ''
  if (animatesDials(motion)) {
    const parts = dialMotion(variables, values, effects, name)
    declarations = { ...templateWithVars(template, variables), ...parts.declarations }
    css = parts.css
  }
  else {
    declarations = Object.entries(template).reduce((acc, [property, value]) => {
      acc[property] = interpolateTemplate(value, values)
      return acc
    }, {} as Record<string, string>)
  }

  if (motion === 'hue') {
    const parts = hueMotion(effects, name)
    Object.assign(declarations, parts.declarations)
    css = parts.css
  }

  const filters = [
    effects.warp > 0 ? `url(#${filterId})` : '',
    motion === 'hue' ? 'hue-rotate(var(--sx-hue))' : '',
  ].filter(Boolean)

  return {
    pattern: {
      position: 'absolute',
      inset: bleed ? `-${bleed}px` : '0',
      ...declarations,
      ...(animatesDials(motion) ? centeredOrigin(bleed) : {}),
      ...(filters.length ? { filter: filters.join(' ') } : {}),
    },
    light: lightStyle(effects),
    overlay: hasOverlay(overlay)
      ? { 'position': 'absolute', 'inset': '0', 'pointer-events': 'none', ...overlay }
      : undefined,
    grain: grainStyle(effects),
    filterMarkup: warpFilterMarkup(effects, { id: filterId, animate }),
    css,
  }
}

export const FRAME_LAYERS = ['pattern', 'light', 'overlay', 'grain'] as const

/** A paste-anywhere HTML + CSS snippet for a frame. */
export function buildSnippet(frame: PatternFrame, className = 'background') {
  const layers = FRAME_LAYERS.filter(layer => frame[layer])
  const html = [
    `<div class="${className}">`,
    ...layers.map(layer => `  <div class="${className}__${layer}"></div>`),
    ...(frame.filterMarkup ? [`  ${frame.filterMarkup}`] : []),
    '</div>',
  ].join('\n')

  const rules = [
    rule(`.${className}`, {
      'position': 'relative',
      'overflow': 'hidden',
      'isolation': 'isolate',
      'container-type': 'size',
      'width': '100%',
      'height': '100%',
    }),
    ...layers.map(layer => rule(`.${className}__${layer}`, frame[layer]!)),
  ]
  if (frame.css) {
    rules.push(frame.css)
    rules.push(`@media (prefers-reduced-motion: reduce) {\n  .${className}__pattern { animation: none; }\n}`)
  }

  return `${html}\n<style>\n${rules.join('\n\n')}\n</style>\n`
}
