import type { PatternFrame } from '~/lib/effects'

export type ImageFormat = 'png' | 'jpeg' | 'webp'

export interface SizePreset {
  id: string
  label: string
  hint: string
  /** Layout size in CSS pixels, so the pattern keeps the scale it has on that screen. */
  width: number
  height: number
  /** Render ratio, the screen's pixel density. The file is `renderSize(width, height, scale)`. */
  scale: number
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'hd', label: 'HD desktop', hint: '1920 × 1080', width: 1920, height: 1080, scale: 1 },
  { id: 'qhd', label: 'QHD desktop', hint: '2560 × 1440', width: 2560, height: 1440, scale: 1 },
  { id: 'uhd', label: '4K desktop', hint: '3840 × 2160', width: 3840, height: 2160, scale: 1 },
  { id: 'ultrawide', label: 'Ultrawide', hint: '3440 × 1440', width: 3440, height: 1440, scale: 1 },
  { id: 'phone', label: 'Phone', hint: '1170 × 2532', width: 390, height: 844, scale: 3 },
  { id: 'tablet', label: 'Tablet', hint: '2048 × 2732', width: 1024, height: 1366, scale: 2 },
]

export const MAX_SIDE = 7680
export const MAX_PIXELS = 16_777_216

export interface ExportSpec {
  width: number
  height: number
  format: ImageFormat
  quality: number
  pixelRatio: number
  slug: string
  /** A still frame (no motion); leave its overlay out to export without one. */
  frame: PatternFrame
}

export function clampDimension(value: number) {
  if (!Number.isFinite(value))
    return 1
  return Math.min(MAX_SIDE, Math.max(1, Math.round(value)))
}

/** The file's real pixel size: the capture is sized to it, so a fractional ratio is truncated like a canvas. */
export function renderSize(width: number, height: number, pixelRatio: number) {
  return {
    width: Math.trunc(clampDimension(width) * pixelRatio),
    height: Math.trunc(clampDimension(height) * pixelRatio),
  }
}

export function outputPixels(width: number, height: number, pixelRatio: number) {
  return clampDimension(width) * clampDimension(height) * pixelRatio * pixelRatio
}

export function canUsePixelRatio(width: number, height: number, pixelRatio: number) {
  const { width: w, height: h } = renderSize(width, height, pixelRatio)
  return w <= MAX_SIDE && h <= MAX_SIDE && w * h <= MAX_PIXELS
}

/**
 * The device's screen as a CSS layout size plus a render ratio, so the export looks
 * like the screen at its physical resolution. A screen past the export limits keeps
 * its layout and gets a lower ratio. iOS reports `screen` in portrait whatever the
 * rotation, so the caller says which way the screen is turned.
 */
export function screenSize(screenWidth: number, screenHeight: number, devicePixelRatio: number, landscape: boolean) {
  const long = clampDimension(Math.max(screenWidth, screenHeight))
  const short = clampDimension(Math.min(screenWidth, screenHeight))
  const scale = Math.min(devicePixelRatio, MAX_SIDE / long, Math.sqrt(MAX_PIXELS / (long * short)))
  return landscape
    ? { width: long, height: short, scale }
    : { width: short, height: long, scale }
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

/** Splits a CSS list on its top-level commas, so `url("a,b")` and `min(1px, 2px)` stay whole. */
export function splitList(value: string) {
  const items: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    if (quote) {
      if (char === quote && value[i - 1] !== '\\')
        quote = ''
    }
    else if (char === '"' || char === '\'') {
      quote = char
    }
    else if (char === '(') {
      depth++
    }
    else if (char === ')') {
      depth--
    }
    else if (char === ',' && depth === 0) {
      items.push(value.slice(start, i).trim())
      start = i + 1
    }
  }
  items.push(value.slice(start).trim())
  return items
}

function flattenBackground(el: HTMLElement) {
  const computed = getComputedStyle(el)
  const layers = splitList(computed.backgroundImage).length
  // WebKit keeps a short list (one size for four layers) as is, and html-to-image copies its
  // `background` shorthand, which then drops the size, position and repeat of every layer
  // after the first. One entry per layer survives that.
  const perLayer = (value: string) => {
    const items = splitList(value)
    return Array.from({ length: layers }, (_, i) => items[i % items.length]).join(', ')
  }
  el.style.backgroundImage = computed.backgroundImage
  el.style.backgroundColor = computed.backgroundColor
  el.style.backgroundSize = perLayer(computed.backgroundSize)
  el.style.backgroundPosition = perLayer(computed.backgroundPosition)
  el.style.backgroundRepeat = perLayer(computed.backgroundRepeat)
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

  // Texture tiles (grain, paper, riso ink) are painted straight onto the canvas
  // afterwards (see `paintTexture`): their SVG noise does not survive
  // html-to-image's foreignObject capture.
  for (const layer of ['light', 'overlay', 'material'] as const) {
    const css = frame[layer]
    if (!css || textureSrc(css))
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
    image.onerror = () => reject(new Error('Could not load a texture.'))
    image.src = src
  })
}

function textureSrc(css: Record<string, string>) {
  return css['background-image']?.match(/^url\("(data:image\/svg\+xml,.*)"\)$/)?.[1]
}

/** Composites a texture layer over a finished capture, matching its CSS tile size and blend. */
async function paintTexture(canvas: HTMLCanvasElement, texture: Record<string, string>, pixelRatio: number) {
  const src = textureSrc(texture)
  const ctx = canvas.getContext('2d')
  if (!src || !ctx)
    return

  const image = await loadImage(src)
  const size = Number.parseFloat(texture['background-size'] ?? '') || image.width
  const tile = document.createElement('canvas')
  tile.width = size * pixelRatio
  tile.height = size * pixelRatio
  tile.getContext('2d')?.drawImage(image, 0, 0, tile.width, tile.height)

  const pattern = ctx.createPattern(tile, 'repeat')
  if (!pattern)
    return
  ctx.save()
  ctx.globalAlpha = Number(texture.opacity ?? 1)
  ctx.globalCompositeOperation = (texture['mix-blend-mode'] ?? 'overlay') as GlobalCompositeOperation
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
    // Firefox rasterizes the SVG capture at its own size and stretches the bitmap for any
    // `pixelRatio` above 1, softening every edge (a transform stretches it the same way).
    // So capture at 1 the size of the file and `zoom` the content, which it lays out and
    // paints at full resolution. shortcut: Firefox before 126 has no `zoom` and would export
    // the pattern unscaled in a corner; drop this once those are gone.
    const file = renderSize(spec.width, spec.height, pixelRatio)
    const canvas = await toCanvas(root, {
      pixelRatio: 1,
      width: file.width,
      height: file.height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        zoom: String(pixelRatio),
      } as Partial<CSSStyleDeclaration>, // `zoom` is missing from this lib.dom
      fontEmbedCSS: '',
      cacheBust: false,
      skipAutoScale: true,
    })
    for (const layer of ['material', 'grain'] as const) {
      const texture = spec.frame[layer]
      if (texture)
        await paintTexture(canvas, texture, pixelRatio)
    }
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
