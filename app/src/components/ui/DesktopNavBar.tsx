import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NavLinkDef {
  to: string
  label: string
}

const NAV_LINKS: NavLinkDef[] = [
  { to: '/moodit', label: 'Moodit' },
  { to: '/harjoittelu', label: 'Harjoittelu' },
  { to: '/virittaminen', label: 'Virittäminen' },
]

function isActive(pathname: string, to: string): boolean {
  if (to === pathname) return true
  return pathname.startsWith(to + '/')
}

/** Fleur-de-lis (U+269C) — heraldic medieval symbol next to the brand. */
function Flourish() {
  return (
    <span
      aria-hidden='true'
      className='inline-block font-medieval text-4xl text-[#5a2d0c] leading-none flex-shrink-0 -translate-y-[10%]'
    >
      ⚜
    </span>
  )
}

/** Desktop top bar (≥769px). Parchment header with manuscript flourish and illuminated active link. */
export function DesktopNavBar({ rightActions }: { rightActions?: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <nav className='w-full'>
      <div
        className='relative'
        style={{
          background: 'linear-gradient(180deg, #faefce 0%, #f1dfa8 55%, #eed59a 100%)',
        }}
      >
        <div className='max-w-[1200px] mx-auto flex items-center gap-4 px-8 h-14'>
          <Link
            to='/'
            className='font-medieval text-2xl text-[#5a2d0c] flex items-center gap-2 leading-none hover:text-[#3a1a00] focus:outline focus:outline-2 focus:outline-[#5a2d0c] rounded px-1'
          >
            <Flourish />
            <span>Sävellajit</span>
          </Link>
          <div className='flex-1' />
          <ul className='flex gap-2 items-center'>
            {NAV_LINKS.map((l) => {
              const active = isActive(pathname, l.to)
              return (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    aria-current={active ? 'page' : undefined}
                    className={`font-medieval inline-flex items-center min-h-[40px] px-4 py-1.5 rounded-sm transition-colors text-base focus:outline focus:outline-2 focus:outline-[#5a2d0c] ${
                      active
                        ? 'bg-[#a0563f] text-[#fffbe9] shadow-[inset_0_-2px_0_#7a3d2a,0_1px_0_#5a2d0c]'
                        : 'text-[#5a2d0c] hover:bg-[#5a2d0c]/10'
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
      </div>
      {/* Manuscript-style double rule */}
      <div className='h-[2px] bg-[#5a2d0c]' />
      <div className='h-[2px] bg-[#faefce]' />
      <div className='h-[1px] bg-[#5a2d0c]/70' />
    </nav>
  )
}
