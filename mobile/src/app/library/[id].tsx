import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Alert, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DockButton, Floating, styles as ui } from '@/components/ui'
import { imageOf, useLibrary } from '@/lib/library'
import { useStudio } from '@/lib/studio'
import { canSetWallpaper } from '@/lib/wallpaper'

export default function WallpaperScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const item = useLibrary(s => s.items.find(i => i.id === id))
  const remove = useLibrary(s => s.remove)
  const insets = useSafeAreaInsets()
  const router = useRouter()
  if (!item)
    return null

  return (
    <View style={styles.screen}>
      <Image source={{ uri: imageOf(item).uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View style={[styles.bottom, { bottom: insets.bottom + 12 }]}>
        <Floating style={[ui.dock, styles.dock]}>
          <DockButton
            icon={{ ios: 'slider.horizontal.3', android: 'tune' }}
            label="Edit"
            onPress={() => {
              useStudio.getState().load(item.recipe)
              router.dismissTo('/')
            }}
          />
          {/* Set, Save to Photos and Share live in the same sheet Create uses. */}
          <DockButton
            icon={canSetWallpaper ? { ios: 'iphone', android: 'wallpaper' } : { ios: 'square.and.arrow.up', android: 'share' }}
            label={canSetWallpaper ? 'Set' : 'Save'}
            onPress={() => router.push({ pathname: '/save', params: { id: item.id } })}
          />
          <DockButton
            icon={{ ios: 'trash', android: 'delete' }}
            label="Delete"
            onPress={() => Alert.alert('Delete this wallpaper?', 'It will be removed from your Library. Copies in Photos stay.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  router.back()
                  remove(item.id)
                },
              },
            ], { cancelable: true })}
          />
        </Floating>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  bottom: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  dock: { alignSelf: 'center', width: 260 },
})
