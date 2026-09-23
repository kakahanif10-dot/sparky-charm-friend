// Serves a published generated app as a real, standalone web page.
// Anyone with the link can open it — no sign-in, no editor.

import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'
import { bundleToHtml } from '@/lib/app-bundle'

function notFoundPage() {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8" /><title>App not found</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:15px/1.6 system-ui,sans-serif;background:#0b0b0f;color:#e4e4e7}</style>
</head><body><div style="text-align:center"><h1 style="font-size:20px;margin:0 0 8px">This app isn't available</h1>
<p style="margin:0;color:#a1a1aa">The link may be wrong, or the owner took it offline.</p></div></body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export const Route = createFileRoute('/api/public/app/$slug')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug
        if (!slug || !/^[a-z0-9-]{1,80}$/.test(slug)) return notFoundPage()

        const url = process.env['SUPABASE_URL']
        const key = process.env['SUPABASE_PUBLISHABLE_KEY']
        if (!url || !key) return new Response('Not configured', { status: 500 })

        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers)
              if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) {
                headers.delete('Authorization')
              }
              headers.set('apikey', key)
              return fetch(input, { ...init, headers })
            },
          },
        })

        const { data: app } = await supabase
          .from('generated_apps')
          .select('id, name, description')
          .eq('slug', slug)
          .eq('published', true)
          .maybeSingle()
        if (!app) return notFoundPage()

        const { data: files } = await supabase
          .from('generated_app_files')
          .select('path, content')
          .eq('app_id', app.id)
          .order('path')
        if (!files || files.length === 0) return notFoundPage()

        const html = bundleToHtml(files, {
          title: app.name,
          description: app.description ?? '',
        })

        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60',
          },
        })
      },
    },
  },
})
