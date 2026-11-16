import { requireOptionalNativeModule } from 'expo'

export type Screen = 'home' | 'lock' | 'both'

const Native = requireOptionalNativeModule<{ setWallpaper: (uri: string, screen: Screen) => Promise<void> }>('StylixirWallpaper')

/** Android only: iPhone apps can't set the wallpaper, so iOS goes through a Shortcuts automation instead. */
export const canSetWallpaper = !!Native

export function setWallpaper(uri: string, screen: Screen) {
  if (!Native)
    throw new Error('This phone does not let apps set the wallpaper.')
  return Native.setWallpaper(uri, screen)
}

export const screenChoices: { label: string, value: Screen }[] = [
  { label: 'Home', value: 'home' },
  { label: 'Lock', value: 'lock' },
  { label: 'Both', value: 'both' },
]
