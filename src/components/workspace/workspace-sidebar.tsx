
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  MessageSquare,
  Trash2,
  Settings,
  LifeBuoy,
  Folder,
  FolderOpen,
  FileCode2,
  FileType2,
  ChevronRight,
  ChevronDown,
  Plug,
  LayoutGrid,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DesignSpec, Template } from '@/lib/design'
import { SuperintelligensMark } from '@/components/superintelligens-logo'
import { Button } from '@/components/ui/button'

export type Session = {
  id: string
  name: string
  updated: string
}

export type SidebarTab = 'chats' | 'files'

/* ------------------------------------------------------------------ */
/* Code-tree: the compiled output of the active generation, mapped to  */
/* a file structure. No hardcoded personas — everything is derived     */
/* from the detected industry template so the tree reflects real code. */
/* ------------------------------------------------------------------ */

type TreeNode = { name: string; kind: 'folder' | 'tsx' | 'css'; children?: TreeNode[] }

// Industry template → the screen modules the engine compiles for it.
const SCREEN_MODULES: Record<Template, string[]> = {
  government: ['login-screen.tsx', 'tax-dashboard.tsx', 'document-upload.tsx', 'account.tsx'],
  fintech: ['wallet-overview.tsx', 'transactions.tsx', 'transfer-sheet.tsx', 'account.tsx'],
  edutech: ['course-catalog.tsx', 'lesson-player.tsx', 'progress.tsx', 'profile.tsx'],
  food: ['menu-grid.tsx', 'cart-drawer.tsx', 'order-tracking.tsx', 'profile.tsx'],
  ecommerce: ['storefront.tsx', 'search.tsx', 'cart-drawer.tsx', 'profile.tsx'],
  health: ['services.tsx', 'find-provider.tsx', 'booking.tsx', 'profile.tsx'],
  saas: ['plans.tsx', 'modules.tsx', 'usage.tsx', 'account.tsx'],
  game: ['game-canvas.tsx', 'hud.tsx', 'scores.tsx', 'profile.tsx'],
  generic: ['home.tsx', 'explore.tsx', 'profile.tsx'],
}

function buildProjectTree(spec: DesignSpec): TreeNode[] {
  const screens = SCREEN_MODULES[spec.template] ?? SCREEN_MODULES.generic
  return [
    {
      name: 'app',
      kind: 'folder',
      children: [
        { name: 'layout.tsx', kind: 'tsx' },
        { name: 'page.tsx', kind: 'tsx' },
        { name: 'globals.css', kind: 'css' },
      ],
    },
    {
      name: 'components',
      kind: 'folder',
      children: [
        { name: 'app-shell.tsx', kind: 'tsx' },
        { name: 'bottom-nav.tsx', kind: 'tsx' },
        ...screens.map((name) => ({ name, kind: 'tsx' as const })),
      ],
    },
    {
      name: 'lib',
      kind: 'folder',
      children: [
        { name: 'design-tokens.ts', kind: 'tsx' },
        { name: 'catalog.ts', kind: 'tsx' },
      ],
    },
  ]
}

