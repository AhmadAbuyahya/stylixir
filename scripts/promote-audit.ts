/**
 * CLI: promote an audit draft JSON into src/lib/templates.ts
 *
 *   pnpm audit:promote --slug zigzag --file draft.json
 *   pnpm audit:promote --slug zigzag   # reads JSON from stdin
 *
 * Draft JSON shape: { "template": {...}, "variables": {...}, "harmony"?: "ramp" }
 */
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { replaceTemplateEntry } from '../src/lib/audit-promote'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const templatesPath = path.resolve(root, 'src/lib/templates.ts')

function usage() {
  console.error(`Usage:
  pnpm audit:promote --slug <pattern> --file <draft.json>
  pnpm audit:promote --slug <pattern> < draft.json
`)
  process.exit(1)
}

function parseArgs(argv: string[]) {
  let slug = ''
  let file = ''
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--slug')
      slug = argv[++i] ?? ''
    else if (argv[i] === '--file')
      file = argv[++i] ?? ''
    else if (argv[i] === '--help' || argv[i] === '-h')
      usage()
  }
  return { slug, file }
}

async function readStdin() {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin)
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const { slug, file } = parseArgs(process.argv.slice(2))
  if (!slug)
    usage()

  const raw = file
    ? fs.readFileSync(path.resolve(file), 'utf8')
    : await readStdin()

  if (!raw.trim()) {
    console.error('Empty draft JSON')
    process.exit(1)
  }

  const draft = JSON.parse(raw)
  if (!draft.template || !draft.variables) {
    console.error('Draft must include template and variables')
    process.exit(1)
  }

  const source = fs.readFileSync(templatesPath, 'utf8')
  const next = replaceTemplateEntry(source, slug, draft)
  fs.writeFileSync(templatesPath, next, 'utf8')
  console.log(`Promoted '${slug}' → src/lib/templates.ts`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
