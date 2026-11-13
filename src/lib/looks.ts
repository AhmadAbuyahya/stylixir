/** Undo history and kept looks, both lists of recipe strings. Pure, so the store stays thin. */

export const HISTORY_CAP = 50
export const KEPT_CAP = 100

/** Adds the look from before a jump, dropping the oldest past the cap. A repeat of the last entry is skipped. */
export function pushHistory(history: string[], recipe: string, cap = HISTORY_CAP) {
  return history.at(-1) === recipe ? history : [...history, recipe].slice(-cap)
}

/** Kept looks as stored. Anything but an array of strings reads as empty, never throws. */
export function parseKept(raw: unknown): string[] {
  try {
    const list = typeof raw === 'string' ? JSON.parse(raw) : raw
    return (Array.isArray(list) && list.every(item => typeof item === 'string')) ? list : []
  }
  catch {
    return []
  }
}

/** Newest first, no duplicates, oldest dropped past the cap. */
export function addKept(kept: string[], recipe: string, cap = KEPT_CAP) {
  return [recipe, ...removeKept(kept, recipe)].slice(0, cap)
}

export function removeKept(kept: string[], recipe: string) {
  return kept.filter(item => item !== recipe)
}

export function toggleKept(kept: string[], recipe: string, cap = KEPT_CAP) {
  return kept.includes(recipe) ? removeKept(kept, recipe) : addKept(kept, recipe, cap)
}
