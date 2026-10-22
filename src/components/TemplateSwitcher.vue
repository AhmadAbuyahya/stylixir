<script setup lang="ts">
import templates from '~/lib/templates'
import { buildStyle, defaultVariables } from '~/lib/pattern'
import { useActiveTemplateStore } from '~/stores/activeTemplate'

const activeTemplateStore = useActiveTemplateStore()

function swatchStyle(slug: string) {
  return buildStyle(slug, templates, defaultVariables(templates[slug].variables))
}

function label(slug: string) {
  return slug.replace(/_/g, ' ')
}

function scrollActiveIntoView() {
  const slug = activeTemplateStore.activeTemplate
  if (!slug)
    return
  const el = document.querySelector<HTMLElement>(`[data-template="${slug}"]`)
  const desktop = window.matchMedia('(min-width: 768px)').matches
  el?.scrollIntoView({
    block: desktop ? 'center' : 'nearest',
    inline: desktop ? 'nearest' : 'center',
  })
}

watch(() => activeTemplateStore.activeTemplate, async () => {
  await nextTick()
  scrollActiveIntoView()
})

onMounted(() => nextTick(scrollActiveIntoView))
</script>

<template>
  <aside class="flex flex-col overflow-hidden border-white/10 bg-#0d0d0d md:h-full md:border-r-1">
    <div class="flex shrink-0 items-center justify-between gap-2 border-b-1 border-white/10 px-3 py-3">
      <RouterLink
        to="/"
        class="h-7 overflow-hidden opacity-90 transition-opacity hover:opacity-100"
        title="Stylixir home"
      >
        <Logo class="h-full w-auto" />
      </RouterLink>
      <RouterLink
        :to="{ path: '/audit', query: { template: activeTemplateStore.activeTemplate } }"
        class="shrink-0 border-1 border-white/12 rounded-md px-2 py-1 font-mono text-10px tracking-wider uppercase text-white/55 transition hover:border-teal-400/40 hover:text-teal-200"
        title="Open pattern audit"
      >
        Audit
      </RouterLink>
    </div>

    <div class="flex gap-2 overflow-x-auto p-3 md:min-h-0 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto">
      <button
        v-for="(_, key) in templates"
        :key="key"
        :data-template="key"
        :title="label(String(key))"
        type="button"
        class="group relative h-22 w-32 shrink-0 overflow-hidden border-1 border-white/10 rounded-lg text-left outline-none transition-all duration-200 md:h-24 md:w-auto hover:border-white/25 focus-visible:ring-2 focus-visible:ring-teal-400"
        :class="activeTemplateStore.activeTemplate === key
          ? 'border-teal-400 ring-1 ring-teal-400'
          : ''"
        @click="activeTemplateStore.updateActiveTemplate(String(key))"
      >
        <span class="absolute inset-0" :style="swatchStyle(String(key))" />
        <span class="absolute inset-x-0 bottom-0 from-black/85 to-transparent bg-gradient-to-t px-2 py-1.5 font-mono text-10px leading-tight capitalize text-white/90">
          {{ label(String(key)) }}
        </span>
      </button>
    </div>
  </aside>
</template>
