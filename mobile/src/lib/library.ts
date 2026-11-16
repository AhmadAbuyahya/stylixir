import { Directory, File, Paths } from 'expo-file-system'
import { create } from 'zustand'

export interface Wallpaper {
  id: string
  /** The look it was made from, so it can be opened again in Create. */
  recipe: string
  createdAt: number
}

const folder = new Directory(Paths.document, 'wallpapers')
const index = new File(Paths.document, 'library.json')

export function imageOf(item: Wallpaper) {
  return new File(folder, `${item.id}.png`)
}

/** Read straight from disk, so the background task can use it without React. */
export function readLibrary(): Wallpaper[] {
  try {
    const items = index.exists ? JSON.parse(index.textSync()) : []
    // An entry whose image is gone (say, an interrupted save) is skipped, not shown broken.
    return Array.isArray(items) ? items.filter(item => imageOf(item).exists) : []
  }
  catch {
    return []
  }
}

interface Library {
  items: Wallpaper[]
  add: (png: File, recipe: string) => Wallpaper
  remove: (id: string) => void
}

export const useLibrary = create<Library>((set, get) => {
  const save = (items: Wallpaper[]) => {
    index.writeSync(JSON.stringify(items))
    set({ items })
  }
  return {
    items: readLibrary(),
    add: (png, recipe) => {
      // The same look saved twice stays one entry, moved to the top.
      const existing = get().items.find(item => item.recipe === recipe)
      const item = existing ?? { id: `${Date.now()}`, recipe, createdAt: Date.now() }
      if (!existing) {
        folder.create({ idempotent: true })
        png.copySync(imageOf(item))
      }
      save([item, ...get().items.filter(i => i.id !== item.id)])
      return item
    },
    remove: (id) => {
      const item = get().items.find(i => i.id === id)
      if (item && imageOf(item).exists)
        imageOf(item).delete()
      save(get().items.filter(i => i.id !== id))
    },
  }
})
