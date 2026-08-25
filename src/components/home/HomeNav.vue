<script setup lang="ts">
const GITHUB_URL = 'https://github.com/ahmadabuyahya/stylixir'
</script>

<template>
  <header class="sticky top-0 z-20 border-b-1 border-white/10 bg-#0d0d0d/80 backdrop-blur-md">
    <div class="mx-auto max-w-1200px flex items-center justify-between gap-4 px-6 py-4">
      <RouterLink to="/" class="h-8 w-auto shrink-0 overflow-hidden" title="Stylixir">
        <Logo class="h-full w-auto" />
      </RouterLink>

      <nav class="flex items-center gap-1 md:gap-2">
        <a
          icon-btn
          :href="GITHUB_URL"
          target="_blank"
          rel="noopener"
          title="View source on GitHub"
          class="hidden text-xl sm:inline-flex"
        >
          <div class="i-carbon-logo-github" />
        </a>
        <button
          icon-btn
          title="Toggle dark mode"
          class="text-xl"
          @click="toggleDark()"
        >
          <div class="i-carbon-sun dark:i-carbon-moon" />
        </button>
        <RouterLink
          to="/generator"
          class="ml-1 items-center gap-1.5 text-sm md:ml-3 btn !flex"
        >
          Open Generator
          <div class="i-carbon-arrow-up-right" />
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
