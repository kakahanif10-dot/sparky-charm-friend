// Lovable AI Gateway client (kept the historical file/exports so existing call
// sites keep working). The API key is server-only.

const GATEWAY = 'https://ai.gateway.lovable.dev/v1'
const TEXT_MODEL = 'openai/gpt-6-astra'
const IMAGE_MODEL = 'openai/gpt-image-2.5-sunburst'

export type GeminiTurn = { role: 'user' | 'assistant'; content: string }

export function geminiApiKey(): string {
  return process.env['LOVABLE_API_KEY'] || ''
}

type GeminiOptions = {
  model: string
  system?: string
  messages: GeminiTurn[]
  temperature?: number
  topP?: number
  maxOutputTokens?: number
}

const LANGUAGE_RULE =
  'Always reply in the same language the user writes in — any language in the world (e.g. English, Indonesian, Thai, Arabic, Chinese, Spanish, Japanese, Hindi...). If the user switches language, switch with them.'

function buildBody(opts: GeminiOptions, stream: boolean) {
  const system = [opts.system, LANGUAGE_RULE].filter(Boolean).join('\n\n')
  return {
    model: TEXT_MODEL,
    reasoning_effort: 'low',
    stream,
    messages: [
      { role: 'system', content: system },
      ...opts.messages
        .filter((m) => typeof m.content === 'string' && m.content.trim())
        .map((m) => ({ role: m.role, content: m.content })),
    ],
  }
}

async function callGateway(opts: GeminiOptions, stream: boolean) {
  const key = geminiApiKey()
  if (!key) throw new Error('Missing LOVABLE_API_KEY')
  const res = await fetch(`${GATEWAY}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
    body: JSON.stringify(buildBody(opts, stream)),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error(`[superintelligens] AI ${res.status}: ${detail.slice(0, 300)}`)
    if (res.status === 402) throw new Error('AI credits are used up. Add credits to keep chatting.')
    if (res.status === 429) throw new Error('Too many requests — wait a moment and try again.')
    throw new Error(`AI ${res.status}: ${detail.slice(0, 200)}`)
  }
  return res
}

export async function geminiGenerateText(opts: GeminiOptions): Promise<string> {
  const res = await callGateway(opts, false)
  const json: any = await res.json()
  return json?.choices?.[0]?.message?.content ?? ''
}

export async function* geminiStreamText(opts: GeminiOptions): AsyncGenerator<string> {
  const res = await callGateway(opts, true)
  if (!res.body) return
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let index: number
    while ((index = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, index).trim()
      buffer = buffer.slice(index + 1)
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (!data || data === '[DONE]') continue
      try {
        const text = JSON.parse(data)?.choices?.[0]?.delta?.content
        if (typeof text === 'string' && text) yield text
      } catch {
        // ignore partial frames
      }
    }
  }
}

// Text-to-image. Returns a data URL.
export async function generateImage(prompt: string): Promise<string> {
  const key = geminiApiKey()
  if (!key) throw new Error('Missing LOVABLE_API_KEY')
  const res = await fetch(`${GATEWAY}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (res.status === 402) throw new Error('AI credits are used up. Add credits to make images.')
    if (res.status === 429) throw new Error('Too many requests — wait a moment and try again.')
    throw new Error(`Image ${res.status}: ${detail.slice(0, 200)}`)
  }
  const json: any = await res.json()
  const b64 = json?.data?.[0]?.b64_json
  if (!b64) throw new Error('No image returned')
  return `data:image/png;base64,${b64}`
}
