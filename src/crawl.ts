// Crawl a running web app with a headless browser: visit pages (same-origin
// breadth-first), take a full-page screenshot of each, extract the interactive
// UI elements, and record the XHR/fetch calls each screen makes (for data-flow).

import { chromium, type Browser, type Page } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { CapturedPage, NetworkCall, UiElement } from './types.js'
import { log } from './log.js'

const slug = (url: string) =>
  url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'page'

async function extract(page: Page): Promise<{ text: string; elements: UiElement[] }> {
  return page.evaluate(() => {
    const seen = new Set<string>()
    const els: { kind: string; text: string }[] = []
    const add = (kind: string, text: string) => {
      const t = (text || '').replace(/\s+/g, ' ').trim()
      if (!t || t.length > 80) return
      const key = kind + '|' + t.toLowerCase()
      if (seen.has(key)) return
      seen.add(key); els.push({ kind, text: t })
    }
    document.querySelectorAll('h1,h2,h3').forEach(e => add('heading', e.textContent || ''))
    document.querySelectorAll('button,[role="button"]').forEach(e => add('button', e.textContent || ''))
    document.querySelectorAll('a[href]').forEach(e => add('link', e.textContent || ''))
    document.querySelectorAll('input,textarea,select').forEach(e => {
      const el = e as HTMLInputElement
      add('input', el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('name') || el.type || 'field')
    })
    const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 2500)
    return { text, elements: els.slice(0, 60) }
  })
}

async function sameOriginLinks(page: Page, origin: string): Promise<string[]> {
  return page.evaluate((o) => {
    const out = new Set<string>()
    document.querySelectorAll('a[href]').forEach(a => {
      try {
        const u = new URL((a as HTMLAnchorElement).href, location.href)
        u.hash = ''
        if (u.origin === o) out.add(u.toString())
      } catch { /* ignore */ }
    })
    return [...out]
  }, origin)
}

export async function crawlSite(
  startUrl: string, maxPages: number, outDir: string, headful: boolean,
): Promise<CapturedPage[]> {
  const shotDir = join(outDir, 'screenshots')
  await mkdir(shotDir, { recursive: true })
  const origin = new URL(startUrl).origin

  let browser: Browser | null = null
  try {
    browser = await chromium.launch({ headless: !headful })
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const queue = [startUrl]
    const visited = new Set<string>()
    const pages: CapturedPage[] = []

    while (queue.length && pages.length < maxPages) {
      const url = queue.shift()!
      if (visited.has(url)) continue
      visited.add(url)

      const page = await ctx.newPage()
      const requests: NetworkCall[] = []
      page.on('request', r => {
        const t = r.resourceType()
        if (t === 'xhr' || t === 'fetch') requests.push({ method: r.method(), url: r.url(), resourceType: t })
      })
      try {
        log.step(`Visiting ${url}`)
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => page.goto(url, { waitUntil: 'load', timeout: 30000 }))
        await page.waitForTimeout(800) // let late renders settle
        const shot = join(shotDir, `${pages.length + 1}-${slug(url)}.png`)
        await page.screenshot({ path: shot, fullPage: true })
        const { text, elements } = await extract(page)
        pages.push({ url, title: (await page.title()) || url, screenshot: shot, text, elements, requests })

        if (pages.length < maxPages) {
          for (const link of await sameOriginLinks(page, origin)) {
            if (!visited.has(link) && !queue.includes(link)) queue.push(link)
          }
        }
      } catch (e) {
        log.warn(`Skipped ${url}: ${(e as Error).message}`)
      } finally {
        await page.close()
      }
    }
    return pages
  } finally {
    await browser?.close()
  }
}
