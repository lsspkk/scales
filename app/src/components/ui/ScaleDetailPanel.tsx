import { type ScaleDetail } from '../../lib/practiceMethod'
import { MusicCanvas } from './MusicCanvas'

interface ScaleDetailPanelProps {
  detail: ScaleDetail
  /**
   * Pitch-class strings (e.g. "F#", "Bb") to render at 10% opacity in both
   * the scale and arpeggio canvases. Used by the hidden-note challenge from
   * Harjoittelu (Task 26).
   */
  hiddenNotes?: ReadonlyArray<string>
}

/** Renders detailed practice guidance for a single scale. Used in both desktop side panel and mobile modal. */
export function ScaleDetailPanel({ detail, hiddenNotes }: ScaleDetailPanelProps) {
  return (
    <div className='space-y-5'>
      {/* Nuotit (Notes) */}
      <section>
        <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Nuotit</h3>
        <MusicCanvas
          scaleKey={detail.scaleKey}
          mode={detail.scaleMode}
          staves={1}
          hiddenNotes={hiddenNotes}
          className='w-full aspect-[4/1] bg-[#fff3c9]'
        />
        <p className='text-xs text-[#8B4513] mt-1'>{detail.notes.join(' – ')}</p>
        <p className='text-sm text-[#8B4513] mt-1'>
          {detail.octaves} oktaavia, {detail.positionLabel}
        </p>
      </section>

      {/* Asemavaihto (Shift) — only for Level 2+ */}
      {detail.shiftExercise && (
        <section>
          <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Asemavaihto</h3>
          <p className='text-base text-[#3a1a00]'>{detail.shiftExercise}</p>
        </section>
      )}

      {/* Harjoitusrutiini (Practice routine) — only for Level 2+ */}
      {detail.shiftRoutine && (
        <section>
          <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Harjoitusrutiini</h3>
          <ol className='list-decimal list-inside space-y-1 text-base text-[#3a1a00]'>
            {detail.shiftRoutine.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Arpeggio */}
      <section>
        <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Arpeggio</h3>
        <MusicCanvas
          arpeggioNotes={detail.arpeggioNotesWithOctave}
          staves={1}
          hiddenNotes={hiddenNotes}
          className='w-full aspect-[4/1] bg-[#fff3c9]'
        />
        <p className='text-xs text-[#8B4513] mt-1'>{detail.arpeggioNotes}</p>
        <p className='text-xs text-[#8B4513]'>{detail.arpeggioDescription}</p>
      </section>
    </div>
  )
}
