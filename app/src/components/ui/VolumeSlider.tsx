/**
 * YouTube-style volume control: speaker icon (tap to mute/unmute) + thin
 * horizontal track with a filled portion. Owns no audio state — emits 0..1
 * via `onChange`. The parent decides what to do with the value.
 */
import { useRef, type ChangeEvent } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

interface VolumeSliderProps {
  /** Current volume, 0..1. */
  value: number
  /** Called with the new 0..1 value on every drag tick or mute toggle. */
  onChange: (value: number) => void
  className?: string
}

export function VolumeSlider({ value, onChange, className = '' }: VolumeSliderProps) {
  const lastNonZero = useRef(value > 0 ? value : 0.6)
  if (value > 0 && value !== lastNonZero.current) {
    lastNonZero.current = value
  }
  const muted = value === 0
  const percent = Math.round(value * 100)

  const handleSlider = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value) / 100)
  }

  const toggleMute = () => {
    onChange(muted ? lastNonZero.current : 0)
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type='button'
        onClick={toggleMute}
        className='w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white hover:bg-white/15 active:bg-white/25 focus:outline focus:outline-2 focus:outline-[#fffbe9]'
        aria-label={muted ? 'Avaa ääni' : 'Mykistä'}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
      <input
        type='range'
        min={0}
        max={100}
        value={percent}
        onChange={handleSlider}
        className='flex-1 min-w-[60px] h-1.5 accent-white cursor-pointer'
        aria-label='Äänenvoimakkuus'
      />
    </div>
  )
}
