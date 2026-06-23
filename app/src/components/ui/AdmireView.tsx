import { useMemo, useState } from 'react'
import { NecklaceCanvas } from './NecklaceCanvas'
import { GemCloseupCanvas } from './GemCloseupCanvas'
import { noteLetter, type NoteScore } from '../../lib/necklaceModels'
import type { NecklaceModel, CloseupLabel } from '../../lib/necklace'
import type { NoteWithOctave } from '../../lib/noteOctave'

interface AdmireViewProps {
  /** The finished necklace to admire. */
  model: NecklaceModel
  /** Scale notes, in socket order — drives the per-note score strip. */
  scaleNotes: NoteWithOctave[]
  /** Per-note set/polish levels, in socket order. */
  noteScores: NoteScore[]
  /** Heading shown across the top (e.g. "C-duuri"). */
  title: string
  /** Leave the admire view. */
  onClose: () => void
}

/**
 * Full-screen close-up of a finished necklace, shared by the game and its test screen.
 * The centre button is a focus **mode switch** (changing label): in **Kaulakoru** it
 * shows the whole necklace with a per-note score strip; tapping it switches to
 * **Jalokivet**, a single-gem close-up where each stone is captioned with its note
 * name + scores on the canvas, and the prev/next arrows (only enabled here) plus
 * swipe / ← → keys step between gems.
 */
export function AdmireView({ model, scaleNotes, noteScores, title, onClose }: AdmireViewProps) {
  // Whole necklace vs. the close-up single-gem viewer, and which gem it is centred on.
  const [admireView, setAdmireView] = useState<'whole' | 'gems'>('whole')
  const [gemIndex, setGemIndex] = useState(0)
  const lastGem = model.sockets.length - 1
  const gemsMode = admireView === 'gems'
  // Step between gems (only meaningful in the close-up; arrows are disabled otherwise).
  const step = (d: number) => setGemIndex((i) => Math.max(0, Math.min(lastGem, i + d)))

  // Per-gem captions for the close-up: note name + "mine:polish" scores.
  const labels = useMemo<CloseupLabel[]>(
    () =>
      scaleNotes.map((note, i) => ({
        note: noteLetter(note),
        sub: `${noteScores[i]?.mine ?? '–'}:${noteScores[i]?.polish ?? '–'}`,
      })),
    [scaleNotes, noteScores],
  )

  return (
    <div className='fixed inset-0 z-50 bg-[#05060f]'>
      {gemsMode ? (
        <GemCloseupCanvas model={model} index={gemIndex} onIndexChange={setGemIndex} labels={labels} className='absolute inset-0' />
      ) : (
        <NecklaceCanvas model={model} className='absolute inset-0' />
      )}

      {/* Top bar: close (X, top-right) + scale name + (Kaulakoru only) the score strip.
          In Jalokivet the title drops ~10vh so it clears the notch / status bar and the
          stones below read clearly. */}
      <div className='pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-safe-top pt-3'>
        <button
          onClick={onClose}
          aria-label='Sulje'
          className='pointer-events-auto absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/90'
        >
          <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <line x1='18' y1='6' x2='6' y2='18' />
            <line x1='6' y1='6' x2='18' y2='18' />
          </svg>
        </button>
        <p className={`text-center font-medieval text-lg text-white ${gemsMode ? 'mt-[10vh]' : ''}`}>{title}</p>
        {!gemsMode && (
          <div className='mt-2 flex justify-around'>
            {scaleNotes.map((note, i) => (
              <div key={i} className='flex flex-col items-center gap-0.5'>
                <span className='text-[11px] font-semibold leading-none text-white'>{noteLetter(note)}</span>
                <span className='text-[9px] leading-none text-white/55'>
                  {noteScores[i]?.mine ?? '–'}:{noteScores[i]?.polish ?? '–'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls: prev/next arrows (enabled only in Jalokivet) flanking the focus
          mode-switch button. Closing is the X (top-right) / device back / swipe-back. */}
      <div className='absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-safe-bottom pb-4'>
        <div className='flex items-center justify-center gap-2'>
          <button
            onClick={() => step(-1)}
            disabled={!gemsMode || gemIndex <= 0}
            aria-label='Edellinen jalokivi'
            className='flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white disabled:opacity-25'
          >
            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <polyline points='15 18 9 12 15 6' />
            </svg>
          </button>

          <button
            onClick={() => setAdmireView(gemsMode ? 'whole' : 'gems')}
            className='min-h-[44px] rounded-xl bg-[#9fd0ff] px-5 text-sm font-bold text-[#05060f]'
          >
            {gemsMode ? 'Kaulakoru' : 'Jalokivet'}
          </button>

          <button
            onClick={() => step(1)}
            disabled={!gemsMode || gemIndex >= lastGem}
            aria-label='Seuraava jalokivi'
            className='flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white disabled:opacity-25'
          >
            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <polyline points='9 18 15 12 9 6' />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
