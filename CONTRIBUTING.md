# Contributing to manuscribe

Thanks for helping make manuscribe better.

## Development

```bash
git clone https://github.com/Lottie128/manuscribe.git
cd manuscribe
npm install
npx playwright install chromium
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev -- generate http://localhost:5173 --pages 3   # run from source (tsx)
```

- `npm run typecheck` — strict TypeScript, no emit.
- `npm run build` — compile `src` → `dist`.

## Project layout

| File | Role |
|---|---|
| `src/cli.ts` | Command-line entry (Commander) |
| `src/generate.ts` | Pipeline orchestrator |
| `src/crawl.ts` | Playwright crawl, screenshots, network capture |
| `src/analyze.ts` | Claude calls (sections + synthesis) |
| `src/manual.ts` | HTML assembly |
| `src/pdf.ts` | HTML → PDF (Playwright) |

## Ground rules

- TypeScript stays **strict**; `npm run typecheck` must pass.
- Claude calls use the official `@anthropic-ai/sdk`, default model
  `claude-opus-4-8`. Don't introduce other providers.
- Keep the CLI dependency-light and the PDF self-contained.
- Update `CHANGELOG.md` under **[Unreleased]** with every user-facing change.

## Releasing

1. Move `[Unreleased]` notes into a new version section in `CHANGELOG.md`.
2. Bump `version` in `package.json` (SemVer).
3. Tag: `git tag vX.Y.Z && git push --tags`.
4. Create the GitHub release from the changelog section.
