import { CALMNESS_MIN, CALMNESS_MAX, DEFAULT_CALMNESS } from '../../stores/tunerStore.ts'

interface SimpleTunerControlsProps {
  /** Current speed step (1..3). */
  calmness: number
  /** Set a new step. */
  onChange: (step: number) => void
  /** Restore the default step. */
  onReset: () => void
}

/**
 * The production tuner's only control: one 3-step "Mittausnopeus" slider. Step 1 is
 * fast/responsive, step 3 is slow/steady; it drives only the smoothing stage and
 * never re-tightens gating, so every step still hears every note. The full
 * four-knob `TunerControls` stays on the hidden test pages. See
 * docs/virittaminen.md for the mapping.
 */
export function SimpleTunerControls({ calmness, onChange, onReset }: SimpleTunerControlsProps) {
  const atDefault = calmness === DEFAULT_CALMNESS
  return (
    <div className='flex w-full max-w-[320px] flex-col gap-2'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-bold text-[#5a2d0c]'>Mittausnopeus</span>
        <button
          onClick={onReset}
          disabled={atDefault}
          className='min-h-[30px] rounded-lg border-2 border-[#8B4513] px-2 text-xs font-bold text-[#8B4513] disabled:opacity-40'
        >
          Oletus
        </button>
      </div>

      <input
        type='range'
        min={CALMNESS_MIN}
        max={CALMNESS_MAX}
        step={1}
        value={calmness}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label='Mittausnopeus'
        list='calmness-ticks'
        className='h-6 w-full accent-[#a0563f]'
      />
      <datalist id='calmness-ticks'>
        {Array.from({ length: CALMNESS_MAX - CALMNESS_MIN + 1 }, (_, i) => CALMNESS_MIN + i).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>

      <div className='flex justify-between text-xs font-bold text-[#8B4513]'>
        <span>Nopea</span>
        <span>Hidas</span>
      </div>
    </div>
  )
}
