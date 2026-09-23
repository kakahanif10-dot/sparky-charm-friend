
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  Code2,
  RefreshCw,
  Monitor,
  Smartphone,
  ExternalLink,
  FileCode2,
  Folder,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'preview' | 'code'
type Device = 'desktop' | 'mobile'

const FILE_TREE = [
  { type: 'folder', name: 'app', depth: 0 },
  { type: 'file', name: 'layout.tsx', depth: 1 },
  { type: 'file', name: 'page.tsx', depth: 1, active: true },
  { type: 'folder', name: 'components', depth: 0 },
  { type: 'file', name: 'hero.tsx', depth: 1 },
  { type: 'file', name: 'menu-grid.tsx', depth: 1 },
  { type: 'file', name: 'hours.tsx', depth: 1 },
]

const CODE = `export default function Page() {
  return (
    <main className="min-h-screen bg-stone-50">
      <Hero
        title="Cloudpour Coffee"
        subtitle="Small-batch roasts, poured with care."
      />
      <MenuGrid items={menu} />
      <Hours schedule={weeklyHours} />
    </main>
  )
}`

export function PreviewPanel({
  building,
  built,
}: {
  building: boolean
  built: boolean
}) {
  const [tab, setTab] = useState<Tab>('preview')
  const [device, setDevice] = useState<Device>('desktop')

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/50 p-0.5">
          <TabButton
            active={tab === 'preview'}
            onClick={() => setTab('preview')}
            icon={<Eye className="h-3.5 w-3.5" />}
            label="Preview"
          />
          <TabButton
            active={tab === 'code'}
            onClick={() => setTab('code')}
            icon={<Code2 className="h-3.5 w-3.5" />}
            label="Code"
          />
        </div>

        {tab === 'preview' && (
          <div className="flex items-center gap-1">
            <IconToggle
              active={device === 'desktop'}
              onClick={() => setDevice('desktop')}
              aria={'Desktop view'}
            >
              <Monitor className="h-4 w-4" />
            </IconToggle>
            <IconToggle
              active={device === 'mobile'}
              onClick={() => setDevice('mobile')}
              aria={'Mobile view'}
            >
              <Smartphone className="h-4 w-4" />
            </IconToggle>
            <span className="mx-1 h-4 w-px bg-border" />
            <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative flex-1 overflow-hidden p-4">
        {tab === 'preview' ? (
          <PreviewSurface building={building} built={built} device={device} />
        ) : (
          <CodeSurface />
        )}
      </div>
    </div>
  )
}

function PreviewSurface({
  building,
  built,
  device,
}: {
  building: boolean
  built: boolean
  device: Device
}) {
  return (
    <div className="thin-scroll h-full overflow-auto">
      <div
        className={cn(
          'mx-auto min-h-full overflow-hidden rounded-xl border border-border bg-card/40 transition-all duration-300',
          device === 'mobile' ? 'max-w-sm' : 'max-w-full',
        )}
      >
        <AnimatePresence mode="wait">
          {building ? (
            <motion.div
              key="building"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[420px] flex-col items-center justify-center gap-4 p-10"
            >
              <div className="relative h-12 w-12">
                <span className="absolute inset-0 animate-ping rounded-xl brand-gradient-bg opacity-40" />
                <span className="absolute inset-0 rounded-xl brand-gradient-bg" />
              </div>
              <p className="text-sm text-muted-foreground">
                Rendering live preview…
              </p>
            </motion.div>
          ) : built ? (
            <motion.div
              key="app"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <MockCoffeeApp />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full min-h-[420px] flex-col items-center justify-center gap-2 p-10 text-center"
            >
              <FileCode2 className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Your preview will appear here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function MockCoffeeApp() {
  return (
    <div className="bg-[oklch(0.97_0.01_90)] text-[oklch(0.2_0.02_60)]">
      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold tracking-tight">
          Cloudpour Coffee
        </span>
        <div className="flex gap-4 text-xs text-[oklch(0.45_0.02_60)]">
          <span>Menu</span>
          <span>Hours</span>
          <span>Visit</span>
        </div>
      </div>
      {/* Hero */}
      <div className="px-6 py-10 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Small-batch roasts, poured with care
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[oklch(0.45_0.02_60)]">
          Freshly roasted beans, warm mornings, and a corner seat with your name
          on it.
        </p>
        <button className="mt-5 rounded-full bg-[oklch(0.18_0_0)] px-5 py-2 text-xs font-medium text-white">
          See the menu
        </button>
      </div>
      {/* Menu grid */}
      <div className="grid grid-cols-3 gap-3 px-6 pb-8">
        {['Espresso', 'Pour Over', 'Cold Brew', 'Latte', 'Cortado', 'Mocha'].map(
          (item, i) => (
            <div
              key={item}
              className="rounded-lg border border-[oklch(0.9_0.01_80)] bg-white p-3"
            >
              <div className="h-14 w-full rounded bg-[oklch(0.92_0.02_70)]" />
              <p className="mt-2 text-xs font-medium">{item}</p>
              <p className="text-xs text-[oklch(0.5_0.02_60)]">
                ${(3.5 + i * 0.75).toFixed(2)}
              </p>
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function CodeSurface() {
  return (
    <div className="flex h-full overflow-hidden rounded-xl border border-border bg-[oklch(0.14_0_0)]">
      {/* File tree */}
      <div className="thin-scroll w-52 shrink-0 overflow-y-auto border-r border-border p-2">
        {FILE_TREE.map((node) => (
          <div
            key={node.name + node.depth}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs',
              node.active
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
            style={{ paddingLeft: 8 + node.depth * 14 }}
          >
            {node.type === 'folder' ? (
              <Folder className="h-3.5 w-3.5 text-primary" />
            ) : (
              <FileCode2 className="h-3.5 w-3.5" />
            )}
            {node.name}
          </div>
        ))}
      </div>
      {/* Code */}
      <div className="thin-scroll flex-1 overflow-auto p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <FileCode2 className="h-3.5 w-3.5" />
          app/page.tsx
        </div>
        <pre className="font-mono text-xs leading-relaxed text-foreground/90">
          <code>{CODE}</code>
        </pre>
      </div>
    </div>
  )
}

function TabButton({
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
        active
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function IconToggle({
  active,
  onClick,
  aria,
  children,
}: {
  active: boolean
  onClick: () => void
  aria: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className={cn(
        'rounded-md p-1.5 transition-colors',
        active
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
