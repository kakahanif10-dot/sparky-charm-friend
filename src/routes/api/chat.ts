// SUPERINTELLIGENS — Conversational consultant endpoint.
// Powers real, responsive back-and-forth chat with the AI consultant (distinct
// from /api/generate, which compiles a full app spec). Runs on the AI SDK
// through the Vercel AI Gateway (zero-config auth, no provider key) and always
// degrades to a coherent local reply so the consultant never goes silent.

import { createFileRoute } from '@tanstack/react-router'
import { geminiStreamText, type GeminiTurn } from '@/lib/gemini.server'

// Ordered fallbacks tried when the primary model is overloaded or rate-limited.
// Note: gemini-3.6-flash has a tiny free-tier daily quota (~20 req/day), so the
// list starts with models that keep working on a free key.
const MODEL_FALLBACKS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-flash-latest',
] as const

type ChatTurn = { role: 'user' | 'assistant'; text: string }
type SpecContext = {
  appName?: string
  industry?: string
  template?: string
  hasContent?: boolean
}

function systemPrompt(spec: SpecContext): string {
  const ctx = spec.hasContent
    ? `The user is currently working on an app called "${spec.appName}" in the "${spec.industry}" vertical (template: ${spec.template}). Ground your answers in that app when relevant.`
    : `The user has not generated an app yet. Encourage them to describe the product they want to build.`

  return `You are the SUPERINTELLIGENS AI Consultant — a warm, sharp, senior product engineer having a live chat with a builder. ${ctx}

Rules:
- Talk like a real person, not a manual. Use natural, warm phrasing, contractions, and a bit of personality. React to what the user actually said.
- Match the user's language and tone (English or Indonesian), and mirror their level of formality.
- Be concise by default: 1-3 short sentences. It's fine to ask a quick follow-up question when it helps.
- Only when the user asks for detail or a comparison, you may use light structure to stay readable: a short "## Heading", **bold** for key terms, and "- " bullet lists. Keep it minimal — never turn a simple answer into a formatted report.
- Answer questions, give real opinions, and suggest concrete next steps.
- If the user asks you to build, add, change, or remove a feature, briefly confirm and tell them to send it so you can compile the app — do NOT output code or JSON.
- Never return fenced code blocks or raw JSON. Just talk.`
}

function toModelMessages(turns: ChatTurn[]): GeminiTurn[] {
  return turns
    .filter((t) => t && typeof t.text === 'string' && t.text.trim())
    .map((t) => ({
      role: t.role === 'assistant' ? 'assistant' : 'user',
      content: t.text.trim(),
    }))
}

// Stream a reply token-by-token so the consultant "types" like a person.
// Tries each model in turn; if every model is unavailable, it streams a
// coherent local reply word-by-word so the consultant never goes silent.
async function streamReply(
  spec: SpecContext,
  turns: ChatTurn[],
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
): Promise<string> {
  const errors: string[] = []
  for (const model of MODEL_FALLBACKS) {
    try {
      const deltas = geminiStreamText({
        model,
        system: systemPrompt(spec),
        messages: toModelMessages(turns),
        temperature: 0.7,
        maxOutputTokens: 512,
      })
      let streamed = false
      for await (const delta of deltas) {
        if (delta) {
          streamed = true
          controller.enqueue(encoder.encode(delta))
        }
      }
      if (streamed) return `gemini:${model}`
    } catch (err) {
      const msg = (err as Error)?.message ?? String(err)
      errors.push(`${model}: ${msg}`)
      console.log('[v0] Chat model failed:', model, msg)
    }
  }

  // Every model failed — degrade to a local reply, streamed for a human feel.
  console.error('[superintelligens] All Gemini models failed, using local fallback:', errors.join(' | '))
  const reply = localReply(spec, turns)
  for (const word of reply.split(' ')) {
    controller.enqueue(encoder.encode(word + ' '))
    await new Promise((r) => setTimeout(r, 16))
  }
  return 'local-fallback'
}

// Deterministic, context-aware fallback so the consultant always answers even
// when the Gateway is unavailable. No randomness — same input, same reply.
function localReply(spec: SpecContext, turns: ChatTurn[]): string {
  const last = [...turns].reverse().find((t) => t.role === 'user')?.text?.toLowerCase() ?? ''
  const app = spec.appName && spec.hasContent ? spec.appName : 'your app'

  const isBuild = /\b(add|create|build|make|change|update|remove|delete|buat|bikin|tambah|ubah|ganti|hapus)\b/.test(last)
  if (isBuild) {
    return `Got it — send that as a prompt and I'll compile it straight into ${app}.`
  }
  if (/\?|how|what|why|apa|bagaimana|kenapa|gimana/.test(last)) {
    return spec.hasContent
      ? `Good question. For ${app} (${spec.industry}), I'd focus on the core flow first — tell me which screen you want to refine and I'll suggest specifics.`
      : `Happy to help — describe the product you have in mind (industry, audience, key action) and I'll brand and compile a working preview.`
  }
  if (/\b(hi|hello|hey|halo|hai)\b/.test(last)) {
    return `Hey! I'm your SUPERINTELLIGENS consultant. Describe an app idea and I'll detect the industry, brand it, and build a live preview.`
  }
  return spec.hasContent
    ? `Understood. Tell me what you'd like to adjust on ${app} and I'll take it from there.`
    : `Tell me about the app you want to build and I'll get started.`
}

async function POST(req: Request) {
  let turns: ChatTurn[] = []
  let spec: SpecContext = {}
  try {
    const body = await req.json()
    if (Array.isArray(body?.messages)) turns = body.messages as ChatTurn[]
    if (body?.spec && typeof body.spec === 'object') spec = body.spec as SpecContext
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!turns.some((t) => t?.role === 'user' && t?.text?.trim())) {
    return Response.json({ success: false, error: 'A user message is required' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const source = await streamReply(spec, turns, controller, encoder)
        console.log('[superintelligens] Chat answered by:', source)
      } catch (error) {
        console.log('[v0] Chat stream failed, using local reply:', (error as Error)?.message)
        controller.enqueue(encoder.encode(localReply(spec, turns)))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  })
}

export const Route = createFileRoute('/api/chat')({
  server: { handlers: { POST: ({ request }) => POST(request) } },
})
