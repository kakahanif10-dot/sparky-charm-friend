
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wifi, Signal, BatteryFull, X } from 'lucide-react'
import { AppPreview } from '@/components/workspace/app-preview'
import type { DesignSpec } from '@/lib/design'

/**
 * Pure frontend device simulator. Everything rendered here runs in the browser
 * — no cloud render service — so the generated application preview updates live
 * as the design spec changes, adapting to any app type or industry.
 */
export function PhoneSimulator({
  spec,
  building,
  attachment,
  onClearAttachment,
  onEdit,
}: {
  spec: DesignSpec
  building: boolean
  attachment?: string | null
  onClearAttachment?: () => void
  onEdit?: (updater: (s: DesignSpec) => DesignSpec) => void
}) {
  // Render the clock only after mount. The current time depends on the
  // viewer's timezone/locale, so computing it during SSR produces markup that
  // won't match the client and triggers a hydration mismatch.
  const [now, setNow] = useState('')

  useEffect(() => {
    const format = () =>
      setNow(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      )
    format()
    const id = setInterval(format, 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-full items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative h-[620px] w-[300px] shrink-0 rounded-[2.75rem] border border-white/15 bg-black p-2.5 shadow-[0_0_0_2px_rgba(255,255,255,0.04),0_40px_80px_-20px_rgba(0,0,0,0.9)]"
      >
        {/* Side buttons */}
        <span className="absolute -left-[3px] top-28 h-12 w-[3px] rounded-l bg-white/20" />
        <span className="absolute -left-[3px] top-44 h-16 w-[3px] rounded-l bg-white/20" />
        <span className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r bg-white/20" />

        {/* Screen */}
        <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2.25rem] bg-[oklch(0.16_0_0)]">
          {/* Status bar */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between px-6 pt-3 text-[11px] font-medium text-white/80 mix-blend-difference">
            <span suppressHydrationWarning>{now}</span>
            <div className="flex items-center gap-1.5">
              <Signal className="h-3 w-3" />
              <Wifi className="h-3 w-3" />
              <BatteryFull className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Camera punch-hole */}
          <span className="absolute left-1/2 top-2.5 z-30 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

          {/* App canvas */}
          <div className="relative flex flex-1 flex-col overflow-hidden pt-7">
            {attachment && (
              <div className="relative z-[5] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachment || '/placeholder.svg'}
                  alt="Attached gallery asset"
                  className="h-24 w-full object-cover"
                />
                <button
                  onClick={onClearAttachment}
                  className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur"
                >
                  <X className="h-3 w-3" /> Clear Attachment
                </button>
              </div>
            )}
            {building && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm"
              >
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                <p className="text-xs text-white/70">Compiling your app…</p>
              </motion.div>
            )}
            <AppPreview spec={spec} onEdit={onEdit} />
          </div>

          {/* Nav pill */}
          <div className="flex justify-center bg-black py-2">
            <span className="h-1 w-24 rounded-full bg-white/30" />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
