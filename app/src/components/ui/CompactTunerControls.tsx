import { CALMNESS_MIN, CALMNESS_MAX } from '../../stores/tunerStore.ts'

interface CompactTunerControlsProps {
  /** Current speed step (1..3). */
  calmness: number
  /** Set a new step. */
  onChange: (step: number) => void
}

/**
 * Space-saving variant of `SimpleTunerControls`: just the 3-step "Mittausnopeus"
 * slider with no reset button and no wrapper padding, sized to sit beside the
 * listen button in a single row (see Tähtiasteikko). Same step → settings
 * mapping as the full control; only the chrome differs.
 */
export function CompactTunerControls({ calmness, onChange }: CompactTunerControlsProps) {
  return (
    <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
      <span className='text-xs font-bold text-[#5a2d0c]'>Mittausnopeus</span>
      <input
        type='range'
        min={CALMNESS_MIN}
        max={CALMNESS_MAX}
        step={1}
        value={calmness}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label='Mittausnopeus'
        list='calmness-ticks-compact'
        className='h-5 w-full accent-[#a0563f]'
      />
      <datalist id='calmness-ticks-compact'>
        {Array.from({ length: CALMNESS_MAX - CALMNESS_MIN + 1 }, (_, i) => CALMNESS_MIN + i).map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <div className='flex justify-between text-[10px] font-bold text-[#8B4513]'>
        <span>Nopea</span>
        <span>Hidas</span>
      </div>
    </div>
  )
}
