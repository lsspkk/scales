import { type ScaleDetail } from '../../lib/practiceMethod'

interface ScaleDetailPanelProps {
  detail: ScaleDetail
}

/** Renders detailed practice guidance for a single scale. Used in both desktop side panel and mobile modal. */
export function ScaleDetailPanel({ detail }: ScaleDetailPanelProps) {
  return (
    <div className='space-y-5'>
      {/* Nuotit (Notes) */}
      <section>
        <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Nuotit</h3>
        <p className='text-base font-mono bg-[#f5e9cc] rounded-lg px-3 py-2 text-[#3a1a00]'>{detail.notes.join(' – ')}</p>
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
        <p className='text-base font-mono bg-[#f5e9cc] rounded-lg px-3 py-2 text-[#3a1a00] mb-1'>{detail.arpeggioNotes}</p>
        <p className='text-sm text-[#8B4513]'>{detail.arpeggioDescription}</p>
      </section>
    </div>
  )
}
