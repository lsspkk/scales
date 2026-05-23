interface TunerControlsProps {
  sensitivity: number
  noiseReduction: number
  filterEnabled: boolean
  onSensitivity: (v: number) => void
  onNoiseReduction: (v: number) => void
  onFilterToggle: () => void
  /** Optional live debug line (Hz / clarity / RMS vs gate). */
  readout?: string
}

/** Detection-tuning controls for the tuner test pages: filter bypass + the two
 *  sensitivity / noise-reduction sliders + an optional live readout. */
export function TunerControls({
  sensitivity,
  noiseReduction,
  filterEnabled,
  onSensitivity,
  onNoiseReduction,
  onFilterToggle,
  readout,
}: TunerControlsProps) {
  return (
    <div className='flex w-full flex-col gap-3 rounded-xl border-2 border-[#8B4513] bg-white p-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-bold text-[#5a2d0c]'>Tunnistus</span>
        <button
          onClick={onFilterToggle}
          aria-label={filterEnabled ? 'Suodatin päällä' : 'Suodatin pois'}
          className={`flex min-h-[40px] items-center gap-2 rounded-xl border-2 px-3 text-sm font-bold ${
            filterEnabled ? 'border-[#5a2d0c] bg-[#5a2d0c] text-white' : 'border-[#8B4513] text-[#8B4513]'
          }`}
        >
          <span aria-hidden>🎚</span>
          Suodatin {filterEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <label className='flex flex-col gap-1 text-sm font-bold text-[#5a2d0c]'>
        Herkkyys
        <input
          type='range'
          min={0}
          max={1}
          step={0.01}
          value={sensitivity}
          disabled={!filterEnabled}
          onChange={(e) => onSensitivity(Number(e.target.value))}
          className='h-11 w-full accent-[#a0563f] disabled:opacity-40'
        />
      </label>

      <label className='flex flex-col gap-1 text-sm font-bold text-[#5a2d0c]'>
        Kohinanvaimennus
        <input
          type='range'
          min={0}
          max={1}
          step={0.01}
          value={noiseReduction}
          disabled={!filterEnabled}
          onChange={(e) => onNoiseReduction(Number(e.target.value))}
          className='h-11 w-full accent-[#a0563f] disabled:opacity-40'
        />
      </label>

      {readout && <p className='font-mono text-xs text-[#8B4513]'>{readout}</p>}
    </div>
  )
}
