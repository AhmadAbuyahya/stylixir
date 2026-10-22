import type { Template, Variable } from '~/types'
import templates from '~/lib/templates'
import {
  cloneTemplateEntry,
  createStubVariable,
  extractPlaceholders,
  inlineVariableInTemplate,
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

  function updateTemplateProperty(property: string, value: string) {
    draft.value.template[property] = value
    syncStubVariablesFromPlaceholders()
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
    draft.value.variables[name] = { ...current, ...patch }
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
    liveValues.value = randomVariables(draft.value, { colors: false, numbers: true })
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

  const slugs = computed(() => Object.keys(templates).sort())

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
