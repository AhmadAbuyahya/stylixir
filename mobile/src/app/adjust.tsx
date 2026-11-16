import { Host, Slider } from '@expo/ui'
import * as Haptics from 'expo-haptics'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { EFFECT_DIALS, type Material } from '~/lib/effects'
import { Chips, Pill, Section, SheetHeader, theme, styles as ui } from '@/components/ui'
import { colorsOf, dialsOf, patternName, useStudio } from '@/lib/studio'

const MATERIALS: { label: string, value: Material }[] = [
  { label: 'None', value: 'none' },
  { label: 'Paper', value: 'paper' },
  { label: 'Linen', value: 'linen' },
  { label: 'Embossed', value: 'embossed' },
  { label: 'Riso', value: 'riso' },
]

// A few of the site's overlays, named for what they do to a wallpaper.
const SHADES = [
  { label: 'None', value: 'none' },
  { label: 'Vignette', value: 'radial-gradient-center' },
  { label: 'Dim', value: 'opacity' },
  { label: 'Dark bottom', value: 'linear-gradient-bottom' },
  { label: 'Dark top', value: 'linear-gradient-top' },
]

// Material tints a palette from any seed color, so on Android the slider's two roles are pinned to neutrals instead.
const sliderTheme: object = Platform.OS === 'android'
  ? { colorOverrides: { primary: theme.text, secondaryContainer: '#3a3a3e' } }
  : { seedColor: theme.text }

function label(key: string) {
  const words = key.replace(/([a-z])([A-Z0-9])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function Dial({ name, value, min, max, step, onChange, percent }: {
  name: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  percent?: boolean
}) {
  return (
    <View style={styles.dial}>
      <View style={styles.dialHead}>
        <Text style={ui.fieldLabel}>{name}</Text>
        <Text style={styles.value}>{percent ? `${Math.round(value * 100)}%` : String(Math.round(value * 100) / 100)}</Text>
      </View>
      <Host matchContents={{ vertical: true }} colorScheme="dark" style={styles.slider} {...sliderTheme}>
        {/* Continuous track, rounded to the step: a stepped Material slider draws a tick for every step. */}
        <Slider value={value} min={min} max={max} onValueChange={v => onChange(step ? +(Math.round(v / step) * step).toFixed(4) : v)} />
      </Host>
    </View>
  )
}

export default function AdjustSheet() {
  const look = useStudio(s => s.look)
  const { setValue, setEffects, setOverlay, rollColors } = useStudio.getState()
  const { effects, overlay } = look
  const dials = dialsOf(look.template)

  return (
    <ScrollView style={styles.sheet} stickyHeaderIndices={[0]} nestedScrollEnabled>
      <SheetHeader title={patternName(look.template)} />
      <View style={[ui.page, styles.content]}>

      {dials.length > 0 && (
        <Section title="Shape">
          {dials.map(([key, v]) => (
            <Dial key={key} name={label(key)} value={Number(look.values[key])} min={v.min ?? 0} max={v.max ?? 100} step={v.step} onChange={value => setValue(key, value)} />
          ))}
        </Section>
      )}

      <Section title="Colors">
        <View style={styles.colors}>
          <View style={styles.swatches} accessibilityLabel="Current colors">
            {colorsOf(look.template).map(([key]) => <View key={key} style={[styles.swatch, { backgroundColor: String(look.values[key]) }]} />)}
          </View>
          <Pill
            icon={{ ios: 'paintpalette', android: 'palette' }}
            label="New colors"
            onPress={() => {
              Haptics.selectionAsync()
              rollColors()
            }}
          />
        </View>
      </Section>

      <Section title="Finish">
        <Chips label="Material" value={effects.material} options={MATERIALS} onChange={material => setEffects({ material })} />
        {effects.material !== 'none' && (
          <Dial name="Material strength" value={effects.materialStrength} min={0.05} max={1} step={0.01} percent onChange={materialStrength => setEffects({ materialStrength })} />
        )}
        <Dial name="Grain" value={effects.grain} min={0} max={1} step={0.01} percent onChange={grain => setEffects({ grain })} />
        <Dial name="Light" value={effects.light} min={0} max={1} step={0.01} percent onChange={light => setEffects({ light })} />
        <Dial name="Warp" value={effects.warp} min={0} max={EFFECT_DIALS.warp.max} step={1} onChange={warp => setEffects({ warp })} />
      </Section>

      <Section title="Shade">
        <Chips label="Style" value={SHADES.some(s => s.value === overlay.overlayType) ? overlay.overlayType : 'none'} options={SHADES} onChange={overlayType => setOverlay({ overlayType })} />
        {overlay.overlayType !== 'none' && (
          <Dial name="Intensity" value={overlay.overlayOpacity} min={0} max={1} step={0.01} percent onChange={overlayOpacity => setOverlay({ overlayOpacity })} />
        )}
      </Section>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: theme.card },
  content: { paddingTop: 8, paddingBottom: 48 },
  dial: { gap: 2 },
  dialHead: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { color: theme.dim, fontSize: 15, fontVariant: ['tabular-nums'] },
  slider: { width: '100%' },
  colors: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swatches: { flexDirection: 'row', gap: 8 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: theme.line },
})
