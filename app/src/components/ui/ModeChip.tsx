/** Small chip displaying a mode name with an optional badge for raised/lowered degrees. */
interface ModeChipProps {
  label: string
  /** Short badge text shown beside the label, e.g. '♯4' or '♭7'. */
  badge?: string
}

export function ModeChip({ label, badge }: ModeChipProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#a0563f] bg-[rgba(160,86,63,0.1)] text-[#a0563f] text-xs font-medium">
      {label}
      {badge && (
        <span className="bg-[#a0563f] text-white text-[10px] font-bold rounded-full px-1 leading-tight">
          {badge}
        </span>
      )}
    </span>
  )
}
