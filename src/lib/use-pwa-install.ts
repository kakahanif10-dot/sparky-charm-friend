
import { useCallback, useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallStatus = 'unavailable' | 'available' | 'installed'

/**
 * Registers the service worker and captures the browser's install prompt so a
 * button can trigger a real, $0 PWA install — no build server, no fake binary.
 */
export function usePwaInstall() {
  const [status, setStatus] = useState<InstallStatus>('unavailable')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration can fail in sandboxed iframes; install stays unavailable.
      })
    }

    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone

    if (standalone) setStatus('installed')

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setStatus('available')
    }

    const onInstalled = () => {
      setStatus('installed')
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return 'unavailable' as const
    await deferred.prompt()
    const choice = await deferred.userChoice
    setDeferred(null)
    if (choice.outcome === 'accepted') {
      setStatus('installed')
      return 'accepted' as const
    }
    setStatus('available')
    return 'dismissed' as const
  }, [deferred])

  return { status, install }
}
