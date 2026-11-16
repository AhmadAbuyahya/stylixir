import * as Haptics from 'expo-haptics'
import { useState } from 'react'
import { Alert, Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { Chips, Pill, Section, theme, styles as ui } from '@/components/ui'
import { type AutoSettings, changeNow, useAuto } from '@/lib/auto'
import { notify, readable } from '@/lib/errors'
import { useLibrary } from '@/lib/library'
import { canSetWallpaper, screenChoices } from '@/lib/wallpaper'

const EVERY = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '3 hours', value: 180 },
  { label: '6 hours', value: 360 },
  { label: '12 hours', value: 720 },
  { label: '1 day', value: 1440 },
]

const ORDER: { label: string, value: AutoSettings['order'] }[] = [
  { label: 'Shuffle', value: 'shuffle' },
  { label: 'In order', value: 'in-order' },
]

/** iPhone apps can't set the wallpaper, but a Shortcuts automation can, from the album "Save to Photos" fills. */
function IPhoneSteps() {
  const steps = [
    'In Create, use Save to Photos on a few wallpapers. They go into a "Stylixir" album.',
    'Open Shortcuts, go to Automation and tap +. Pick Time of Day (or another trigger) and set it to Run Immediately.',
    'Add "Find Photos" where Album is Stylixir, sorted randomly, limit 1.',
    'Add "Set Wallpaper", choose Lock and Home screens, and turn off Show Preview.',
  ]
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={ui.page}>
      <Section title="Change your wallpaper automatically">
        {steps.map((step, i) => <Text key={step} style={styles.step}>{`${i + 1}. ${step}`}</Text>)}
      </Section>
      <Pill tone="solid" label="Open Shortcuts" onPress={() => Linking.openURL('shortcuts://')} style={styles.wide} />
    </ScrollView>
  )
}

export default function AutoScreen() {
  const settings = useAuto(s => s.settings)
  const update = useAuto(s => s.update)
  const count = useLibrary(s => s.items.length)
  const [changing, setChanging] = useState(false)

  if (!canSetWallpaper)
    return <IPhoneSteps />

  const empty = count === 0
  const on = settings.enabled && !empty
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={ui.page}>
      <Section footer={empty ? 'Save a few wallpapers first: Auto picks from your Library.' : `Picks from the ${count} wallpaper${count === 1 ? '' : 's'} in your Library. Android may wait a little longer than you set, to save battery.`}>
        <View style={styles.toggle}>
          <Text style={styles.toggleLabel}>Change wallpaper automatically</Text>
          <Switch
            value={on}
            disabled={empty}
            onValueChange={enabled => update({ enabled })}
            trackColor={{ false: '#3a3a3e', true: '#8a8a90' }}
            thumbColor={on ? theme.text : '#b5b5ba'}
            accessibilityLabel="Change wallpaper automatically"
          />
        </View>
      </Section>

      <Section title="Schedule">
        <Chips label="Every" value={settings.every} options={EVERY} onChange={every => update({ every })} />
        <Chips label="Set on" value={settings.screen} options={screenChoices} onChange={screen => update({ screen })} />
        <Chips label="Order" value={settings.order} options={ORDER} onChange={order => update({ order })} />
      </Section>

      <Pill
        label="Change now"
        icon={{ ios: 'arrow.triangle.2.circlepath', android: 'autorenew' }}
        disabled={empty}
        busy={changing}
        style={styles.wide}
        onPress={() => {
          setChanging(true)
          changeNow()
            .then(() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              notify('Wallpaper changed')
            })
            .catch(error => Alert.alert('Couldn\'t change the wallpaper', readable(error)))
            .finally(() => setChanging(false))
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  toggleLabel: { flex: 1, color: theme.text, fontSize: 16 },
  step: { color: theme.text, fontSize: 15, lineHeight: 21 },
  wide: { alignSelf: 'stretch', borderRadius: 16 },
})
