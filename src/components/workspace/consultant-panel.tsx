
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2,
  Download,
  AlertCircle,
  Cpu,
  Plus,
  Paperclip,
  Mic,
  ChevronsLeft, ChevronsRight, } from 'lucide-react'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { Button } from '@/components/ui/button'
import { TEMPLATE_LABELS, type DesignSpec } from '@/lib/design'
import {
  COMPILE_STEPS,
  COMPILE_DURATION_MS,
  type ConsultantMessage,
} from '@/lib/consultant'
import type { Recommendation } from '@/lib/consultant'
import { cn } from '@/lib/utils'

const EXAMPLES = [
  'Aplikasi SAMSAT online untuk cek dan bayar pajak kendaraan',
  'A cozy neighborhood coffee shop with menu and delivery',
  'A fashion e-commerce store with cart and checkout',
]

export function ConsultantPanel({
  prompt,
  onPromptChange,
  onGenerate,
  onRecommendation,
  onExport,
  generating,
  chatting = false,
  error,
  messages,
  spec,
  expanded,
  onToggleExpanded,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  onGenerate: () => void
  onRecommendation: (rec: Recommendation) => void
  onExport: () => void
  generating: boolean
  chatting?: boolean
  error: string | null
  messages: ConsultantMessage[]
  spec: DesignSpec
  expanded: boolean
  onToggleExpanded: () => void
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const busy = generating || chatting

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, generating, chatting])

  const empty = messages.length === 0 && !busy

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-end bg-background px-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleExpanded}
          aria-label={expanded ? 'Show preview' : 'Hide preview'}
          title={expanded ? 'Show preview' : 'Hide preview'}
        >
          {expanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Conversation */}
      <Conversation className="thin-scroll">
        <ConversationContent className="gap-5 px-4 py-4">
          {empty && <EmptyState onPick={onPromptChange} />}

          {messages.map((m) =>
            m.role === 'user' ? (
              <UserBubble key={m.id} text={m.text} />
            ) : (
              <AssistantBubble
                key={m.id}
                message={m}
                onRecommendation={onRecommendation}
                disabled={busy}
              />
            ),
          )}

          <AnimatePresence>{generating && <CompileLog />}</AnimatePresence>
          <div ref={endRef} />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Detected context strip */}
      {spec.hasContent && (
        <div className="shrink-0 px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex items-center gap-1">
              {(['bg', 'surface', 'accent', 'text'] as const).map((k) => (
                <span
                  key={k}
                  className="h-4 w-4 rounded-full ring-1 ring-white/10"
                  style={{ backgroundColor: spec.palette[k] }}
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold leading-tight">
                {spec.industry}
              </p>
              <p className="truncate text-[9px] leading-tight text-muted-foreground">
                {TEMPLATE_LABELS[spec.template]}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-border bg-card/70 p-3 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Composer */}
      <div className="shrink-0 p-3">
        <PromptInput
          onSubmit={() => onGenerate()}
          className="border-0 shadow-none [&_[data-slot=input-group]]:rounded-2xl [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-muted [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:ring-0 [&_[data-slot=input-group]]:outline-none [&_[data-slot=input-group]:focus-within]:ring-0 [&_[data-slot=input-group]:focus-within]:border-0"
        >
          <PromptInputTextarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ask SUPERINTELLIGENS to build or change anything..."
            className="min-h-16 px-3 text-base md:text-sm"
          />
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputButton tooltip="Attach files" aria-label="Attach files">
                <Paperclip className="size-4" />
              </PromptInputButton>
              <PromptInputButton tooltip="Voice input" aria-label="Voice input">
                <Mic className="size-4" />
              </PromptInputButton>
              <span className="hidden text-[10px] text-muted-foreground sm:inline">Plan & build</span>
            </PromptInputTools>
          </PromptInputFooter>
        </PromptInput>

        <Button
          variant="outline"
          onClick={onExport}
          disabled={!spec.hasContent || generating}
          className="mt-2 h-9 w-full gap-2"
        >
          <Download className="h-4 w-4" />
          Download app
        </Button>
        <p className="mt-1.5 px-1 text-[10px] leading-relaxed text-muted-foreground">
          Exports a real Expo / React Native project you can build into an
          installable <span className="font-mono">.apk</span> with{' '}
          <span className="font-mono">eas build -p android</span>.
        </p>
      </div>
    </div>
  )
}

function EmptyState({ onPick }: { onPick: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card/70 px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
          I&apos;m your autonomous engineering consultant. Describe any product —
          a government tax portal, a coffee shop, a marketplace — and I&apos;ll
          detect the industry, brand it, and compile a functional multi-page app
          preview. Try one of these:
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => onPick(ex)}
            className="rounded-lg border border-border bg-card/50 px-3 py-2 text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}

// Lightweight, dependency-free markdown renderer for assistant replies.
// Supports short headings (##, ###), bold (**text**), inline code (`code`),
// and bullet lists (-, *). Everything else renders as plain paragraphs so the
// consultant can add light structure without ever leaking raw markup.
function renderInline(text: string, keyPrefix: string) {
  // Split on **bold** and `code` while keeping the delimiters.
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    return <span key={key}>{part}</span>
  })
}

function RichText({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (bullets.length === 0) return
    const items = bullets
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="space-y-1 pl-1">
        {items.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
            <span className="flex-1">{renderInline(b, `li-${blocks.length}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    )
    bullets = []
  }

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd()
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) {
      bullets.push(bullet[1])
      return
    }
    flushBullets()
    if (!line.trim()) return
    const heading = line.match(/^\s*(#{2,3})\s+(.*)$/)
    if (heading) {
      blocks.push(
        <p key={`h-${idx}`} className="text-[13px] font-semibold text-foreground">
          {renderInline(heading[2], `h-${idx}`)}
        </p>,
      )
      return
    }
    blocks.push(
      <p key={`p-${idx}`}>{renderInline(line, `p-${idx}`)}</p>,
    )
  })
  flushBullets()

  return <div className="space-y-2">{blocks}</div>
}

function UserBubble({ text }: { text: string }) {
  return (
    <Message from="user" className="animate-fade-in">
      <MessageContent className="bg-primary text-primary-foreground">{text}</MessageContent>
    </Message>
  )
}

function AssistantBubble({
  message,
  onRecommendation,
  disabled,
}: {
  message: ConsultantMessage
  onRecommendation: (rec: Recommendation) => void
  disabled: boolean
}) {
  return (
    <Message from="assistant" className="animate-fade-in">
      <div className="flex gap-3">
        <div className="min-w-0 max-w-[88%] space-y-2">
          <MessageContent className="w-full">
          {message.text ? (
            <MessageResponse>{message.text}</MessageResponse>
          ) : !message.image ? (
            <Shimmer className="text-sm">Thinking...</Shimmer>
          ) : null}
          {message.image && (
            <a href={message.image} download="image.png" target="_blank" rel="noreferrer">
              <img src={message.image} alt="Generated" className="mt-2 w-full max-w-sm rounded-lg border border-border" />
            </a>
          )}
          </MessageContent>
        {message.recommendations && message.recommendations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {message.recommendations.map((rec, i) => (
              <Button
                variant="outline"
                key={rec.label}
                onClick={() => onRecommendation(rec)}
                disabled={disabled}
                className="h-auto w-full justify-start gap-2 px-3 py-2 text-left text-[12px]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-muted-foreground group-hover:bg-foreground group-hover:text-background">
                  {i + 1}
                </span>
                <span className="flex-1">{rec.label}</span>
                <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </Button>
            ))}
          </div>
        )}
        </div>
      </div>
    </Message>
  )
}

// Real-time compile log — the agent streaming its analytical thoughts.
function CompileLog() {
  const [step, setStep] = useState(0)
  const perStep = COMPILE_DURATION_MS / COMPILE_STEPS.length

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, COMPILE_STEPS.length - 1))
    }, perStep)
    return () => clearInterval(id)
  }, [perStep])

  const progress = Math.round(((step + 1) / COMPILE_STEPS.length) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <div className="w-full max-w-[85%] space-y-2 rounded-2xl rounded-tl-sm border border-border bg-card/70 px-3.5 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Cpu className="h-3.5 w-3.5 animate-pulse" />
          Compiling snapshot… {progress}%
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-foreground"
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          />
        </div>
        <ul className="space-y-1 pt-0.5">
          {COMPILE_STEPS.slice(0, step + 1).map((s, i) => (
            <motion.li
              key={s}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-center gap-2 text-[11px]',
                i === step ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  i === step ? 'animate-pulse bg-foreground' : 'bg-muted-foreground/50',
                )}
              />
              {s}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
