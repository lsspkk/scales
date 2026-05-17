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

/** Small decorative scroll/flourish next to the brand — evokes a manuscript seal. */
function Flourish() {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 22 22'
      aria-hidden='true'
      className='flex-shrink-0'
    >
      <g fill='none' stroke='#a0563f' strokeWidth='1.4' strokeLinecap='round'>
        <path d='M11 3 C 8 6, 8 10, 11 11 C 14 10, 14 6, 11 3 Z' fill='#a0563f' />
        <path d='M11 11 L 11 19' />
        <path d='M6 17 Q 11 14, 16 17' />
        <circle cx='6' cy='17' r='1.1' fill='#a0563f' />
        <circle cx='16' cy='17' r='1.1' fill='#a0563f' />
      </g>
    </svg>
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
          background:
            'linear-gradient(180deg, #faefce 0%, #f1dfa8 55%, #eed59a 100%)',
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
