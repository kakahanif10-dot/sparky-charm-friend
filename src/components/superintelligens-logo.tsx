import { cn } from '@/lib/utils'
import whiteLogo from '@/assets/superintelligens-logo-white.png'

export function SuperintelligensMark({ className }: { className?: string }) {
  return (
    <img
      src={whiteLogo}
      alt="SUPERINTELLIGENS logo"
      className={cn('brand-mark inline-block object-contain', className)}
    />
  )
}

export function SuperintelligensLogo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string
  markClassName?: string
  wordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <SuperintelligensMark className={cn('h-8 w-8', markClassName)} />
      {wordmark && (
        <span className="text-[15px] text-foreground">
          <strong className="font-extrabold">SUPER</strong>
          <span className="font-medium">INTELLIGENS</span>
        </span>
      )}
    </span>
  )
}
