/**
 * Small label chip. Can be selectable (toggles active state) or display-only.
 * color: 'primary' (brown) | 'secondary' (red) | 'neutral'
 */
import type { ReactNode } from 'react'

interface ChipProps {
  label: string
  active?: boolean
  color?: 'primary' | 'secondary' | 'neutral'
  icon?: ReactNode
  onClick?: () => void
}

const colors = {
  primary: {
    active:   'bg-[#5a2d0c] text-white border-[#5a2d0c]',
    inactive: 'bg-[rgba(90,45,12,0.1)] text-[#5a2d0c] border-[#5a2d0c] active:bg-[rgba(90,45,12,0.25)]',
  },
  secondary: {
    active:   'bg-[#a0563f] text-white border-[#a0563f]',
    inactive: 'bg-[rgba(160,86,63,0.1)] text-[#a0563f] border-[#a0563f] active:bg-[rgba(160,86,63,0.25)]',
  },
  neutral: {
    active:   'bg-[#555] text-white border-[#555]',
    inactive: 'bg-[rgba(0,0,0,0.06)] text-[#444] border-[#888] active:bg-[rgba(0,0,0,0.14)]',
  },
}

export function Chip({ label, active = false, color = 'primary', icon, onClick }: ChipProps) {
  const style = active ? colors[color].active : colors[color].inactive
  const Tag = onClick ? 'button' : 'span'

  return (
    <Tag
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${style} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {icon && <span className="text-[10px]">{icon}</span>}
      {label}
    </Tag>
  )
}
