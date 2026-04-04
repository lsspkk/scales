/**
 * Boolean toggle switch with optional label.
 * color: 'primary' (brown) | 'secondary' (red)
 */
interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  color?: 'primary' | 'secondary'
  disabled?: boolean
}

const trackOn = {
  primary: 'bg-[#5a2d0c]',
  secondary: 'bg-[#a0563f]',
}

export function Switch({ checked, onChange, label, color = 'primary', disabled = false }: SwitchProps) {
  return (
    <label className={`inline-flex items-center gap-3 ${disabled ? 'opacity-40 pointer-events-none' : 'cursor-pointer'}`}>
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors ${checked ? trackOn[color] : 'bg-[#ccc]'}`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </div>
      {label && <span className="text-sm text-[#333] select-none">{label}</span>}
    </label>
  )
}
