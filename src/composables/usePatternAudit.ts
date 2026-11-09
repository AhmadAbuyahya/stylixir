import type { Template, Variable } from '~/types'
import templates from '~/lib/templates'
import {
  cloneTemplateEntry,
  createStubVariable,
  extractPlaceholders,
  inlineVariableInTemplate,
  parseLiteral,
  replacedSegment,
  validateAuditDraft,
} from '~/lib/audit'
import { defaultVariables, randomVariables } from '~/lib/pattern'

export function usePatternAudit() {
  const slug = ref(Object.keys(templates)[0] ?? '')
  const draft = ref<Template>(cloneTemplateEntry(templates[slug.value]))
  const liveValues = ref(defaultVariables(draft.value.variables))

  function loadSlug(nextSlug: string) {
    if (!templates[nextSlug])
      return
    slug.value = nextSlug
    draft.value = cloneTemplateEntry(templates[nextSlug])
    liveValues.value = defaultVariables(draft.value.variables)
  }

  function resetDraft() {
    loadSlug(slug.value)
  }

  /** Every keystroke. Placeholders typed here wait for commitTemplateProperty, so half-typed names never become dials. */
  function updateTemplateProperty(property: string, value: string) {
    draft.value.template[property] = value
  }

  /**
   * When a CSS box is left: create dials for placeholders that don't exist yet.
   * A single placeholder typed over a number takes that number as its default.
   */
  function commitTemplateProperty(property: string, before: string) {
    const after = draft.value.template[property] ?? ''
    const missing = extractPlaceholders({ [property]: after }).filter(key => !(key in draft.value.variables))
    if (!missing.length)
      return []
    const { removed, inserted } = replacedSegment(before, after)
    // Typing over just the number leaves its unit after the placeholder; read it so `45deg` still counts as an angle.
    const unitAfter = (key: string) => /^[a-z%]*/i.exec(after.slice(after.indexOf(`{${key}}`) + key.length + 2))?.[0] ?? ''
    for (const key of missing) {
      const typedOverNumber = missing.length === 1 && inserted.includes(`{${key}}`)
      const guess = typedOverNumber ? parseLiteral(removed + unitAfter(key)) : null
      addVariable(key, guess?.variable ?? createStubVariable(key))
    }
    return missing
  }

  /**
   * Turns the number at [start, end) of a CSS value into `{name}`, keeping its unit.
   * A new name becomes a dial defaulting to that number; an existing name links the value to that dial.
   */
  function convertToVariable(property: string, start: number, end: number, name: string): 'created' | 'linked' | null {
    const css = draft.value.template[property]
    const parsed = css === undefined ? null : parseLiteral(css.slice(start, end))
    const key = name.trim()
    if (!parsed || !/^[a-zA-Z]\w*$/.test(key))
      return null
    const at = start + css.slice(start, end).search(/\S/)
    draft.value.template[property] = `${css.slice(0, at)}{${key}}${css.slice(at + parsed.number.length)}`
    if (key in draft.value.variables)
      return 'linked'
    addVariable(key, parsed.variable)
    return 'created'
  }

  function addTemplateProperty(property: string) {
    if (property in draft.value.template)
      return false
    draft.value.template[property] = ''
    return true
  }

  function removeTemplateProperty(property: string) {
    delete draft.value.template[property]
  }

  function addVariable(name: string, variable: Variable) {
    const key = name.trim()
    if (!key || key in draft.value.variables)
      return false
    draft.value.variables[key] = variable
    liveValues.value[key] = variable.value
    return true
  }

  function updateVariable(name: string, patch: Partial<Variable>) {
    const current = draft.value.variables[name]
    if (!current)
      return
    const { breaking, ...rest } = { ...current, ...patch }
    const { type, ...others } = rest
    // Same shape as templates.ts: the flag sits right after `type`, or is left out when off.
    draft.value.variables[name] = breaking ? { type, breaking: true, ...others } : rest
    if (patch.value !== undefined)
      liveValues.value[name] = patch.value
  }

  function removeVariable(name: string) {
    const variable = draft.value.variables[name]
    if (!variable)
      return false

    draft.value.template = inlineVariableInTemplate(
      draft.value.template,
      name,
      variable.value,
    )
    delete draft.value.variables[name]
    delete liveValues.value[name]
    return true
  }

  function shuffleLiveValues() {
    liveValues.value = randomVariables(draft.value, { colors: false, numbers: true, breaking: true })
  }

  function syncStubVariablesFromPlaceholders() {
    for (const key of extractPlaceholders(draft.value.template)) {
      if (!(key in draft.value.variables)) {
        draft.value.variables[key] = createStubVariable(key)
        liveValues.value[key] = draft.value.variables[key].value
      }
    }
  }

  function defineMissingPlaceholders() {
    syncStubVariablesFromPlaceholders()
  }

  const validation = computed(() =>
    validateAuditDraft(draft.value.template, draft.value.variables),
  )

  // Book order, so numbers match the studio's tag and Pattern book.
  const slugs = computed(() => Object.keys(templates))

  return {
    templates,
    slug,
    draft,
    liveValues,
    slugs,
    validation,
    loadSlug,
    resetDraft,
    updateTemplateProperty,
    commitTemplateProperty,
    convertToVariable,
    addTemplateProperty,
    removeTemplateProperty,
    addVariable,
    updateVariable,
    removeVariable,
    shuffleLiveValues,
    defineMissingPlaceholders,
    syncStubVariablesFromPlaceholders,
  }
}
