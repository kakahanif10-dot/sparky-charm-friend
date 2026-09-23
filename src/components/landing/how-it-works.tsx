
import { motion } from 'framer-motion'

const STEPS = [
  {
    step: 'Describe',
    title: 'Tell SUPERINTELLIGENS your idea',
    body: 'Write a prompt in plain language. Attach a screenshot or sketch if you have one — SUPERINTELLIGENS understands both.',
  },
  {
    step: 'Generate',
    title: 'Watch it come to life',
    body: 'The engine writes full-stack code and renders a live preview instantly. Refine by chatting back and forth.',
  },
  {
    step: 'Deploy',
    title: 'Ship it in one click',
    body: 'Publish to a global edge network with SSL and a custom domain. Iterate and redeploy any time.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            From prompt to production in three steps
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl border border-border bg-card/50 p-7"
            >
              <span className="text-sm font-mono font-semibold text-foreground">
                Step {i + 1}
              </span>
              <h3 className="mt-3 text-xl font-medium">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
