import tinycolor from 'tinycolor2'
import type { ColorHarmony, ColorRole, Template, Variables } from '~/types'

type Rng = () => number

const SHADE_RANK: Record<string, number> = {
  dark: 0,
  base: 1,
  mid: 2,
  light: 3,
  bright: 4,
}

function wrapHue(h: number) {
  return ((h % 360) + 360) % 360
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function rand(min: number, max: number, rng: Rng) {
  return min + rng() * (max - min)
}

function pick<T>(items: readonly T[], rng: Rng) {
  return items[Math.floor(rng() * items.length)]
}

function shuffle<T>(items: T[], rng: Rng) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const swap = next[i]
    next[i] = next[j]
    next[j] = swap
  }
  return next
}

function satForHue(h: number, s: number) {
  const hue = wrapHue(h)
  if (hue >= 48 && hue <= 100)
    return Math.min(s, 58)
  if (hue >= 100 && hue <= 145)
    return Math.min(s, 64)
  return s
}

function toHex(h: number, s: number, l: number) {
  return tinycolor({
    h: wrapHue(h),
    s: clamp(satForHue(h, s), 0, 100) / 100,
    l: clamp(l, 5, 96) / 100,
  }).toHexString()
}

function inferRole(key: string, keys: string[]): ColorRole | 'slot' {
  const k = key.toLowerCase()
  if (/background|bgcolor|^bg$/.test(k))
    return 'ground'
  if (/dark|base/.test(k))
    return 'shade-dark'
  if (/mid/.test(k))
    return 'shade-mid'
  if (/bright/.test(k))
    return 'shade-light'
  if (/light/.test(k) && keys.some(name => /dark|base|mid|bright/i.test(name)))
    return 'shade-light'
  if (/heart|square|band/.test(k))
    return 'figure'
  return 'slot'
}

function roleOf(key: string, variables: Variables, keys: string[]): ColorRole | 'slot' {
  return variables[key]?.role ?? inferRole(key, keys)
}

function shadeRank(key: string, role: ColorRole | 'slot') {
  if (role === 'shade-dark')
    return 0
  if (role === 'shade-mid')
    return 2
  if (role === 'shade-light')
    return 3
  const k = key.toLowerCase()
  const hit = Object.keys(SHADE_RANK).find(name => k.includes(name))
  return hit ? SHADE_RANK[hit] : 99
}

function inferHarmony(harmony: ColorHarmony | undefined, roles: Array<ColorRole | 'slot'>): ColorHarmony {
  if (harmony)
    return harmony
  if (roles.some(role => String(role).startsWith('shade')))
    return 'ramp'
  if (roles.filter(role => role !== 'ground').length <= 1)
    return 'pair'
  if (roles.length <= 2)
    return 'pair'
  return 'set'
}

function schemeHues(base: number, count: number, rng: Rng) {
  const kind = pick([
    'analogous',
    'analogous',
    'analogous',
    'analogous',
    'tonal',
    'tonal',
    'tonal',
    'split',
    'complement',
  ] as const, rng)
  const hues: number[] = []

  for (let i = 0; i < count; i++) {
    if (kind === 'analogous')
      hues.push(base + [-20, 0, 14, 28][i % 4] + rand(-5, 5, rng))
    else if (kind === 'split')
      hues.push(base + [0, 18, 155, 205][i % 4] + rand(-6, 6, rng))
    else if (kind === 'tonal')
      hues.push(base + rand(-8, 8, rng))
    else
      hues.push(base + (i % 2 === 0 ? rand(-8, 8, rng) : 180 + rand(-10, 10, rng)))
  }

  return { kind, hues: hues.map(wrapHue) }
}

function inkSaturation(kind: string, index: number, l: number, rng: Rng) {
  const muted = (kind === 'complement' && index % 2 === 1)
    || (kind === 'split' && index >= 2)

  if (muted)
    return rand(12, 34, rng)
  if (l < 24 || l > 84)
    return rand(14, 40, rng)
  return rand(36, 68, rng)
}

function spreadLightness(values: number[], minDelta: number) {
  const next = [...values].sort((a, b) => a - b)
  for (let i = 1; i < next.length; i++) {
    if (next[i] - next[i - 1] < minDelta)
      next[i] = clamp(next[i - 1] + minDelta, 5, 96)
  }
  return next
}

function generateRamp(count: number, rng: Rng) {
  const h = rand(0, 360, rng)
  const greyscale = rng() < 0.18
  const s = greyscale ? rand(0, 10, rng) : rand(16, 50, rng)
  const lStart = rand(12, 30, rng)
  const lEnd = rand(70, 93, rng)

  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.45 : i / (count - 1)
    return toHex(h + (t - 0.5) * 8, s * (1 - t * 0.22), lStart + (lEnd - lStart) * t)
  })
}

