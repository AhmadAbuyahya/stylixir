import { GRAIN_TILE, type PatternFrame } from '~/lib/effects'

export type ImageFormat = 'png' | 'jpeg' | 'webp'

export interface SizePreset {
  id: string
  label: string
  hint: string
  width: number
  height: number
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'hd', label: 'HD desktop', hint: '1920 × 1080', width: 1920, height: 1080 },
  { id: 'qhd', label: 'QHD desktop', hint: '2560 × 1440', width: 2560, height: 1440 },
  { id: 'uhd', label: '4K desktop', hint: '3840 × 2160', width: 3840, height: 2160 },
  { id: 'ultrawide', label: 'Ultrawide', hint: '3440 × 1440', width: 3440, height: 1440 },
  { id: 'phone', label: 'Phone', hint: '1170 × 2532', width: 1170, height: 2532 },
  { id: 'tablet', label: 'Tablet', hint: '2048 × 2732', width: 2048, height: 2732 },
]

export const MAX_SIDE = 7680
export const MAX_PIXELS = 16_777_216

export interface ExportSpec {
  width: number
  height: number
  format: ImageFormat
  quality: number
  pixelRatio: 1 | 2
  slug: string
  /** A still frame (no motion); leave its overlay out to export without one. */
  frame: PatternFrame
}

export function clampDimension(value: number) {
  if (!Number.isFinite(value))
    return 1
  return Math.min(MAX_SIDE, Math.max(1, Math.round(value)))
}

export function outputPixels(width: number, height: number, pixelRatio: number) {
  return clampDimension(width) * clampDimension(height) * pixelRatio * pixelRatio
}

export function canUsePixelRatio(width: number, height: number, pixelRatio: number) {
  const w = clampDimension(width) * pixelRatio
  const h = clampDimension(height) * pixelRatio
  return w <= MAX_SIDE && h <= MAX_SIDE && w * h <= MAX_PIXELS
}

/**
 * The device's screen in physical pixels, scaled down (keeping its shape) to fit
 * the export limits. iOS reports `screen` in portrait whatever the rotation, so the
 * caller says which way the screen is turned.
 */
export function screenSize(screenWidth: number, screenHeight: number, devicePixelRatio: number, landscape: boolean) {
  const long = Math.max(screenWidth, screenHeight) * devicePixelRatio
  const short = Math.min(screenWidth, screenHeight) * devicePixelRatio
  const scale = Math.min(1, MAX_SIDE / long, Math.sqrt(MAX_PIXELS / (long * short)))
  // Floor once scaled so rounding can never push the result past a limit.
  const fit = (side: number) => clampDimension(scale < 1 ? Math.floor(side * scale) : side)
  return landscape
    ? { width: fit(long), height: fit(short) }
    : { width: fit(short), height: fit(long) }
}

export function exportFilename(slug: string, width: number, height: number, format: ImageFormat, pixelRatio: number) {
  const safe = slug.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'pattern'
  const ratio = pixelRatio === 2 ? '@2x' : ''
  return `stylixir-${safe}-${width}x${height}${ratio}.${format === 'jpeg' ? 'jpg' : format}`
}

function applyCss(el: HTMLElement, css: Record<string, string>) {
  Object.entries(css).forEach(([property, value]) => {
    el.style.setProperty(property, value)
  })
}

function overlayBlurPx(overlayStyle: Record<string, string>) {
  const raw = overlayStyle['backdrop-filter'] || overlayStyle.backdropFilter || ''
  const match = String(raw).match(/blur\(([\d.]+)px\)/)
  return match ? Number(match[1]) : 0
}

function nextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

function flattenBackground(el: HTMLElement) {
  const computed = getComputedStyle(el)
  el.style.backgroundImage = computed.backgroundImage
  el.style.backgroundColor = computed.backgroundColor
  el.style.backgroundSize = computed.backgroundSize
  el.style.backgroundPosition = computed.backgroundPosition
  el.style.backgroundRepeat = computed.backgroundRepeat
}

