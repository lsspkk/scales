import { SMOOTHING_FRAMES_MAX, CONFIRM_FRAMES_MAX } from '../../lib/audio/tuner.ts'

interface TunerControlsProps {
  sensitivity: number
  clarityThreshold: number
  filterEnabled: boolean
  /** Median window length over cents readings (Task 28 stability). */
  smoothingFrames: number
  /** Frames a new note must persist before its label commits (Task 28 stability). */
  confirmFrames: number
  onSensitivity: (v: number) => void
  onClarityThreshold: (v: number) => void
  onFilterToggle: () => void
  onSmoothingFrames: (v: number) => void
  onConfirmFrames: (v: number) => void
  /** Optional live debug line — should lead with clarity. */
  readout?: string
}

/** Detection-tuning controls for the tuner test pages. Sensitivity (the volume
 *  gate) is the primary knob; clarity threshold and the two stability sliders
 *  (cents smoothing + note-confirm hysteresis) are secondary, for finding the
 *  defaults empirically. Filter OFF shows the raw detector output. The
 *  control/state shapes are reusable for the production tuner menu (Task 29). */
export function TunerControls({
  sensitivity,
  clarityThreshold,
  filterEnabled,
  smoothingFrames,
  confirmFrames,
  onSensitivity,
  onClarityThreshold,
  onFilterToggle,
  onSmoothingFrames,
  onConfirmFrames,
  readout,
}: TunerControlsProps) {
  const slider = 'h-6 w-full accent-[#a0563f] disabled:opacity-40'
  const cap = 'flex flex-col text-xs font-bold text-[#8B4513]'
  return (
    <div className='flex w-full flex-col gap-2 rounded-xl border-2 border-[#8B4513] bg-white p-2'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-bold text-[#5a2d0c]'>Tunnistus</span>
        <button
          onClick={onFilterToggle}
          aria-label={filterEnabled ? 'Suodatin päällä' : 'Suodatin pois'}
          className={`flex min-h-[30px] items-center gap-1 rounded-lg border-2 px-2 text-xs font-bold ${
            filterEnabled ? 'border-[#5a2d0c] bg-[#5a2d0c] text-white' : 'border-[#8B4513] text-[#8B4513]'
          }`}
        >
          <span aria-hidden>🎚</span>
          Suodatin {filterEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* 2×2 grid keeps the four detection knobs to ~half the vertical space. */}
      <div className='grid grid-cols-2 gap-x-3 gap-y-1'>
        <label className={`${cap} text-[#5a2d0c]`}>
          Herkkyys
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={sensitivity}
            disabled={!filterEnabled}
            onChange={(e) => onSensitivity(Number(e.target.value))}
            className={slider}
          />
        </label>

        <label className={cap}>
          Selkeys {clarityThreshold.toFixed(2)}
          <input
            type='range'
            min={0.5}
            max={1}
            step={0.01}
            value={clarityThreshold}
            disabled={!filterEnabled}
            onChange={(e) => onClarityThreshold(Number(e.target.value))}
            className={slider}
          />
        </label>

        <label className={cap}>
          Tasaus {smoothingFrames}
          <input
            type='range'
            min={1}
            max={SMOOTHING_FRAMES_MAX}
            step={1}
            value={smoothingFrames}
            disabled={!filterEnabled}
            onChange={(e) => onSmoothingFrames(Number(e.target.value))}
            className={slider}
          />
        </label>

        <label className={cap}>
          Varmistus {confirmFrames}
          <input
            type='range'
            min={1}
            max={CONFIRM_FRAMES_MAX}
            step={1}
            value={confirmFrames}
            disabled={!filterEnabled}
            onChange={(e) => onConfirmFrames(Number(e.target.value))}
            className={slider}
          />
        </label>
      </div>

      {readout && <p className='font-mono text-[10px] leading-tight text-[#8B4513]'>{readout}</p>}
    </div>
  )
}
