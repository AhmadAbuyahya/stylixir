import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { Dimensions, FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { Pill, theme, styles as ui } from '@/components/ui'
import { imageOf, useLibrary } from '@/lib/library'

const COLUMNS = 3
const GAP = 10
const PAD = 16

export default function LibraryScreen() {
  const items = useLibrary(s => s.items)
  const router = useRouter()
  const { width } = useWindowDimensions()
  const screen = Dimensions.get('screen')
  const tile = (width - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <SymbolView name={{ ios: 'photo.on.rectangle', android: 'photo_library' }} size={40} tintColor={theme.dim} />
        <Text style={ui.title}>No wallpapers yet</Text>
        <Text style={styles.emptyText}>Wallpapers you save or set show up here, and Auto picks from them.</Text>
        <Pill tone="solid" label="Make one" onPress={() => router.back()} style={styles.emptyButton} />
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      numColumns={COLUMNS}
      keyExtractor={item => item.id}
      contentInsetAdjustmentBehavior="automatic"
      columnWrapperStyle={{ gap: GAP }}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/library/[id]', params: { id: item.id } })}
          accessibilityRole="button"
          accessibilityLabel="Open wallpaper"
          style={({ pressed }) => [styles.tile, { width: tile, height: tile * (screen.height / screen.width), opacity: pressed ? 0.8 : 1 }]}
        >
          <Image source={{ uri: imageOf(item).uri }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={item.id} />
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  grid: { padding: PAD, gap: GAP },
  tile: { borderRadius: 14, borderCurve: 'continuous', overflow: 'hidden', backgroundColor: theme.card },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyText: { color: theme.dim, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  emptyButton: { alignSelf: 'center', marginTop: 12 },
})
