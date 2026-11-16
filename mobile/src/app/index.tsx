import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PatternCanvas } from '@/components/pattern-canvas'
import { DockButton, Floating, Pill, styles as ui } from '@/components/ui'
import { useStudio } from '@/lib/studio'

export default function CreateScreen() {
  const look = useStudio(s => s.look)
  const canUndo = useStudio(s => s.history.length > 0)
  const { shuffle, rollColors, undo } = useStudio.getState()
  const insets = useSafeAreaInsets()
  // The hook, not the global `router`: expo-router 58 unbinds the global when the app starts from a background task.
  const router = useRouter()
  // Tapping the wallpaper hides everything else, to see it as it will look on the phone.
  const [controls, setControls] = useState(true)

  return (
    <View style={styles.screen}>
      <StatusBar style="light" hidden={!controls} />
      <PatternCanvas look={look} style={StyleSheet.absoluteFill} />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => setControls(c => !c)}
        accessibilityLabel={controls ? 'Hide controls' : 'Show controls'}
      />
      {controls && (
        <>
          <View style={[styles.top, { top: insets.top + 8 }]}>
            <Pill tone="float" icon={{ ios: 'photo.on.rectangle', android: 'photo_library' }} label="Library" onPress={() => router.push('/library')} />
            <Pill tone="float" icon={{ ios: 'arrow.triangle.2.circlepath', android: 'autorenew' }} label="Auto" onPress={() => router.push('/auto')} />
          </View>
          <View style={[styles.bottom, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
            {canUndo && <Pill tone="float" icon={{ ios: 'arrow.uturn.backward', android: 'undo' }} label="Undo" onPress={undo} style={styles.undo} />}
            <Floating style={ui.dock}>
              <DockButton icon={{ ios: 'square.grid.2x2', android: 'grid_view' }} label="Patterns" onPress={() => router.push('/patterns')} />
              <DockButton
                icon={{ ios: 'paintpalette', android: 'palette' }}
                label="Colors"
                onPress={() => {
                  Haptics.selectionAsync()
                  rollColors()
                }}
              />
              <DockButton
                primary
                icon={{ ios: 'shuffle', android: 'shuffle' }}
                label="Shuffle"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  shuffle()
                }}
              />
              <DockButton icon={{ ios: 'slider.horizontal.3', android: 'tune' }} label="Adjust" onPress={() => router.push('/adjust')} />
              <DockButton icon={{ ios: 'square.and.arrow.down', android: 'download' }} label="Save" onPress={() => router.push('/save')} />
            </Floating>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between' },
  bottom: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 12 },
  undo: { alignSelf: 'center' },
})
