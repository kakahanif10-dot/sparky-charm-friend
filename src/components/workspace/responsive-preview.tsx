
import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor,
  Smartphone,
  ImagePlus,
  X,
  Upload,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  RotateCcw,
  ExternalLink,
  Globe,
} from 'lucide-react'
import { PhoneSimulator } from '@/components/workspace/phone-simulator'
import { AppPreview } from '@/components/workspace/app-preview'
import { Button } from '@/components/ui/button'
import { GALLERY_IMAGES } from '@/lib/consultant'
import type { DesignSpec } from '@/lib/design'
import { cn } from '@/lib/utils'

type Device = 'mobile' | 'desktop'
const ZOOM_LEVELS = [50, 67, 75, 90, 100] as const
type Zoom = (typeof ZOOM_LEVELS)[number]

const zoomClass: Record<Zoom, string> = {
  50: 'scale-50',
  67: 'scale-[.67]',
  75: 'scale-75',
  90: 'scale-90',
  100: 'scale-100',
}

/**
 * Dual-mode preview terminal. A stateless responsive switcher flips the
 * generated app between a compact phone frame and an expansive desktop console
 * — both render the exact same client-side <AppPreview/>. A local gallery
 * picker hydrates a chosen asset into whichever viewport is active.
 */
export function ResponsivePreview({
  spec,
  building,
  onEdit,
}: {
  spec: DesignSpec
  building: boolean
  onEdit?: (updater: (s: DesignSpec) => DesignSpec) => void
}) {
  const [device, setDevice] = useState<Device>('mobile')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [attachment, setAttachment] = useState<string | null>(null)
  const [zoom, setZoom] = useState<Zoom>(67)
  const [expanded, setExpanded] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFromDevice = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setAttachment(String(reader.result)) // base64 data URL, memory only
      setGalleryOpen(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn('flex h-full flex-col bg-background', expanded && 'fixed inset-0 z-50')}>
      {/* Toolbar */}
      <div className="flex h-12 shrink-0 items-center justify-between bg-background px-4">
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-0.5">
          <ViewToggle
            active={device === 'mobile'}
            onClick={() => setDevice('mobile')}
            icon={<Smartphone className="h-3.5 w-3.5" />}
            label="Mobile"
          />
          <ViewToggle
            active={device === 'desktop'}
            onClick={() => setDevice('desktop')}
            icon={<Monitor className="h-3.5 w-3.5" />}
            label="Desktop"
          />
        </div>

        <div className="mx-3 hidden min-w-0 max-w-sm flex-1 items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] text-muted-foreground md:flex">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">/{spec.hasContent ? spec.appName.toLowerCase().replace(/\s+/g, '-') : ''}</span>
          <button
            type="button"
            onClick={() => { setDevice('desktop'); setExpanded(true) }}
            className="ml-auto rounded p-0.5 hover:bg-muted hover:text-foreground"
            aria-label="Open web pop-up"
            title="Open web pop-up"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Refresh preview"
            title="Refresh preview"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <div className="flex h-8 items-center rounded-lg bg-secondary">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((value) => ZOOM_LEVELS[Math.max(0, ZOOM_LEVELS.indexOf(value) - 1)])}
              disabled={zoom === ZOOM_LEVELS[0]}
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Zoom out"
              title="Zoom out"
            ><Minus className="h-3.5 w-3.5" /></Button>
            <span className="w-11 text-center text-[11px] tabular-nums text-muted-foreground">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setZoom((value) => ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, ZOOM_LEVELS.indexOf(value) + 1)])}
              disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Zoom in"
              title="Zoom in"
            ><Plus className="h-3.5 w-3.5" /></Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setGalleryOpen(true)}
            disabled={!spec.hasContent}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Add image from gallery"
            title="Add image from gallery"
          >
            <ImagePlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setExpanded((value) => !value)}
            className="text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={expanded ? 'Pop preview in' : 'Pop preview out'}
            title={expanded ? 'Pop preview in' : 'Pop preview out'}
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Viewport */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className={cn('h-full w-full origin-center transition-transform duration-200', zoomClass[zoom])} key={refreshKey}>
          {device === 'mobile' ? (
            <PhoneSimulator
              spec={spec}
              building={building}
              attachment={attachment}
              onClearAttachment={() => setAttachment(null)}
              onEdit={onEdit}
            />
          ) : (
            <DesktopFrame
              spec={spec}
              building={building}
              attachment={attachment}
              onClearAttachment={() => setAttachment(null)}
              onEdit={onEdit}
            />
          )}
        </div>

        {/* Gallery picker modal */}
        <AnimatePresence>
          {galleryOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGalleryOpen(false)}
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-white/10 bg-[oklch(0.16_0_0)] p-5 shadow-2xl"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">Choose from gallery</p>
                    <p className="text-xs text-white/50">
                      Realistic asset dataset — decoded locally, nothing is uploaded.
                    </p>
                  </div>
                  <button
                    onClick={() => setGalleryOpen(false)}
                    aria-label="Close gallery"
                    className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {GALLERY_IMAGES.map((img) => (
                    <button
                      key={img.src}
                      onClick={() => {
                        setAttachment(img.src)
                        setGalleryOpen(false)
                      }}
                      className="group overflow-hidden rounded-xl border border-white/10 text-left transition-transform hover:scale-[1.02]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src || '/placeholder.svg'}
                        alt={img.label}
                        className="h-20 w-full object-cover"
                      />
                      <span className="block truncate px-2 py-1.5 text-[10px] font-medium text-white/70">
                        {img.label}
                      </span>
                    </button>
                  ))}
                </div>

                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10">
                  <Upload className="h-4 w-4" /> Upload from device
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => pickFromDevice(e.target.files)}
                  />
                </label>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Desktop console frame — same AppPreview, expansive browser chrome    */
/* ------------------------------------------------------------------ */

function DesktopFrame({
  spec,
  building,
  attachment,
  onClearAttachment,
  onEdit,
}: {
  spec: DesignSpec
  building: boolean
  attachment?: string | null
  onClearAttachment?: () => void
  onEdit?: (updater: (s: DesignSpec) => DesignSpec) => void
}) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex h-full max-h-[640px] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/12 bg-black shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]"
      >
        {/* Browser chrome */}
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <div className="ml-3 flex-1 truncate rounded-md bg-white/5 px-3 py-1 text-[11px] text-white/40">
            {spec.hasContent ? `${slug(spec.appName)}.superintelligens.build` : 'preview.superintelligens.build'}
          </div>
        </div>

        {/* App canvas */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {attachment && (
            <div className="relative z-[5] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment || '/placeholder.svg'}
                alt="Attached gallery asset"
                className="h-36 w-full object-cover"
              />
              <button
                onClick={onClearAttachment}
                className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur"
              >
                <X className="h-3 w-3" /> Clear Attachment
              </button>
            </div>
          )}
          {building && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm"
            >
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <p className="text-xs text-white/70">Compiling your app…</p>
            </motion.div>
          )}
          <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
            <AppPreview spec={spec} onEdit={onEdit} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'app'
}

function ViewToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
