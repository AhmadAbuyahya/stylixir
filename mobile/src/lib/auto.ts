import * as BackgroundTask from 'expo-background-task'
import { File, Paths } from 'expo-file-system'
import * as TaskManager from 'expo-task-manager'
import { create } from 'zustand'
import { imageOf, readLibrary } from '@/lib/library'
import { type Screen, canSetWallpaper, setWallpaper } from '@/lib/wallpaper'

const TASK = 'stylixir-change-wallpaper'

export interface AutoSettings {
  enabled: boolean
  /** Minutes between changes; Android won't go below 15. */
  every: number
  screen: Screen
  order: 'shuffle' | 'in-order'
  /** Id of the wallpaper set last, so "in order" knows where it is. */
  lastId?: string
}

const DEFAULTS: AutoSettings = { enabled: false, every: 60 * 6, screen: 'both', order: 'shuffle' }
const file = new File(Paths.document, 'auto.json')

function readSettings(): AutoSettings {
  try {
    return { ...DEFAULTS, ...(file.exists ? JSON.parse(file.textSync()) : {}) }
  }
  catch {
    return DEFAULTS
  }
}

/** Sets the next wallpaper from the Library. Runs in the background task too, so it only touches disk. */
export async function changeNow() {
  const settings = readSettings()
  const items = readLibrary().filter(item => imageOf(item).exists)
  if (!items.length)
    return false
  const at = items.findIndex(item => item.id === settings.lastId)
  // Shuffle never repeats the current one when there is a choice.
  const others = items.filter(item => item.id !== settings.lastId)
  const pool = others.length ? others : items
  const next = settings.order === 'in-order'
    ? items[(at + 1) % items.length]
    : pool[Math.floor(Math.random() * pool.length)]
  await setWallpaper(imageOf(next).uri, settings.screen)
  useAuto.getState().update({ lastId: next.id })
  return true
}

// Background tasks must be defined when the JS bundle loads, before any screen renders.
TaskManager.defineTask(TASK, async () => {
  try {
    await changeNow()
    return BackgroundTask.BackgroundTaskResult.Success
  }
  catch {
    return BackgroundTask.BackgroundTaskResult.Failed
  }
})

async function schedule({ enabled, every }: AutoSettings) {
  if (!canSetWallpaper)
    return
  if (await TaskManager.isTaskRegisteredAsync(TASK))
    await BackgroundTask.unregisterTaskAsync(TASK)
  if (enabled)
    await BackgroundTask.registerTaskAsync(TASK, { minimumInterval: Math.max(15, every) })
}

interface Auto {
  settings: AutoSettings
  update: (patch: Partial<AutoSettings>) => void
}

export const useAuto = create<Auto>((set, get) => ({
  settings: readSettings(),
  update: (patch) => {
    const before = get().settings
    const settings = { ...before, ...patch }
    file.writeSync(JSON.stringify(settings))
    set({ settings })
    if (settings.enabled !== before.enabled || settings.every !== before.every)
      schedule(settings).catch(() => {})
  },
}))
