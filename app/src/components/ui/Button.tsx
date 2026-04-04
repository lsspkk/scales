/**
 * General-purpose button.
 * variant: 'filled' | 'outlined' | 'text'
 * color:   'primary' (brown) | 'secondary' (red) | 'neutral'
 * size:    'sm' | 'md' | 'lg'
 */
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'text'
  color?: 'primary' | 'secondary' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconRight?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

const colors = {
  primary: {
    filled:   'bg-[#5a2d0c] text-white active:bg-[#3d1e08]',
    outlined: 'border-2 border-[#5a2d0c] text-[#5a2d0c] active:bg-[rgba(90,45,12,0.12)]',
    text:     'text-[#5a2d0c] active:bg-[rgba(90,45,12,0.12)]',
  },
  secondary: {
    filled:   'bg-[#a0563f] text-white active:bg-[#7a3f2e]',
    outlined: 'border-2 border-[#a0563f] text-[#a0563f] active:bg-[rgba(160,86,63,0.12)]',
    text:     'text-[#a0563f] active:bg-[rgba(160,86,63,0.12)]',
  },
  neutral: {
    filled:   'bg-[#555] text-white active:bg-[#333]',
    outlined: 'border-2 border-[#888] text-[#444] active:bg-[rgba(0,0,0,0.06)]',
    text:     'text-[#555] active:bg-[rgba(0,0,0,0.06)]',
  },
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3.5 text-base rounded-xl gap-2',
}

export function Button({
  variant = 'filled',
  color = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  className = '',
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${colors[color][variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
      {iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  )
}
