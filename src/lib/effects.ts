import type { Variables } from '~/types'
import { interpolateTemplate } from '~/lib/pattern'

/**
 * Finishing effects layered on top of any template: film grain, an SVG
 * displacement warp, soft lighting, and motion.
 *
 * Everything here still compiles down to plain HTML + CSS (plus one inline
 * SVG filter for warp), so "Copy CSS" keeps working. Motion is four stackable
 * channels — shape, color, move, liquid — each off at 0 and stronger towards
 * 1. Shape and color animate the template's own dials through registered
 * custom properties (`@property`), so the pattern itself morphs, not just its
 * position.
 */

export const colorModes = ['shift', 'swap'] as const
export type ColorMode = typeof colorModes[number]
export const moveModes = ['drift', 'spin'] as const
export type MoveMode = typeof moveModes[number]
export const materials = ['none', 'paper', 'linen', 'embossed', 'riso'] as const
export type Material = typeof materials[number]

export interface Effects {
  grain: number
  grainSize: number
  warp: number
  warpSize: number
  light: number
  /** Seconds per cycle, shared by every motion channel. */
  speed: number
  /** Dials swing out of sync. */
  shape: number
  /** Hue shift (oklch) or colors trading places. */
  color: number
  colorMode: ColorMode
  /** Seamless drift by whole tiles, or a slow spin. */
  move: number
  moveMode: MoveMode
  /** Drift heading in degrees, clockwise from east, in 45° steps. */
  driftAngle: number
  /** Churns the warp, bringing a soft one of its own when Warp is off. */
  liquid: number
  /** Dial keys shape motion leaves still. Unknown keys are ignored, so holds carry across patterns that share names. */
  shapeHold: string[]
  /** A physical finish for the whole swatch. */
  material: Material
  materialStrength: number
}

export const DEFAULT_EFFECTS: Effects = {
  grain: 0,
  grainSize: 1.5,
  warp: 0,
  warpSize: 4,
  light: 0,
  speed: 8,
  shape: 0,
  color: 0,
  colorMode: 'shift',
  move: 0,
  moveMode: 'drift',
  driftAngle: 315,
  liquid: 0,
  shapeHold: [],
  material: 'none',
  materialStrength: 0.5,
}

/** What a motion channel jumps to when it is switched on. */
export const CHANNEL_ON = 0.35
export const motionChannels = ['shape', 'color', 'move', 'liquid'] as const
export type MotionChannel = typeof motionChannels[number]

export function isMoving(effects: Effects) {
  return motionChannels.some(channel => effects[channel] > 0)
}

type NumericEffect = { [K in keyof Effects]: Effects[K] extends number ? K : never }[keyof Effects]

/** URL key and range for every numeric dial, so parsing and the controls share one source. */
export const EFFECT_DIALS: Record<NumericEffect, { param: string; min: number; max: number; step: number }> = {
  grain: { param: 'fxGrain', min: 0, max: 1, step: 0.01 },
  grainSize: { param: 'fxGrainSize', min: 0.5, max: 4, step: 0.1 },
  warp: { param: 'fxWarp', min: 0, max: 160, step: 1 },
  warpSize: { param: 'fxWarpSize', min: 1, max: 10, step: 0.1 },
  light: { param: 'fxLight', min: 0, max: 1, step: 0.01 },
  speed: { param: 'fxSpeed', min: 2, max: 30, step: 0.5 },
  shape: { param: 'fxShape', min: 0, max: 1, step: 0.01 },
  color: { param: 'fxColor', min: 0, max: 1, step: 0.01 },
  move: { param: 'fxMove', min: 0, max: 1, step: 0.01 },
  driftAngle: { param: 'fxDriftAngle', min: 0, max: 315, step: 45 },
  liquid: { param: 'fxLiquid', min: 0, max: 1, step: 0.01 },
  materialStrength: { param: 'fxMaterialStrength', min: 0, max: 1, step: 0.01 },
}

const EFFECT_CHOICES = {
  colorMode: { param: 'fxColorMode', values: colorModes },
  moveMode: { param: 'fxMoveMode', values: moveModes },
  material: { param: 'fxMaterial', values: materials },
} as const

type ChoiceEffect = keyof typeof EFFECT_CHOICES

