import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

type Profile = { display_name: string | null; avatar_url: string | null }

export function AccountMenu() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user
      if (!user || !active) return
      setEmail(user.email ?? '')
      const { data: p } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
      if (active) setProfile(p)
    })
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => {
      active = false
      document.removeEventListener('mousedown', close)
    }
  }, [])

  const name = profile?.display_name || email.split('@')[0] || 'Account'

  const signOut = async () => {
    await queryClient.cancelQueries()
    queryClient.clear()
    await supabase.auth.signOut()
    navigate({ to: '/login', replace: true })
  }

  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        aria-label="Account"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-xs font-semibold text-foreground"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-xl">
          <div className="px-2 py-1.5">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
