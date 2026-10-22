<script setup lang="ts">
import { useRandomPattern } from '~/composables/useRandomPattern'

type Surface = 'landing' | 'poster' | 'sleeve' | 'phone'

const surfaces: { id: Surface; label: string; note: string }[] = [
  { id: 'landing', label: 'Landing', note: 'Full-bleed page hero' },
  { id: 'poster', label: 'Poster', note: 'Tall print crop' },
  { id: 'sleeve', label: 'Sleeve', note: 'Square cover art' },
  { id: 'phone', label: 'Phone', note: 'Lock-screen wallpaper' },
]

const surface = ref<Surface>('landing')
const { style, version, slug, shuffle } = useRandomPattern()

const active = computed(() => surfaces.find(item => item.id === surface.value) ?? surfaces[0])
const patternLabel = computed(() => slug.value.replace(/_/g, ' '))

function selectSurface(id: Surface) {
  surface.value = id
}
</script>

<template>
  <section class="applied border-b-1 border-white/10">
    <div class="mx-auto max-w-1200px px-6 py-20 md:py-24">
      <div class="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-xl">
          <p class="mb-2 font-mono text-xs tracking-widest uppercase text-teal-400">
            Applied
          </p>
          <h2 class="font-federo text-2xl tracking-tight uppercase sm:text-3xl">
            Same CSS.
            <span class="block text-white/55">Different surfaces.</span>
          </h2>
          <p class="mt-3 max-w-md text-white/60">
            Watch one live pattern wear a landing, a poster, a sleeve, and a phone — then shuffle it until the crop feels right.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="surface-switch" role="tablist" aria-label="Preview surface">
            <button
              v-for="item in surfaces"
              :key="item.id"
              type="button"
              role="tab"
              class="surface-switch__btn"
              :aria-selected="surface === item.id"
              :class="{ 'is-active': surface === item.id }"
              @click="selectSurface(item.id)"
            >
              {{ item.label }}
            </button>
          </div>
          <button
            type="button"
            class="button px-3.5 py-2 text-xs !gap-1.5"
            title="Shuffle this pattern"
            @click="shuffle()"
          >
            <div class="i-carbon-shuffle" />
            Shuffle
          </button>
        </div>
      </div>

      <div class="stage">
        <div class="stage__meta">
          <p class="font-mono text-xs tracking-widest uppercase text-teal-400/90">
            {{ active.note }}
          </p>
          <p class="font-mono text-xs capitalize text-white/45">
            {{ patternLabel }}
          </p>
        </div>

        <div class="stage__viewport" :class="{ 'is-phone': surface === 'phone' }">
          <Transition name="surface" mode="out-in">
            <!-- Landing: edge-to-edge hero plane -->
            <div v-if="surface === 'landing'" key="landing" class="frame frame--landing">
              <PatternCanvas class="frame__fill" :style="style" :version="version" />
              <div class="frame__scrim frame__scrim--landing" />
              <div class="frame__copy frame__copy--landing">
                <p class="frame__headline font-federo text-3xl leading-none tracking-tight uppercase text-white md:text-5xl sm:text-4xl">
                  Built from
                  <span class="text-teal-300">gradients.</span>
                </p>
                <p class="frame__lede mt-4 max-w-sm text-sm text-white/85 sm:text-base">
                  No image file. Just CSS sitting behind the type.
                </p>
              </div>
            </div>

            <!-- Poster: tall editorial crop -->
            <div v-else-if="surface === 'poster'" key="poster" class="frame frame--poster">
              <div class="poster">
                <PatternCanvas class="frame__fill" :style="style" :version="version" />
                <div class="frame__scrim frame__scrim--poster" />
                <div class="poster__type">
                  <p class="frame__kicker font-mono text-10px tracking-[0.22em] uppercase text-white/85">
                    Issue 07 · Stylixir
                  </p>
                  <h3 class="frame__headline mt-3 font-federo text-4xl leading-none tracking-tight uppercase text-white sm:text-5xl">
                    Tessellate
                  </h3>
                </div>
              </div>
            </div>

            <!-- Sleeve: square cover with a thin spine -->
            <div v-else-if="surface === 'sleeve'" key="sleeve" class="frame frame--sleeve">
              <div class="sleeve">
                <div class="sleeve__spine" aria-hidden="true" />
                <div class="sleeve__face">
                  <PatternCanvas class="frame__fill" :style="style" :version="version" />
                  <div class="frame__scrim frame__scrim--sleeve" />
                  <div class="sleeve__caption">
                    <p class="frame__headline font-federo text-lg tracking-tight uppercase text-white">
                      Midnight Drift
                    </p>
                    <p class="frame__kicker mt-1 font-mono text-10px tracking-widest uppercase text-white/80">
                      Side A
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Phone: lock screen -->
            <div v-else key="phone" class="frame frame--phone">
              <div class="phone">
                <div class="phone__bezel">
                  <div class="phone__notch" aria-hidden="true" />
                  <div class="phone__screen">
                    <PatternCanvas class="frame__fill" :style="style" :version="version" />
                    <div class="frame__scrim frame__scrim--phone" />
                    <div class="phone__ui">
                      <p class="frame__kicker font-mono text-xs text-white/90">
                        Tue 25
                      </p>
                      <p class="frame__headline font-federo text-5xl leading-none tracking-tight text-white">
                        9:41
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stage {
  display: grid;
  gap: 0.85rem;
}

