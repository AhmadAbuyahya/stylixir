<script setup lang="ts">
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'Stylixir - CSS Pattern Generator',
  meta: [
    { name: 'description', content: 'Make layered CSS background patterns. Shuffle, tune every color and size, then copy the code or export an image.' },
    {
      name: 'theme-color',
      content: () => isDark.value ? '#00aba9' : '#ffffff',
    },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicon.svg',
    },
  ],
})

const isDev = import.meta.env.DEV
</script>

<template>
  <RouterView />
  <FpsCounter v-if="isDev" />
</template>
