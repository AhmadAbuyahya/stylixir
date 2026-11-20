import { useEffect, useMemo, useRef } from 'react'
import { type StyleProp, type ViewStyle } from 'react-native'
import { WebView, type WebViewMessageEvent } from 'react-native-webview'
import type { ExportSpec } from '~/lib/exportImage'
import type { Look } from '~/lib/recipe'
import { setExporter } from '@/lib/canvas'
import { frameFor, glideFrames } from '@/lib/studio'
import html from '@/renderer/html'

type Reply = { ready?: true, id?: number, data?: string, error?: string }

// shortcut: react-native-webview 14's default type argument (undefined) breaks `ref` under React 19 types; drop once its typings are fixed.
const Canvas = WebView<object>

const paintScript = (frame: ReturnType<typeof frameFor>) => `window.stylixir.paint(${JSON.stringify(frame)});true;`
const glideScript = (frames: ReturnType<typeof frameFor>[]) => `window.stylixir.glide(${JSON.stringify(frames)},450);true;`

/**
 * Paints the look with the website's own engine. CSS patterns need a browser engine to draw
 * (conic gradients, calc, custom properties), so this is a WebView with no chrome, no scrolling
 * and no touch: everything you touch around it is native.
 */
export function PatternCanvas({ look, style }: { look: Look, style?: StyleProp<ViewStyle> }) {
  const view = useRef<InstanceType<typeof Canvas>>(null)
  const ready = useRef(false)
  const waiting = useRef(new Map<number, { resolve: (data: string) => void, reject: (error: Error) => void }>())
  const nextId = useRef(0)
  const frame = useMemo(() => frameFor(look), [look])
  const latest = useRef(frame)
  const shown = useRef(look)

  // Several dials changing at once (roll colors) glide; a new pattern or a slider drag paints straight away.
  useEffect(() => {
    const frames = glideFrames(shown.current, look)
    shown.current = look
    latest.current = frame
    if (ready.current)
      view.current?.injectJavaScript(frames ? glideScript(frames) : paintScript(frame))
  }, [frame, look])

  useEffect(() => {
    setExporter((spec: ExportSpec) => new Promise((resolve, reject) => {
      const id = nextId.current++
      waiting.current.set(id, { resolve, reject })
      view.current?.injectJavaScript(`window.stylixir.exportImage(${id}, ${JSON.stringify(spec)});true;`)
    }))
    return () => setExporter(undefined)
  }, [])

  const onMessage = (event: WebViewMessageEvent) => {
    const reply: Reply = JSON.parse(event.nativeEvent.data)
    if (reply.ready) {
      ready.current = true
      view.current?.injectJavaScript(paintScript(latest.current))
      return
    }
    const pending = reply.id === undefined ? undefined : waiting.current.get(reply.id)
    if (!pending)
      return
    waiting.current.delete(reply.id!)
    if (reply.data)
      pending.resolve(reply.data)
    else
      pending.reject(new Error(reply.error ?? 'Could not make the image.'))
  }

  return (
    <Canvas
      ref={view}
      source={{ html }}
      originWhitelist={['*']}
      onMessage={onMessage}
      style={[{ backgroundColor: '#000' }, style]}
      containerStyle={style}
      pointerEvents="none"
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never"
      automaticallyAdjustContentInsets={false}
      setSupportMultipleWindows={false}
      webviewDebuggingEnabled={__DEV__}
    />
  )
}
