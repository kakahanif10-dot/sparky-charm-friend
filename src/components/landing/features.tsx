
import { motion } from 'framer-motion'
import { Eye, Code2, Rocket, GitBranch, ShieldCheck, Zap } from 'lucide-react'

const FEATURES = [
  {
    icon: Eye,
    title: 'Instant preview',
    body: 'See your app render live as it is generated. Every change reflects immediately in a fully interactive preview.',
  },
  {
    icon: Code2,
    title: 'Real-time code generation',
    body: 'Watch clean, production-ready code stream in. Full-stack, type-safe, and yours to edit any time.',
  },
  {
    icon: Rocket,
    title: '1-click deployment',
    body: 'Ship to a global edge network with a single click. Custom domains, SSL, and previews included.',
  },
  {
    icon: GitBranch,
    title: 'Version history',
    body: 'Every generation is a checkpoint. Branch, roll back, and compare versions without losing work.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    body: 'Auth, environment variables, and database rules wired up following best practices from the first prompt.',
  },
  {
    icon: Zap,
    title: 'Blazing fast',
    body: 'A streaming engine tuned for latency means iterations feel like a conversation, not a build queue.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Why SUPERINTELLIGENS</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Everything you need to go from idea to production
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            A complete AI development environment. No setup, no boilerplate —
            just describe what you want and iterate.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="group relative rounded-2xl border border-border bg-card/50 p-6 transition-colors hover:border-primary/30"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/60 text-primary transition-colors group-hover:border-primary/40">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-medium">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
