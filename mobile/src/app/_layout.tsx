import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { theme } from '@/components/ui'

const navigation = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: theme.bg, card: theme.bg, text: theme.text, border: 'transparent', primary: theme.text },
}

const sheet = {
  presentation: 'formSheet',
  headerShown: false,
  sheetGrabberVisible: true,
  sheetCornerRadius: 28,
  contentStyle: { backgroundColor: theme.card },
} as const

export default function RootLayout() {
  return (
    <ThemeProvider value={navigation}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShadowVisible: false, headerTintColor: theme.text, headerStyle: { backgroundColor: theme.bg }, contentStyle: { backgroundColor: theme.bg } }}>
        {/* No tab bar: the wallpaper you are making gets the whole screen, and Library and Auto open from it. */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="library/index" options={{ title: 'Library' }} />
        <Stack.Screen name="library/[id]" options={{ title: '', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen name="auto" options={{ title: 'Auto change' }} />
        {/* Patterns and Adjust open half-height and leave the wallpaper bright, so changes show live behind them. */}
        <Stack.Screen name="patterns" options={{ ...sheet, sheetAllowedDetents: [0.5, 1], sheetLargestUndimmedDetentIndex: 0 }} />
        <Stack.Screen name="adjust" options={{ ...sheet, sheetAllowedDetents: [0.5, 0.92], sheetLargestUndimmedDetentIndex: 0 }} />
        <Stack.Screen name="save" options={{ ...sheet, sheetAllowedDetents: 'fitToContents' }} />
      </Stack>
    </ThemeProvider>
  )
}
