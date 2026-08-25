<script setup lang="ts">
import { inject } from '@vercel/analytics'

inject()
</script>

<template>
  <main class="min-h-full bg-#0d0d0d text-white">
    <RouterView />
  </main>
</template>
