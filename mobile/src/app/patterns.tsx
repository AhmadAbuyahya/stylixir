import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { FlatList, Linking, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native'
import templates from '~/lib/templates'
import { SHEET_HEADER, SheetHeader, theme } from '@/components/ui'
import { patternName, useStudio } from '@/lib/studio'
import { thumbs } from '@/thumbs'

const slugs = Object.keys(templates)
const COLUMNS = 4
const GAP = 8
const PAD = 16
// Shorter than a phone: the middle of each thumbnail, so more patterns fit on screen at once.
const ASPECT = 1.3

export default function PatternsSheet() {
  const active = useStudio(s => s.look.template)
  const setPattern = useStudio(s => s.setPattern)
  const { width } = useWindowDimensions()
  const tile = (width - PAD * 2 - GAP * (COLUMNS - 1)) / COLUMNS
  const row = tile * ASPECT + GAP

  return (
    <FlatList
      style={styles.sheet}
      data={slugs}
      numColumns={COLUMNS}
      keyExtractor={slug => slug}
      nestedScrollEnabled
      // Part of the list, not above it: an iOS sheet lays its scroll view over anything placed on top.
      ListHeaderComponent={<SheetHeader title="Patterns" note={patternName(active)} />}
      stickyHeaderIndices={[0]}
      ListFooterComponent={(
        <Text style={styles.credit} accessibilityRole="link" onPress={() => Linking.openURL('https://github.com/Afif13/CSS-Pattern')}>
          Patterns adapted from CSS-Pattern by Temani Afif, MIT License.
        </Text>
      )}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      getItemLayout={(_, index) => ({ length: row, offset: SHEET_HEADER + row * index, index })}
      // One row early: the pinned header covers the top of the list, and the current pattern should clear it.
      initialScrollIndex={Math.max(0, Math.floor(slugs.indexOf(active) / COLUMNS) - 1)}
      renderItem={({ item }) => {
        const selected = item === active
        return (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync()
              setPattern(item)
            }}
            accessibilityRole="button"
            accessibilityLabel={patternName(item)}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.tile, { width: tile, height: tile * ASPECT, opacity: pressed ? 0.8 : 1 }, selected && styles.selected]}
          >
            <Image source={thumbs[item]} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} />
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: theme.card },
  grid: { paddingBottom: 40 },
  row: { gap: GAP, paddingHorizontal: PAD },
  tile: { marginBottom: GAP, borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: theme.text },
  credit: { color: theme.dim, fontSize: 12, textAlign: 'center', paddingHorizontal: PAD, paddingTop: 16 },
})