const SHAPE_HOLD_PARAM = 'fxShapeHold'

/** Pre-channel links carried a single `fxMotion` preset and its `fxAmount`. */
const LEGACY_PARAMS = ['fxMotion', 'fxAmount']

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits))
}

function applyLegacyMotion(next: Effects, read: (param: string) => unknown) {
  const motion = read('fxMotion')
  const amount = parseFloat(String(read('fxAmount') ?? ''))
  const strength = Number.isFinite(amount) ? clamp(amount, 0.05, 1) : CHANNEL_ON
  if (motion === 'breathe' || motion === 'morph')
    next.shape = strength
  if (motion === 'morph')
    next.color = strength
  if (motion === 'hue')
    next.color = 1
  if (motion === 'flow')
    next.liquid = CHANNEL_ON
}

/** Rehydrate effects from URL/query params, falling back to the current values. */
export function parseEffects(read: (param: string) => unknown, fallback: Effects = DEFAULT_EFFECTS): Effects {
  const next = { ...fallback }
  applyLegacyMotion(next, read)
  for (const [key, dial] of Object.entries(EFFECT_DIALS) as [NumericEffect, typeof EFFECT_DIALS[NumericEffect]][]) {
    const raw = read(dial.param)
    if (raw === undefined || raw === null || raw === '')
      continue
    const parsed = parseFloat(String(raw))
    if (Number.isFinite(parsed))
      next[key] = clamp(parsed, dial.min, dial.max)
  }
  for (const [key, choice] of Object.entries(EFFECT_CHOICES) as [ChoiceEffect, typeof EFFECT_CHOICES[ChoiceEffect]][]) {
    const raw = read(choice.param)
    if ((choice.values as readonly unknown[]).includes(raw))
      Object.assign(next, { [key]: raw })
  }
  const hold = read(SHAPE_HOLD_PARAM)
  if (typeof hold === 'string')
    next.shapeHold = hold.split(',').filter(key => /^\w+$/.test(key))
  return next
}

export function effectsToParams(effects: Effects) {
  const params: Record<string, string | number> = { [SHAPE_HOLD_PARAM]: effects.shapeHold.join(',') }
  for (const [key, choice] of Object.entries(EFFECT_CHOICES) as [ChoiceEffect, typeof EFFECT_CHOICES[ChoiceEffect]][])
    params[choice.param] = effects[key]
  for (const [key, dial] of Object.entries(EFFECT_DIALS) as [NumericEffect, typeof EFFECT_DIALS[NumericEffect]][])
    params[dial.param] = effects[key]
  return params
}

/** Every URL key effects own, legacy ones included so resets clear them. */
export function effectParamKeys() {
  return [
    ...Object.values(EFFECT_CHOICES).map(choice => choice.param),
    SHAPE_HOLD_PARAM,
    ...Object.values(EFFECT_DIALS).map(dial => dial.param),
    ...LEGACY_PARAMS,
  ]
}

export function legacyEffectParamKeys() {
  return [...LEGACY_PARAMS]
}

// ---------------------------------------------------------------------------
// Grain
// ---------------------------------------------------------------------------

export const GRAIN_TILE = 256

/** A tile painted by an SVG filter, as a data URI. */
function filterTile(width: number, height: number, filter: string, attributes = '') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
    // The region must be exactly the tile, or stitched noise repeats at the wrong period and seams.
    + `<filter id="g" x="0" y="0" width="100%" height="100%"${attributes}>${filter}</filter>`
    + '<rect width="100%" height="100%" filter="url(#g)"/></svg>'
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** Monochrome noise pushed through a linear curve. */
function greyNoise(turbulence: string, slope: number, intercept: number) {
  const curve = `type="linear" slope="${slope}" intercept="${intercept}"`
  return `${turbulence}<feColorMatrix type="saturate" values="0"/>`
    + `<feComponentTransfer><feFuncR ${curve}/><feFuncG ${curve}/><feFuncB ${curve}/></feComponentTransfer>`
}

