import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import type { Template } from './src/types'

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/**
 * Dev-only middleware: POST /__audit/promote { slug, draft }
 * writes the pattern entry into src/lib/templates.ts.
 * GET /__audit/baseline?ref=main returns templates.ts as it is at a git ref.
 */
export function auditPromotePlugin(root = process.cwd()): Plugin {
  const templatesPath = path.resolve(root, 'src/lib/templates.ts')

  return {
    name: 'audit-promote',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__audit/baseline', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        const ref = new URL(req.url ?? '/', 'http://localhost').searchParams.get('ref') || 'main'
        // No leading '-' so the ref can never be read as a git option.
        if (!/^\w[\w./~^-]*$/.test(ref)) {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, error: `Invalid ref: ${ref}` }))
          return
        }

        try {
          const source = execFileSync('git', ['show', `${ref}:src/lib/templates.ts`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
          // ssrLoadModule needs a real file; name it by content so each version loads fresh.
          const dir = path.resolve(root, 'audit-sheets/.baseline')
          const file = path.join(dir, `${createHash('sha1').update(source).digest('hex')}.ts`)
          if (!fs.existsSync(file)) {
            fs.mkdirSync(dir, { recursive: true })
            fs.writeFileSync(file, source, 'utf8')
          }
          const { default: templates } = await server.ssrLoadModule(file)
          res.end(JSON.stringify({ ok: true, ref, templates }))
        }
        catch (error) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }))
        }
      })

      server.middlewares.use('/__audit/promote', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const raw = await readBody(req)
          const body = JSON.parse(raw) as { slug?: string; draft?: Template }

          if (!body.slug || !body.draft?.template || !body.draft?.variables) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: 'Expected { slug, draft }' }))
            return
          }

          const { replaceTemplateEntry } = await server.ssrLoadModule('/src/lib/audit-promote.ts') as {
            replaceTemplateEntry: (source: string, slug: string, draft: Template) => string
          }

          const source = fs.readFileSync(templatesPath, 'utf8')
          const nextSource = replaceTemplateEntry(source, body.slug, body.draft)
          fs.writeFileSync(templatesPath, nextSource, 'utf8')

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, slug: body.slug, path: 'src/lib/templates.ts' }))
        }
        catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          }))
        }
      })
    },
  }
}
