#!/usr/bin/env node
import { Command } from 'commander'
import { resolve } from 'node:path'
import { generate } from './generate.js'
import { log } from './log.js'

const program = new Command()
program
  .name('manuscribe')
  .description('Generate a polished PDF user manual from your running web app — written by Claude.')
  .version('0.1.0')

program
  .command('generate')
  .argument('<url>', 'URL of the running app (e.g. http://localhost:5173)')
  .option('-o, --out <file>', 'output PDF path', 'manual.pdf')
  .option('-n, --name <name>', 'app name shown on the cover')
  .option('-p, --pages <n>', 'maximum screens to crawl', '8')
  .option('-m, --model <id>', 'Claude model', 'claude-opus-4-8')
  .option('--repo <path>', 'path to the source repo for richer data-flow context')
  .option('--headful', 'show the browser while it crawls', false)
  .option('--out-dir <dir>', 'working directory for screenshots', 'manuscribe-out')
  .action(async (url: string, o: { out: string; name?: string; pages: string; model: string; repo?: string; headful: boolean; outDir: string }) => {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) { log.err('Set ANTHROPIC_API_KEY (the same key Claude Code uses).'); process.exit(1) }
    try {
      await generate({
        url,
        out: resolve(o.out),
        appName: o.name,
        maxPages: Math.max(1, parseInt(o.pages, 10) || 8),
        model: o.model,
        apiKey,
        repo: o.repo ? resolve(o.repo) : undefined,
        headful: !!o.headful,
        outDir: resolve(o.outDir),
      })
    } catch (e) {
      log.err((e as Error).message)
      process.exit(1)
    }
  })

program.parseAsync()
