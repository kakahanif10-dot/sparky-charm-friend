
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SuperintelligensMark } from '@/components/superintelligens-logo'

const STEPS = [
  'Menganalisis prompt',
  'Memilih palet & tipografi',
  'Menyusun spesifikasi desain',
  'Merender pratinjau garmen',
  'Menyelesaikan desain',
]

export function ApkLoadingOverlay() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STEPS.length)
    }, 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background/95 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Merakit native APK"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-2xl border border-foreground/15"
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="absolute inset-0 rounded-2xl border border-foreground/25"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          style={{ borderTopColor: 'var(--foreground)' }}
        />
        <SuperintelligensMark className="h-14 w-14" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium tracking-wide text-foreground">
          Merakit Native APK
        </p>
        <div className="h-5 overflow-hidden text-center">
          <motion.p
            key={active}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            {STEPS[active]}
          </motion.p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={
              'h-1 w-6 rounded-full transition-colors duration-300 ' +
              (i <= active ? 'bg-foreground' : 'bg-foreground/15')
            }
          />
        ))}
      </div>
    </motion.div>
  )
}