.stage__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.stage__viewport {
  position: relative;
  min-height: clamp(22rem, 58vw, 34rem);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.15rem;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(45, 212, 191, 0.06), transparent 55%),
    #101010;
}

.surface-switch {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  padding: 0.2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
}

.surface-switch__btn {
  appearance: none;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  line-height: 1;
  padding: 0.55rem 0.75rem;
  text-transform: uppercase;
  transition: color 0.15s ease, background 0.15s ease;
}

.surface-switch__btn:hover {
  color: rgba(255, 255, 255, 0.9);
}

.surface-switch__btn.is-active {
  background: rgba(45, 212, 191, 0.14);
  color: #5eead4;
}

.surface-switch__btn:focus-visible {
  outline: 2px solid #2dd4bf;
  outline-offset: 2px;
}

.frame {
  position: absolute;
  inset: 0;
}

.frame__fill {
  position: absolute;
  inset: 0;
}

.frame__scrim {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.frame__scrim--landing {
  background:
    linear-gradient(90deg, rgba(8, 8, 8, 0.9) 0%, rgba(8, 8, 8, 0.5) 40%, rgba(8, 8, 8, 0.12) 72%, transparent 100%),
    linear-gradient(180deg, rgba(8, 8, 8, 0.28) 0%, transparent 38%, rgba(8, 8, 8, 0.78) 100%);
}

.frame__scrim--poster {
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.42) 0%, rgba(0, 0, 0, 0.08) 38%, rgba(0, 0, 0, 0.86) 100%);
}

.frame__scrim--sleeve {
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0%, transparent 42%, rgba(0, 0, 0, 0.82) 100%);
}

.frame__scrim--phone {
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.62) 0%, rgba(0, 0, 0, 0.18) 32%, rgba(0, 0, 0, 0.08) 55%, rgba(0, 0, 0, 0.5) 100%);
}

.frame__headline {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55), 0 10px 28px rgba(0, 0, 0, 0.45);
}

.frame__lede,
.frame__kicker {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7), 0 6px 18px rgba(0, 0, 0, 0.45);
}

.frame__copy--landing {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: clamp(1.25rem, 4vw, 2.75rem);
}

.frame--landing {
  overflow: hidden;
}

.frame--poster,
.frame--sleeve,
.frame--phone {
  display: grid;
  place-items: center;
  padding: clamp(1rem, 3vw, 2rem);
}

.stage__viewport.is-phone {
  min-height: min(42rem, 78vh);
}

.frame--phone {
  container-type: size;
  padding: clamp(1.25rem, 3.5vw, 2.5rem);
}

.poster {
  position: relative;
  width: min(100%, 22rem);
  aspect-ratio: 2 / 3;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.poster__type {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 1.25rem 1.15rem 1.35rem;
}

.sleeve {
  display: flex;
  width: min(100%, 26rem);
  aspect-ratio: 1.12 / 1;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
}

.sleeve__spine {
  width: 1.1rem;
  flex-shrink: 0;
  background:
    repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.08) 0 1px,
      transparent 1px 7px
    ),
    linear-gradient(90deg, #1a1a1a, #2a2a2a 40%, #141414);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.sleeve__face {
  position: relative;
  flex: 1;
  min-width: 0;
}

.sleeve__caption {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 1.25rem 1rem 1.15rem;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.88) 78%);
}

.phone {
  /* Leave room for bezel padding + drop shadow inside overflow:hidden. */
  width: min(16rem, 100%, calc((100cqh - 2.5rem) * 9 / 20.6));
}

.phone__bezel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 1.75rem;
  background: #080808;
  box-shadow:
    0 28px 60px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.04);
  padding: 0.55rem;
}

.phone__notch {
  position: absolute;
  top: 0.85rem;
  left: 50%;
  z-index: 2;
  width: 4.5rem;
  height: 1.05rem;
  border-radius: 999px;
  background: #050505;
  transform: translateX(-50%);
}

.phone__screen {
  position: relative;
  aspect-ratio: 9 / 19.5;
  overflow: hidden;
  border-radius: 1.25rem;
}

.phone__ui {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 18%;
  text-align: center;
}

.surface-enter-active,
.surface-leave-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

.surface-enter-from {
  opacity: 0;
  transform: translateY(0.55rem);
}

.surface-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem);
}

@media (prefers-reduced-motion: reduce) {
  .surface-enter-active,
  .surface-leave-active {
    transition: opacity 0.15s ease;
  }

  .surface-enter-from,
  .surface-leave-to {
    transform: none;
  }
}
</style>
