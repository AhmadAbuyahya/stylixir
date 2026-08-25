export type ImageFormat = 'png' | 'jpeg' | 'webp'

export interface SizePreset {
  id: string
  label: string
  hint: string
  width: number
  height: number
}

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'square', label: 'Square', hint: '1080 × 1080', width: 1080, height: 1080 },
  { id: 'hd', label: 'HD', hint: '1920 × 1080', width: 1920, height: 1080 },
  { id: 'qhd', label: 'QHD', hint: '2560 × 1440', width: 2560, height: 1440 },
  { id: 'uhd', label: '4K', hint: '3840 × 2160', width: 3840, height: 2160 },
  { id: 'story', label: 'Story', hint: '1080 × 1920', width: 1080, height: 1920 },
  { id: 'og', label: 'Open Graph', hint: '1200 × 630', width: 1200, height: 630 },
]

export const MAX_SIDE = 7680
export const MAX_PIXELS = 16_777_216

export interface ExportSpec {
  width: number
  height: number
  format: ImageFormat
  quality: number
  pixelRatio: 1 | 2
  includeOverlay: boolean
  slug: string
  patternStyle: Record<string, string>
  overlayStyle: Record<string, string>
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

  const pattern = doc.createElement('div')
  pattern.style.cssText = 'position:absolute;inset:0;'
  applyCss(pattern, spec.patternStyle)

  if (spec.includeOverlay) {
    const blur = overlayBlurPx(spec.overlayStyle)
    if (blur > 0)
      pattern.style.filter = `blur(${blur}px)`
  }

  root.append(pattern)

  if (spec.includeOverlay) {
    const background = spec.overlayStyle.background
    if (background && background !== 'none') {
      const overlay = doc.createElement('div')
      overlay.style.cssText = 'position:absolute;inset:0;'
      overlay.style.background = background
      root.append(overlay)
    }
  }

  doc.body.append(root)
  return { iframe, pattern, width, height }
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
