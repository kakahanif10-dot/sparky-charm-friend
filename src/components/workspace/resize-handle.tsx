import { useCallback, useRef } from 'react'

/**
 * Thin vertical drag handle. Reports the new width for the pane on its left.
 */
export function ResizeHandle({
  onResize,
  min = 200,
  max = 720,
  className = '',
  side = 'left',
}: {
  side?: 'left' | 'right'
  onResize: (width: number) => void
  min?: number
  max?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const el = ref.current
      if (!el) return
      const prev = (side === 'right' ? el.nextElementSibling : el.previousElementSibling) as HTMLElement | null
      if (!prev) return
      const startX = e.clientX
      const startWidth = prev.getBoundingClientRect().width
      const body = document.body
      const prevCursor = body.style.cursor
      const prevSelect = body.style.userSelect
      body.style.cursor = 'col-resize'
      body.style.userSelect = 'none'

      const move = (ev: PointerEvent) => {
        const next = Math.min(max, Math.max(min, startWidth + (side === 'right' ? startX - ev.clientX : ev.clientX - startX)))
        onResize(next)
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        body.style.cursor = prevCursor
        body.style.userSelect = prevSelect
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [onResize, min, max, side],
  )

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      className={`group relative z-30 hidden w-1.5 shrink-0 cursor-col-resize lg:block ${className}`}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border/60 transition-colors group-hover:bg-primary/60" />
    </div>
  )
}
