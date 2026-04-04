/**
 * Text input field with optional label, helper text, and error state.
 */
import type { InputHTMLAttributes, Ref } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'color'> {
  label?: string
  helperText?: string
  error?: boolean
  ref?: Ref<HTMLInputElement>
}

export function Input({ label, helperText, error = false, className = '', ref, ...props }: InputProps) {
  const ring = error
    ? 'border-red-500 focus:ring-red-400'
    : 'border-[#c4a77d] focus:ring-[#5a2d0c]'

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label className="text-xs font-medium text-[#444]">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full px-3 py-2.5 rounded-xl border bg-white text-sm text-[#333] placeholder:text-[#aaa] focus:outline-none focus:ring-2 transition ${ring} ${className}`}
        {...props}
      />
      {helperText && (
        <span className={`text-xs ${error ? 'text-red-500' : 'text-[#888]'}`}>{helperText}</span>
      )}
    </div>
  )
}