function mountExportFrame(spec: ExportSpec) {
  const width = clampDimension(spec.width)
  const height = clampDimension(spec.height)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.setAttribute('data-stylixir-export', '')
  iframe.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${width}px`,
    `height:${height}px`,
    'border:0',
    'opacity:0',
    'pointer-events:none',
    'z-index:0',
  ].join(';')

  document.body.append(iframe)
  const doc = iframe.contentDocument
  if (!doc)
    throw new Error('Could not export the image.')

  doc.body.style.margin = '0'
  doc.body.style.padding = '0'
  doc.body.style.overflow = 'hidden'

  const root = doc.createElement('div')
  root.style.cssText = [
    'position:relative',
    `width:${width}px`,
    `height:${height}px`,
    'overflow:hidden',
  ].join(';')

  root.style.isolation = 'isolate'

  const { frame } = spec
  const pattern = doc.createElement('div')
  applyCss(pattern, frame.pattern)

  // html-to-image does not paint backdrop-filter, so the overlay's blur is
  // applied to the pattern itself instead.
  const blur = frame.overlay ? overlayBlurPx(frame.overlay) : 0
  if (blur > 0)
    pattern.style.filter = [frame.pattern.filter, `blur(${blur}px)`].filter(Boolean).join(' ')

  root.append(pattern)

  // Grain is painted straight onto the canvas afterwards (see `paintGrain`):
  // its SVG noise tile does not survive html-to-image's foreignObject capture.
  for (const layer of ['light', 'overlay'] as const) {
    const css = frame[layer]
    if (!css)
      continue
    const el = doc.createElement('div')
    applyCss(el, css)
    el.style.removeProperty('backdrop-filter')
    root.append(el)
  }

  // Cloned into the capture with the rest of the root, so `url(#…)` still resolves.
  if (frame.filterMarkup)
    root.insertAdjacentHTML('beforeend', frame.filterMarkup)

  doc.body.append(root)
  return { iframe, pattern, width, height }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load the grain texture.'))
    image.src = src
  })
}

/** Composites the frame's grain layer over a finished capture, matching its CSS blend. */
async function paintGrain(canvas: HTMLCanvasElement, grain: Record<string, string>, pixelRatio: number) {
  const src = grain['background-image']?.match(/^url\("(.*)"\)$/)?.[1]
  const ctx = canvas.getContext('2d')
  if (!src || !ctx)
    return

  const image = await loadImage(src)
  const tile = document.createElement('canvas')
  tile.width = GRAIN_TILE * pixelRatio
  tile.height = GRAIN_TILE * pixelRatio
  tile.getContext('2d')?.drawImage(image, 0, 0, tile.width, tile.height)

  const pattern = ctx.createPattern(tile, 'repeat')
  if (!pattern)
    return
  ctx.save()
  ctx.globalAlpha = Number(grain.opacity ?? 1)
  ctx.globalCompositeOperation = (grain['mix-blend-mode'] ?? 'overlay') as GlobalCompositeOperation
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()
}

function canvasToBlob(canvas: HTMLCanvasElement, format: ImageFormat, quality: number) {
  const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
  const q = format === 'png' ? undefined : quality
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob)
        resolve(blob)
      else
        reject(new Error('Could not encode the image.'))
    }, mime, q)
  })
}

export async function renderPatternBlob(spec: ExportSpec) {
  const { iframe, pattern, width, height } = mountExportFrame(spec)
  try {
    await nextFrame()
    await nextFrame()
    flattenBackground(pattern)
    const { toCanvas } = await import('html-to-image')
    const pixelRatio = canUsePixelRatio(spec.width, spec.height, spec.pixelRatio)
      ? spec.pixelRatio
      : 1
    const root = pattern.parentElement
    if (!root)
      throw new Error('Could not export the image.')
    const canvas = await toCanvas(root, {
      pixelRatio,
      width,
      height,
      fontEmbedCSS: '',
      cacheBust: false,
      skipAutoScale: true,
    })
    if (spec.frame.grain)
      await paintGrain(canvas, spec.frame.grain, pixelRatio)
    return canvasToBlob(canvas, spec.format, spec.quality)
  }
  finally {
    iframe.remove()
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyImageBlob(blob: Blob) {
  const png = blob.type === 'image/png'
    ? blob
    : await blobToPng(blob)
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': png }),
  ])
}

async function blobToPng(blob: Blob) {
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx)
    throw new Error('Could not convert the image.')
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvasToBlob(canvas, 'png', 1)
}
