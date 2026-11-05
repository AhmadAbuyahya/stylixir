/**
 * CLI: render one contact sheet per pattern (rows = numeric variables, columns = values
 * swept across each range, others at default) and flag suspicious sweeps.
 *
 *   pnpm audit:sheets                         # every pattern
 *   pnpm audit:sheets zigzag waves            # some patterns
 *   pnpm audit:sheets zigzag --var width --range 50:99 --steps 12 --scale 1
 *
 * Writes audit-sheets/<slug>.png and audit-sheets/report.json.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import templates from '../src/lib/templates'
import { defaultVariables, generateCss, interpolateTemplate } from '../src/lib/pattern'
import { type SweepFlag, type TileStats, flagSweep, sampleRange } from '../src/lib/audit'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(__dirname, '../audit-sheets')

const TILE = 240 // CSS px; big enough to show a couple of repeats at the largest sizes

function parseArgs(argv: string[]) {
  const opts = { slugs: [] as string[], variable: '', range: undefined as [number, number] | undefined, steps: 7, scale: 0.5 }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--var')
      opts.variable = argv[++i]
    else if (arg === '--range')
      opts.range = argv[++i].split(':').map(Number) as [number, number]
    else if (arg === '--steps')
      opts.steps = Number(argv[++i])
    else if (arg === '--scale')
      opts.scale = Number(argv[++i])
    else
      opts.slugs.push(arg)
  }
  for (const slug of opts.slugs) {
    if (!templates[slug])
      throw new Error(`Unknown pattern: ${slug}`)
  }
  if (opts.range && (opts.range.length !== 2 || opts.range.some(Number.isNaN)))
    throw new Error('--range expects lo:hi')
  return opts
}

// Flags about specific values (vs the whole sweep) get their tiles outlined.
const isLocal = (f: SweepFlag) => f.kind !== 'dead' && f.kind !== 'subtle'

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

interface Row { name: string; values: number[] }

function sheetHtml(slug: string, rows: Row[], scale: number) {
  const { template, variables } = templates[slug]
  const defaults = defaultVariables(variables)
  const font = Math.round(12 / scale)
  const tile = (values: Record<string, string | number>, label: string, cls: string) => {
    const style = generateCss(Object.fromEntries(
      Object.entries(template).map(([prop, css]) => [prop, interpolateTemplate(css, values)]),
    )).replace(/\n/g, ' ')
    return `<figure class="${cls}"><div class="t" style="${escape(style)}"></div><figcaption>${label}</figcaption></figure>`
  }
  const body = rows.map(({ name, values }) => {
    const v = variables[name]
    return `<section data-var="${name}">
      <div class="row">
        <h2>${name}<small>${v.min}–${v.max}${v.step ? ` /${v.step}` : ''}</small></h2>
        ${tile(defaults, `default ${defaults[name]}`, 'default')}
        ${values.map(value => tile({ ...defaults, [name]: value }, String(value), 'sample')).join('')}
      </div>
      <p class="flags"></p>
    </section>`
  }).join('')

  return `<!doctype html><html><head><style>
    body { margin: 0; padding: ${font}px; background: #1a1a1a; color: #ddd; font: ${font}px/1.2 monospace; width: max-content; }
    h1 { font-size: ${font * 1.4}px; margin: 0 0 ${font}px; }
    section { margin-bottom: ${font}px; }
    .row { display: flex; gap: ${font / 2}px; align-items: flex-start; }
    h2 { flex: none; width: ${font * 10}px; margin: 0; font-size: ${font}px; overflow-wrap: anywhere; }
    h2 small { display: block; color: #888; }
    figure { margin: 0; }
    figure.default { margin-right: ${font}px; }
    figure.default .t { outline: ${2 / scale}px solid #2dd4bf; }
    figure.flagged .t { outline: ${3 / scale}px solid #f43f5e; }
    .t { width: ${TILE}px; height: ${TILE}px; }
    figcaption { text-align: center; color: #aaa; }
    .flags { width: 0; min-width: 100%; margin: 0; color: #fb7185; }
    body > section { width: max-content; }
    .flags:empty { display: none; }
  </style></head><body><h1>${slug}</h1>${body}</body></html>`
}

/** Runs in the page: decodes the screenshot and summarises each tile's pixels. */
async function analyse({ png, rects, pairs }: { png: string; rects: number[][]; pairs: number[][] }) {
  const img = new Image()
  img.src = `data:image/png;base64,${png}`
  await img.decode()
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)

  const tiles = rects.map(([x, y, w, h]) => ctx.getImageData(x, y, w, h))
  const stats = tiles.map(({ data, width, height }) => {
    const hist: Record<string, number> = {}
    let edge = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const key = `${data[i] >> 5},${data[i + 1] >> 5},${data[i + 2] >> 5}`
        hist[key] = (hist[key] ?? 0) + 1
        const r = x < width - 1 ? i + 4 : i
        const d = y < height - 1 ? i + width * 4 : i
        for (let c = 0; c < 3; c++)
          edge += Math.abs(data[i + c] - data[r + c]) + Math.abs(data[i + c] - data[d + c])
      }
    }
    const n = width * height
    for (const key in hist) hist[key] /= n
    // Drop sub-0.2% bins: antialiasing noise, not real colours.
    for (const key in hist) {
      if (hist[key] < 0.002)
        delete hist[key]
    }
    return { hist, dominant: Math.max(...Object.values(hist)), edge: edge / (n * 6 * 255) }
  })

  const diffs = pairs.map(([a, b]) => {
    const A = tiles[a].data
    const B = tiles[b].data
    // Fraction of pixels that visibly changed, so a small moving detail still counts.
    let changed = 0
    for (let i = 0; i < A.length; i += 4) {
      if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 48)
        changed++
    }
    return changed / (A.length / 4)
  })
  return { stats, diffs }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2).filter(arg => arg !== '--'))
  const slugs = opts.slugs.length ? opts.slugs : Object.keys(templates).sort()
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await chromium.launch()
  const page = await browser.newPage({ deviceScaleFactor: opts.scale, viewport: { width: 800, height: 600 } })
  const report: Record<string, Record<string, { values: number[]; flags: SweepFlag[] }>> = {}

  for (const slug of slugs) {
    const { variables } = templates[slug]
    const rows: Row[] = Object.entries(variables)
      .filter(([name, v]) => v.type !== 'color' && (!opts.variable || name === opts.variable))
      .map(([name, v]) => ({ name, values: sampleRange(v, opts.steps, opts.range) }))
    if (!rows.length)
      continue

    await page.setContent(sheetHtml(slug, rows, opts.scale))
    const rects = await page.$$eval('.t', (els, s) => els.map((el) => {
      const r = el.getBoundingClientRect()
      return [r.x, r.y, r.width, r.height].map(n => Math.round(n * s))
    }), opts.scale)

    // Tile order per row: default, then samples.
    let offset = 0
    const layout = rows.map((row) => {
      const start = offset
      offset += row.values.length + 1
      return { defaultIdx: start, first: start + 1, last: start + row.values.length }
    })
    const png = (await page.screenshot({ fullPage: true })).toString('base64')
    const { stats, diffs } = await page.evaluate(analyse, {
      png,
      rects,
      pairs: layout.flatMap(l => Array.from({ length: l.last - l.first + 1 }, (_, k) => [l.first, l.first + k])),
    })

    report[slug] = {}
    const marks: { row: number; values: number[]; text: string }[] = []
    let pair = 0
    rows.forEach((row, r) => {
      const l = layout[r]
      const rowDiffs = diffs.slice(pair, pair += row.values.length)
      const flags = flagSweep(row.values, stats.slice(l.first, l.last + 1) as TileStats[], stats[l.defaultIdx] as TileStats, rowDiffs)
      report[slug][row.name] = { values: row.values, flags }
      if (flags.length) {
        marks.push({
          row: r,
          values: [...new Set(flags.filter(isLocal).flatMap(f => f.at))],
          text: flags.map(f => `${f.kind}: ${f.detail}${isLocal(f) ? ` @ ${f.at.join(', ')}` : ''}`).join(' · '),
        })
        console.log(`${slug}.${row.name}: ${flags.map(f => f.kind).join(', ')}`)
      }
    })

    await page.evaluate((marks) => {
      const sections = document.querySelectorAll('section')
      for (const { row, values, text } of marks) {
        const section = sections[row]
        section.querySelector('.flags')!.textContent = text
        section.querySelectorAll('figure.sample').forEach((fig) => {
          if (values.includes(Number(fig.querySelector('figcaption')!.textContent)))
            fig.classList.add('flagged')
        })
      }
    }, marks)
    await page.screenshot({ fullPage: true, path: path.join(outDir, `${slug}.png`) })
  }

  await browser.close()
  const reportPath = path.join(outDir, 'report.json')
  // Merge so partial runs (a few slugs / one var) don't wipe the full report.
  const previous = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')) : {}
  fs.writeFileSync(reportPath, `${JSON.stringify({ ...previous, ...report }, null, 2)}\n`)
  console.log(`\n${Object.keys(report).length} sheets -> ${path.relative(process.cwd(), outDir)}/`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
