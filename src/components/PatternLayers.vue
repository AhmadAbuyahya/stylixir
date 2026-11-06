<script setup lang="ts">
import { FRAME_LAYERS } from '~/lib/effects'
import { useActiveTemplateStore } from '~/stores/activeTemplate'

const props = withDefaults(defineProps<{
  /** Leave false for still previews (e.g. the export dialog). */
  animate?: boolean
  overlay?: boolean
}>(), {
  animate: true,
  overlay: true,
})

defineOptions({
  name: 'PatternLayers',
})

// Each instance gets its own filter id and keyframe names, so the main
// preview and the export preview can live in one document.
const uid = `sx${Math.random().toString(36).slice(2, 8)}`

const store = useActiveTemplateStore()
const reducedMotion = usePreferredReducedMotion()

const frame = computed(() => store.frame({
  animate: props.animate && reducedMotion.value !== 'reduce',
  overlay: props.overlay,
  filterId: `${uid}-warp`,
  name: uid,
}))

const layers = computed(() => FRAME_LAYERS.filter(layer => frame.value[layer]))

useStyleTag(computed(() => frame.value.css))
</script>

<template>
  <div class="absolute inset-0 isolate overflow-hidden" style="container-type: size">
    <div
      v-for="layer in layers"
      :key="layer"
      :class="layer === 'pattern' ? '' : 'pointer-events-none'"
      :style="frame[layer]"
    />
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-if="frame.filterMarkup" class="contents" v-html="frame.filterMarkup" />
  </div>
</template>
