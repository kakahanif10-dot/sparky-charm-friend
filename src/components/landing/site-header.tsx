
import Link from '@/components/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SuperintelligensLogo } from '@/components/superintelligens-logo'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Product', href: '#features' },
  { label: 'Showcase', href: '#showcase' },
  { label: 'How it works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <div
        className={cn(
          'flex w-full max-w-6xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500',
          scrolled &&
            'site-header-scrolled bg-background/70 backdrop-blur-xl',
        )}
      >
        <Link href="/" aria-label="SUPERINTELLIGENS home">
          <SuperintelligensLogo className="transition-colors duration-500" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            variant="outline"
            className="sign-in-outline hidden rounded-full border-transparent bg-card text-card-foreground hover:bg-card sm:inline-flex"
          >
            Sign in
          </Button>
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            className="rounded-full font-medium text-primary-foreground hover:brightness-110"
          >
            Get started
          </Button>
        </div>
      </div>
    </motion.header>
  )
}
