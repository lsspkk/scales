/** Large tap-target hub card for the Home screen; navigates to a section on tap. */
interface HomeCardProps {
  icon: React.ReactNode
  label: string
  subtitle?: string
  /** 'brown' (default) for Kirkkosävellajit; 'red' for Harjoittelu. */
  color?: 'brown' | 'red'
  onClick: () => void
}

export function HomeCard({ icon, label, subtitle, color = 'brown', onClick }: HomeCardProps) {
  const brown =
    'bg-gradient-to-br from-[#7a3e10] to-[#5a2d0c] text-[#fffbe9] shadow-[0_4px_16px_rgba(90,45,12,0.45)] active:scale-95 active:shadow-[0_2px_8px_rgba(90,45,12,0.6)]'
  const red =
    'bg-gradient-to-br from-[#c0624a] to-[#8b3a28] text-[#fffbe9] shadow-[0_4px_16px_rgba(160,86,63,0.45)] active:scale-95 active:shadow-[0_2px_8px_rgba(160,86,63,0.6)]'

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 w-full transition-transform duration-100 ${color === 'red' ? red : brown}`}
    >
      <span className="w-12 h-12 flex items-center justify-center">{icon}</span>
      <span className="text-lg font-semibold leading-tight">{label}</span>
      {subtitle && <span className="text-sm opacity-80 font-normal">{subtitle}</span>}
    </button>
  )
}
