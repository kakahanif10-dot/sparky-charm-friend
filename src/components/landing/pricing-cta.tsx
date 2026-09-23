
import Link from '@/components/link'
import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    desc: 'For trying out ideas.',
    features: ['5 daily generations', 'Instant preview', 'Community support'],
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$20',
    period: '/mo',
    desc: 'For builders shipping real products.',
    features: [
      'Unlimited generations',
      '1-click deploy + custom domains',
      'Version history & branching',
      'Priority engine',
    ],
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$60',
    period: '/mo',
    desc: 'For teams collaborating.',
    features: ['Everything in Pro', 'Shared workspaces', 'Roles & permissions', 'SSO'],
    highlighted: false,
  },
]

export function PricingCta() {
  return (
    <section id="pricing" className="relative px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Pricing</p>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Start free, scale when you are ready
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={
                p.highlighted
                  ? 'relative rounded-2xl border border-primary/40 bg-card/70 p-7 glow-border'
                  : 'relative rounded-2xl border border-border bg-card/40 p-7'
              }
            >
              {p.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full brand-gradient-bg px-3 py-1 text-xs font-medium text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-medium">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                <span className="mb-1 text-sm text-muted-foreground">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                render={<Link href="/login" />}
                nativeButton={false}
                className={
                  p.highlighted
                    ? 'mt-7 w-full rounded-lg brand-gradient-bg font-medium text-primary-foreground hover:opacity-90'
                    : 'mt-7 w-full rounded-lg border border-border bg-background/50 font-medium text-foreground hover:bg-secondary'
                }
              >
                Get started
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
