/** App bar with a back button, a title, and an optional subtitle. */
interface ScreenHeaderProps {
  title: string
  subtitle?: string
  onBack: () => void
  /** 'brown' (default) for Kirkkosävellajit; 'red' for Harjoittelu. */
  color?: 'brown' | 'red'
}

export function ScreenHeader({ title, subtitle, onBack, color = 'brown' }: ScreenHeaderProps) {
  const bg = color === 'red' ? 'bg-[#a0563f]' : 'bg-[#5a2d0c]'

  return (
    <div className={`flex items-center gap-1 px-2 ${bg} text-white flex-shrink-0 min-h-[52px]`}>
      <button
        onClick={onBack}
        className="flex items-center justify-center w-11 h-11 bg-transparent border-none cursor-pointer flex-shrink-0"
        aria-label="Takaisin"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div className="flex flex-col">
        <span className="font-medieval text-lg leading-tight">{title}</span>
        {subtitle && <span className="text-xs opacity-80">{subtitle}</span>}
      </div>
    </div>
  )
}
