<script setup lang="ts">
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
// they will be rendered correctly in the html results with vite-ssg
useHead({
  title: 'Stylixir · Pattern wallpaper generator',
  meta: [
    { name: 'description', content: 'Make pattern wallpapers for your desktop, phone or tablet. Shuffle through 157 designs, tune the colors and shape, then download a sharp image at any size.' },
    {
      name: 'theme-color',
      content: () => isDark.value ? '#111111' : '#efefeb',
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
