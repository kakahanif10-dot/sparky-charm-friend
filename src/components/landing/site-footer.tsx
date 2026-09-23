import Link from '@/components/link'
import { SuperintelligensLogo } from '@/components/superintelligens-logo'

const COLUMNS = [
  {
    title: 'Product',
    links: ['Features', 'Showcase', 'Pricing', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Blog', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Docs', 'Community', 'Support', 'Status'],
  },
]

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border px-4 py-16">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <SuperintelligensLogo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            The AI software generator. Describe it, preview it, ship it.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-medium text-foreground">{col.title}</h4>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} SUPERINTELLIGENS All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="#" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  )
}
