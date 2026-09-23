import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Check, Loader2, Moon, Sun } from 'lucide-react'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { applyAppearance, type Appearance } from '@/lib/appearance'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const title = 'Welcome — SUPERINTELLIGENS'
const description =
  'A few quick questions so SUPERINTELLIGENS can tailor your workspace before you start building.'

export const Route = createFileRoute('/_authenticated/onboarding')({
  head: () => ({
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: '/onboarding' }],
  }),
  component: OnboardingPage,
})

const ROLES = ['Founder', 'Developer', 'Designer', 'Something else'] as const
const TEAM_SIZES = ['Just me', '2–5', '6–20', '20+'] as const

const answerSchema = z.object({
  theme_preference: z.enum(['dark', 'light']),
  user_role: z.string().trim().min(1).max(60),
  team_size: z.string().trim().min(1).max(40),
  building: z.string().trim().max(500),
})

const STEPS = ['Appearance', 'You', 'Team', 'Project'] as const

function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [appearance, setAppearance] = useState<Appearance>('dark')
  const [role, setRole] = useState<string>('')
  const [teamSize, setTeamSize] = useState<string>('')
  const [building, setBuilding] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    applyAppearance(appearance)
  }, [appearance])

  const canContinue =
    (step === 0 && !!appearance) ||
    (step === 1 && !!role) ||
    (step === 2 && !!teamSize) ||
    step === 3

  const finish = async () => {
    setError(null)
    const parsed = answerSchema.safeParse({
      theme_preference: appearance,
      user_role: role,
      team_size: teamSize,
      building,
    })
    if (!parsed.success) {
      setError('Please answer the earlier questions before continuing.')
      return
    }
    setSaving(true)
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setSaving(false)
      navigate({ to: '/login', replace: true })
      return
    }
    const { error: dbError } = await supabase
      .from('profiles')
      .update({
        theme_preference: parsed.data.theme_preference,
        user_role: parsed.data.user_role,
        team_size: parsed.data.team_size,
        building: parsed.data.building || null,
        onboarded_at: new Date().toISOString(),
      })
      .eq('id', auth.user.id)
    setSaving(false)
    if (dbError) {
      setError("We couldn't save your answers. Please try again.")
      return
    }
    navigate({ to: '/workspace', replace: true, search: { intro: building || undefined } as never })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1">
              <div
                className={cn(
                  'h-1 rounded-full transition-colors',
                  i <= step ? 'bg-foreground' : 'bg-muted',
                )}
              />
              <p
                className={cn(
                  'mt-2 text-[11px]',
                  i === step ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          {step === 0 && (
            <Question
              heading="Dark mode or white mode?"
              sub="You can change this later in your account."
            >
              <div className="grid grid-cols-2 gap-3">
                <ChoiceCard
                  selected={appearance === 'dark'}
                  onClick={() => setAppearance('dark')}
                  label="Dark mode"
                >
                  <Moon className="h-5 w-5" />
                </ChoiceCard>
                <ChoiceCard
                  selected={appearance === 'light'}
                  onClick={() => setAppearance('light')}
                  label="White mode"
                >
                  <Sun className="h-5 w-5" />
                </ChoiceCard>
              </div>
            </Question>
          )}

          {step === 1 && (
            <Question heading="What best describes you?" sub="This shapes the way I explain things.">
              <div className="grid gap-2">
                {ROLES.map((r) => (
                  <OptionRow key={r} label={r} selected={role === r} onClick={() => setRole(r)} />
                ))}
              </div>
            </Question>
          )}

          {step === 2 && (
            <Question heading="How big is your team?" sub="Solo builders and teams get different defaults.">
              <div className="grid gap-2">
                {TEAM_SIZES.map((t) => (
                  <OptionRow
                    key={t}
                    label={t}
                    selected={teamSize === t}
                    onClick={() => setTeamSize(t)}
                  />
                ))}
              </div>
            </Question>
          )}

          {step === 3 && (
            <Question
              heading="What are you building?"
              sub="One or two sentences is plenty — I'll use it as your first brief."
            >
              <textarea
                value={building}
                maxLength={500}
                onChange={(e) => setBuilding(e.target.value)}
                rows={5}
                placeholder="A booking app for my barbershop with online payments..."
                className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {building.length}/500
              </p>
            </Question>
          )}

          {error && <p className="mt-4 text-sm font-medium text-foreground">⚠ {error}</p>}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || saving}
            >
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canContinue}>
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={saving || !canContinue}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enter workspace
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Question({
  heading,
  sub,
  children,
}: {
  heading: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function ChoiceCard({
  selected,
  onClick,
  label,
  children,
}: {
  selected: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors',
        selected
          ? 'border-foreground/60 bg-secondary text-foreground'
          : 'border-border bg-background text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}

function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors',
        selected
          ? 'border-foreground/60 bg-secondary text-foreground'
          : 'border-border bg-background text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
      {selected && <Check className="h-4 w-4" />}
    </button>
  )
}
