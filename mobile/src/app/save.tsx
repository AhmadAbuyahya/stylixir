import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Sharing from 'expo-sharing'
import { SymbolView } from 'expo-symbols'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { encodeRecipe } from '~/lib/recipe'
import { type IconName, Pill, SheetHeader, theme, styles as ui } from '@/components/ui'
import { useAuto } from '@/lib/auto'
import { renderWallpaper } from '@/lib/canvas'
import { notify, readable } from '@/lib/errors'
import { imageOf, useLibrary } from '@/lib/library'
import { saveToPhotos } from '@/lib/photos'
import { useStudio } from '@/lib/studio'
import { canSetWallpaper, type Screen, screenChoices, setWallpaper } from '@/lib/wallpaper'

type Action = Screen | 'photos' | 'library' | 'share'

const DONE: Record<Exclude<Action, 'share'>, string> = {
  home: 'Wallpaper set',
  lock: 'Wallpaper set',
  both: 'Wallpaper set',
  photos: 'Saved to Photos',
  library: 'Saved to Library',
}

/** Everything you can do with a wallpaper: the one being made, or with `?id=`, one already in the Library. */
export default function SaveSheet() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const saved = useLibrary(s => s.items.find(item => item.id === id))
  const add = useLibrary(s => s.add)
  // The hook, not the global `router`: expo-router 58 unbinds the global when the app starts from a background task.
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [busy, setBusy] = useState<Action>()

  async function run(action: Action) {
    setBusy(action)
    try {
      const look = useStudio.getState().look
      const png = saved ? imageOf(saved) : await renderWallpaper(look)
      if (action === 'share') {
        await Sharing.shareAsync(png.uri, { mimeType: 'image/png', dialogTitle: 'Share wallpaper' })
        return
      }
      // Everything you set or save also lands in the Library, which Auto picks from.
      const item = saved ?? add(png, encodeRecipe(look))
      if (action === 'photos')
        await saveToPhotos(png.uri)
      if (action === 'home' || action === 'lock' || action === 'both') {
        await setWallpaper(png.uri, action)
        // So Auto's next change moves on from this one.
        useAuto.getState().update({ lastId: item.id })
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      notify(DONE[action])
      router.back()
    }
    catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Couldn\'t do that', readable(error))
    }
    finally {
      setBusy(undefined)
    }
  }

  const row = (action: Action, icon: IconName, title: string, hint: string) => (
    <Pressable
      onPress={() => run(action)}
      disabled={!!busy}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
      style={[styles.row, !!busy && busy !== action && ui.off]}
    >
      <SymbolView name={icon} size={24} tintColor={theme.text} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      {busy === action && <ActivityIndicator size="small" color={theme.text} />}
    </Pressable>
  )

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
      <SheetHeader title={canSetWallpaper ? 'Set as wallpaper' : 'Save wallpaper'} />
      <View style={styles.set}>
        {canSetWallpaper && (
          <View style={styles.screens}>
            {screenChoices.map(choice => (
              <Pill
                key={choice.value}
                label={choice.label}
                tone={choice.value === 'both' ? 'solid' : 'raised'}
                busy={busy === choice.value}
                disabled={!!busy && busy !== choice.value}
                onPress={() => run(choice.value)}
                style={styles.screen}
              />
            ))}
          </View>
        )}
      </View>
      {!saved && row('library', { ios: 'square.stack', android: 'bookmark' }, 'Save to Library', 'Keep it in the app, for Auto to pick from')}
      {row('photos', { ios: 'photo.badge.plus', android: 'add_photo_alternate' }, 'Save to Photos', 'Into a Stylixir album')}
      {row('share', { ios: 'square.and.arrow.up', android: 'share' }, 'Share', 'Send the image to another app')}
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { backgroundColor: theme.card },
  set: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  screens: { flexDirection: 'row', gap: 8 },
  screen: { flex: 1, alignSelf: 'auto', borderRadius: 16 },
  row: { minHeight: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { color: theme.text, fontSize: 16 },
  rowHint: { color: theme.dim, fontSize: 13 },
})