export function WorkspaceSidebar({
  collapsed,
  onToggle,
  tab,
  onTabChange,
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
  spec,
  width,
}: {
  collapsed: boolean
  onToggle: () => void
  tab: SidebarTab
  onTabChange: (t: SidebarTab) => void
  sessions: Session[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  spec: DesignSpec
  width?: number
}) {
  const [query, setQuery] = useState('')
  const filtered = sessions.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : (width ?? 264) }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative z-20 flex shrink-0 flex-col bg-sidebar"
    >
      {/* Brand + collapse */}
      <div className="flex h-14 items-center justify-between px-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <SuperintelligensMark className="h-7 w-7 shrink-0" />
          {!collapsed && (
            <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
              SUPERINTELLIGENS
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Primary navigation */}
      <div className="space-y-1 px-3">
        <Button
          variant="ghost"
          onClick={onNew}
          className={cn(
            'h-9 w-full justify-start gap-2 text-muted-foreground',
            collapsed ? 'justify-center px-0' : 'px-3',
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && 'New'}
        </Button>
        {[{ icon: Search, label: 'Search' }, { icon: Plug, label: 'Connectors' }, { icon: MessageSquare, label: 'Chats' }, { icon: LayoutGrid, label: 'Projects' }].map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            className={cn('h-9 w-full justify-start gap-2 text-muted-foreground', collapsed && 'justify-center px-0')}
            onClick={item.label === 'Search' || item.label === 'Chats' ? () => onTabChange('chats') : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && item.label}
          </Button>
        ))}
      </div>

      {!collapsed && (
        <>
          {/* Tabs */}
          <div className="mt-3 px-3">
            <div className="flex gap-1 rounded-lg border border-sidebar-border bg-background/40 p-0.5">
              {(['chats', 'files'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => onTabChange(t)}
                  className={cn(
                    'flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors',
                    tab === t
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {tab === 'chats' && (
            <div className="px-3 pt-3">
              <label className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-background/40 px-2.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chats"
                  className="h-9 w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                />
              </label>
            </div>
          )}
        </>
      )}

      {/* Body */}
      <div className="thin-scroll mt-4 flex-1 overflow-y-auto px-3">
        {tab === 'chats' ? (
          <>
            {!collapsed && (
              <p className="px-1 pb-2 text-[11px] font-medium text-muted-foreground">
                Recents
              </p>
            )}
            {filtered.length === 0 ? (
              !collapsed && (
                <p className="px-1 py-4 text-xs text-muted-foreground">
                  No chats yet. Generate an app to start a session.
                </p>
              )
            ) : (
              <ul className="flex flex-col gap-1">
                {filtered.map((s) => {
                  const active = s.id === activeId
                  return (
                    <li key={s.id} className="group relative">
                      <button
                        onClick={() => onSelect(s.id)}
                        title={s.name}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg py-2 pl-2.5 pr-8 text-left text-sm transition-colors',
                          active
                            ? 'bg-sidebar-accent text-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                          collapsed && 'justify-center px-0 pr-0',
                        )}
                      >
                        <MessageSquare
                          className={cn('h-4 w-4 shrink-0', active && 'text-primary')}
                        />
                        {!collapsed && (
                          <span className="flex-1 overflow-hidden">
                            <span className="block truncate">{s.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {s.updated}
                            </span>
                          </span>
                        )}
                      </button>
                      {!collapsed && (
                        <button
                          onClick={() => onDelete(s.id)}
                          aria-label={`Delete ${s.name}`}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-background/60 hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : (
          !collapsed && <FileTree spec={spec} />
        )}
      </div>

      {/* Footer actions */}
      <div className="p-3">
        <Button
          className={cn('mb-2 h-10 w-full gap-2', collapsed ? 'px-0' : 'justify-start')}
          onClick={() => undefined}
        >
          <Zap className="h-4 w-4" />
          {!collapsed && <span className="flex-1 text-left">Upgrade to Pro</span>}
        </Button>
        <ul className="flex flex-col gap-1">
          {[
            { icon: LifeBuoy, label: 'Support' },
            { icon: Settings, label: 'Settings' },
          ].map((item) => (
            <li key={item.label}>
              <button
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground',
                  collapsed && 'justify-center px-0',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </motion.aside>
  )
}

/* ------------------------------------------------------------------ */
/* Live code tree of the active generation                             */
/* ------------------------------------------------------------------ */

function FileTree({ spec }: { spec: DesignSpec }) {
  if (!spec.hasContent) {
    return (
      <div className="px-1">
        <p className="pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Source tree
        </p>
        <p className="py-4 text-xs text-muted-foreground">
          Generate an app to map its compiled file structure.
        </p>
      </div>
    )
  }

  const tree = buildProjectTree(spec)
  return (
    <div className="px-1">
      <div className="flex items-center justify-between pb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Source tree
        </p>
        <span className="truncate rounded-full border border-sidebar-border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
          {spec.template}
        </span>
      </div>
      <ul className="flex flex-col gap-0.5 font-mono text-[13px]">
        {tree.map((node) => (
          <TreeItem key={node.name} node={node} depth={0} />
        ))}
      </ul>
    </div>
  )
}

function TreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(true)
  const pad = { paddingLeft: depth * 12 + 4 }

  if (node.kind === 'folder') {
    const Chevron = open ? ChevronDown : ChevronRight
    const FolderIcon = open ? FolderOpen : Folder
    return (
      <li>
        <button
          onClick={() => setOpen((o) => !o)}
          style={pad}
          className="flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <Chevron className="h-3 w-3 shrink-0" />
          <FolderIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">{node.name}</span>
        </button>
        <AnimatePresence initial={false}>
          {open && node.children && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {node.children.map((child) => (
                <TreeItem key={child.name} node={child} depth={depth + 1} />
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </li>
    )
  }

  const FileIcon = node.kind === 'css' ? FileType2 : FileCode2
  return (
    <li>
      <div
        style={pad}
        className="flex items-center gap-1.5 rounded-md py-1 pr-2 text-muted-foreground"
      >
        <span className="h-3 w-3 shrink-0" />
        <FileIcon
          className={cn(
            'h-3.5 w-3.5 shrink-0',
            node.kind === 'css' ? 'text-sky-400' : 'text-emerald-400',
          )}
        />
        <span className="truncate">{node.name}</span>
      </div>
    </li>
  )
}
