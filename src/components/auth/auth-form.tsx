import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import Link from '@/components/link'
import { supabase } from '@/integrations/supabase/client'
import { lovable } from '@/integrations/lovable/index'

export function AuthForm() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: '/workspace', replace: true })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) navigate({ to: '/workspace', replace: true })
    })
    return () => sub.subscription.unsubscribe()
  }, [navigate])

  const google = async () => {
    setError(null)
    setStatus('loading')
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/login`,
    })
    if (result.error) {
      setError(result.error.message ?? 'Google sign-in failed')
      setStatus('idle')
      return
    }
    if (result.redirected) return
    navigate({ to: '/workspace', replace: true })
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setStatus('loading')
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: { display_name: name || email.split('@')[0] },
        },
      })
      setStatus('idle')
      if (error) return setError(error.message)
      if (!data.session) setNotice('Check your email to confirm your account, then log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setStatus('idle')
      if (error) return setError(error.message)
    }
  }

  return (
    <div className="login-card-gradient relative w-full max-w-[420px] rounded-2xl border border-white/25 p-8 shadow-2xl shadow-black/20">
      <Link
        href="/"
        aria-label="Close"
        className="absolute right-5 top-5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </Link>

      <p className="text-xl font-medium text-muted-foreground">Start building.</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
        {mode === 'signin' ? 'Log in to your account' : 'Create your account'}
      </h1>

      <div className="mt-6 grid gap-3">
        <SocialButton onClick={google} disabled={status !== 'idle'} label="Continue with Google" icon={<GoogleIcon />} />
      </div>

      <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        OR
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="grid gap-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 w-full rounded-md border border-border bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"
        />
        {error && <p className="text-sm font-medium text-foreground">⚠ {error}</p>}
        {notice && <p className="text-sm font-medium text-foreground">{notice}</p>}
        <button
          type="submit"
          disabled={status !== 'idle'}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-70"
        >
          {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'signin' ? 'Log in' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setNotice(null)
          }}
          className="font-semibold text-foreground underline underline-offset-2"
        >
          {mode === 'signin' ? 'Sign up' : 'Log in'}
        </button>
      </p>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <LockIcon />
        Your account is saved securely
      </p>
    </div>
  )
}

function SocialButton({
  onClick,
  label,
  icon,
  disabled,
}: {
  onClick: () => void
  label: string
  icon: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-70"
    >
      {icon}
      {label}
    </button>
  )
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.3 14.7 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.5H12z"
      />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg className="h-4 w-4 fill-foreground" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4 fill-foreground" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.36 12.78c.02 2.5 2.19 3.33 2.22 3.35-.02.06-.35 1.2-1.15 2.37-.69 1.02-1.41 2.03-2.55 2.05-1.12.02-1.48-.66-2.76-.66-1.28 0-1.68.64-2.74.68-1.1.04-1.94-1.1-2.64-2.11-1.43-2.07-2.52-5.85-1.05-8.41.73-1.27 2.03-2.07 3.44-2.09 1.08-.02 2.1.73 2.76.73.66 0 1.9-.9 3.2-.77.55.02 2.08.22 3.07 1.67-.08.05-1.83 1.07-1.8 3.19M14.3 4.9c.58-.71.98-1.7.87-2.69-.84.04-1.86.56-2.47 1.27-.54.63-1.01 1.64-.88 2.6.94.08 1.9-.47 2.48-1.18" />
    </svg>
  )
}
