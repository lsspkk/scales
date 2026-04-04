/**
 * Icon-only button. Always requires aria-label for accessibility.
 * variant: 'filled' | 'outlined' | 'ghost'
 * color:   'primary' (brown) | 'secondary' (red) | 'neutral'
 * size:    'sm' | 'md' | 'lg'
 */
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  'aria-label': string
  variant?: 'filled' | 'outlined' | 'ghost'
  color?: 'primary' | 'secondary' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  ref?: Ref<HTMLButtonElement>
}

const colors = {
  primary: {
    filled:   'bg-[#5a2d0c] text-white active:bg-[#3d1e08]',
    outlined: 'border-2 border-[#5a2d0c] text-[#5a2d0c] active:bg-[rgba(90,45,12,0.12)]',
    ghost:    'text-[#5a2d0c] active:bg-[rgba(90,45,12,0.12)]',
  },
  secondary: {
    filled:   'bg-[#a0563f] text-white active:bg-[#7a3f2e]',
    outlined: 'border-2 border-[#a0563f] text-[#a0563f] active:bg-[rgba(160,86,63,0.12)]',
    ghost:    'text-[#a0563f] active:bg-[rgba(160,86,63,0.12)]',
  },
  neutral: {
    filled:   'bg-[#555] text-white active:bg-[#333]',
    outlined: 'border-2 border-[#888] text-[#555] active:bg-[rgba(0,0,0,0.06)]',
    ghost:    'text-[#555] active:bg-[rgba(0,0,0,0.06)]',
  },
}

const sizes = {
  sm: 'w-8 h-8 rounded-lg text-sm',
  md: 'w-11 h-11 rounded-xl text-base',
  lg: 'w-14 h-14 rounded-2xl text-xl',
}

export function IconButton({
  variant = 'ghost',
  color = 'neutral',
  size = 'md',
  children,
  className = '',
  ref,
  ...props
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0 ${sizes[size]} ${colors[color][variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
