// Client-callable builder RPC: generates a real app from a prompt, stores it on
// the signed-in user's account, and reads back their saved apps.

import { createServerFn } from '@tanstack/react-start'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { z } from 'zod'

export type AppFile = { path: string; content: string }
export type SavedApp = {
  id: string
  name: string
  description: string
  prompt: string
  updatedAt: string
  files: AppFile[]
}

const BuildInput = z.object({
  prompt: z.string().min(2).max(4000),
  appId: z.string().uuid().nullable(),
})

export const buildApp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => BuildInput.parse(input))
  .handler(async ({ data, context }): Promise<SavedApp> => {
    const { supabase, userId } = context
    const { buildAppFiles } = await import('@/lib/app-builder.server')

    let previous: AppFile[] | undefined
    if (data.appId) {
      const { data: rows } = await supabase
        .from('generated_app_files')
        .select('path, content')
        .eq('app_id', data.appId)
      previous = rows ?? undefined
    }

    const built = await buildAppFiles(data.prompt, previous)

    let appId = data.appId
    if (appId) {
      const { error } = await supabase
        .from('generated_apps')
        .update({
          name: built.name,
          description: built.description,
          prompt: data.prompt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appId)
      if (error) throw new Error(error.message)
      const { error: delError } = await supabase
        .from('generated_app_files')
        .delete()
        .eq('app_id', appId)
      if (delError) throw new Error(delError.message)
    } else {
      const { data: row, error } = await supabase
        .from('generated_apps')
        .insert({
          user_id: userId,
          name: built.name,
          description: built.description,
          prompt: data.prompt,
        })
        .select('id')
        .single()
      if (error || !row) throw new Error(error?.message ?? 'Could not save the app.')
      appId = row.id
    }

    const { error: filesError } = await supabase.from('generated_app_files').insert(
      built.files.map((f) => ({ app_id: appId as string, path: f.path, content: f.content })),
    )
    if (filesError) throw new Error(filesError.message)

    return {
      id: appId as string,
      name: built.name,
      description: built.description,
      prompt: data.prompt,
      updatedAt: new Date().toISOString(),
      files: built.files,
    }
  })

export const listApps = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from('generated_apps')
      .select('id, name, description, prompt, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    return (data ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description ?? '',
      prompt: a.prompt,
      updatedAt: a.updated_at,
    }))
  })

export const getApp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ appId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }): Promise<SavedApp> => {
    const { data: app, error } = await context.supabase
      .from('generated_apps')
      .select('id, name, description, prompt, updated_at')
      .eq('id', data.appId)
      .single()
    if (error || !app) throw new Error(error?.message ?? 'App not found.')
    const { data: files, error: filesError } = await context.supabase
      .from('generated_app_files')
      .select('path, content')
      .eq('app_id', data.appId)
      .order('path')
    if (filesError) throw new Error(filesError.message)
    return {
      id: app.id,
      name: app.name,
      description: app.description ?? '',
      prompt: app.prompt,
      updatedAt: app.updated_at,
      files: files ?? [],
    }
  })

export const deleteApp = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ appId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from('generated_apps')
      .delete()
      .eq('id', data.appId)
    if (error) throw new Error(error.message)
    return { ok: true }
  })
