
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Home,
  Search,
  User,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Eye,
  EyeOff,
  ImagePlus,
  X,
  FileText,
  ShieldCheck,
  Car,
  Truck,
  CheckCircle2,
  Package,
  LayoutGrid,
  ChevronRight,
  Lock,
  LogOut,
  Star,
  Landmark,
  Coffee,
  HeartPulse,
  Zap,
  Sparkles,
  Wallet,
  GraduationCap,
} from 'lucide-react'
import type { CatalogItem, DesignSpec, Palette, Template } from '@/lib/design'
import { GameArcade } from '@/components/workspace/games'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Inline click-to-edit — makes the live preview's text editable        */
/* ------------------------------------------------------------------ */

// A spec editor threaded through context so any nested preview node can commit
// an edit without prop-drilling. When it's null, the preview is read-only.
type SpecEditor = (updater: (s: DesignSpec) => DesignSpec) => void
const EditContext = createContext<SpecEditor | null>(null)

/**
 * Renders `value` as normal text; when editing is enabled (an editor is present
 * in context) it becomes click-to-edit. Enter/blur commits, Escape cancels.
 * `numeric` parses the draft as a number before committing.
 */
function EditableText({
  value,
  commit,
  className,
  style,
  multiline = false,
  numeric = false,
  ariaLabel,
}: {
  value: string
  commit: (editor: SpecEditor, next: string) => void
  className?: string
  style?: React.CSSProperties
  multiline?: boolean
  numeric?: boolean
  ariaLabel?: string
}) {
  const editor = useContext(EditContext)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  if (!editor) {
    return (
      <span className={className} style={style}>
        {value}
      </span>
    )
  }

  const save = () => {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== value) commit(editor, next)
    else setDraft(value)
  }

  if (editing) {
    const shared = {
      autoFocus: true,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: save,
      onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        e.currentTarget.select(),
      className: cn(
        'w-full rounded bg-black/25 px-1 outline-none ring-1 ring-white/50',
        className,
      ),
      style,
      'aria-label': ariaLabel,
    }
    if (multiline) {
      return (
        <textarea
          {...shared}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(value)
              setEditing(false)
            }
          }}
        />
      )
    }
    return (
      <input
        {...shared}
        inputMode={numeric ? 'decimal' : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          } else if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
        }}
      />
    )
  }

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? `Edit ${value}`}
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setDraft(value)
          setEditing(true)
        }
      }}
      className={cn(
        'cursor-text rounded px-0.5 outline-dashed outline-1 outline-transparent transition-colors hover:bg-white/10 hover:outline-current/40',
        className,
      )}
      style={style}
    >
      {value}
    </span>
  )
}

// Commit helpers for the top-level, single-value spec fields.
const setField =
  (key: 'appName' | 'tagline' | 'description' | 'primaryAction' | 'industry') =>
  (editor: SpecEditor, next: string) =>
    editor((s) => ({ ...s, [key]: next }))

// Commit helper for one catalog row's editable field.
const setCatalog =
  (index: number, key: 'name' | 'meta' | 'price') =>
  (editor: SpecEditor, next: string) =>
    editor((s) => ({
      ...s,
      catalog: s.catalog.map((row, i) =>
        i === index
          ? {
              ...row,
              [key]:
                key === 'price'
                  ? Math.max(0, Math.round((Number(next.replace(/[^0-9.]/g, '')) || 0) * 100) / 100)
                  : next,
            }
          : row,
      ),
    }))

/* ------------------------------------------------------------------ */
/* Automatic psychological brand emblem per detected industry          */
/* ------------------------------------------------------------------ */

// The Context-Aware Engine assigns each industry an authoritative logo mark,
// so a generated app reads as a real institution/brand — never a bare initial.
const BRAND_ICON: Record<Template, typeof Home> = {
  government: Landmark,
  fintech: Wallet,
  edutech: GraduationCap,
  food: Coffee,
  ecommerce: ShoppingBag,
  health: HeartPulse,
  saas: Zap,
  game: Sparkles,
  generic: Sparkles,
}

