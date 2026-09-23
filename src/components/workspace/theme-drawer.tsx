
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PanelRightClose,
  PanelRightOpen,
  Pipette,
  RotateCcw,
  Check,
  SlidersHorizontal,
  Wand2,
  ArrowUp,
} from 'lucide-react'
import { TEMPLATE_LABELS, TEMPLATE_PALETTES, type DesignSpec } from '@/lib/design'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Color math — HSV <-> RGB <-> hex. Pure, deterministic, SSR-safe.    */
/* ------------------------------------------------------------------ */

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function toHex(n: number) {
  return n.toString(16).padStart(2, '0').toUpperCase()
}

function hsvToHex(h: number, s: number, v: number) {
  const { r, g, b } = hsvToRgb(h, s, v)
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function hexToHsv(hex: string): { h: number; s: number; v: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const int = parseInt(m[1], 16)
  const r = ((int >> 16) & 255) / 255
  const g = ((int >> 8) & 255) / 255
  const b = (int & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

// Readable text color for a given accent swatch (relative luminance).
function readableText(hex: string) {
  const parsed = hexToHsv(hex)
  if (!parsed) return '#ffffff'
  const { r, g, b } = hsvToRgb(parsed.h, parsed.s, parsed.v)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#0a0a0a' : '#ffffff'
}

/* ------------------------------------------------------------------ */
/* Preset palette matrix — high-density brand swatch grid.             */
/* ------------------------------------------------------------------ */

const PRESET_SWATCHES: { hex: string; name: string }[] = [
  { hex: '#EE4D2D', name: 'Commerce Orange' },
  { hex: '#FF6B00', name: 'Transaction Amber' },
  { hex: '#10B981', name: 'Money Emerald' },
  { hex: '#3B82F6', name: 'Academic Blue' },
  { hex: '#8B5CF6', name: 'Product Violet' },
  { hex: '#14B8A6', name: 'Clinical Teal' },
  { hex: '#F43F5E', name: 'Signal Rose' },
  { hex: '#0A192F', name: 'Civic Navy' },
  { hex: '#EAB308', name: 'Premium Gold' },
  { hex: '#6366F1', name: 'Indigo Core' },
  { hex: '#22C55E', name: 'Fresh Green' },
  { hex: '#0EA5E9', name: 'Sky Cyan' },
]

// A large, deterministic spectrum used by the scrollable matrix grid.
// 24 hue rows × 8 tint/shade columns + a grayscale row = 200 tokens.
const MATRIX_ROWS: string[][] = (() => {
  const hues = Array.from({ length: 24 }, (_, i) => i * 15)
  const rows = hues.map((h) =>
    Array.from({ length: 8 }, (_, i) => {
      const t = i / 7
      const s = clamp01(0.25 + t * 0.72)
      const v = clamp01(0.99 - t * 0.66)
      return hsvToHex(h, s, v)
    }),
  )
  const grays = Array.from({ length: 8 }, (_, i) => hsvToHex(0, 0, 1 - i / 7))
  return [...rows, grays]
})()

/* ------------------------------------------------------------------ */
/* Universal App Input — industry quick-action seeds.                  */
/* ------------------------------------------------------------------ */

const INDUSTRY_SEEDS: { label: string; seed: string }[] = [
  { label: 'Government', seed: 'A government public service portal for citizens to pay bills' },
  { label: 'Fintech', seed: 'A digital wallet and peer-to-peer money transfer app' },
  { label: 'Food', seed: 'A food delivery app with a menu, cart and checkout' },
  { label: 'E-commerce', seed: 'A fashion e-commerce store with cart and checkout' },
  { label: 'Health', seed: 'A telemedicine clinic with appointment booking' },
  { label: 'Education', seed: 'An online learning app with courses and quizzes' },
]

/* ------------------------------------------------------------------ */
/* Pane 3 — Unified Configuration Matrix                               */
/* Universal App Input fields + 2D Color Area Canvas + scroll matrix.  */
/* ------------------------------------------------------------------ */

export function ThemeDrawer({
  spec,
  width = 360,
  open,
  onToggle,
  onApplyAccent,
  disabled,
  prompt,
  onPromptChange,
  onGenerate,
  onIndustry,
  onAppNameChange,
  generating,
}: {
  width?: number
  spec: DesignSpec
  open: boolean
  onToggle: () => void
  onApplyAccent: (hex: string) => void
  disabled: boolean
  prompt: string
  onPromptChange: (v: string) => void
  onGenerate: () => void
  onIndustry: (seed: string) => void
  onAppNameChange: (v: string) => void
  generating: boolean
}) {
  const initial = hexToHsv(spec.palette.accent) ?? { h: 20, s: 0.85, v: 0.93 }
  const [hue, setHue] = useState(initial.h)
  const [sat, setSat] = useState(initial.s)
  const [val, setVal] = useState(initial.v)
  const [dragging, setDragging] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)

  // Scrollable matrix drag-capture state.
  const [matrixDrag, setMatrixDrag] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)

  // Sync the cursor to the live accent whenever a new spec/theme lands
  // (generation, session switch) — but never mid-drag.
  useEffect(() => {
    if (dragging) return
    const parsed = hexToHsv(spec.palette.accent)
    if (parsed) {
      setHue(parsed.h)
      setSat(parsed.s)
      setVal(parsed.v)
    }
  }, [spec.palette.accent, dragging])

  const hex = hsvToHex(hue, sat, val)

  const setFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = areaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSat(clamp01((clientX - rect.left) / rect.width))
    setVal(1 - clamp01((clientY - rect.top) / rect.height))
  }, [])

  const commit = useCallback(
    (nextHex: string) => {
      if (disabled) return
      onApplyAccent(nextHex)
    },
    [disabled, onApplyAccent],
  )

  const captureHex = useCallback(
    (nextHex: string) => {
      const parsed = hexToHsv(nextHex)
      if (parsed) {
        setHue(parsed.h)
        setSat(parsed.s)
        setVal(parsed.v)
      }
      commit(nextHex.toUpperCase())
    },
    [commit],
  )

  // Commit the last hovered swatch when the matrix drag / tap ends anywhere.
  useEffect(() => {
    if (!matrixDrag) return
    const end = () => {
      setMatrixDrag(false)
      if (previewRef.current) captureHex(previewRef.current)
      setPreview(null)
      previewRef.current = null
    }
    window.addEventListener('pointerup', end)
    return () => window.removeEventListener('pointerup', end)
  }, [matrixDrag, captureHex])

  const beginMatrix = (swatch: string) => {
    if (disabled) return
    setMatrixDrag(true)
    setPreview(swatch)
    previewRef.current = swatch
  }

  const hoverMatrix = (swatch: string) => {
    if (!matrixDrag) return
    setPreview(swatch)
    previewRef.current = swatch
  }

  const resetToTemplate = () => captureHex(TEMPLATE_PALETTES[spec.template].accent)

  const detected = useMemo(
    () => ({
      industry: spec.industry || 'Awaiting prompt…',
      template: TEMPLATE_LABELS[spec.template],
    }),
    [spec.industry, spec.template],
  )

  return (
    <motion.aside
      animate={{ width: open ? width : 52 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative z-10 hidden max-h-screen shrink-0 flex-col overflow-hidden bg-muted/40 lg:flex"
    >
      {/* Header / collapse */}
      <div className="flex h-12 shrink-0 items-center gap-2 px-3">
        <button
          onClick={onToggle}
          aria-label={open ? 'Collapse configuration matrix' : 'Expand configuration matrix'}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {open ? (
            <PanelRightClose className="h-4 w-4" />
          ) : (
            <PanelRightOpen className="h-4 w-4" />
          )}
        </button>
        {open && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Configuration Matrix
          </span>
        )}
      </div>

      {/* Collapsed rail */}
      {!open && (
        <div className="flex flex-1 flex-col items-center gap-3 pt-4">
          <button
            onClick={onToggle}
            aria-label="Open configuration matrix"
            className="h-7 w-7 rounded-full ring-2 ring-border"
            style={{ backgroundColor: spec.palette.accent }}
          />
          <Pipette className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="thin-scroll min-h-0 w-full flex-1 space-y-5 overflow-y-auto overflow-x-hidden p-4"
          >
            {/* ---------------------------------------------------------- */}
            {/* Universal App Input (legacy spec) — 100% white-label.       */}
            {/* ---------------------------------------------------------- */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Describe Any App
              </p>
              <div className="rounded-lg bg-muted p-2">
                <textarea
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing &&
                      e.keyCode !== 229
                    ) {
                      e.preventDefault()
                      onGenerate()
                    }
                  }}
                  rows={2}
                  placeholder="Describe any app in any language — the engine detects the industry and brands it for you."
                  className="w-full resize-none bg-transparent px-1 py-0.5 text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-[9px] text-muted-foreground">Enter to generate</span>
                  <button
                    onClick={onGenerate}
                    disabled={!prompt.trim() || generating}
                    aria-label="Generate app"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {generating ? (
                      <Wand2 className="h-3.5 w-3.5 animate-pulse" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Try An Industry
              </p>
              <div className="flex flex-wrap gap-1.5">
                {INDUSTRY_SEEDS.map((it) => (
                  <button
                    key={it.label}
                    onClick={() => onIndustry(it.seed)}
                    disabled={generating}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                App Name / Brand
              </p>
              <input
                value={spec.appName}
                onChange={(e) => onAppNameChange(e.target.value)}
                placeholder="Auto-branded from your prompt"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Detected Context
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <div className="flex items-center gap-1">
                  {(['bg', 'surface', 'accent', 'text'] as const).map((k) => (
                    <span
                      key={k}
                      className="h-4 w-4 rounded-full ring-1 ring-border"
                      style={{ backgroundColor: spec.palette[k] }}
                    />
                  ))}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold leading-tight text-foreground">
                    {detected.industry}
                  </p>
                  <p className="truncate text-[9px] leading-tight text-muted-foreground">
                    {detected.template}
                  </p>
                </div>
              </div>
            </section>

            <div className="h-px bg-border" />

            {/* ---------------------------------------------------------- */}
            {/* 2D color area canvas — saturation (X) × value (Y)          */}
            {/* ---------------------------------------------------------- */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                2D Color Area Canvas
              </p>
              <div
                ref={areaRef}
                role="slider"
                aria-label="Saturation and brightness"
                aria-valuetext={hex}
                tabIndex={0}
                onPointerDown={(e) => {
                  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
                  setDragging(true)
                  setFromPointer(e.clientX, e.clientY)
                }}
                onPointerMove={(e) => {
                  if (dragging) setFromPointer(e.clientX, e.clientY)
                }}
                onPointerUp={() => {
                  setDragging(false)
                  commit(hsvToHex(hue, sat, val))
                }}
                className="relative h-40 w-full cursor-crosshair rounded-lg"
                style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
              >
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-[linear-gradient(to_right,#fff,transparent)]" />
                <div className="pointer-events-none absolute inset-0 rounded-lg bg-[linear-gradient(to_top,#000,transparent)]" />
                <span
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                  style={{
                    left: `${sat * 100}%`,
                    top: `${(1 - val) * 100}%`,
                    backgroundColor: hex,
                  }}
                />
              </div>

              {/* Hue rail */}
              <input
                type="range"
                min={0}
                max={359}
                value={Math.round(hue)}
                onChange={(e) => setHue(Number(e.target.value))}
                onPointerUp={() => commit(hsvToHex(hue, sat, val))}
                aria-label="Hue"
                className="hue-rail h-3 w-full cursor-pointer appearance-none rounded-full"
              />

              {/* Live hex readout + apply */}
              <div className="flex items-center gap-2">
                <span
                  className="h-8 w-8 shrink-0 rounded-md ring-1 ring-border"
                  style={{ backgroundColor: preview ?? hex }}
                />
                <code className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground">
                  {preview ?? hex}
                </code>
                <button
                  onClick={() => commit(hex)}
                  disabled={disabled}
                  className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: hex, color: readableText(hex) }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Apply
                </button>
              </div>
            </section>

            {/* Quick brand swatches */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Brand Swatches
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_SWATCHES.map((sw) => {
                  const active =
                    sw.hex.toUpperCase() === spec.palette.accent.toUpperCase()
                  return (
                    <button
                      key={sw.hex}
                      onClick={() => captureHex(sw.hex)}
                      disabled={disabled}
                      title={`${sw.name} · ${sw.hex}`}
                      aria-label={`${sw.name} ${sw.hex}`}
                      className={cn(
                         'aspect-square rounded-md ring-1 ring-border transition-transform hover:scale-110 disabled:opacity-40',
                         active && 'ring-2 ring-foreground',
                      )}
                      style={{ backgroundColor: sw.hex }}
                    />
                  )
                })}
              </div>
            </section>

            {/* ---------------------------------------------------------- */}
            {/* Scrollable Color Palette Matrix Grid — drag to capture.     */}
            {/* ---------------------------------------------------------- */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Palette Matrix Grid
                </p>
                <span className="text-[9px] text-muted-foreground">drag to capture</span>
              </div>
              <div
                className="thin-scroll max-h-48 touch-none overflow-y-scroll rounded-lg border border-border bg-background p-1.5"
                style={{ overflowY: 'scroll' }}
              >
                <div className="grid grid-cols-8 gap-1">
                  {MATRIX_ROWS.flat().map((swatch, i) => {
                    const active =
                      swatch.toUpperCase() === spec.palette.accent.toUpperCase()
                    return (
                      <button
                        key={`${swatch}-${i}`}
                        onPointerDown={(e) => {
                          e.preventDefault()
                          beginMatrix(swatch)
                        }}
                        onPointerEnter={() => hoverMatrix(swatch)}
                        disabled={disabled}
                        title={swatch}
                        aria-label={`Palette token ${swatch}`}
                        className={cn(
                           'aspect-square rounded-sm ring-1 ring-border transition-transform hover:z-10 hover:scale-125 disabled:opacity-40',
                           active && 'ring-2 ring-foreground',
                        )}
                        style={{ backgroundColor: swatch }}
                      />
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Active token map */}
            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Active Theme Tokens
              </p>
              <div className="space-y-1">
                {(['bg', 'surface', 'accent', 'text'] as const).map((token) => (
                  <div
                    key={token}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded ring-1 ring-border"
                      style={{ backgroundColor: spec.palette[token] }}
                    />
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {token}
                    </span>
                    <code className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {spec.palette[token]}
                    </code>
                  </div>
                ))}
              </div>
            </section>

            <button
              onClick={resetToTemplate}
              disabled={disabled}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to template palette
            </button>

            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Drag across the matrix to intercept a live hex token, then release
              to run a 3.6s theme-hydration loop across the active simulator
              frame.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
