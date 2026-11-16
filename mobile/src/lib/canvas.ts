import { File, Paths } from 'expo-file-system'
import { Dimensions, PixelRatio } from 'react-native'
import type { ExportSpec } from '~/lib/exportImage'
import { screenSize } from '~/lib/exportImage'
import { encodeRecipe, type Look } from '~/lib/recipe'
import { frameFor } from '@/lib/studio'

/** Set by the Create screen's pattern view, which is the only WebView that paints and exports. */
let exporter: ((spec: ExportSpec) => Promise<string>) | undefined

export function setExporter(next: typeof exporter) {
  exporter = next
}

let last: { recipe: string, file: File } | undefined

/** The look as a PNG the size of this phone's screen, at its pixel density. Reuses the last render when nothing changed. */
export async function renderWallpaper(look: Look) {
  const recipe = encodeRecipe(look)
  if (last?.recipe === recipe && last.file.exists)
    return last.file
  if (!exporter)
    throw new Error('The pattern view is not ready yet.')
  const screen = Dimensions.get('screen')
  const { width, height, scale } = screenSize(screen.width, screen.height, PixelRatio.get(), false)
  const data = await exporter({ width, height, format: 'png', quality: 1, pixelRatio: scale, slug: look.template, frame: frameFor(look) })
  const file = new File(Paths.cache, `wallpaper-${Date.now()}.png`)
  file.writeSync(data, { encoding: 'base64' })
  last = { recipe, file }
  return file
}