/** A seamless, monochrome, contrast-boosted noise tile as an SVG data URI. */
export function grainImage(size: number) {
  const frequency = round(0.9 / clamp(size, 0.1, 10))
  return filterTile(GRAIN_TILE, GRAIN_TILE, greyNoise(
    `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3" stitchTiles="stitch"/>`,
    2.2,
    -0.6,
  ))
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
  // Liquid strength sets how far each axis stretches.
  const hi = 1 + effects.liquid
  const lo = 1 - 0.55 * effects.liquid
  const flow = (animate && effects.liquid > 0)
    ? `<animate attributeName="baseFrequency" dur="${effects.speed}s" repeatCount="indefinite" `
      + `values="${f} ${f};${round(f * hi, 5)} ${round(f * lo, 5)};${round(f * lo, 5)} ${round(f * hi, 5)};${f} ${f}"/>`
    : ''
  return '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">'
    + `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`
    + `<feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="2" seed="7" result="noise">${flow}</feTurbulence>`
    + `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${effects.warp}" xChannelSelector="R" yChannelSelector="G"/>`
    + '</filter></svg>'
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export const PAPER_TILE = 512

function hasMaterial(effects: Effects) {
  return effects.material !== 'none' && effects.materialStrength > 0
}

/** Each plate's shift: strength pulls the inks further out of register. */
function risoOffset(effects: Effects) {
  return round(0.5 + effects.materialStrength * 3, 1)
}

/** Overhang the pattern layer needs so the material's filter has pixels to read past the edges. */
function materialBleed(effects: Effects) {
  if (!hasMaterial(effects))
    return 0
  if (effects.material === 'riso')
    return Math.ceil(risoOffset(effects)) + 2
  return effects.material === 'embossed' ? 4 : 0
}

/** Crossed threads, each lit on one side, with slubs on prime periods so the weave never lines up into a grid. */
const LINEN = [
  'repeating-linear-gradient(0deg, rgb(255 255 255 / 0.35) 0 1px, rgb(0 0 0 / 0.35) 1px 2px, transparent 2px 3px)',
  'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.3) 0 1px, rgb(0 0 0 / 0.3) 1px 2px, transparent 2px 3px)',
  'repeating-linear-gradient(0deg, transparent 0 5px, rgb(0 0 0 / 0.25) 5px 7px, transparent 7px 17px)',
  'repeating-linear-gradient(90deg, transparent 0 9px, rgb(0 0 0 / 0.2) 9px 10px, transparent 10px 13px)',
  'repeating-linear-gradient(0deg, transparent 0 21px, rgb(255 255 255 / 0.3) 21px 23px, transparent 23px 41px)',
  'repeating-linear-gradient(90deg, transparent 0 27px, rgb(255 255 255 / 0.3) 27px 29px, transparent 29px 47px)',
].join(', ')

/** Raking light over fibrous noise gives the paper its tooth; the curve centres it on mid-grey so hard-light both lifts and presses. */
function paperImage() {
  return filterTile(PAPER_TILE, PAPER_TILE, ''
    + '<feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="5" seed="4" stitchTiles="stitch"/>'
    + `<feDiffuseLighting surfaceScale="1.6" lighting-color="#fff"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>${
     greyNoise('', 1.5, -0.73)}`, ' color-interpolation-filters="sRGB"')
}

/** Sparse pale specks where the ink starved. */
function risoInkImage() {
  return filterTile(GRAIN_TILE, GRAIN_TILE, greyNoise(
    '<feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="3" stitchTiles="stitch"/>',
    7,
    -4.1,
  ))
}

/** The material's own layer over the pattern; Embossed has none, it lives in the filter. */
export function materialStyle(effects: Effects): Record<string, string> | undefined {
  if (!hasMaterial(effects) || effects.material === 'embossed')
    return undefined
  const opacity = String(round(effects.materialStrength, 2))
  const base = { 'position': 'absolute', 'inset': '0', 'pointer-events': 'none' }
  if (effects.material === 'linen')
    return { ...base, 'background-image': LINEN, 'mix-blend-mode': 'hard-light', opacity }
  const paper = effects.material === 'paper'
  const tile = paper ? PAPER_TILE : GRAIN_TILE
  return {
    ...base,
    'background-image': paper ? paperImage() : risoInkImage(),
    'background-size': `${tile}px ${tile}px`,
    // Hard-light keys off the texture rather than the pattern, so it still shows on white or black grounds.
    'mix-blend-mode': paper ? 'hard-light' : 'screen',
    opacity,
  }
}

/** The pattern layer's material filter, chained after warp: Embossed lights the pattern's luminance, Riso splits it into ink plates. */
export function materialFilterMarkup(effects: Effects, id: string) {
  if (!hasMaterial(effects) || !['embossed', 'riso'].includes(effects.material))
    return ''
  let body: string
  if (effects.material === 'embossed') {
    const surface = round(1 + effects.materialStrength * 4, 2)
    // Diffuse only: a specular pass halved the frame rate under motion for little visible gain.
    // Dividing by sin(50°) keeps flat areas at their own color; only slopes shade.
    body = '<feColorMatrix in="SourceGraphic" type="luminanceToAlpha"/>'
      + '<feGaussianBlur stdDeviation="1.2"/>'
      + `<feDiffuseLighting surfaceScale="${surface}" lighting-color="#fff" result="shade"><feDistantLight azimuth="225" elevation="50"/></feDiffuseLighting>`
      + '<feComposite in="SourceGraphic" in2="shade" operator="arithmetic" k1="1.305"/>'
  }
  else {
    const d = risoOffset(effects)
    // Cyan, magenta and yellow plates multiply back to the original when aligned; shifted, their edges fringe.
    const plate = (matrix: string, dx: number, dy: number, result: string) =>
      `<feColorMatrix in="SourceGraphic" type="matrix" values="${matrix}"/><feOffset dx="${dx}" dy="${dy}" result="${result}"/>`
    body = `${plate('1 0 0 0 0  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0', d, round(-d / 2, 1), 'cyan')
      + plate('0 0 0 0 1  0 1 0 0 0  0 0 0 0 1  0 0 0 1 0', round(-d * 0.6, 1), d, 'magenta')
      + plate('0 0 0 0 1  0 0 0 0 1  0 0 1 0 0  0 0 0 1 0', 0, 0, 'yellow')
       }<feBlend in="cyan" in2="magenta" mode="multiply"/>`
      + '<feBlend in2="yellow" mode="multiply"/>'
      // Riso inks are translucent and matte: no true black, no glare.
      + '<feComponentTransfer><feFuncR type="linear" slope="0.9" intercept="0.07"/><feFuncG type="linear" slope="0.9" intercept="0.07"/><feFuncB type="linear" slope="0.9" intercept="0.07"/></feComponentTransfer>'
  }
  return '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">'
    + `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${body}</filter></svg>`
}

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export function dialVar(key: string) {
  return `--sx-${key}`
}

const HUE_VAR = '--sx-hue'
const PLACEHOLDER = /(-?)\{(\w+)\}(px|deg|%)?/g

/**
 * Rewrites a template's `{key}` placeholders into `var(--sx-key)` references
 * so the dials can be animated. Units are folded into `calc()` because
 * `var(--x)px` is not valid CSS. `hue` wraps each color in a relative
 * `oklch()` that adds `--sx-hue` to its hue, so a shift keeps lightness.
 */
export function templateWithVars(template: Record<string, string>, variables: Variables, options: { hue?: boolean } = {}) {
  return Object.entries(template).reduce((acc, [property, value]) => {
    acc[property] = value.replace(PLACEHOLDER, (match, sign: string, key: string, unit?: string) => {
      const variable = variables[key]
      if (!variable)
        return match
      const ref = `var(${dialVar(key)})`
      if (variable.type === 'color')
        return `${sign}${options.hue ? `oklch(from ${ref} l c calc(h + var(${HUE_VAR})))` : ref}${unit ?? ''}`
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

function rule(selector: string, declarations: Record<string, string>) {
  const body = Object.entries(declarations).map(([key, value]) => `  ${key}: ${value};`).join('\n')
  return `${selector} {\n${body}\n}`
}

function keyframes(name: string, stops: [string, Record<string, string>][]) {
  const body = stops.map(([at, declarations]) => rule(`  ${at}`, declarations).replace(/\n/g, '\n  ')).join('\n')
  return `@keyframes ${name} {\n${body}\n}`
}

function registerProperty(name: string, syntax: string, initial: string) {
  return rule(`@property ${name}`, { 'syntax': `'${syntax}'`, 'inherits': 'false', 'initial-value': initial })
}

/** Alternating motions take half the cycle each way, so one round trip is one cycle. */
function swing(effects: Effects) {
  return `${round(effects.speed / 2, 2)}s ease-in-out infinite alternate`
}

interface MotionParts {
  /** Extra declarations for the pattern layer. */
  declarations?: Record<string, string>
  /** Entries for the layer's comma-separated `animation`. */
  animations: string[]
  /** Global `@property` and `@keyframes` rules. */
  css: string[]
}

/** Every dial's resting value, so the `var()` references in the rewritten template resolve. */
function dialValues(variables: Variables, values: Record<string, string | number>) {
  return Object.entries(variables).reduce((acc, [key, variable]) => {
    const value = values[key] ?? variable.value
    acc[dialVar(key)] = variable.type === 'color' ? String(value) : String(Number(value))
    return acc
  }, {} as Record<string, string>)
}

/**
 * Each number dial swings on its own clock. Golden-ratio spaced periods and
 * per-dial start offsets keep them from lining up, so the pattern wanders
 * instead of pulsing.
 */
function shapeMotion(variables: Variables, values: Record<string, string | number>, effects: Effects, name: string, breaking: boolean): MotionParts {
  const parts: MotionParts = { animations: [], css: [] }
  let index = 0
  for (const [key, variable] of Object.entries(variables)) {
    if (variable.type === 'color' || (variable.breaking && !breaking) || effects.shapeHold.includes(key))
      continue
    const value = Number(values[key] ?? variable.value)
    const target = numberTarget(key, variable, value, effects.shape)
    if (target === value)
      continue
    const duration = round(effects.speed / 2 * (1 + (index++ * 0.618) % 1), 2)
    const delay = round(-duration * (hashKey(key) % 100) / 100, 2)
    const frames = `${name}-dial-${key}`
    parts.css.push(
      registerProperty(dialVar(key), '<number>', '0'),
      keyframes(frames, [['from', { [dialVar(key)]: String(value) }], ['to', { [dialVar(key)]: String(target) }]]),
    )
    parts.animations.push(`${frames} ${duration}s ease-in-out ${delay}s infinite alternate`)
  }
  return parts
}

/** Hue drifts in oklch; full strength turns all the way round the wheel. */
function hueMotion(effects: Effects, name: string): MotionParts {
  const full = effects.color >= 1
  const reach = round(effects.color * 180, 1)
  const frames = `${name}-hue`
  return {
    animations: [full ? `${frames} ${effects.speed}s linear infinite` : `${frames} ${swing(effects)}`],
    css: [
      registerProperty(HUE_VAR, '<number>', '0'),
      keyframes(frames, [['from', { [HUE_VAR]: full ? '0' : String(-reach) }], ['to', { [HUE_VAR]: full ? '360' : String(reach) }]]),
    ],
  }
}

/** Colors trade places around the palette, holding between moves; strength shortens the hold. */
function swapMotion(variables: Variables, values: Record<string, string | number>, keys: string[], effects: Effects, name: string): MotionParts {
  const colors = keys.map(key => String(values[key] ?? variables[key].value))
  const n = keys.length
  const hold = 1 - clamp(effects.color, 0, 1)
  const at = (step: number) => `${round(step / n * 100, 2)}%`
  const state = (step: number) => Object.fromEntries(keys.map((key, i) => [dialVar(key), colors[(i + step) % n]]))
  const stops: [string, Record<string, string>][] = []
  for (let step = 0; step <= n; step++) {
    stops.push([at(step), state(step)])
    if (step < n && hold > 0)
      stops.push([at(step + hold), state(step)])
  }
  const frames = `${name}-swap`
  return {
    animations: [`${frames} ${round(effects.speed / 2 * n, 2)}s ease-in-out infinite`],
    css: [...keys.map(key => registerProperty(dialVar(key), '<color>', 'transparent')), keyframes(frames, stops)],
  }
}

function splitTop(value: string, separator: RegExp) {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of value) {
    if (char === '(')
      depth++
    else if (char === ')')
      depth--
    if (depth === 0 && separator.test(char)) {
      if (current.trim())
        parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim())
    parts.push(current.trim())
  return parts
}

/**
 * The repeat period of a `background-size`: the largest layer on each axis,
 * or undefined when any layer has no fixed size.
 * shortcut: layers whose sizes are not multiples of each other get the largest, so the drift loop can seam; compute an LCM if that shows up.
 */
export function tileSize(backgroundSize?: string): [string, string] | undefined {
  if (!backgroundSize)
    return undefined
  const widths = new Set<string>()
  const heights = new Set<string>()
  for (const layer of splitTop(backgroundSize, /,/)) {
    const [width, height = 'auto'] = splitTop(layer, /\s/)
    if ([width, height].some(token => /auto|cover|contain|%/.test(token)))
      return undefined
    widths.add(width)
    heights.add(height)
  }
  if (!widths.size)
    return undefined
  const largest = (sizes: Set<string>) => sizes.size > 1 ? `max(${[...sizes].join(', ')})` : [...sizes][0]
  return [largest(widths), largest(heights)]
}

const DRIFT_MAX_TILES = 4

/**
 * Slides the pattern by whole tiles, so the loop's jump back lands on an
 * identical frame. Works while shape motion resizes the tiles too, since the
 * distance tracks the live tile size.
 */
function driftMotion(effects: Effects, name: string, backgroundSize?: string): MotionParts {
  const radians = effects.driftAngle * Math.PI / 180
  const dx = Math.round(Math.cos(radians))
  const dy = Math.round(Math.sin(radians))
  const tile = tileSize(backgroundSize)
  const tiles = Math.max(1, Math.round(effects.move * DRIFT_MAX_TILES))
  // Without a fixed tile size there is no seamless period, so the drift sways instead of looping.
  const [w, h] = tile
    ? tile.map(length => tiles > 1 ? `calc(${tiles} * ${length})` : length)
    : [`${round(effects.move * 30, 1)}cqmin`, `${round(effects.move * 30, 1)}cqmin`]
  const offset = (direction: number, length: string) => direction === 0 ? '0px' : direction > 0 ? length : `calc(-1 * ${length})`
  // Overhang the trailing edges so the gap the drift opens is still painted.
  const declarations: Record<string, string> = {}
  if (dx)
    declarations[dx > 0 ? 'margin-left' : 'margin-right'] = `calc(-1 * ${w})`
  if (dy)
    declarations[dy > 0 ? 'margin-top' : 'margin-bottom'] = `calc(-1 * ${h})`
  const frames = `${name}-drift`
  return {
    declarations,
    animations: [tile ? `${frames} ${effects.speed}s linear infinite` : `${frames} ${swing(effects)}`],
    css: [keyframes(frames, [['from', { translate: '0px 0px' }], ['to', { translate: `${offset(dx, w)} ${offset(dy, h)}` }]])],
  }
}

/** Rocks around the frame centre; full strength turns all the way round. */
function spinMotion(effects: Effects, name: string, pad: string): MotionParts {
  const full = effects.move >= 1
  const reach = round(effects.move * 90, 1)
  const frames = `${name}-spin`
  return {
    // The layer's top-left sits `pad` outside the frame on both axes.
    declarations: { 'transform-origin': `calc(50cqw + ${pad}) calc(50cqh + ${pad})` },
    animations: [full ? `${frames} ${effects.speed}s linear infinite` : `${frames} ${swing(effects)}`],
    css: [keyframes(frames, [['from', { rotate: full ? '0deg' : `${-reach}deg` }], ['to', { rotate: full ? '360deg' : `${reach}deg` }]])],
  }
}

const LIQUID_WARP = 80

/** The effects a frame actually renders: no motion when still, and liquid's own warp when Warp is off. */
function liveEffects(effects: Effects, animate: boolean): Effects {
  if (!animate)
    return { ...effects, shape: 0, color: 0, move: 0, liquid: 0 }
  if (effects.liquid > 0 && effects.warp <= 0)
    return { ...effects, warp: round(effects.liquid * LIQUID_WARP) }
  return effects
}

// ---------------------------------------------------------------------------
// Frame: every layer, ready to render as DOM or to print as a snippet
// ---------------------------------------------------------------------------

export interface PatternFrame {
  pattern: Record<string, string>
  light?: Record<string, string>
  overlay?: Record<string, string>
  material?: Record<string, string>
  grain?: Record<string, string>
  /** Inline SVG holding the warp and material filters; empty when neither is on. */
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
  /** Let shape motion swing breaking dials too (wild shapes). */
  breaking?: boolean
}

function hasOverlay(overlay?: Record<string, string>) {
  if (!overlay)
    return false
  const blur = overlay['backdrop-filter']
  return (overlay.background && overlay.background !== 'none') || (blur && !/blur\(0(px)?\)/.test(blur))
}

function negate(length: string) {
  return length.startsWith('calc(') ? `calc(-1 * ${length})` : `-${length}`
}

/**
 * Tiles grow from the background origin, the pattern layer's top-left, so
 * animated dials zoom out of that corner. A transparent top/left border
 * (painted under, since background-clip is border-box) parks the origin at
 * the frame's centre while the padding box keeps the frame's size, so `%`
 * sizes and positions mean the same. `cq*` units need the frame to be a size
 * container. `pad` is how far the layer overhangs each edge.
 */
function centeredOrigin(pad: string): Record<string, string> {
  return {
    'inset': `${negate(pad)} calc(-50cqw - 2 * ${pad}) calc(-50cqh - 2 * ${pad}) ${negate(pad)}`,
    'border-top': `calc(50cqh + ${pad}) solid transparent`,
    'border-left': `calc(50cqw + ${pad}) solid transparent`,
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
    breaking = false,
  } = options

  const fx = liveEffects(effects, animate)
  const bleed = warpBleed(fx) + materialBleed(fx)
  const materialId = `${filterId}-material`
  const materialFilter = materialFilterMarkup(fx, materialId)
  const filters = [fx.warp > 0 && `url(#${filterId})`, materialFilter && `url(#${materialId})`].filter(Boolean)
  const spin = fx.move > 0 && fx.moveMode === 'spin'
  // A spinning layer must cover the frame's diagonal at every angle; half the longer side past each edge is enough.
  const pad = spin ? `calc(${bleed}px + 50cqmax)` : `${bleed}px`
  const colorKeys = Object.keys(variables).filter(key => variables[key].type === 'color')
  const hue = fx.color > 0 && (fx.colorMode === 'shift' || colorKeys.length < 2)

  const parts: MotionParts[] = []
  let declarations: Record<string, string>
  if (fx.shape > 0 || fx.color > 0) {
    declarations = { ...templateWithVars(template, variables, { hue }), ...dialValues(variables, values) }
    if (fx.shape > 0)
      parts.push(shapeMotion(variables, values, fx, name, breaking))
    if (fx.color > 0)
      parts.push(hue ? hueMotion(fx, name) : swapMotion(variables, values, colorKeys, fx, name))
  }
  else {
    declarations = Object.entries(template).reduce((acc, [property, value]) => {
      acc[property] = interpolateTemplate(value, values)
      return acc
    }, {} as Record<string, string>)
  }
  if (fx.move > 0)
    parts.push(spin ? spinMotion(fx, name, pad) : driftMotion(fx, name, declarations['background-size']))

  const animations = parts.flatMap(part => part.animations)

  return {
    pattern: {
      position: 'absolute',
      inset: (bleed || spin) ? negate(pad) : '0',
      ...declarations,
      ...(fx.shape > 0 ? centeredOrigin(pad) : {}),
      ...Object.assign({}, ...parts.map(part => part.declarations)),
      ...(filters.length ? { filter: filters.join(' ') } : {}),
      ...(animations.length ? { animation: animations.join(', ') } : {}),
    },
    light: lightStyle(fx),
    overlay: hasOverlay(overlay)
      ? { 'position': 'absolute', 'inset': '0', 'pointer-events': 'none', ...overlay }
      : undefined,
    material: materialStyle(fx),
    grain: grainStyle(fx),
    filterMarkup: warpFilterMarkup(fx, { id: filterId, animate }) + materialFilter,
    css: parts.flatMap(part => part.css).join('\n'),
  }
}

export const FRAME_LAYERS = ['pattern', 'light', 'overlay', 'material', 'grain'] as const

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
