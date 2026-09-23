
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Paperclip, Smartphone } from 'lucide-react'
import { SuperintelligensMark } from '@/components/superintelligens-logo'
import { cn } from '@/lib/utils'

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  steps?: string[]
  code?: string
}

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSend,
  onGenerateApk,
  generating,
  generatingApk,
}: {
  messages: ChatMessage[]
  input: string
  onInputChange: (v: string) => void
  onSend: () => void
  onGenerateApk: () => void
  generating: boolean
  generatingApk: boolean
}) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, generating])

  return (
    <div className="flex h-full flex-col bg-background/40">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-medium">
        <SuperintelligensMark className="h-6 w-6 shrink-0" />
        <span className="text-[15px] tracking-wide">
          <strong className="font-extrabold">SUPER</strong>
          <span className="font-medium">INTELLIGENS</span>
        </span>
      </div>

      <div className="thin-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}

        <AnimatePresence>
          {generating && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <SuperintelligensMark className="h-7 w-7 shrink-0" />
              <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                </span>
                Generating your app…
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 p-3">
        <div className="rounded-xl border border-border bg-card/70 p-2 backdrop-blur focus-within:border-primary/40">
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing &&
                e.keyCode !== 229
              ) {
                e.preventDefault()
                onSend()
              }
            }}
            rows={2}
            placeholder="Describe a change or a new feature…"
            className="w-full resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center justify-start px-1">
            <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground">
              <Paperclip className="h-4 w-4" />
            </button>
          </div>
        </div>

        <button
          onClick={onGenerateApk}
          disabled={!input.trim() || generating || generatingApk}
          className="group relative mt-2 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/60 bg-white px-4 py-2.5 text-sm font-semibold tracking-wide text-black shadow-[0_0_18px_-2px_rgba(255,255,255,0.7)] transition-all hover:shadow-[0_0_30px_0px_rgba(255,255,255,0.95)] disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-foreground disabled:shadow-none disabled:opacity-40"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 animate-pulse rounded-xl bg-white/30 group-disabled:hidden"
          />
          <Smartphone className="relative h-4 w-4" />
          <span className="relative">GENERATE NATIVE APK</span>
        </button>
      </div>
    </div>
  )
}

function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      {isUser ? (
        <span className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-secondary" />
      ) : (
        <SuperintelligensMark className="mt-0.5 h-7 w-7 shrink-0" />
      )}
      <div className={cn('max-w-[85%]', isUser && 'text-right')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-tr-sm bg-secondary text-secondary-foreground'
              : 'rounded-tl-sm border border-border bg-card/70 text-foreground',
          )}
        >
          {message.content}
        </div>
        {message.code && (
          <pre className="mt-2 max-h-72 overflow-auto rounded-xl border border-border bg-card/70 p-3 text-left font-mono text-xs leading-relaxed text-foreground">
            <code>{message.code}</code>
          </pre>
        )}
        {message.steps && message.steps.length > 0 && (
          <ul className="mt-2 space-y-1.5 text-left">
            {message.steps.map((s) => (
              <li
                key={s}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}
