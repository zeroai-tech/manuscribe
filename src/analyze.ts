// Claude does the writing: it looks at each screenshot (vision) plus the
// extracted UI elements and network calls, and produces a user-manual section.
// A final synthesis pass writes the overview, data-flow and glossary.

import Anthropic from '@anthropic-ai/sdk'
import { readFile } from 'node:fs/promises'
import type { CapturedPage, ManualSynthesis, NetworkCall } from './types.js'

export function makeClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey })
}

function textOf(msg: Anthropic.Message): string {
  return msg.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('\n').trim()
}

const SECTION_SYSTEM = `You are a senior technical writer producing a printed end-user manual for a web application.
You are given ONE screen: a screenshot, its interactive elements, and the network calls it made.
Write the manual section for THIS screen only, in GitHub-flavoured Markdown:
- Start with a level-2 heading: the screen's human name (not the URL).
- One short paragraph: what this screen is for, in plain language a non-technical user understands.
- "### What you see" — a short bulleted tour of the key UI areas/controls and what each does.
- "### How to use it" — a numbered, do-this-then-that walkthrough of the main task on this screen.
- If the network calls reveal what data is loaded or saved, add a one-line "_Behind the scenes:_ …" note.
Be concrete and reference real button/field labels. No preamble, no "in this section". Do not invent features you cannot see.`

const SYNTH_SYSTEM = `You are the editor assembling the front and back matter of a printed user manual.
Given the app name and the list of documented screens (with their network calls), write three parts in Markdown,
each preceded EXACTLY by its marker line on its own line:
<!--OVERVIEW-->
A welcoming "Overview & Getting Started" (2-4 short paragraphs): what the app is, who it's for, and the typical journey through the screens.
<!--DATAFLOW-->
A "How your data flows" section: in plain language, trace what happens to data as the user moves through the app, citing the observed endpoints/methods. Use a short bullet list of the key data operations.
<!--GLOSSARY-->
A "Glossary" of 5-12 terms a user of THIS app would need, each as **Term** — definition.
Keep it factual to the provided material; do not fabricate endpoints or features.`

export async function describePage(client: Anthropic, model: string, page: CapturedPage): Promise<string> {
  const b64 = (await readFile(page.screenshot)).toString('base64')
  const els = page.elements.map(e => `- (${e.kind}) ${e.text}`).join('\n') || '- (none detected)'
  const reqs = page.requests.slice(0, 30).map(r => `- ${r.method} ${r.url}`).join('\n') || '- (none observed)'
  const stream = client.messages.stream({
    model, max_tokens: 2000, system: SECTION_SYSTEM,
    messages: [{
      role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: b64 } },
        { type: 'text', text: `Screen title: "${page.title}"\nURL: ${page.url}\n\nInteractive elements:\n${els}\n\nNetwork calls on load:\n${reqs}\n\nWrite the manual section for THIS screen.` },
      ],
    }],
  })
  return textOf(await stream.finalMessage())
}

export async function synthesize(
  client: Anthropic, model: string, appName: string,
  pages: CapturedPage[], allRequests: NetworkCall[], repoContext: string | null,
): Promise<ManualSynthesis> {
  const screens = pages.map(p => `- ${p.title} (${p.url})`).join('\n')
  const endpoints = [...new Set(allRequests.map(r => `${r.method} ${new URL(r.url).pathname}`))].slice(0, 40).join('\n') || '(none observed)'
  const repo = repoContext ? `\n\nSource hints (from the repository):\n${repoContext.slice(0, 4000)}` : ''
  const stream = client.messages.stream({
    model, max_tokens: 3000, system: SYNTH_SYSTEM,
    messages: [{ role: 'user', content: `App name: ${appName}\n\nDocumented screens:\n${screens}\n\nObserved endpoints:\n${endpoints}${repo}\n\nWrite the three parts with their markers.` }],
  })
  const out = textOf(await stream.finalMessage())
  const grab = (a: string, b?: string) => {
    const start = out.indexOf(a); if (start < 0) return ''
    const from = start + a.length
    const end = b ? out.indexOf(b, from) : out.length
    return out.slice(from, end < 0 ? out.length : end).trim()
  }
  return {
    overview: grab('<!--OVERVIEW-->', '<!--DATAFLOW-->') || out,
    dataFlow: grab('<!--DATAFLOW-->', '<!--GLOSSARY-->'),
    glossary: grab('<!--GLOSSARY-->'),
  }
}
