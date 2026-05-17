import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NavLinkDef {
  to: string
  label: string
}

const NAV_LINKS: NavLinkDef[] = [
  { to: '/moodit', label: 'Moodit' },
  { to: '/harjoittelu', label: 'Harjoittelu' },
]

function isActive(pathname: string, to: string): boolean {
  if (to === pathname) return true
  return pathname.startsWith(to + '/')
}

/** Desktop top bar (≥769px). Brand on the left, primary nav, optional screen-local actions on the right. */
export function DesktopNavBar({ rightActions }: { rightActions?: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <nav className='w-full bg-[#5a2d0c] text-white border-b border-[#3a1a00]'>
      <div className='max-w-[1200px] mx-auto flex items-center gap-2 px-8 h-11'>
        <Link
          to='/'
          className='font-medieval text-xl flex-1 hover:opacity-80 focus:outline focus:outline-2 focus:outline-[#fffbe9] rounded px-1'
        >
          Sävellajit
        </Link>
        <ul className='flex gap-1 items-center'>
          {NAV_LINKS.map((l) => {
            const active = isActive(pathname, l.to)
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center px-3 py-1 rounded transition-colors text-sm font-semibold focus:outline focus:outline-2 focus:outline-[#fffbe9] ${
                    active ? 'underline underline-offset-4' : 'hover:bg-[#6d3a14]'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            )
          })}
        </ul>
        {rightActions && <div className='flex items-center gap-2 ml-2'>{rightActions}</div>}
      </div>
    </nav>
  )
}
