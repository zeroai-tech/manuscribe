// Orchestrates the pipeline: crawl → write a section per screen → synthesise
// front/back matter → render the PDF.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { crawlSite } from './crawl.js'
import { makeClient, describePage, synthesize } from './analyze.js'
import { buildHtml } from './manual.js'
import { htmlToPdf } from './pdf.js'
import { log } from './log.js'
import type { GenerateOptions, ManualSection, NetworkCall } from './types.js'

async function repoContext(repo: string): Promise<string | null> {
  const parts: string[] = []
  for (const f of ['README.md', 'package.json']) {
    try { parts.push(`# ${f}\n${(await readFile(join(repo, f), 'utf8')).slice(0, 2000)}`) } catch { /* optional */ }
  }
  return parts.length ? parts.join('\n\n') : null
}

export async function generate(opts: GenerateOptions): Promise<void> {
  log.step(`Crawling ${opts.url} (up to ${opts.maxPages} screens)…`)
  const pages = await crawlSite(opts.url, opts.maxPages, opts.outDir, opts.headful)
  if (!pages.length) throw new Error('No screens captured — is the app actually running at that URL?')
  log.ok(`Captured ${pages.length} screen(s).`)

  const client = makeClient(opts.apiKey)
  const appName = opts.appName || pages[0].title || new URL(opts.url).hostname
  const sections: ManualSection[] = []
  for (const [i, p] of pages.entries()) {
    log.step(`Writing section ${i + 1}/${pages.length}: ${p.title}`)
    const markdown = await describePage(client, opts.model, p)
    const title = (markdown.match(/^##\s+(.+)$/m)?.[1] || p.title).trim()
    sections.push({ title, url: p.url, screenshot: p.screenshot, markdown })
  }

  log.step('Synthesising overview, data flow & glossary…')
  const allRequests: NetworkCall[] = pages.flatMap(p => p.requests)
  const repo = opts.repo ? await repoContext(opts.repo) : null
  const synth = await synthesize(client, opts.model, appName, pages, allRequests, repo)

  log.step('Rendering PDF…')
  const html = await buildHtml(appName, opts.url, synth, sections)
  await htmlToPdf(html, opts.out)
  log.ok(`Manual written to ${opts.out}`)
}
