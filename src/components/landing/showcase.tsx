
import { motion } from 'framer-motion'
import { Circle } from 'lucide-react'

export function Showcase() {
  return (
    <section id="showcase" className="relative px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl border border-border bg-card/60 p-2 backdrop-blur-xl glow-border"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span className="h-3 w-3 rounded-full bg-destructive/70" />
            <span className="h-3 w-3 rounded-full bg-primary/70" />
            <span className="h-3 w-3 rounded-full bg-muted-foreground/40" />
            <div className="mx-auto flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
              app.superintelligens.build/preview
            </div>
          </div>

          {/* Split view: chat + preview */}
          <div className="grid gap-2 overflow-hidden rounded-xl md:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col gap-3 bg-background/40 p-4">
              <ChatBubble side="user">
                Build a landing page for my coffee shop with a menu and hours.
              </ChatBubble>
              <ChatBubble side="ai">
                Generating layout, menu grid, and hours section. Wiring the hero
                image and CTA now…
              </ChatBubble>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                </span>
                SUPERINTELLIGENS is building
              </div>
            </div>

            <div className="bg-background/70 p-5">
              <div className="rounded-lg border border-border bg-card/70 p-5">
                <div className="h-3 w-24 rounded-full bg-foreground/25" />
                <div className="mt-3 h-6 w-3/4 rounded-md bg-foreground/15" />
                <div className="mt-2 h-3 w-1/2 rounded-md bg-muted-foreground/25" />
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-md border border-border bg-background/50 p-3">
                      <div className="h-10 w-full rounded bg-foreground/10" />
                      <div className="mt-2 h-2.5 w-3/4 rounded bg-muted-foreground/25" />
                      <div className="mt-1.5 h-2.5 w-1/2 rounded bg-muted-foreground/15" />
                    </div>
                  ))}
                </div>
                <div className="mt-5 h-9 w-32 rounded-md bg-foreground/20" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function ChatBubble({
  side,
  children,
}: {
  side: 'user' | 'ai'
  children: React.ReactNode
}) {
  const isUser = side === 'user'
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground'
            : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card/80 px-3.5 py-2.5 text-sm text-foreground'
        }
      >
        {children}
      </div>
    </div>
  )
}
