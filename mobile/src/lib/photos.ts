import { Album, Asset, requestPermissionsAsync } from 'expo-media-library'

const ALBUM = 'Stylixir'

/** Saves into a "Stylixir" album, which is also what the iPhone Shortcuts automation picks from. */
export async function saveToPhotos(uri: string) {
  const { granted } = await requestPermissionsAsync(true)
  if (!granted)
    throw new Error('Allow Stylixir to add photos in Settings to save wallpapers.')
  const album = await Album.get(ALBUM)
  if (album)
    await Asset.create(uri, album)
  else
    await Album.create(ALBUM, [await Asset.create(uri)], true)
}
