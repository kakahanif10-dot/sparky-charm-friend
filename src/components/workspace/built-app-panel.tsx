// Live preview + real source code for the app the builder just generated.

import { useEffect, useMemo, useState } from 'react'
import {
  Code2,
  Download,
  Eye,
  FileCode2,
  Monitor,
  RefreshCw,
  Smartphone,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { bundleToHtml, downloadAppZip } from '@/lib/app-bundle'
import type { SavedApp } from '@/lib/builder.functions'

type Tab = 'preview' | 'code'
type Device = 'desktop' | 'mobile'

export function BuiltAppPanel({
  app,
  building,
}: {
  app: SavedApp | null
  building: boolean
}) {
  const [tab, setTab] = useState<Tab>('preview')
  const [device, setDevice] = useState<Device>('desktop')
  const [nonce, setNonce] = useState(0)
  const [activePath, setActivePath] = useState<string | null>(null)

  const files = app?.files ?? []

  useEffect(() => {
    setActivePath(
      files.find((f) => f.path === 'src/App.jsx')?.path ?? files[0]?.path ?? null,
    )
  }, [app?.id, files.length])

  const html = useMemo(() => (files.length ? bundleToHtml(files) : ''), [files, nonce])
  const activeFile = files.find((f) => f.path === activePath) ?? null

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/50 p-0.5">
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')} icon={<Eye className="h-3.5 w-3.5" />}>
            Preview
          </TabButton>
          <TabButton active={tab === 'code'} onClick={() => setTab('code')} icon={<Code2 className="h-3.5 w-3.5" />}>
            Code{files.length ? ` (${files.length})` : ''}
          </TabButton>
        </div>

        <div className="flex items-center gap-1">
          {tab === 'preview' && (
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card/50 p-0.5">
              <IconButton active={device === 'desktop'} onClick={() => setDevice('desktop')} label="Desktop">
                <Monitor className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton active={device === 'mobile'} onClick={() => setDevice('mobile')} label="Mobile">
                <Smartphone className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          )}
          <IconButton onClick={() => setNonce((n) => n + 1)} label="Reload preview">
            <RefreshCw className="h-3.5 w-3.5" />
          </IconButton>
          <button
            type="button"
            disabled={!files.length}
            onClick={() => app && void downloadAppZip(app.name, app.files)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            Source
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {building && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Writing the code for your app…</p>
          </div>
        )}

        {!files.length && !building && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
            <FileCode2 className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No app yet</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Describe the app you want in the chat and it will be built here with real,
              editable code.
            </p>
          </div>
        )}

        {files.length > 0 && tab === 'preview' && (
          <div className="flex h-full items-start justify-center overflow-auto bg-muted/30 p-4">
            <div
              className={cn(
                'overflow-hidden rounded-xl border border-border bg-white shadow-xl transition-all',
                device === 'mobile' ? 'h-[720px] w-[390px]' : 'h-full w-full',
              )}
            >
              <iframe
                key={`${app?.id}-${nonce}`}
                title="App preview"
                srcDoc={html}
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        )}

        {files.length > 0 && tab === 'code' && (
          <div className="flex h-full min-h-0">
            <div className="w-56 shrink-0 overflow-auto border-r border-border bg-card/30 py-2">
              {files.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setActivePath(f.path)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition',
                    f.path === activePath
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{f.path}</span>
                </button>
              ))}
            </div>
            <pre className="min-w-0 flex-1 overflow-auto bg-card/10 p-4 text-[11.5px] leading-relaxed text-foreground/90">
              <code>{activeFile?.content ?? ''}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition',
        active ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function IconButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'rounded-md p-1.5 transition',
        active ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
