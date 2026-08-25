import templates from '~/lib/templates'
import { buildStyle, defaultVariables, generateCss, randomTemplateSlug, randomVariables } from '~/lib/pattern'

/**
 * An independent, throwaway pattern instance for demos on the marketing page.
 * Each call owns its own slug + variables — shuffling one never touches
 * another, and none of it reads or writes the generator's URL state.
 *
 * Starts on a deterministic default (so SSR output and first client render
 * match, same guard the generator's own store uses) and rolls its first
 * random pattern once mounted.
 */
export function useRandomPattern(initialSlug?: string) {
  const firstSlug = initialSlug ?? Object.keys(templates)[0]

  const slug = ref(firstSlug)
  const variables = ref(defaultVariables(templates[firstSlug].variables))
  const version = ref(0)

  const style = computed(() => buildStyle(slug.value, templates, variables.value))
  const css = computed(() => generateCss(style.value))

  function shuffle(options: { newTemplate?: boolean; exclude?: string | string[] } = {}) {
    const { newTemplate = true, exclude } = options
    if (newTemplate) {
      const skipped = [slug.value, ...(Array.isArray(exclude) ? exclude : exclude ? [exclude] : [])]
      slug.value = randomTemplateSlug(templates, skipped)
    }
    variables.value = randomVariables(templates[slug.value])
    version.value++
  }

  onMounted(() => shuffle())

  return { slug, variables, style, css, version, shuffle }
}
