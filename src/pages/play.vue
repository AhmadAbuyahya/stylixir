<script setup lang="ts">
import { DEFAULT_EFFECTS, FRAME_LAYERS, type PatternFrame, buildFrame, dialVar } from '~/lib/effects'
import { defaultVariables } from '~/lib/pattern'
import templates from '~/lib/templates'

defineOptions({
  name: 'PlayPage',
})

interface Dial {
  key: string
  min: number
  max: number
  /** Default position, 0..1 across the dial's range. */
  home: number
  /** Which end Hold pulls this dial to. */
  end: 0 | 1
  x: number
  v: number
  phase: number
  history: Float32Array
}

const HISTORY = 120
const slugs = Object.keys(templates)
const index = ref(Math.floor(Math.random() * slugs.length))
const slug = computed(() => slugs[index.value])
const title = computed(() => slug.value.replace(/_/g, ' '))
const number = computed(() => String(index.value + 1).padStart(3, '0'))

// Shape + full hue motion make buildFrame write every dial as a custom property;
// the keyframes are dropped and the springs below set those properties each frame.
const effects = { ...DEFAULT_EFFECTS, shape: 1, color: 1, colorMode: 'shift' as const }

const frame = shallowRef<PatternFrame>()
const dials = shallowRef<Dial[]>([])
const hue = { h: 0, v: 0 }

watch(slug, (next, prev) => {
  const { template, variables } = templates[next]
  const built = buildFrame({ template, variables, values: defaultVariables(variables), effects, name: 'play', filterId: 'play-warp' })
  delete built.pattern.animation
  built.pattern[dialVar('hue')] = '0'
  frame.value = built
  dials.value = Object.entries(variables)
    .filter(([, variable]) => variable.type !== 'color' && !variable.breaking)
    .map(([key, variable], i) => {
      const min = variable.min ?? 0
      const max = variable.max ?? 100
      const home = (Number(variable.value) - min) / (max - min || 1)
      const end = home < 0.5 ? 1 : 0
      // A new pattern arrives with every dial thrown to the far end, then springs home.
      return { key, min, max, home, end, x: prev ? end : home, v: 0, phase: i * 2.4, history: new Float32Array(HISTORY).fill(home) }
    })
  hue.v += prev ? 160 : 0
}, { immediate: true })

const layers = computed(() => FRAME_LAYERS.filter(layer => frame.value?.[layer]))

// ---------------------------------------------------------------- input

const stage = ref<HTMLElement>()
const patternEl = ref<HTMLElement[]>([])
const rows = ref<HTMLElement[]>([])
const sparks = ref<HTMLCanvasElement[]>([])
const reduced = usePreferredReducedMotion()

const pointer = { x: 0.5, y: 0.5, lastMove: -Infinity, lastX: 0, lastY: 0, lastT: 0 }
const hold = { down: false, start: 0, x: 0, y: 0 }
let follow = 0
let wander = 1
let time = 0
let head = 0

function onMove(event: PointerEvent) {
  const now = performance.now()
  const rect = stage.value!.getBoundingClientRect()
  pointer.x = (event.clientX - rect.left) / rect.width
  pointer.y = (event.clientY - rect.top) / rect.height
  const dt = Math.max(1, now - pointer.lastT) / 1000
  const speed = Math.min(4000, Math.hypot(event.clientX - pointer.lastX, event.clientY - pointer.lastY) / dt)
  // Fast flicks shove the dials the pointer does not steer, and nudge the hue round.
  dials.value.slice(2).forEach((dial, i) => dial.v += (i % 2 ? 1 : -1) * speed * 0.00025)
  hue.v += speed * 0.01
  Object.assign(pointer, { lastMove: now, lastX: event.clientX, lastY: event.clientY, lastT: now })
}

function onDown(event: PointerEvent) {
  Object.assign(hold, { down: true, start: performance.now(), x: event.clientX, y: event.clientY })
}

