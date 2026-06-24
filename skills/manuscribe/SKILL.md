---
name: manuscribe
description: Generate a polished PDF user manual from a running web app. Use when the user wants documentation, a user guide/manual, onboarding docs, or a UX/data-flow walkthrough of an app reachable by URL (e.g. a localhost dev server). Crawls the app, screenshots every screen, and Claude writes the manual.
---

# manuscribe — auto user manuals

Turn a running web app into a professional PDF user manual (overview, a section
per screen with screenshots, data flow, glossary).

## When to use

The user says things like "make a user manual / user guide / documentation for
this app", "document the UX", "explain how this app works for end users", and the
app is running somewhere you can reach by URL (often `http://localhost:<port>`).

## Prerequisites

1. The app must be **running** and reachable by URL. If it isn't, start its dev
   server first (e.g. `npm run dev`) and confirm the port.
2. `ANTHROPIC_API_KEY` must be set in the environment (the same key Claude Code
   uses). If missing, ask the user to export it.
3. Chromium installed once: `npx playwright install chromium`.

## How to run

From the manuscribe repo (or once installed globally):

```bash
manuscribe generate <url> \
  --name "<App Name>" \
  --pages <n> \
  --repo <path-to-source-if-available> \
  --out <output>.pdf
```

- `<url>`: where the app is running, e.g. `http://localhost:5173`.
- `--name`: the product name for the cover (ask the user if unclear).
- `--pages`: how many screens to crawl (default 8; raise for bigger apps).
- `--repo`: if the user is in the app's repo, pass its path for richer data-flow
  context (manuscribe reads README + package.json).
- `--out`: where to save the PDF.

## Workflow for the agent

1. Confirm the running URL and the app name.
2. If the working directory is the app's source, pass it via `--repo`.
3. Run the `generate` command; stream the progress to the user.
4. Report the output PDF path. Offer to open it or to re-run with more `--pages`.

## Notes

- Auth-gated apps may need `--headful` and a manual login.
- Claude documents only what it can see; remind the user to review before sharing.
