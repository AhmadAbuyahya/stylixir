<script setup lang="ts">
const GITHUB_URL = 'https://github.com/ahmadabuyahya/stylixir'
</script>

<template>
  <section class="px-6 py-24 text-center">
    <div class="mx-auto max-w-2xl">
      <h2 class="font-federo text-3xl tracking-tight uppercase sm:text-4xl">
        Stop picking stock backgrounds.
      </h2>
      <p class="mx-auto mt-4 max-w-md text-white/60">
        Open the generator, mash shuffle a few times, and copy out whatever it lands on.
      </p>
      <div class="mt-8 flex items-center justify-center gap-3">
        <RouterLink to="/generator" class="items-center gap-2 px-6 py-3 text-base btn !flex">
          Open the Generator
          <div class="i-carbon-arrow-up-right" />
        </RouterLink>
      </div>
    </div>
  </section>

  <footer class="border-t-1 border-white/10 px-6 py-10">
    <div class="mx-auto max-w-1200px flex flex-col items-center justify-between gap-6 sm:flex-row">
      <div class="flex items-center gap-3 text-sm text-white/40">
        <Logo class="h-6 w-auto opacity-70" />
        <span>Made of nothing but CSS.</span>
      </div>
      <div class="flex items-center gap-4">
        <a
          :href="GITHUB_URL"
          target="_blank"
          rel="noopener"
          icon-btn
          title="View source on GitHub"
          class="text-lg"
        >
          <div class="i-carbon-logo-github" />
        </a>
        <a
          href="https://www.producthunt.com/posts/stylixir?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-stylixir"
          target="_blank"
          rel="noopener"
        >
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=488516&theme=dark"
            alt="Stylixir - CSS Pattern Generator | Product Hunt"
            width="180"
            height="39"
            style="width: 180px; height: 39px;"
          >
        </a>
      </div>
    </div>
  </footer>
</template>