function onUp() {
  if (!hold.down)
    return
  hold.down = false
  const held = performance.now() - hold.start
  if (held < 220) {
    // Tap: a shockwave that reaches each dial a beat after the last.
    ring(hold.x, hold.y, 0.6)
    dials.value.forEach((dial, i) => setTimeout(() => dial.v += (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 4), i * 45))
    hue.v += 120
  }
  else {
    ring(hold.x, hold.y, 1.2)
    hue.v += Math.min(1, held / 1200) * 400
  }
}

function ring(x: number, y: number, scale: number) {
  const el = document.createElement('div')
  el.className = 'ring'
  Object.assign(el.style, { left: `${x}px`, top: `${y}px` })
  stage.value!.append(el)
  el.animate(
    [{ transform: 'translate(-50%, -50%) scale(0)', opacity: 1 }, { transform: `translate(-50%, -50%) scale(${scale})`, opacity: 0 }],
    { duration: 900 * scale, easing: 'cubic-bezier(.2,.7,.3,1)' },
  ).onfinish = () => el.remove()
}

function go(step: number) {
  index.value = (index.value + step + slugs.length) % slugs.length
}

let wheelLock = 0
function onWheel(event: WheelEvent) {
  const now = performance.now()
  if (now < wheelLock || Math.abs(event.deltaY) < 20)
    return
  wheelLock = now + 700
  go(Math.sign(event.deltaY))
}

onKeyStroke(['ArrowRight', 'ArrowDown'], () => go(1))
onKeyStroke(['ArrowLeft', 'ArrowUp'], () => go(-1))
onKeyStroke(' ', (event) => {
  event.preventDefault()
  index.value = Math.floor(Math.random() * slugs.length)
})

// ---------------------------------------------------------------- physics + paint

useRafFn(({ delta }) => {
  const dt = Math.min(delta / 1000, 1 / 30)
  time += dt
  const now = performance.now()
  const idle = now - pointer.lastMove > 3000
  const calm = reduced.value === 'reduce' ? 0 : 1
  // Left alone, the pointer lets go and the pattern wanders wider on its own.
  follow += ((idle ? 0 : 1) - follow) * Math.min(1, dt * 3)
  wander += ((idle ? 2.6 : 0.6) * calm - wander) * Math.min(1, dt * 0.8)
  const charge = hold.down ? Math.min(1, (now - hold.start) / 1200) : 0

  const style = patternEl.value[0]?.style
  dials.value.forEach((dial, i) => {
    let target = dial.home + 0.1 * wander * Math.sin(time * (0.4 + 0.5 * ((i * 0.618) % 1)) + dial.phase)
    if (i === 0)
      target += (pointer.x - 0.5) * 0.9 * follow
    if (i === 1)
      target += (pointer.y - 0.5) * 0.9 * follow
    target += (dial.end - target) * charge
    target = Math.min(1, Math.max(0, target))
    // Underdamped spring: overshoots and settles, so every push reads as a wobble.
    dial.v += (90 * (target - dial.x) - 7 * dial.v) * dt
    dial.x += dial.v * dt
    if (dial.x < 0 || dial.x > 1) {
      dial.x = dial.x < 0 ? 0 : 1
      dial.v *= -0.45
    }
    dial.history[head] = dial.x
    style?.setProperty(dialVar(dial.key), String(dial.min + dial.x * (dial.max - dial.min)))
  })
  hue.v *= Math.exp(-1.6 * dt)
  hue.h = (hue.h + (hue.v + 6 * calm) * dt) % 360
  style?.setProperty(dialVar('hue'), hue.h.toFixed(1))
  head = (head + 1) % HISTORY

  paintHud(charge)
})