function generatePair(rng: Rng, hasGround: boolean) {
  const h = rand(0, 360, rng)
  const relation = pick(['tonal', 'tonal', 'analogous', 'complement'] as const, rng)
  const h2 = relation === 'tonal'
    ? h + rand(-10, 10, rng)
    : relation === 'analogous'
      ? h + rand(18, 38, rng) * (rng() < 0.5 ? -1 : 1)
      : h + 180 + rand(-12, 12, rng)

  const groundDark = rng() < 0.62
  const groundL = groundDark ? rand(6, 18, rng) : rand(86, 95, rng)
  const figureL = groundDark ? rand(46, 74, rng) : rand(22, 44, rng)
  const groundS = relation === 'complement' ? rand(8, 28, rng) : rand(12, 42, rng)
  const figureS = rand(38, 78, rng)

  if (hasGround)
    return [toHex(h, groundS, groundL), toHex(h2, figureS, figureL)]

  return [
    toHex(h, rand(22, 58, rng), groundDark ? rand(10, 24, rng) : rand(72, 90, rng)),
    toHex(h2, figureS, figureL),
  ]
}

function generateSet(count: number, rng: Rng, hasGround: boolean) {
  const base = rand(0, 360, rng)
  const { kind, hues } = schemeHues(base, count, rng)

  if (hasGround) {
    const groundDark = rng() < 0.65
    const ground = toHex(
      hues[0],
      rand(8, 32, rng),
      groundDark ? rand(6, 18, rng) : rand(88, 95, rng),
    )
    const figureLights = spreadLightness(
      Array.from({ length: count - 1 }, () => (
        groundDark ? rand(40, 78, rng) : rand(22, 50, rng)
      )),
      14,
    )
    const figures = figureLights.map((l, i) => toHex(
      hues[i + 1] ?? hues[0],
      inkSaturation(kind, i + 1, l, rng),
      l,
    ))
    return [ground, ...figures]
  }

  const lights = spreadLightness(
    Array.from({ length: count }, (_, i) => {
      if (count === 3)
        return [rand(26, 38, rng), rand(48, 60, rng), rand(70, 82, rng)][i]
      if (count >= 4)
        return [rand(24, 36, rng), rand(42, 52, rng), rand(56, 66, rng), rand(72, 84, rng)][i % 4]
      return rand(28, 78, rng)
    }),
    10,
  )

  return shuffle(lights, rng).map((l, i) => toHex(
    hues[i],
    inkSaturation(kind, i, l, rng),
    l,
  ))
}

function generateColors(count: number, harmony: ColorHarmony, hasGround: boolean, rng: Rng) {
  if (count <= 0)
    return []
  if (harmony === 'ramp')
    return generateRamp(count, rng)
  if (count === 1 || harmony === 'pair' || count === 2)
    return generatePair(rng, hasGround).slice(0, count)
  return generateSet(count, rng, hasGround)
}

export function rollPalette(
  variables: Variables,
  options: { harmony?: ColorHarmony; rng?: Rng } = {},
) {
  const rng = options.rng ?? Math.random
  const keys = Object.entries(variables)
    .filter(([, variable]) => variable.type === 'color')
    .map(([key]) => key)

  if (!keys.length)
    return {} as Record<string, string>

  const roles = keys.map(key => roleOf(key, variables, keys))
  const harmony = inferHarmony(options.harmony, roles)
  const groundKeys = keys.filter((_, i) => roles[i] === 'ground')
  const colors = generateColors(keys.length, harmony, groundKeys.length > 0, rng)
  const assigned: Record<string, string> = {}

  if (harmony === 'ramp') {
    const ordered = [...keys].sort((a, b) => {
      return shadeRank(a, roleOf(a, variables, keys)) - shadeRank(b, roleOf(b, variables, keys))
    })
    ordered.forEach((key, i) => {
      assigned[key] = colors[i] ?? colors[colors.length - 1]
    })
    return assigned
  }

  const restKeys = keys.filter(key => !groundKeys.includes(key))
  groundKeys.forEach((key, i) => {
    assigned[key] = colors[i] ?? colors[0]
  })
  restKeys.forEach((key, i) => {
    assigned[key] = colors[groundKeys.length + i] ?? colors[colors.length - 1]
  })

  return assigned
}

export function rollTemplatePalette(template: Template, rng: Rng = Math.random) {
  return rollPalette(template.variables, { harmony: template.harmony, rng })
}

export function paletteMetrics(hex: string) {
  const hsl = tinycolor(hex).toHsl()
  return {
    h: hsl.h,
    s: hsl.s * 100,
    l: hsl.l * 100,
  }
}

export function hueDistance(a: number, b: number) {
  const d = Math.abs(wrapHue(a) - wrapHue(b)) % 360
  return Math.min(d, 360 - d)
}
