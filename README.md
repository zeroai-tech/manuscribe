# manuscribe

**Point it at your running web app — get a polished PDF user manual.** manuscribe
crawls a live app, screenshots every screen, and uses **Claude** to write a real
end-user manual: an overview, a section per screen (what it's for, what you see,
how to use it), how your data flows, and a glossary — screenshots placed in the
right spots.

Built for small teams that ship fast but have no docs, QA, or design department.
A product of **[ZeroAI](https://zeroaitech.tech)**.

```bash
manuscribe generate http://localhost:5173 --name "My App" --out my-app-manual.pdf
```

---

## Why

You're building an app. There's no technical writer. The "manual" is tribal
knowledge. manuscribe turns the app **as it actually is right now** into a clean,
shareable PDF — so onboarding, support, investor decks and pilots have something
real behind them.

## How it works

```
running app ──▶ Playwright crawl ──▶ screenshots + UI elements + network calls
                                            │
                                            ▼
                                   Claude (claude-opus-4-8, vision)
                                   writes a section per screen
                                            │
                                            ▼
                          synthesis: overview · data flow · glossary
                                            │
                                            ▼
                                   self-contained PDF manual
```

## Install

```bash
npm install -g manuscribe          # or: npx manuscribe
npx playwright install chromium    # one-time: the browser engine
```

Set your key (the **same one Claude Code uses**):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Usage

```bash
manuscribe generate <url> [options]
```

| Option | Default | Description |
|---|---|---|
| `-o, --out <file>` | `manual.pdf` | Output PDF path |
| `-n, --name <name>` | page title | App name on the cover |
| `-p, --pages <n>` | `8` | Max screens to crawl |
| `-m, --model <id>` | `claude-opus-4-8` | Claude model |
| `--repo <path>` | — | Source repo for richer data-flow context |
| `--headful` | off | Show the browser while crawling |
| `--out-dir <dir>` | `manuscribe-out` | Working dir for screenshots |

### Example

```bash
# Document a local dev server, 12 screens, with repo context for data flow
manuscribe generate http://localhost:3000 \
  --name "ZaiCAD" --pages 12 --repo ../zaicad --out zaicad-manual.pdf
```

## Use it from Claude Code

manuscribe ships a Claude Code skill (`skills/manuscribe/SKILL.md`). With it,
you can just say:

> "Generate a user manual for the app running on localhost:5173"

and Claude Code drives manuscribe for you. This is the seed of a bigger idea:
**add a repo/URL, get the manual** — see [`docs/vision.md`](docs/vision.md).

## Requirements

- Node ≥ 18
- A running app reachable by URL (localhost is fine)
- An Anthropic API key
- Chromium via `npx playwright install chromium`

## Notes & limits

- Crawls **same-origin** links breadth-first; auth-gated flows may need
  `--headful` plus a manual login (cookie reuse is on the roadmap).
- Claude writes only from what it can **see and observe** — review before you ship.
- Cost scales with `--pages` (one vision call per screen + one synthesis call).

## License

MIT © ZeroAI (Lottie Mukuka). See [LICENSE](LICENSE).
