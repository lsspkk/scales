/**
 * Styled range slider with optional label and value display.
 * color: 'primary' (brown) | 'secondary' (red)
 */
import type { InputHTMLAttributes, Ref } from 'react'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'color'> {
  label?: string
  showValue?: boolean
  color?: 'primary' | 'secondary'
  ref?: Ref<HTMLInputElement>
}

const accent = {
  primary: 'accent-[#5a2d0c]',
  secondary: 'accent-[#a0563f]',
}

export function Slider({
  label,
  showValue = false,
  color = 'primary',
  className = '',
  ref,
  ...props
}: SliderProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs text-[#555]">
          {label && <span className="font-medium">{label}</span>}
          {showValue && props.value !== undefined && (
            <span className="font-semibold">{props.value}</span>
          )}
        </div>
      )}
      <input
        ref={ref}
        type="range"
        className={`w-full h-2 rounded-full cursor-pointer ${accent[color]} ${className}`}
        {...props}
      />
    </div>
  )
}
