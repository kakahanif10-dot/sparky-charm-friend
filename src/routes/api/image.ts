import { createFileRoute } from '@tanstack/react-router'
import { generateImage } from '@/lib/gemini.server'

export const Route = createFileRoute('/api/image')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { prompt?: unknown }
          const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 2000) : ''
          if (!prompt) return Response.json({ error: 'Missing prompt' }, { status: 400 })
          const image = await generateImage(prompt)
          return Response.json({ image })
        } catch (err) {
          return Response.json({ error: (err as Error).message }, { status: 500 })
        }
      },
    },
  },
})
