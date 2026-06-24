// `manuscribe render <manual.json>` — the mechanical render step. No AI, no key.
// Takes the manual the agent wrote and produces print-ready output (PDF or PNG).

import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { buildHtml } from './manual.js'
import { htmlToPdf, htmlToPng } from './pdf.js'
import { log } from './log.js'
import type { ManualInput } from './types.js'

export interface RenderCmdOptions { format?: 'pdf' | 'png'; scale?: number; baseDir?: string }

export async function runRender(manualPath: string, out: string, opts: RenderCmdOptions = {}): Promise<void> {
  const manual = JSON.parse(await readFile(manualPath, 'utf8')) as ManualInput
  if (!manual.sections?.length) throw new Error('manual.json has no sections.')
  const base = opts.baseDir ? resolve(opts.baseDir) : dirname(resolve(manualPath))
  const format = opts.format ?? 'pdf'

  log.step(`Rendering ${manual.sections.length} section(s) → ${format.toUpperCase()}…`)
  const html = await buildHtml(manual, base)
  if (format === 'png') await htmlToPng(html, out, { scale: opts.scale })
  else await htmlToPdf(html, out, { appName: manual.appName, scale: opts.scale })
  log.ok(`Manual written to ${out}`)
}
