<script setup lang="ts">
defineOptions({
  name: 'HomePage',
})
</script>

<template>
  <div class="min-h-screen bg-#0d0d0d font-sans text-white">
    <HomeNav />
    <HomeHero />
    <PatternLibrary />
    <ScenarioShowcase />
    <FeatureGrid />
    <HomeCta />
  </div>
</template>

<route lang="yaml">
meta:
  layout: marketing
</route>
