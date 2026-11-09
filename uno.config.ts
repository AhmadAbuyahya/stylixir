import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  shortcuts: [
    ['btn', 'px-4 py-1 rounded-lg inline-block bg-[var(--ink)] text-[var(--paper)] cursor-pointer !outline-none disabled:cursor-default disabled:opacity-50'],
    ['icon-btn', 'inline-block cursor-pointer select-none opacity-75 transition duration-200 ease-in-out hover:opacity-100'],
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetTypography(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        // Bolt-end stamp: condensed mill lettering for pattern names.
        display: [{ name: 'Big Shoulders Display', weights: ['700', '800', '900'] }],
        sans: [{ name: 'Schibsted Grotesk', weights: ['400', '500', '600'] }],
        mono: [{ name: 'Martian Mono', weights: ['400', '500'] }],
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  safelist: 'prose m-auto text-left'.split(' '),
})
