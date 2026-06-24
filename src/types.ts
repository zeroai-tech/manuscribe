// Shared types for the crawl → analyse → render pipeline.

export interface NetworkCall {
  method: string
  url: string
  resourceType: string // 'xhr' | 'fetch' | ...
}

export interface UiElement {
  kind: string  // 'button' | 'link' | 'input' | 'heading' | ...
  text: string
}

// One screen captured from the running app.
export interface CapturedPage {
  url: string
  title: string
  screenshot: string       // absolute path to the PNG on disk
  text: string             // trimmed visible text (context for Claude)
  elements: UiElement[]    // interactive elements / headings
  requests: NetworkCall[]  // XHR/fetch made while loading this screen
}

// One written manual section (markdown), tied to its screenshot.
export interface ManualSection {
  title: string
  url: string
  screenshot: string
  markdown: string
}

// The synthesised front-/back-matter of the manual.
export interface ManualSynthesis {
  overview: string   // markdown
  dataFlow: string   // markdown
  glossary: string   // markdown
}

export interface GenerateOptions {
  url: string
  out: string
  appName?: string
  maxPages: number
  model: string
  apiKey: string
  repo?: string      // optional path to source for data-flow context
  headful: boolean
  outDir: string     // working dir for screenshots
}
