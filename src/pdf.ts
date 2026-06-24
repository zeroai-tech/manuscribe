// Render the assembled HTML to print-ready output with the same browser engine
// (Playwright/Chromium) used for crawling. The HTML is laid out as precise A4
// pages (CSS `@page { size: A4 }` + `preferCSSPageSize`), so what you see maps
// 1:1 to the printed page. Supports PDF (vector text, crisp at any DPI) and a
// high-resolution PNG, with a `scale` quality lever.

import { chromium } from 'playwright'

export interface RenderOptions { appName?: string; scale?: number }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function htmlToPdf(html: string, outPath: string, opts: RenderOptions = {}): Promise<void> {
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.emulateMedia({ media: 'print' })
    const foot = `${esc(opts.appName ?? '')} · ZeroAI`
    await page.pdf({
      path: outPath,
      printBackground: true,
      format: 'A4',                   // explicit A4 + the margins below (reliable full-bleed sides)
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        `<div style="width:100%;font-size:8px;color:#9aa0ad;font-family:Helvetica,Arial,sans-serif;padding:0 14mm;display:flex;justify-content:space-between;align-items:center;">` +
        `<span>${foot}</span>` +
        `<span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
      margin: { top: '12mm', bottom: '12mm', left: '0', right: '0' },
    })
  } finally {
    await browser.close()
  }
}

// One tall, high-resolution PNG of the whole document (good for web/preview/social).
export async function htmlToPng(html: string, outPath: string, opts: RenderOptions = {}): Promise<void> {
  const scale = Math.max(1, Math.min(opts.scale ?? 2, 4))
  const browser = await chromium.launch({ headless: true })
  try {
    // 210 mm at 96 dpi ≈ 794 px; deviceScaleFactor multiplies the output resolution.
    const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: scale })
    const page = await ctx.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.screenshot({ path: outPath, fullPage: true })
  } finally {
    await browser.close()
  }
}
