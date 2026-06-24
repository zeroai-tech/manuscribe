# Vision

## The idea

Most small teams ship software with **no documentation, no QA, and no design
department**. The knowledge of how the app works lives in one or two people's
heads. manuscribe closes that gap: it reads the app **as it actually is** and
produces the manual those teams never have time to write.

## Where it's going

The CLI is step one. The bigger product is simple to state:

> **Add a repo or a URL → get the manual.**

A user contributes the app (the hard 80% — the real product, the real screens).
Claude contributes the writing, the structure, the screenshots-in-the-right-place
(the 20%). That split is the whole point: the human builds the thing; the AI
documents it faithfully and beautifully.

This is a natural feature for an AI design/build surface: paste a link, get a
living manual that regenerates every release.

## Roadmap

1. **Crawl + write + PDF** — ✅ shipped in 0.1.0.
2. **Authenticated & interactive flows** — log in, click through tasks, document
   multi-step journeys (not just landing screens).
3. **Living docs** — regenerate on each release; diff manuals between versions.
4. **Output targets** — PDF, hosted HTML site, in-app help, Markdown for repos.
5. **Review loop** — human edits a section; Claude keeps the rest consistent.

## Credit

Originated by **Lottie Mukuka (ZeroAI)** — the concept, the use case, and the
"80% you / 20% Claude" framing are his.
