import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect'
import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import type { ReactNode } from 'react'
import { ActivityIndicator, Platform, Pressable, type StyleProp, StyleSheet, Text, View, type ViewStyle } from 'react-native'

/** One dark, neutral chrome everywhere, so the wallpaper is the only color on screen. */
export const theme = {
  bg: '#0b0b0c',
  card: '#17171a',
  line: 'rgba(255,255,255,0.1)',
  text: '#ffffff',
  dim: 'rgba(255,255,255,0.62)',
}

export type IconName = SymbolViewProps['name']

const glass = Platform.OS === 'ios' && isLiquidGlassAvailable()
const ripple = { color: 'rgba(255,255,255,0.2)', borderless: false }
const pressedStyle = ({ pressed }: { pressed: boolean }) => (pressed && Platform.OS === 'ios' ? { opacity: 0.6 } : undefined)

/** The surface for anything that floats over the wallpaper: Liquid Glass on iOS 26, a dark veil elsewhere. */
export function Floating({ style, children }: { style?: StyleProp<ViewStyle>, children: ReactNode }) {
  return glass
    ? <GlassView glassEffectStyle="regular" colorScheme="dark" style={style}>{children}</GlassView>
    : <View style={[styles.veil, style]}>{children}</View>
}

/** An icon over its label, for the bar at the bottom of a wallpaper. `primary` is the one big white action. */
export function DockButton({ icon, label, onPress, primary }: { icon: IconName, label: string, onPress: () => void, primary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ ...ripple, borderless: true, radius: 36 }}
      style={state => [styles.dockItem, pressedStyle(state)]}
    >
      {primary
        ? <View style={styles.dockPrimary}><SymbolView name={icon} size={26} tintColor="#000" weight="semibold" /></View>
        : (
            <>
              <SymbolView name={icon} size={24} tintColor={theme.text} />
              <Text style={styles.dockLabel} numberOfLines={1}>{label}</Text>
            </>
          )}
    </Pressable>
  )
}

interface PillProps {
  label: string
  onPress: () => void
  icon?: IconName
  /** `float` sits over the wallpaper, `raised` on a sheet or page, `solid` is the main action. */
  tone?: 'float' | 'raised' | 'solid'
  busy?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function Pill({ label, onPress, icon, tone = 'raised', busy, disabled, style }: PillProps) {
  const ink = tone === 'solid' ? '#000' : theme.text
  const content = (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy }}
      android_ripple={tone === 'solid' ? { color: 'rgba(0,0,0,0.15)' } : ripple}
      style={state => [styles.pill, tone === 'raised' && styles.raised, tone === 'solid' && styles.solid, disabled && styles.off, pressedStyle(state)]}
    >
      {busy
        ? <ActivityIndicator size="small" color={ink} />
        : (
            <>
              {icon && <SymbolView name={icon} size={18} tintColor={ink} />}
              <Text style={[styles.pillLabel, { color: ink }]} numberOfLines={1}>{label}</Text>
            </>
          )}
    </Pressable>
  )
  // The clip keeps the Android ripple inside the rounded shape.
  return tone === 'float'
    ? <Floating style={[styles.pillClip, style]}>{content}</Floating>
    : <View style={[styles.pillClip, style]}>{content}</View>
}

/** Pick one of a few: every choice stays visible, unlike a dropdown. */
export function Chips<T extends string | number>({ label, options, value, onChange }: {
  label: string
  options: { label: string, value: T }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map((option) => {
          const selected = option.value === value
          return (
            <View key={option.value} style={[styles.chipClip, selected ? styles.solid : styles.raised]}>
              <Pressable
                onPress={() => onChange(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                android_ripple={ripple}
                hitSlop={4}
                style={styles.chip}
              >
                <Text style={[styles.chipLabel, selected && { color: '#000' }]}>{option.label}</Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}

/** The top of a sheet: a grabber (Android draws none of its own) and the title, with an optional note on the right. */
export function SheetHeader({ title, note }: { title: string, note?: string }) {
  return (
    <View style={styles.sheetHeader}>
      {Platform.OS === 'android' && <View style={styles.grabber} />}
      <View style={styles.sheetTitle}>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {note && <Text style={styles.note} numberOfLines={1}>{note}</Text>}
      </View>
    </View>
  )
}

/** Height of `SheetHeader`, for lists that need to know it. */
export const SHEET_HEADER = 68

/** A titled card of controls, with an optional note under it. */
export function Section({ title, footer, children }: { title?: string, footer?: string, children: ReactNode }) {
  return (
    <View style={styles.section}>
      {title && <Text style={styles.sectionTitle} accessibilityRole="header">{title}</Text>}
      <View style={styles.card}>{children}</View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  )
}

export const styles = StyleSheet.create({
  veil: { backgroundColor: 'rgba(16,16,18,0.78)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.16)' },
  raised: { backgroundColor: 'rgba(255,255,255,0.1)' },
  solid: { backgroundColor: theme.text },
  off: { opacity: 0.4 },

  dock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginHorizontal: 12, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 36, borderCurve: 'continuous', overflow: 'hidden' },
  dockItem: { flex: 1, height: 60, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dockPrimary: { width: 60, height: 60, borderRadius: 30, backgroundColor: theme.text, alignItems: 'center', justifyContent: 'center' },
  dockLabel: { color: theme.text, fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },

  pillClip: { borderRadius: 22, borderCurve: 'continuous', overflow: 'hidden', alignSelf: 'flex-start' },
  pill: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pillLabel: { fontSize: 14, fontWeight: '600' },

  field: { gap: 10 },
  fieldLabel: { color: theme.text, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipClip: { borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden' },
  chip: { minHeight: 40, paddingHorizontal: 14, justifyContent: 'center' },
  chipLabel: { color: theme.text, fontSize: 14, fontWeight: '500' },

  section: { gap: 8 },
  sectionTitle: { color: theme.dim, fontSize: 13, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase', marginLeft: 4 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderCurve: 'continuous', padding: 16, gap: 18 },
  footer: { color: theme.dim, fontSize: 13, lineHeight: 18, marginHorizontal: 4 },

  sheetHeader: { height: SHEET_HEADER, backgroundColor: theme.card, paddingHorizontal: 20 },
  grabber: { alignSelf: 'center', marginTop: 10, width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  sheetTitle: { position: 'absolute', left: 20, right: 20, bottom: 10, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 },
  note: { color: theme.dim, fontSize: 14, flexShrink: 1 },

  page: { padding: 16, gap: 24 },
  title: { color: theme.text, fontSize: 22, fontWeight: '700' },
})
