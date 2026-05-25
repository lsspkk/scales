import { SMOOTHING_FRAMES_MAX, CONFIRM_FRAMES_MAX } from '../../lib/audio/tuner.ts'
import type { TunerSettings } from '../../lib/audio/tuner.ts'

interface TunerControlsProps {
  /** The full settings object — fields are documented on TunerSettings. */
  settings: TunerSettings
  /** Apply a partial update, e.g. onChange({ sensitivity: 0.6 }). */
  onChange: (patch: Partial<TunerSettings>) => void
  /** Optional live debug line — should lead with clarity. */
  readout?: string
}

/** Detection-tuning controls for the tuner test pages. Sensitivity (the volume
 *  gate) is the primary knob; clarity threshold and the two stability sliders
 *  (cents smoothing + note-confirm hysteresis) are secondary, for finding the
 *  defaults empirically. Filter OFF shows the raw detector output. The
 *  control/state shapes are reusable for the production tuner menu (Task 29). */
export function TunerControls({ settings, onChange, readout }: TunerControlsProps) {
  const { sensitivity, clarityThreshold, filterEnabled, smoothingFrames, confirmFrames } = settings
  const slider = 'h-6 w-full accent-[#a0563f] disabled:opacity-40'
  const cap = 'flex flex-col text-xs font-bold text-[#8B4513]'
  return (
    <div className='flex w-full flex-col gap-2 rounded-xl border-2 border-[#8B4513] bg-white p-2'>
      <div className='flex items-center justify-between'>
        <span className='text-xs font-bold text-[#5a2d0c]'>Detection</span>
        <button
          onClick={() => onChange({ filterEnabled: !filterEnabled })}
          aria-label={filterEnabled ? 'Filter on' : 'Filter off'}
          className={`flex min-h-[30px] items-center gap-1 rounded-lg border-2 px-2 text-xs font-bold ${
            filterEnabled ? 'border-[#5a2d0c] bg-[#5a2d0c] text-white' : 'border-[#8B4513] text-[#8B4513]'
          }`}
        >
          <span aria-hidden>🎚</span>
          Filter {filterEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* One slider per row, full width: each is easy to drag and shows its value. */}
      <div className='flex flex-col gap-2'>
        <label className={`${cap} text-[#5a2d0c]`}>
          <span className='flex justify-between'>
            <span>Sensitivity</span>
            <span>{sensitivity.toFixed(2)}</span>
          </span>
          <input
            type='range'
            min={0}
            max={1}
            step={0.01}
            value={sensitivity}
            disabled={!filterEnabled}
            onChange={(e) => onChange({ sensitivity: Number(e.target.value) })}
            className={slider}
          />
        </label>

        <label className={cap}>
          <span className='flex justify-between'>
            <span>Clarity</span>
            <span>{clarityThreshold.toFixed(2)}</span>
          </span>
          <input
            type='range'
            min={0.5}
            max={1}
            step={0.01}
            value={clarityThreshold}
            disabled={!filterEnabled}
            onChange={(e) => onChange({ clarityThreshold: Number(e.target.value) })}
            className={slider}
          />
        </label>

        <label className={cap}>
          <span className='flex justify-between'>
            <span>Smoothing</span>
            <span>{smoothingFrames}</span>
          </span>
          <input
            type='range'
            min={1}
            max={SMOOTHING_FRAMES_MAX}
            step={1}
            value={smoothingFrames}
            disabled={!filterEnabled}
            onChange={(e) => onChange({ smoothingFrames: Number(e.target.value) })}
            className={slider}
          />
        </label>

        <label className={cap}>
          <span className='flex justify-between'>
            <span>Confirm</span>
            <span>{confirmFrames}</span>
          </span>
          <input
            type='range'
            min={1}
            max={CONFIRM_FRAMES_MAX}
            step={1}
            value={confirmFrames}
            disabled={!filterEnabled}
            onChange={(e) => onChange({ confirmFrames: Number(e.target.value) })}
            className={slider}
          />
        </label>
      </div>

      {/* What each slider + the filter toggle does. */}
      <div className='rounded-lg border-2 border-[#e3d1ad] bg-[#fffbe9] px-2 py-1'>
        <span className='text-[10px] font-bold text-[#7c6fd6]'>Info</span>
        <ul className='flex list-none flex-col gap-0.5 text-xs leading-snug text-[#5a2d0c]'>
          <li>
            <b>Sensitivity</b> – higher picks up quieter notes.
          </li>
          <li>
            <b>Clarity</b> – how clean the tone must be to register; higher rejects more noise.
          </li>
          <li>
            <b>Smoothing</b> – frequency stability: median window over cents; higher = calmer, steadier needle.
          </li>
          <li>
            <b>Confirm</b> – note stability: frames a new note must hold before its name switches; higher = steadier.
          </li>
        </ul>
      </div>

      {readout && (
        <div className='rounded-lg border-2 border-[#e3d1ad] bg-[#fffbe9] px-2 py-1'>
          <span className='text-[10px] font-bold text-[#7c6fd6]'>Live</span>
          <p className='font-mono text-[11px] leading-snug text-[#5a2d0c]'>{readout}</p>
        </div>
      )}
    </div>
  )
}
