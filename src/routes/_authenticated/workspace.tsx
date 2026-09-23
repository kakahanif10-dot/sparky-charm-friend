import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { applyAppearance } from '@/lib/appearance'


const title = 'Workspace — SUPERINTELLIGENS'
const description =
  'Chat with the AI consultant, compile your app spec and preview it live on phone, tablet and desktop.'

export const Route = createFileRoute('/_authenticated/workspace')({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at, theme_preference')
      .eq('id', auth.user.id)
      .maybeSingle()
    if (profile && !profile.onboarded_at) throw redirect({ to: '/onboarding' })
    applyAppearance(profile?.theme_preference === 'light' ? 'light' : 'dark')
  },
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: '/workspace' }],
  }),
  component: WorkspacePage,
})



import { useEffect, useMemo, useRef, useState } from 'react'
import { useServerFn } from '@tanstack/react-start'
import { ConsultantPanel } from '@/components/workspace/consultant-panel'
import { BuiltAppPanel } from '@/components/workspace/built-app-panel'
import { ThemeDrawer } from '@/components/workspace/theme-drawer'
import {
  WorkspaceSidebar,
  type SidebarTab,
} from '@/components/workspace/workspace-sidebar'
import { WorkspaceTopnav } from '@/components/workspace/workspace-topnav'
import { ResizeHandle } from '@/components/workspace/resize-handle'
import { DEFAULT_SPEC, type DesignSpec } from '@/lib/design'
import {
  buildApp,
  deleteApp as deleteAppFn,
  getApp,
  listApps,
  type SavedApp,
} from '@/lib/builder.functions'
import { downloadAppZip } from '@/lib/app-bundle'
import {
  COMPILE_DURATION_MS,
  type ConsultantMessage,
  type Recommendation,
} from '@/lib/consultant'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.round(hr / 24)}d ago`
}

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

type AppSummary = { id: string; name: string; updatedAt: string }

function WorkspacePage() {
  const [prompt, setPrompt] = useState('')
  const [lastPrompt, setLastPrompt] = useState('')
  const [spec, setSpec] = useState<DesignSpec>(DEFAULT_SPEC)
  const [messages, setMessages] = useState<ConsultantMessage[]>([])
  const [generating, setGenerating] = useState(false)
  const [chatting, setChatting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [collapsed, setCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(264)
  const [chatWidth, setChatWidth] = useState(420)
  const [drawerWidth, setDrawerWidth] = useState(360)
  const [tab, setTab] = useState<SidebarTab>('chats')
  const [apps, setApps] = useState<AppSummary[]>([])
  const [app, setApp] = useState<SavedApp | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [deployState, setDeployState] = useState<'idle' | 'deploying' | 'deployed'>('idle')
  const [chatExpanded, setChatExpanded] = useState(false)

  // Pane 3 — theme modifier drawer + its 3.6s hydration loop.
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [hydrating, setHydrating] = useState(false)
  const hydrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (hydrateTimer.current) clearTimeout(hydrateTimer.current)
    }
  }, [])

  // Commit a new accent token from the 2D color canvas and run a fluid
  // theme-hydration loop across the active simulator frame (~3.6s).
  const applyAccent = (hex: string) => {
    setSpec((s) => ({ ...s, palette: { ...s.palette, accent: hex } }))
    setHydrating(true)
    if (hydrateTimer.current) clearTimeout(hydrateTimer.current)
    hydrateTimer.current = setTimeout(() => setHydrating(false), COMPILE_DURATION_MS)
  }

  const runBuildApp = useServerFn(buildApp)
  const runListApps = useServerFn(listApps)
  const runGetApp = useServerFn(getApp)
  const runDeleteApp = useServerFn(deleteAppFn)

  // Load the user's saved apps.
  const refreshApps = async () => {
    try {
      const rows = await runListApps()
      setApps(rows.map((r) => ({ id: r.id, name: r.name, updatedAt: r.updatedAt })))
    } catch {
      /* listing is non-critical */
    }
  }

  useEffect(() => {
    void refreshApps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Core build routine — generates real source files, stores them on the
  // account and renders them in the live preview.
  const runGenerate = async (fullPrompt: string, userLabel: string) => {
    if (generating) return
    setGenerating(true)
    setError(null)
    setMessages((m) => [...m, { id: uid(), role: 'user', text: userLabel }])

    try {
      const built = await runBuildApp({
        data: { prompt: fullPrompt, appId: activeId },
      })

      setApp(built)
      setActiveId(built.id)
      setLastPrompt(fullPrompt)
      setSpec((s) => ({ ...s, appName: built.name, hasContent: true }))

      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: `**${built.name}** is built. ${built.description}\n\nI wrote ${built.files.length} real source files — open the Code tab to read them, or Source to download the project. Tell me what to change next and I'll rewrite the code.`,
        },
      ])

      setTab('chats')
      void refreshApps()
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'assistant',
          text: `I hit a snag building that: ${(err as Error).message}. Try rephrasing the prompt or build again.`,
        },
      ])
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }


  // Conversational reply path — the consultant actually talks back (distinct
  // from compiling an app). Backed by /api/chat with a local fallback.
  const runChat = async (text: string) => {
    if (chatting || generating) return
    setChatting(true)
    setError(null)
    const userMsg: ConsultantMessage = { id: uid(), role: 'user', text }
    // Add the user turn plus an empty assistant turn that fills in as tokens
    // stream — this is what makes the consultant "type" like a person.
    const assistantId = uid()
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: 'assistant', text: '' },
    ])

    try {
      const history = [...messages, userMsg]
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          spec: {
            appName: spec.appName,
            industry: spec.industry,
            template: spec.template,
            hasContent: spec.hasContent,
          },
        }),
      })
      if (!res.ok || !res.body) {
        throw new Error(`Chat failed (${res.status})`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setMessages((m) =>
          m.map((msg) => (msg.id === assistantId ? { ...msg, text: acc } : msg)),
        )
      }

      if (!acc.trim()) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, text: "Sorry, I couldn't reply just now. Try again in a moment." }
              : msg,
          ),
        )
      }
    } catch (err) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                text: `Sorry, I couldn't reply just now: ${(err as Error).message}. Try again in a moment.`,
              }
            : msg,
        ),
      )
    } finally {
      setChatting(false)
    }
  }

  // Action verbs (EN + ID) that signal the user wants to build/modify the app
  // rather than just chat. First message always builds; afterwards, only these
  // action-intent messages compile — plain nouns like "app" or "store" no
  // longer force a rebuild, so ordinary conversation stays conversational.
  const BUILD_INTENT =
    /\b(add|create|build|make|generate|redesign|design|change|update|remove|delete|turn|convert|rebuild|buat|bikin|tambah|ubah|ganti|hapus|jadikan|tambahkan|hilangkan)\b/i

  // Text-to-image intent (multi-language keywords).
  const IMAGE_INTENT =
    /(\b(draw|image|picture|photo|illustration|paint|sketch|gambar|gambarkan|foto|lukis|imagen|dibujo|dessine|bild|immagine)\b|ภาพ|รูป|画|图片|絵|画像|그림|صورة|рисунок|चित्र)/i

  const runImage = async (text: string) => {
    if (chatting || generating) return
    setChatting(true)
    const assistantId = uid()
    setMessages((m) => [
      ...m,
      { id: uid(), role: 'user', text },
      { id: assistantId, role: 'assistant', text: '' },
    ])
    try {
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      })
      const json = (await res.json()) as { image?: string; error?: string }
      if (!res.ok || !json.image) throw new Error(json.error || `Failed (${res.status})`)
      setMessages((m) => m.map((msg) => (msg.id === assistantId ? { ...msg, image: json.image } : msg)))
    } catch (err) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId ? { ...msg, text: `Couldn't create the image: ${(err as Error).message}` } : msg,
        ),
      )
    } finally {
      setChatting(false)
    }
  }

  const handleSend = () => {
    const text = prompt.trim()
    if (!text || generating || chatting) return
    setPrompt('')
    if (IMAGE_INTENT.test(text)) {
      void runImage(text)
    } else if (!spec.hasContent) {
      void runGenerate(text, text)
    } else if (BUILD_INTENT.test(text)) {
      const base = lastPrompt || spec.industry || 'the current app'
      void runGenerate(`${base}. Also ${text}.`, text)
    } else {
      void runChat(text)
    }
  }

  const handleRecommendation = (rec: Recommendation) => {
    const base = lastPrompt || spec.industry || 'the current app'
    void runGenerate(`${base}. Also ${rec.append}.`, `Please add: ${rec.label}`)
  }

  // Universal App Input — industry quick-action seeds run generation directly.
  const handleIndustry = (seed: string) => {
    setPrompt('')
    void runGenerate(seed, seed)
  }

  // Editable App Name / Brand field — live-updates the active spec.
  const handleAppNameChange = (name: string) => {
    setSpec((s) => ({ ...s, appName: name }))
  }

  const handleExport = () => {
    if (spec.hasContent) downloadSourceZip(spec)
  }

  const handleDeploy = () => {
    if (deployState === 'deploying') return
    setDeployState('deploying')
    window.setTimeout(() => setDeployState('deployed'), 1100)
  }

  const selectSession = (id: string) => {
    const s = sessions.find((x) => x.id === id)
    if (!s) return
    setActiveId(id)
    setSpec(s.spec)
    setPrompt('')
    setLastPrompt(s.prompt)
    setError(null)
    // Restore a lightweight conversation recap for the loaded project.
    setMessages([
      {
        id: uid(),
        role: 'assistant',
        text: introMessage(s.spec),
        recommendations: recommendationsFor(s.spec),
      },
    ])
  }

  const deleteSession = (id: string) => {
    const next = sessions.filter((x) => x.id !== id)
    persist(next)
    if (activeId === id) {
      setActiveId(null)
      setSpec(DEFAULT_SPEC)
      setPrompt('')
      setLastPrompt('')
      setMessages([])
    }
  }

  const newProject = () => {
    setActiveId(null)
    setSpec(DEFAULT_SPEC)
    setPrompt('')
    setLastPrompt('')
    setMessages([])
    setError(null)
  }

  const sidebarSessions = useMemo(
    () =>
      sessions.map((s) => ({
        id: s.id,
        name: s.title,
        updated: relativeTime(s.updated),
      })),
    [sessions],
  )

  return (
    <div className="workspace-light flex h-screen overflow-hidden bg-background text-foreground">
      {<WorkspaceSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        tab={tab}
        onTabChange={setTab}
        sessions={sidebarSessions}
        activeId={activeId}
        onSelect={selectSession}
        onNew={newProject}
        onDelete={deleteSession}
        spec={spec}
        width={sidebarWidth}
      />}

      {!collapsed && <ResizeHandle onResize={setSidebarWidth} min={200} max={480} />}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {<WorkspaceTopnav
          projectName={spec.hasContent ? spec.appName : 'Untitled project'}
          deployState={deployState}
          onDeploy={handleDeploy}
        />}

        {/* Three-pane console: consultant · preview · modifier drawer */}
        <div
          className={chatExpanded ? 'flex min-h-0 flex-1 flex-col' : 'flex min-h-0 flex-1 flex-col lg:flex-row'}
        >
          <div
            className={
              chatExpanded
                ? 'min-h-0 min-w-0 flex-1'
                : 'min-h-0 min-w-0 flex-1 lg:w-[var(--chat-w)] lg:flex-none'
            }
            style={{ ['--chat-w' as string]: `${chatWidth}px` } as React.CSSProperties}
          >
            <ConsultantPanel
              prompt={prompt}
              onPromptChange={setPrompt}
              onGenerate={handleSend}
              onRecommendation={handleRecommendation}
              onExport={handleExport}
              generating={generating}
              chatting={chatting}
              error={error}
              messages={messages}
              spec={spec}
              expanded={chatExpanded}
              onToggleExpanded={() => setChatExpanded((value) => !value)}
            />
          </div>

          {!chatExpanded && <ResizeHandle onResize={setChatWidth} min={320} max={900} />}

          {!chatExpanded && <div className="hidden min-h-0 min-w-0 flex-1 lg:block">
            <ResponsivePreview
              spec={spec}
              building={generating || hydrating}
              onEdit={(updater) => setSpec((s) => updater(s))}
            />
          </div>}

          {!chatExpanded && drawerOpen && <ResizeHandle side="right" onResize={setDrawerWidth} min={280} max={640} />}
          {!chatExpanded && <ThemeDrawer
            spec={spec}
            width={drawerWidth}
            open={drawerOpen}
            onToggle={() => setDrawerOpen((o) => !o)}
            onApplyAccent={applyAccent}
            disabled={!spec.hasContent || generating}
            prompt={prompt}
            onPromptChange={setPrompt}
            onGenerate={handleSend}
            onIndustry={handleIndustry}
            onAppNameChange={handleAppNameChange}
            generating={generating || chatting}
          />}
        </div>
      </div>
    </div>
  )
}
