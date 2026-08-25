<script setup lang="ts">
import { inject } from '@vercel/analytics'

inject()
</script>

<template>
  <main>
    <RouterView />
  </main>
</template>
