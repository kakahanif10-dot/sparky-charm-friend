
import { useState } from 'react'
import {
  Sparkles,
  Wand2,
  Download,
  Check,
  Building2,
  AlertCircle,
  Compass,
  Palette as PaletteIcon,
} from 'lucide-react'
import { usePwaInstall } from '@/lib/use-pwa-install'
import { TEMPLATE_LABELS, type DesignSpec } from '@/lib/design'
import { cn } from '@/lib/utils'

const EXAMPLES = [
  'Aplikasi SAMSAT online untuk cek dan bayar pajak kendaraan',
  'A cozy neighborhood coffee shop with menu and delivery',
  'A fashion e-commerce store with cart and checkout',
]

export function PromptMenu({
  prompt,
  onPromptChange,
  spec,
  onPatch,
  onGenerate,
  generating,
  error,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  spec: DesignSpec
  onPatch: (patch: Partial<DesignSpec>) => void
  onGenerate: () => void
  generating: boolean
  error: string | null
}) {
  const { status, install } = usePwaInstall()
  const [installNote, setInstallNote] = useState<string | null>(null)

  const handleInstall = async () => {
    if (status === 'installed') {
      setInstallNote('Already installed on this device.')
      return
    }
    const outcome = await install()
    if (outcome === 'unavailable') {
      setInstallNote(
        'Open on Android Chrome (or use the browser menu → “Add to Home screen”) to install.',
      )
    } else if (outcome === 'dismissed') {
      setInstallNote('Install dismissed — you can try again anytime.')
    } else {
      setInstallNote(null)
    }
  }

  const swatches: { key: keyof DesignSpec['palette']; label: string }[] = [
    { key: 'bg', label: 'Background' },
    { key: 'surface', label: 'Surface' },
    { key: 'accent', label: 'Accent' },
    { key: 'text', label: 'Text' },
  ]

  return (
    <div className="thin-scroll flex h-full flex-col overflow-y-auto">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-medium">
        <Sparkles className="h-4 w-4" />
        Context-Aware Engine
      </div>

      <div className="flex-1 space-y-6 px-4 py-5">
        {/* Prompt */}
        <section className="space-y-2">
          <label
            htmlFor="l3-prompt"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Describe any app
          </label>
          <div className="glow-border rounded-xl border border-border bg-card/70">
            <textarea
              id="l3-prompt"
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' &&
                  (e.metaKey || e.ctrlKey) &&
                  !e.nativeEvent.isComposing &&
                  e.keyCode !== 229
                ) {
                  e.preventDefault()
                  onGenerate()
                }
              }}
              rows={4}
              placeholder="e.g. Aplikasi SAMSAT online untuk cek status pajak, unggah STNK/KTP, dan bayar pajak kendaraan."
              className="w-full resize-none bg-transparent p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Press{' '}
            <kbd className="rounded border border-border bg-secondary px-1">⌘/Ctrl</kbd>{' '}
            + <kbd className="rounded border border-border bg-secondary px-1">Enter</kbd> to
            generate.
          </p>
        </section>

        {/* Quick examples */}
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Try an industry
          </p>
          <div className="flex flex-col gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => onPromptChange(ex)}
                className="rounded-lg border border-border bg-card/50 px-3 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        </section>

        {/* Detected context (auto — read only) */}
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Compass className="h-3.5 w-3.5" /> Detected context
          </p>
          <div className="grid grid-cols-2 gap-2">
            <InfoTile label="Industry" value={spec.hasContent ? spec.industry : '—'} />
            <InfoTile
              label="Template"
              value={spec.hasContent ? TEMPLATE_LABELS[spec.template] : '—'}
            />
          </div>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            The engine analyzes your prompt and auto-selects branding, layout, and a
            functional multi-page flow for the matched industry.
          </p>
        </section>

        {/* Palette preview (auto) */}
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <PaletteIcon className="h-3.5 w-3.5" /> Generated palette
          </p>
          <div className="grid grid-cols-4 gap-2">
            {swatches.map((s) => (
              <div key={s.key} className="space-y-1">
                <span
                  className="block h-8 w-full rounded-lg ring-1 ring-white/10"
                  style={{ backgroundColor: spec.palette[s.key] }}
                />
                <span className="block truncate text-[9px] text-muted-foreground">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* App name / brand */}
        <section className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" /> App name / brand
          </p>
          <input
            value={spec.hasContent ? spec.appName : ''}
            maxLength={22}
            onChange={(e) => onPatch({ appName: e.target.value, hasContent: true })}
            className="w-full rounded-lg border border-border bg-card/70 px-3 py-2 text-sm focus:border-foreground/40 focus:outline-none"
            placeholder="Auto-generated after you generate"
          />
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-card/70 p-3 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 space-y-2 border-t border-border bg-background/90 p-3 backdrop-blur">
        <button
          onClick={onGenerate}
          disabled={!prompt.trim() || generating}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold tracking-wide text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Wand2 className="h-4 w-4" />
          {generating ? 'GENERATING…' : 'GENERATE WITH AI'}
        </button>

        <button
          onClick={handleInstall}
          className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/60 bg-white px-4 py-2.5 text-sm font-semibold tracking-wide text-black shadow-[0_0_18px_-2px_rgba(255,255,255,0.7)] transition-all hover:shadow-[0_0_30px_0px_rgba(255,255,255,0.95)]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-pulse rounded-xl bg-white/30"
          />
          {status === 'installed' ? (
            <>
              <Check className="h-4 w-4" /> INSTALLED AS APP
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> INSTALL AS APP (PWA)
            </>
          )}
        </button>
        {installNote && (
          <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
            {installNote}
          </p>
        )}
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate text-[12px] font-semibold">{value}</p>
    </div>
  )
}
