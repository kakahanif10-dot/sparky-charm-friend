// Real app builder — turns a natural-language prompt into actual source files
// (React + Tailwind) that run in the workspace preview and can be exported.
// Runs server-side only; the Lovable AI key never reaches the browser.

import { createOpenAI } from '@ai-sdk/openai'
import { Output, streamText } from 'ai'
import { z } from 'zod'

export type BuiltFile = { path: string; content: string }
export type BuiltApp = {
  name: string
  description: string
  files: BuiltFile[]
}

const MODEL = 'openai/gpt-6-astra'

const FileSchema = z.object({
  path: z.string(),
  content: z.string(),
})

const AppSchema = z.object({
  name: z.string(),
  description: z.string(),
  files: z.array(FileSchema),
})

const SYSTEM = `You are a senior full-stack product engineer. You write REAL, working application source code for the user's idea — never pseudo-code, never placeholders, never "TODO" comments.

Output contract (strict):
- Emit a complete, self-contained React + Tailwind app as a list of files with real file paths and full file contents.
- ALWAYS include these files, plus any extra components you need:
  - "index.html" — realistic HTML host document (Tailwind CDN + React CDN + the app script). Used for export.
  - "src/App.jsx" — MUST have "export default function App()" as the app root.
  - "src/main.jsx" — mounts <App /> into #root.
  - "src/styles.css" — any custom CSS (keep it small; prefer Tailwind classes).
  - 2 to 6 files under "src/components/" — one component per file, each with a default export.
- Imports: only "react" (hooks included) and RELATIVE paths to your own files. NO npm packages, NO icon libraries, NO routers, NO fetch to external APIs, NO image URLs from other domains (use CSS gradients, emoji or inline SVG instead).
- Target React 18 runtime APIs (useState, useEffect, useMemo, useRef). No server components, no React 19-only APIs.
- Style with Tailwind utility classes only (Tailwind v3 CDN). Make it genuinely beautiful and opinionated: deliberate palette, real typographic hierarchy, spacing rhythm, hover/active states, responsive layout.
- The app must be INTERACTIVE and functional with realistic local state and seeded demo data that fits the exact product described (navigation between views, forms that validate, lists that filter, carts that total, toggles that persist in state).
- Content must match the user's prompt exactly — the real domain, language and tone they used. Never drift to an unrelated product. If the prompt is in Indonesian, Thai, etc., write the UI copy in that language.
- "name": short product name (max 24 chars). "description": one sentence.

Return only the structured object. No markdown, no code fences inside file contents.`

/** Generates real source files for a prompt using Lovable AI. */
export async function buildAppFiles(
  prompt: string,
  previousFiles?: BuiltFile[],
): Promise<BuiltApp> {
  const key = process.env['LOVABLE_API_KEY']
  if (!key) throw new Error('AI is not configured for this project.')

  const runtimeFetch: typeof fetch = (input, init) => fetch(input, init)
  const lovable = createOpenAI({
    baseURL: 'https://ai.gateway.lovable.dev/v1',
    apiKey: key,
    headers: {
      'Lovable-API-Key': key,
      'X-Lovable-AIG-SDK': 'vercel-ai-sdk',
    },
    fetch: runtimeFetch,
  })

  const context =
    previousFiles && previousFiles.length
      ? `\n\nThis is a CHANGE REQUEST on an existing app. Here are its current files — return the FULL updated file set, keeping everything the user did not ask to change:\n${previousFiles
          .map((f) => `--- ${f.path} ---\n${f.content}`)
          .join('\n\n')
          .slice(0, 60000)}`
      : ''

  const result = streamText({
    model: lovable.responses(MODEL),
    system: SYSTEM,
    prompt: `${prompt}${context}`,
    output: Output.object({ schema: AppSchema }),
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: 'low',
        reasoningSummary: 'auto',
        store: false,
        include: ['reasoning.encrypted_content'],
      },
    },
  })

  const app = (await result.output) as BuiltApp

  const files = (app.files ?? [])
    .filter((f) => f && typeof f.path === 'string' && typeof f.content === 'string')
    .map((f) => ({ path: f.path.replace(/^\.?\//, ''), content: f.content }))

  if (!files.some((f) => f.path === 'src/App.jsx')) {
    throw new Error('The build did not produce an app entry file. Please try again.')
  }

  return {
    name: (app.name || 'Untitled app').slice(0, 60),
    description: (app.description || '').slice(0, 400),
    files,
  }
}
