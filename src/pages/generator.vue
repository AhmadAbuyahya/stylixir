<script setup lang="ts">
import { useActiveTemplateStore } from '~/stores/activeTemplate'

defineOptions({
  name: 'GeneratorPage',
})

const route = useRoute()
const store = useActiveTemplateStore()

onMounted(() => store.applyTemplateFromRoute())
watch(() => route.fullPath, () => store.applyTemplateFromRoute())
</script>

<template>
  <div class="studio">
    <TemplateSwitcher class="studio-film" />
    <BgPreview class="studio-canvas" />
    <Controls class="studio-desk" />
  </div>
  <Toasts />
</template>

<route lang="yaml">
meta:
  layout: home
</route>

<style>
.studio {
  display: grid;
  min-height: 100dvh;
  background: #0d0d0d;
  color: #fafafa;
  grid-template-areas:
    "canvas"
    "film"
    "desk";
}

.studio-film { grid-area: film; }
.studio-canvas { grid-area: canvas; }
.studio-desk { grid-area: desk; }

@media (min-width: 768px) {
  .studio {
    height: 100dvh;
    overflow: hidden;
    grid-template-columns: 15.5rem minmax(0, 1fr) 22rem;
    grid-template-rows: 1fr;
    grid-template-areas: "film canvas desk";
  }
}
</style>
