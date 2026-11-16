// The mobile app's pattern view. React Native owns the look, sends finished frames
// here to paint, and asks for image exports; see mobile/src/components/pattern-canvas.tsx.
import { FRAME_LAYERS, type PatternFrame } from '~/lib/effects'
import { type ExportSpec, renderPatternBlob } from '~/lib/exportImage'

const root = document.getElementById('root') as HTMLElement
const rules = document.getElementById('frame-css') as HTMLStyleElement

function paint(frame: PatternFrame) {
  root.replaceChildren(...FRAME_LAYERS.filter(layer => frame[layer]).map((layer) => {
    const el = document.createElement('div')
    Object.entries(frame[layer] ?? {}).forEach(([property, value]) => el.style.setProperty(property, value))
    return el
  }))
  if (frame.filterMarkup)
    root.insertAdjacentHTML('beforeend', frame.filterMarkup)
  rules.textContent = frame.css
}

function reply(message: object) {
  (window as unknown as { ReactNativeWebView?: { postMessage: (data: string) => void } })
    .ReactNativeWebView?.postMessage(JSON.stringify(message))
}

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function exportImage(id: number, spec: ExportSpec) {
  try {
    reply({ id, data: await toBase64(await renderPatternBlob(spec)) })
  }
  catch (error) {
    reply({ id, error: String(error) })
  }
}

Object.assign(window, { stylixir: { paint, exportImage } })
reply({ ready: true })