function paintHud(charge: number) {
  const dpr = window.devicePixelRatio || 1
  dials.value.forEach((dial, i) => {
    const row = rows.value[i]
    const canvas = sparks.value[i]
    if (!row || !canvas)
      return
    row.querySelector<HTMLElement>('.value')!.textContent = (dial.min + dial.x * (dial.max - dial.min)).toFixed(1)
    row.querySelector<HTMLElement>('.fill')!.style.transform = `scaleX(${dial.x})`
    const w = canvas.clientWidth * dpr
    const h = canvas.clientHeight * dpr
    if (canvas.width !== w)
      Object.assign(canvas, { width: w, height: h })
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(255,255,255,.35)'
    ctx.setLineDash([2 * dpr, 3 * dpr])
    ctx.beginPath()
    ctx.moveTo(0, h - dial.home * h)
    ctx.lineTo(w, h - dial.home * h)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5 * dpr
    ctx.beginPath()
    for (let s = 0; s < HISTORY; s++) {
      const y = dial.history[(head + s) % HISTORY]
      ctx.lineTo(s / (HISTORY - 1) * w, h - 1 - y * (h - 2))
    }
    ctx.stroke()
  })
  stage.value?.style.setProperty('--charge', String(charge))
}
</script>

<template>
  <main
    ref="stage"
    class="stage fixed inset-0 select-none overflow-hidden bg-black"
    @pointermove="onMove"
    @pointerdown="onDown"
    @pointerup="onUp"
    @pointerleave="onUp"
    @wheel.passive="onWheel"
  >
    <div class="charge-shake absolute inset-0 isolate overflow-clip" style="container-type: size">
      <div v-for="layer in layers" :key="layer" :ref="layer === 'pattern' ? 'patternEl' : undefined" :style="frame![layer]" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="frame?.filterMarkup" class="contents" v-html="frame.filterMarkup" />
    </div>

    <div class="hud pointer-events-none absolute inset-0 font-mono text-white mix-blend-difference">
      <header class="absolute left-6 right-6 top-6 flex items-baseline justify-between gap-6">
        <h1 class="title font-bold leading-[0.85] tracking-tight uppercase">
          <span class="block text-sm font-normal tracking-[0.3em] opacity-70">{{ number }} / {{ slugs.length }}</span>
          {{ title }}
        </h1>
      </header>

      <ul class="absolute bottom-6 left-6 grid w-[min(22rem,calc(100vw-3rem))] gap-2 text-xs">
        <li v-for="dial in dials" :key="`${slug}-${dial.key}`" ref="rows" class="grid grid-cols-[6rem_1fr_3.5rem] items-center gap-3">
          <span class="truncate tracking-widest uppercase opacity-80">{{ dial.key }}</span>
          <span class="relative h-5">
            <canvas ref="sparks" class="absolute inset-0 h-full w-full" />
            <span class="absolute bottom-0 left-0 right-0 h-px bg-white/30"><span class="fill block h-full origin-left bg-white" /></span>
          </span>
          <span class="value text-right tabular-nums" />
        </li>
      </ul>

      <p class="absolute bottom-6 right-6 text-right text-xs leading-relaxed tracking-widest uppercase opacity-80">
        move · steer<br>tap · shockwave<br>hold · charge<br>scroll / ← → · next<br>space · random
      </p>
    </div>
  </main>
</template>

<style scoped>
h1.title {
  font-size: clamp(2rem, 8vw, 7rem);
}

.stage {
  touch-action: none;
  cursor: crosshair;
}

/* Holding builds a tremble that grows with the charge. */
.charge-shake {
  animation: shake 90ms linear infinite;
  animation-play-state: paused;
  scale: calc(1 + var(--charge, 0) * 0.04);
}

.stage:active .charge-shake {
  animation-play-state: running;
}

@keyframes shake {
  0%, 100% { translate: 0 0; }
  25% { translate: calc(var(--charge, 0) * 4px) calc(var(--charge, 0) * -3px); }
  75% { translate: calc(var(--charge, 0) * -3px) calc(var(--charge, 0) * 4px); }
}

@media (prefers-reduced-motion: reduce) {
  .charge-shake {
    animation: none;
  }
}

.stage :deep(.ring) {
  position: absolute;
  width: 150vmax;
  height: 150vmax;
  border-radius: 50%;
  border: 2px solid #fff;
  mix-blend-mode: difference;
  pointer-events: none;
}
</style>

<route lang="yaml">
meta:
  layout: home
</route>