function BrandMark({
  spec,
  className = 'h-7 w-7',
  iconClassName = 'h-4 w-4',
  rounded = 'rounded-lg',
}: {
  spec: DesignSpec
  className?: string
  iconClassName?: string
  rounded?: string
}) {
  const p = spec.palette
  const Icon = BRAND_ICON[spec.template] ?? Sparkles
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${rounded} ${className}`}
      style={{ backgroundColor: p.accent, color: p.accentText }}
      aria-hidden="true"
    >
      <Icon className={iconClassName} strokeWidth={2.4} />
    </span>
  )
}

/**
 * Fully client-side render of the generated product. The whole thing runs in
 * the browser — no cloud render service, 0 MB server storage. Uploaded images
 * are read to base64 data URLs in-memory, so nothing ever touches a disk.
 * The layout, palette and interactive screens all adapt to the detected
 * industry (spec.template), so the device preview reflects whatever the
 * Context-Aware Engine returns.
 */
export function AppPreview({
  spec,
  onEdit,
}: {
  spec: DesignSpec
  onEdit?: SpecEditor
}) {
  if (!spec.hasContent) return <AwaitingState />
  // Game template boots a real, playable arcade instead of the app shell.
  if (spec.template === 'game') return <GameArcade spec={spec} />
  return (
    <EditContext.Provider value={onEdit ?? null}>
      <InteractiveApp spec={spec} />
    </EditContext.Provider>
  )
}

function formatPrice(currency: string, price: number) {
  const n = Number.isInteger(price)
    ? price.toLocaleString('en-US')
    : price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
  return `${currency}${n}`
}

/* ------------------------------------------------------------------ */
/* Shell: shared state + per-industry page routing via bottom nav      */
/* ------------------------------------------------------------------ */

type PageDef = { key: string; label: string; icon: typeof Home }

function pagesFor(template: DesignSpec['template']): PageDef[] {
  switch (template) {
    case 'government':
      return [
        { key: 'home', label: 'Home', icon: ShieldCheck },
        { key: 'docs', label: 'Docs', icon: FileText },
        { key: 'profile', label: 'Account', icon: User },
      ]
    case 'food':
      return [
        { key: 'menu', label: 'Menu', icon: LayoutGrid },
        { key: 'cart', label: 'Cart', icon: ShoppingBag },
        { key: 'track', label: 'Track', icon: Truck },
        { key: 'profile', label: 'Me', icon: User },
      ]
    case 'ecommerce':
      return [
        { key: 'shop', label: 'Shop', icon: Home },
        { key: 'search', label: 'Search', icon: Search },
        { key: 'cart', label: 'Cart', icon: ShoppingBag },
        { key: 'profile', label: 'Me', icon: User },
      ]
    case 'health':
      return [
        { key: 'home', label: 'Services', icon: HeartPulse },
        { key: 'search', label: 'Find', icon: Search },
        { key: 'cart', label: 'Booking', icon: ShoppingBag },
        { key: 'profile', label: 'Me', icon: User },
      ]
    case 'saas':
      return [
        { key: 'home', label: 'Plans', icon: LayoutGrid },
        { key: 'explore', label: 'Modules', icon: Search },
        { key: 'profile', label: 'Account', icon: User },
      ]
    case 'fintech':
      return [
        { key: 'home', label: 'Wallet', icon: Wallet },
        { key: 'explore', label: 'Explore', icon: Search },
        { key: 'profile', label: 'Account', icon: User },
      ]
    case 'edutech':
      return [
        { key: 'home', label: 'Learn', icon: GraduationCap },
        { key: 'explore', label: 'Browse', icon: Search },
        { key: 'profile', label: 'Me', icon: User },
      ]
    default:
      return [
        { key: 'home', label: 'Home', icon: Home },
        { key: 'explore', label: 'Explore', icon: Search },
        { key: 'profile', label: 'Me', icon: User },
      ]
  }
}

function InteractiveApp({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const pages = useMemo(() => pagesFor(spec.template), [spec.template])
  const [page, setPage] = useState(pages[0].key)
  const [authed, setAuthed] = useState(false)

  // Shared cart across menu/shop and cart pages.
  const [cart, setCart] = useState<Record<string, number>>({})
  const addToCart = (name: string, delta: number) =>
    setCart((c) => {
      const next = Math.max(0, (c[name] ?? 0) + delta)
      const copy = { ...c }
      if (next === 0) delete copy[name]
      else copy[name] = next
      return copy
    })
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)

  // Government requires a login gate first.
  if (spec.template === 'government' && !authed) {
    return <LoginScreen spec={spec} onLogin={() => setAuthed(true)} />
  }

  const goCart = () => setPage('cart')

  return (
    <div
      className="flex h-full w-full flex-col"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      <AppHeader spec={spec} cartCount={cartCount} onCart={goCart} />

      <div className="thin-scroll relative flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="min-h-full"
          >
            <PageBody
              page={page}
              spec={spec}
              cart={cart}
              addToCart={addToCart}
              cartCount={cartCount}
              onLogout={() => {
                setAuthed(false)
                setPage(pages[0].key)
              }}
              goCart={goCart}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav pages={pages} active={page} onChange={setPage} palette={p} />
    </div>
  )
}

function PageBody({
  page,
  spec,
  cart,
  addToCart,
  cartCount,
  onLogout,
  goCart,
}: {
  page: string
  spec: DesignSpec
  cart: Record<string, number>
  addToCart: (name: string, delta: number) => void
  cartCount: number
  onLogout: () => void
  goCart: () => void
}) {
  switch (page) {
    case 'cart':
      return <CartPage spec={spec} cart={cart} addToCart={addToCart} />
    case 'track':
      return <TrackPage spec={spec} />
    case 'docs':
      return <DocsPage spec={spec} />
    case 'profile':
      return <ProfilePage spec={spec} onLogout={onLogout} cartCount={cartCount} />
    case 'search':
    case 'explore':
      return <CatalogPage spec={spec} cart={cart} addToCart={addToCart} searchable />
    case 'home':
      if (spec.template === 'government') return <TaxHomePage spec={spec} goCart={goCart} />
      return <CatalogPage spec={spec} cart={cart} addToCart={addToCart} />
    default:
      // menu / shop
      return <CatalogPage spec={spec} cart={cart} addToCart={addToCart} />
  }
}

/* ------------------------------------------------------------------ */
/* Shared chrome                                                       */
/* ------------------------------------------------------------------ */

function AppHeader({
  spec,
  cartCount,
  onCart,
}: {
  spec: DesignSpec
  cartCount: number
  onCart: () => void
}) {
  const p = spec.palette
  const showCart =
    spec.template === 'food' ||
    spec.template === 'ecommerce' ||
    spec.template === 'health'
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: `1px solid ${p.border}` }}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <BrandMark spec={spec} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold leading-tight">
            <EditableText
              value={spec.appName}
              commit={setField('appName')}
              ariaLabel="Edit app name"
            />
          </p>
          <p className="truncate text-[9px] leading-tight" style={{ color: p.muted }}>
            <EditableText
              value={spec.industry}
              commit={setField('industry')}
              ariaLabel="Edit industry"
            />
          </p>
        </div>
      </div>
      {showCart ? (
        <button
          onClick={onCart}
          className="relative rounded-lg p-1.5"
          style={{ backgroundColor: p.surface }}
          aria-label="Open cart"
        >
          <ShoppingBag className="h-4 w-4" style={{ color: p.text }} />
          {cartCount > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
              style={{ backgroundColor: p.accent, color: p.accentText }}
            >
              {cartCount}
            </span>
          )}
        </button>
      ) : (
        <Bell className="h-4 w-4" style={{ color: p.muted }} />
      )}
    </div>
  )
}

function BottomNav({
  pages,
  active,
  onChange,
  palette,
}: {
  pages: PageDef[]
  active: string
  onChange: (k: string) => void
  palette: Palette
}) {
  return (
    <div
      className="flex items-center justify-around px-2 py-2"
      style={{ borderTop: `1px solid ${palette.border}`, backgroundColor: palette.bg }}
    >
      {pages.map((pg) => {
        const on = pg.key === active
        const Icon = pg.icon
        return (
          <button
            key={pg.key}
            onClick={() => onChange(pg.key)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 transition-colors"
            style={{ color: on ? palette.accent : palette.muted }}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={on ? 2.4 : 1.8} />
            <span className="text-[9px] font-medium">{pg.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function CtaButton({
  spec,
  label,
  onClick,
}: {
  spec: DesignSpec
  label?: string
  onClick?: () => void
}) {
  const p = spec.palette
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl py-2.5 text-xs font-semibold transition-opacity active:opacity-80"
      style={{ backgroundColor: p.accent, color: p.accentText }}
    >
      {label ?? spec.primaryAction}
    </button>
  )
}

/**
 * The main call-to-action, bound to `spec.primaryAction`. It behaves like a
 * normal button (single click runs `onClick`) but, when the preview is
 * editable, a double-click turns the label into an inline field — so an
 * interactive control never loses its action just to become editable.
 */
function EditablePrimaryButton({
  spec,
  onClick,
  className,
  style,
}: {
  spec: DesignSpec
  onClick?: () => void
  className?: string
  style?: React.CSSProperties
}) {
  const editor = useContext(EditContext)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(spec.primaryAction)

  useEffect(() => {
    if (!editing) setDraft(spec.primaryAction)
  }, [spec.primaryAction, editing])

  const save = () => {
    setEditing(false)
    const next = draft.trim()
    if (editor && next && next !== spec.primaryAction) {
      editor((s) => ({ ...s, primaryAction: next }))
    } else {
      setDraft(spec.primaryAction)
    }
  }

  if (editing && editor) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          } else if (e.key === 'Escape') {
            setDraft(spec.primaryAction)
            setEditing(false)
          }
        }}
        aria-label="Edit primary action"
        className={cn('text-center outline-none ring-1 ring-white/60', className)}
        style={style}
      />
    )
  }

  return (
    <button
      onClick={onClick}
      onDoubleClick={
        editor
          ? () => {
              setDraft(spec.primaryAction)
              setEditing(true)
            }
          : undefined
      }
      title={editor ? 'Double-click to rename' : undefined}
      className={className}
      style={style}
    >
      {spec.primaryAction}
    </button>
  )
}

/**
 * A category filter chip. Single click filters the catalog (its original job);
 * when the preview is editable, a double-click renames that category inline.
 * The "All" chip is never editable because it is not part of the spec.
 */
function CategoryChip({
  label,
  active,
  editable,
  palette,
  onSelect,
  onRename,
}: {
  label: string
  active: boolean
  editable: boolean
  palette: Palette
  onSelect: () => void
  onRename: (next: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)

  useEffect(() => {
    if (!editing) setDraft(label)
  }, [label, editing])

  const save = () => {
    setEditing(false)
    const next = draft.trim()
    if (next && next !== label) onRename(next)
    else setDraft(label)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          } else if (e.key === 'Escape') {
            setDraft(label)
            setEditing(false)
          }
        }}
        aria-label="Edit category"
        className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium outline-none ring-1 ring-white/60"
        style={{
          width: `${Math.max(draft.length + 2, 4)}ch`,
          backgroundColor: palette.surface,
          color: palette.text,
          border: `1px solid ${palette.border}`,
        }}
      />
    )
  }

  return (
    <button
      onClick={onSelect}
      onDoubleClick={
        editable
          ? () => {
              setDraft(label)
              setEditing(true)
            }
          : undefined
      }
      title={editable ? 'Double-click to rename' : undefined}
      className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors"
      style={{
        backgroundColor: active ? palette.accent : palette.surface,
        color: active ? palette.accentText : palette.muted,
        border: `1px solid ${palette.border}`,
      }}
    >
      {label}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Catalog (menu / shop / explore) with working category filter + cart */
/* ------------------------------------------------------------------ */

function CatalogPage({
  spec,
  cart,
  addToCart,
  searchable,
}: {
  spec: DesignSpec
  cart: Record<string, number>
  addToCart: (name: string, delta: number) => void
  searchable?: boolean
}) {
  const p = spec.palette
  const editor = useContext(EditContext)
  const cats = useMemo(() => ['All', ...spec.categories], [spec.categories])
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')

  // Rename a real category (index into spec.categories). Keeps the active
  // filter selection pointing at the renamed chip so the grid stays in sync.
  const renameCategory = (index: number, next: string) => {
    if (!editor || index < 0) return
    const old = spec.categories[index]
    editor((s) => ({
      ...s,
      categories: s.categories.map((c, i) => (i === index ? next : c)),
    }))
    setCat((cur) => (cur === old ? next : cur))
  }

  const catOf = (i: number) =>
    spec.categories.length ? spec.categories[i % spec.categories.length] : 'All'

  const items = spec.catalog
    .map((item, i) => ({ item, i }))
    .filter(({ i }) => cat === 'All' || catOf(i) === cat)
    .filter(({ item }) =>
      query.trim() ? item.name.toLowerCase().includes(query.trim().toLowerCase()) : true,
    )

  return (
    <div className="space-y-3 px-4 py-3">
      <div>
        <p className="text-base font-bold leading-tight text-balance">
          <EditableText
            value={spec.tagline}
            commit={setField('tagline')}
            multiline
            ariaLabel="Edit tagline"
          />
        </p>
        <p className="mt-0.5 text-[10px] leading-relaxed" style={{ color: p.muted }}>
          <EditableText
            value={spec.description}
            commit={setField('description')}
            multiline
            ariaLabel="Edit description"
          />
        </p>
      </div>

      {searchable && (
        <label
          className="flex items-center gap-2 rounded-xl px-2.5 py-2"
          style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
        >
          <Search className="h-3.5 w-3.5" style={{ color: p.muted }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="w-full bg-transparent text-[11px] focus:outline-none"
            style={{ color: p.text }}
          />
        </label>
      )}

      {/* Category filter chips */}
      <div className="thin-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {cats.map((c, i) => (
          <CategoryChip
            key={c + i}
            label={c}
            active={c === cat}
            editable={!!editor && i > 0}
            palette={p}
            onSelect={() => setCat(c)}
            onRename={(next) => renameCategory(i - 1, next)}
          />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {items.map(({ item, i }) => (
          <ProductCard
            key={item.name + i}
            spec={spec}
            item={item}
            index={i}
            qty={cart[item.name] ?? 0}
            onAdd={() => addToCart(item.name, 1)}
            onRemove={() => addToCart(item.name, -1)}
          />
        ))}
        {items.length === 0 && (
          <p className="col-span-2 py-6 text-center text-[11px]" style={{ color: p.muted }}>
            Nothing in “{cat}” yet.
          </p>
        )}
      </div>
    </div>
  )
}

// Deterministic hue tile so each catalog item gets a distinct "photo".
function tileGradient(accent: string, index: number) {
  const hue = (index * 47) % 360
  return `linear-gradient(135deg, ${accent}, hsl(${hue} 55% 32%))`
}

function ProductCard({
  spec,
  item,
  index,
  qty,
  onAdd,
  onRemove,
}: {
  spec: DesignSpec
  item: CatalogItem
  index: number
  qty: number
  onAdd: () => void
  onRemove: () => void
}) {
  const p = spec.palette
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl"
      style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
    >
      <div
        className="relative h-16 w-full"
        style={{ background: tileGradient(p.accent, index), opacity: 0.92 }}
      >
        {index % 3 === 0 && (
          <span
            className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8px] font-bold"
            style={{ backgroundColor: p.bg, color: p.accent }}
          >
            <Star className="h-2.5 w-2.5 fill-current" /> Top
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-2.5 py-2">
        <p className="truncate text-[11px] font-semibold leading-tight">
          <EditableText
            value={item.name}
            commit={setCatalog(index, 'name')}
            ariaLabel="Edit item name"
          />
        </p>
        <p className="truncate text-[9px] leading-tight" style={{ color: p.muted }}>
          <EditableText
            value={item.meta || 'Add detail'}
            commit={setCatalog(index, 'meta')}
            ariaLabel="Edit item detail"
          />
        </p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[11px] font-bold" style={{ color: p.accent }}>
            <EditableText
              value={item.price > 0 ? formatPrice(spec.currency, item.price) : 'Included'}
              commit={setCatalog(index, 'price')}
              numeric
              ariaLabel="Edit item price"
            />
          </span>
          {qty === 0 ? (
            <button
              onClick={onAdd}
              className="flex h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: p.accent, color: p.accentText }}
              aria-label={`Add ${item.name}`}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <QtyButton onClick={onRemove} palette={p} aria={`Remove ${item.name}`}>
                <Minus className="h-3 w-3" strokeWidth={2.6} />
              </QtyButton>
              <span className="min-w-3 text-center text-[11px] font-bold">{qty}</span>
              <QtyButton onClick={onAdd} palette={p} aria={`Add ${item.name}`}>
                <Plus className="h-3 w-3" strokeWidth={2.6} />
              </QtyButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QtyButton({
  onClick,
  palette,
  aria,
  children,
}: {
  onClick: () => void
  palette: Palette
  aria: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className="flex h-5 w-5 items-center justify-center rounded-full active:opacity-80"
      style={{ border: `1px solid ${palette.border}`, color: palette.text }}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Cart with working +/- counters and live total                      */
/* ------------------------------------------------------------------ */

function CartPage({
  spec,
  cart,
  addToCart,
}: {
  spec: DesignSpec
  cart: Record<string, number>
  addToCart: (name: string, delta: number) => void
}) {
  const p = spec.palette
  const priceOf = (name: string) =>
    spec.catalog.find((c) => c.name === name)?.price ?? 0
  const lines = Object.entries(cart)
  const total = lines.reduce((sum, [name, qty]) => sum + priceOf(name) * qty, 0)

  if (lines.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <ShoppingBag className="h-8 w-8" style={{ color: p.muted }} />
        <p className="text-[12px] font-semibold">Your cart is empty</p>
        <p className="text-[10px]" style={{ color: p.muted }}>
          Add items from the catalog with the + button.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col px-4 py-3">
      <p className="mb-2 text-[13px] font-bold">Your cart</p>
      <div className="space-y-2">
        {lines.map(([name, qty]) => (
          <div
            key={name}
            className="flex items-center gap-2.5 rounded-xl p-2"
            style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
          >
            <span
              className="h-9 w-9 shrink-0 rounded-lg"
              style={{ background: tileGradient(p.accent, name.length), opacity: 0.9 }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold">{name}</p>
              <p className="text-[10px] font-bold" style={{ color: p.accent }}>
                {formatPrice(spec.currency, priceOf(name))}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <QtyButton onClick={() => addToCart(name, -1)} palette={p} aria={`Remove ${name}`}>
                <Minus className="h-3 w-3" strokeWidth={2.6} />
              </QtyButton>
              <span className="min-w-3 text-center text-[11px] font-bold">{qty}</span>
              <QtyButton onClick={() => addToCart(name, 1)} palette={p} aria={`Add ${name}`}>
                <Plus className="h-3 w-3" strokeWidth={2.6} />
              </QtyButton>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-3 space-y-2 rounded-xl p-3"
        style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
      >
        <div className="flex items-center justify-between text-[11px]">
          <span style={{ color: p.muted }}>Subtotal</span>
          <span className="font-semibold">{formatPrice(spec.currency, total)}</span>
        </div>
        <div className="flex items-center justify-between text-[13px] font-bold">
          <span>Total</span>
          <span style={{ color: p.accent }}>{formatPrice(spec.currency, total)}</span>
        </div>
      </div>

      <div className="mt-3">
        <EditablePrimaryButton
          spec={spec}
          className="w-full rounded-xl py-2.5 text-xs font-semibold transition-opacity active:opacity-80"
          style={{ backgroundColor: p.accent, color: p.accentText }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Government: login gate, tax dashboard + plate lookup, docs gallery   */
/* ------------------------------------------------------------------ */

function LoginScreen({ spec, onLogin }: { spec: DesignSpec; onLogin: () => void }) {
  const p = spec.palette
  const [show, setShow] = useState(false)
  const [id, setId] = useState('')
  const [pass, setPass] = useState('')

  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-5 px-6"
      style={{ backgroundColor: p.bg, color: p.text }}
    >
      <div className="flex flex-col items-center gap-2">
        <BrandMark
          spec={spec}
          className="h-14 w-14"
          iconClassName="h-7 w-7"
          rounded="rounded-2xl"
        />
        <p className="text-center text-[15px] font-bold leading-tight">
          <EditableText
            value={spec.appName}
            commit={setField('appName')}
            ariaLabel="Edit app name"
          />
        </p>
        <p className="text-center text-[10px]" style={{ color: p.muted }}>
          <EditableText
            value={spec.industry}
            commit={setField('industry')}
            ariaLabel="Edit industry"
          />{' '}
          · Secure portal
        </p>
      </div>

      <div className="space-y-2.5">
        <Field palette={p} icon={<User className="h-3.5 w-3.5" />}>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="NIK / Account ID"
            className="w-full bg-transparent text-[12px] focus:outline-none"
            style={{ color: p.text }}
          />
        </Field>
        <Field palette={p} icon={<Lock className="h-3.5 w-3.5" />}>
          <input
            type={show ? 'text' : 'password'}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="Password"
            className="w-full bg-transparent text-[12px] focus:outline-none"
            style={{ color: p.text }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            style={{ color: p.muted }}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>
      </div>

      <CtaButton spec={spec} label="Sign in" onClick={onLogin} />
      <p className="text-center text-[9px]" style={{ color: p.muted }}>
        Protected by end-to-end verification. Tap Sign in to enter the demo.
      </p>
    </div>
  )
}

function Field({
  palette,
  icon,
  children,
}: {
  palette: Palette
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label
      className="flex items-center gap-2 rounded-xl px-3 py-2.5"
      style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}
    >
      <span style={{ color: palette.muted }}>{icon}</span>
      {children}
    </label>
  )
}

function TaxHomePage({ spec, goCart }: { spec: DesignSpec; goCart: () => void }) {
  const p = spec.palette
  const ORANGE = '#f97316'
  const [plate, setPlate] = useState('')
  const [result, setResult] = useState<null | { amount: number; year: number }>(null)

  const check = () => {
    const clean = plate.trim()
    if (!clean) return
    // Deterministic mock computation from the plate string.
    const base = 250000 + (clean.length * 137 + clean.charCodeAt(0)) * 1000
    setResult({ amount: base, year: 2025 + (clean.length % 2) })
  }

  return (
    <div className="space-y-3 px-4 py-3">
      <div
        className="rounded-2xl p-3.5"
        style={{
          background: `linear-gradient(135deg, ${p.accent}, ${p.surface})`,
          color: p.accentText,
        }}
      >
        <p className="text-[10px] font-medium opacity-80">Outstanding tax</p>
        <p className="text-xl font-black leading-tight">
          <EditableText
            value={formatPrice(spec.currency, spec.catalog[0]?.price ?? 0)}
            commit={setCatalog(0, 'price')}
            numeric
            ariaLabel="Edit outstanding tax amount"
          />
        </p>
        <p className="mt-0.5 text-[9px] opacity-80">
          <EditableText
            value={spec.catalog[0]?.meta ?? 'Due soon'}
            commit={setCatalog(0, 'meta')}
            ariaLabel="Edit tax due detail"
          />
        </p>
      </div>

      {/* Plate number calculator */}
      <div
        className="space-y-2 rounded-xl p-3"
        style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold">
          <Car className="h-3.5 w-3.5" style={{ color: p.accent }} /> Check by plate number
        </p>
        <div className="flex gap-2">
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="B 1234 XYZ"
            className="w-full rounded-lg px-2.5 py-2 text-[12px] font-semibold tracking-wider focus:outline-none"
            style={{ backgroundColor: p.bg, color: p.text, border: `1px solid ${p.border}` }}
          />
          <button
            onClick={check}
            className="shrink-0 rounded-lg px-3 text-[11px] font-bold"
            style={{ backgroundColor: p.accent, color: p.accentText }}
          >
            Check
          </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1.5 rounded-lg p-2.5" style={{ backgroundColor: p.bg }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold tracking-wider">{plate}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[8px] font-bold"
                    style={{ backgroundColor: ORANGE, color: '#1a0d00' }}
                  >
                    UNPAID
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px]" style={{ color: p.muted }}>
                  <span>Tax year {result.year}</span>
                  <span className="font-bold" style={{ color: p.text }}>
                    {formatPrice(spec.currency, result.amount)}
                  </span>
                </div>
                <EditablePrimaryButton
                  spec={spec}
                  onClick={goCart}
                  className="mt-1 w-full rounded-lg py-1.5 text-[10px] font-bold"
                  style={{ backgroundColor: p.accent, color: p.accentText }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Payable services */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold">Services</p>
        <div className="space-y-1.5">
          {spec.catalog.map((item, i) => (
            <div
              key={item.name + i}
              className="flex items-center gap-2.5 rounded-xl p-2.5"
              style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: p.bg, color: p.accent }}
              >
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold">
                  <EditableText
                    value={item.name}
                    commit={setCatalog(i, 'name')}
                    ariaLabel="Edit service name"
                  />
                </p>
                <p className="text-[9px]" style={{ color: p.muted }}>
                  <EditableText
                    value={item.meta || 'Add detail'}
                    commit={setCatalog(i, 'meta')}
                    ariaLabel="Edit service detail"
                  />
                </p>
              </div>
              <span className="text-[11px] font-bold" style={{ color: p.accent }}>
                <EditableText
                  value={formatPrice(spec.currency, item.price)}
                  commit={setCatalog(i, 'price')}
                  numeric
                  ariaLabel="Edit service price"
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Base64 document uploader: mock gallery + real device picker, tap-to-view, delete.
type Doc = { id: string; url: string; label: string }

const MOCK_DOCS = [
  { label: 'KTP', hue: 205 },
  { label: 'STNK', hue: 150 },
  { label: 'BPKB', hue: 30 },
  { label: 'SIM', hue: 275 },
]

function DocsPage({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const [docs, setDocs] = useState<Doc[]>([])
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [viewer, setViewer] = useState<Doc | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const addMock = (label: string, hue: number) => {
    // Encode a tiny SVG "document" as a base64 data URL — 0 bytes on disk.
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><rect width='320' height='200' fill='hsl(${hue} 45% 22%)'/><rect x='16' y='16' width='288' height='168' rx='10' fill='hsl(${hue} 50% 32%)'/><text x='32' y='60' fill='white' font-family='sans-serif' font-size='22' font-weight='bold'>${label}</text><rect x='32' y='84' width='150' height='12' rx='6' fill='rgba(255,255,255,0.5)'/><rect x='32' y='108' width='210' height='12' rx='6' fill='rgba(255,255,255,0.3)'/><rect x='210' y='40' width='72' height='90' rx='8' fill='rgba(255,255,255,0.25)'/></svg>`
    const url = `data:image/svg+xml;base64,${btoa(svg)}`
    setDocs((d) => [{ id: crypto.randomUUID(), url, label }, ...d])
    setGalleryOpen(false)
  }

  const onFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files)
      .slice(0, 6)
      .forEach((file) => {
        const reader = new FileReader()
        reader.onload = () =>
          setDocs((d) => [
            { id: crypto.randomUUID(), url: String(reader.result), label: file.name.slice(0, 14) },
            ...d,
          ])
        reader.readAsDataURL(file) // → base64 data URL, kept in memory only
      })
    setGalleryOpen(false)
  }

  return (
    <div className="space-y-3 px-4 py-3">
      <div>
        <p className="text-[13px] font-bold">My documents</p>
        <p className="text-[10px]" style={{ color: p.muted }}>
          Upload KTP / STNK. Files are encoded to base64 in your browser — nothing is stored on a server.
        </p>
      </div>

      <button
        onClick={() => setGalleryOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-semibold"
        style={{ border: `1.5px dashed ${p.accent}`, color: p.accent, backgroundColor: p.surface }}
      >
        <ImagePlus className="h-4 w-4" /> Add image from gallery
      </button>

      {docs.length === 0 ? (
        <p className="py-4 text-center text-[10px]" style={{ color: p.muted }}>
          No documents yet.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {docs.map((d) => (
            <div
              key={d.id}
              className="group relative overflow-hidden rounded-lg"
              style={{ border: `1px solid ${p.border}` }}
            >
              <button onClick={() => setViewer(d)} className="block w-full" aria-label={`View ${d.label}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.url || '/placeholder.svg'} alt={d.label} className="h-16 w-full object-cover" />
              </button>
              <button
                onClick={() => setDocs((x) => x.filter((i) => i.id !== d.id))}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff' }}
                aria-label={`Delete ${d.label}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Mock gallery modal */}
      <AnimatePresence>
        {galleryOpen && (
          <Modal onClose={() => setGalleryOpen(false)} palette={p} title="Gallery">
            <div className="grid grid-cols-2 gap-2">
              {MOCK_DOCS.map((m) => (
                <button
                  key={m.label}
                  onClick={() => addMock(m.label, m.hue)}
                  className="overflow-hidden rounded-lg text-left"
                  style={{ border: `1px solid ${p.border}` }}
                >
                  <span
                    className="flex h-14 w-full items-end p-1.5 text-[10px] font-bold text-white"
                    style={{ background: `hsl(${m.hue} 50% 32%)` }}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
            <label
              className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-semibold"
              style={{ backgroundColor: p.accent, color: p.accentText }}
            >
              <ImagePlus className="h-4 w-4" /> Choose from device
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
          </Modal>
        )}
      </AnimatePresence>

      {/* Full image viewer */}
      <AnimatePresence>
        {viewer && (
          <Modal onClose={() => setViewer(null)} palette={p} title={viewer.label}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={viewer.url || '/placeholder.svg'}
              alt={viewer.label}
              className="w-full rounded-lg"
            />
            <button
              onClick={() => {
                setDocs((x) => x.filter((i) => i.id !== viewer.id))
                setViewer(null)
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-semibold"
              style={{ backgroundColor: '#ef4444', color: '#fff' }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete document
            </button>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function Modal({
  onClose,
  palette,
  title,
  children,
}: {
  onClose: () => void
  palette: Palette
  title: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 z-30 flex items-end justify-center p-3"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl p-3"
        style={{ backgroundColor: palette.surface, border: `1px solid ${palette.border}` }}
      >
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12px] font-semibold" style={{ color: palette.text }}>
            {title}
          </p>
          <button onClick={onClose} aria-label="Close" style={{ color: palette.muted }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Delivery tracking (food)                                            */
/* ------------------------------------------------------------------ */

function TrackPage({ spec }: { spec: DesignSpec }) {
  const p = spec.palette
  const steps = ['Order confirmed', 'Preparing', 'Out for delivery', 'Delivered']
  const [current, setCurrent] = useState(2)

  return (
    <div className="space-y-3 px-4 py-3">
      <p className="text-[13px] font-bold">Track your order</p>

      <div
        className="flex items-center gap-2.5 rounded-xl p-3"
        style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: p.accent, color: p.accentText }}
        >
          <Truck className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold">Courier · Andi</p>
          <p className="text-[10px]" style={{ color: p.muted }}>
            Arriving in ~12 min
          </p>
        </div>
        <Package className="h-4 w-4" style={{ color: p.muted }} />
      </div>

      <div className="space-y-0.5 py-1">
        {steps.map((s, i) => {
          const done = i <= current
          return (
            <div key={s} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: done ? p.accent : p.surface,
                    color: done ? p.accentText : p.muted,
                    border: `1px solid ${p.border}`,
                  }}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[9px]">{i + 1}</span>}
                </span>
                {i < steps.length - 1 && (
                  <span
                    className="h-6 w-0.5"
                    style={{ backgroundColor: i < current ? p.accent : p.border }}
                  />
                )}
              </div>
              <span
                className="text-[11px]"
                style={{ color: done ? p.text : p.muted, fontWeight: i === current ? 700 : 400 }}
              >
                {s}
              </span>
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setCurrent((c) => Math.min(steps.length - 1, c + 1))}
        disabled={current >= steps.length - 1}
        className="w-full rounded-xl py-2.5 text-xs font-semibold disabled:opacity-40"
        style={{ backgroundColor: p.accent, color: p.accentText }}
      >
        {current >= steps.length - 1 ? 'Order delivered' : 'Advance status'}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Profile (all templates)                                             */
/* ------------------------------------------------------------------ */

function ProfilePage({
  spec,
  onLogout,
  cartCount,
}: {
  spec: DesignSpec
  onLogout: () => void
  cartCount: number
}) {
  const p = spec.palette
  const STAT_SETS: Record<Template, { label: string; value: string }[]> = {
    government: [
      { label: 'Vehicles', value: '2' },
      { label: 'Paid', value: '14' },
      { label: 'Due', value: '1' },
    ],
    fintech: [
      { label: 'Accounts', value: '3' },
      { label: 'Cards', value: '2' },
      { label: 'Score', value: '742' },
    ],
    edutech: [
      { label: 'Courses', value: '6' },
      { label: 'Certs', value: '3' },
      { label: 'Streak', value: '12' },
    ],
    health: [
      { label: 'Visits', value: '9' },
      { label: 'Booked', value: String(cartCount) },
      { label: 'Reports', value: '5' },
    ],
    saas: [
      { label: 'Projects', value: '12' },
      { label: 'Members', value: '4' },
      { label: 'Usage', value: '68%' },
    ],
    food: [
      { label: 'Orders', value: '27' },
      { label: 'In cart', value: String(cartCount) },
      { label: 'Points', value: '860' },
    ],
    ecommerce: [
      { label: 'Orders', value: '27' },
      { label: 'In cart', value: String(cartCount) },
      { label: 'Points', value: '860' },
    ],
    game: [
      { label: 'Score', value: '0' },
      { label: 'Level', value: '1' },
      { label: 'Best', value: '0' },
    ],
    generic: [
      { label: 'Orders', value: '27' },
      { label: 'In cart', value: String(cartCount) },
      { label: 'Points', value: '860' },
    ],
  }
  const ROW_SETS: Record<Template, string[]> = {
    government: ['Personal data', 'My vehicles', 'Payment history', 'Notifications'],
    fintech: ['Personal data', 'Linked cards', 'Transaction history', 'Security & PIN'],
    edutech: ['Personal data', 'My courses', 'Certificates', 'Notifications'],
    health: ['Personal data', 'Medical records', 'Appointments', 'Notifications'],
    saas: ['Workspace settings', 'Team & roles', 'Billing & plan', 'Notifications'],
    food: ['Order history', 'Addresses', 'Payment methods', 'Notifications'],
    ecommerce: ['Order history', 'Addresses', 'Payment methods', 'Notifications'],
    game: ['High scores', 'Controls', 'Sound', 'Notifications'],
    generic: ['Order history', 'Addresses', 'Payment methods', 'Notifications'],
  }
  const stats = STAT_SETS[spec.template] ?? STAT_SETS.generic
  const rows = ROW_SETS[spec.template] ?? ROW_SETS.generic

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <BrandMark
          spec={spec}
          className="h-14 w-14"
          iconClassName="h-6 w-6"
          rounded="rounded-full"
        />
        <div>
          <p className="text-[13px] font-bold">Demo User</p>
          <p className="text-[10px]" style={{ color: p.muted }}>
            <EditableText
              value={spec.industry}
              commit={setField('industry')}
              ariaLabel="Edit industry"
            />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-2.5 text-center"
            style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
          >
            <p className="text-base font-black" style={{ color: p.accent }}>
              {s.value}
            </p>
            <p className="text-[9px]" style={{ color: p.muted }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div
        className="divide-y overflow-hidden rounded-xl"
        style={{ backgroundColor: p.surface, border: `1px solid ${p.border}` }}
      >
        {rows.map((r) => (
          <button
            key={r}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[11px]"
            style={{ borderColor: p.border }}
          >
            <span>{r}</span>
            <ChevronRight className="h-3.5 w-3.5" style={{ color: p.muted }} />
          </button>
        ))}
      </div>

      <button
        onClick={onLogout}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-semibold"
        style={{ border: `1px solid ${p.border}`, color: p.text }}
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Neutral idle state                                                  */
/* ------------------------------------------------------------------ */

function AwaitingState() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-8 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
          <span className="h-5 w-5 rounded-md bg-white/80" />
        </div>
        <p className="text-sm font-semibold tracking-[0.25em] text-white/90">SUPERINTELLIGENS</p>
      </motion.div>
      <p className="max-w-[15rem] text-xs leading-relaxed text-white/45">
        Awaiting your design blueprint. Type a prompt on the left to witness the genesis of your
        native application.
      </p>
      <span className="mt-1 h-1 w-10 animate-pulse rounded-full bg-white/25" />
    </div>
  )
}
