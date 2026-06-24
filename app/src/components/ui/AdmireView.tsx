import { useState } from 'react'
import { NecklaceCanvas } from './NecklaceCanvas'
import { GemCloseupCanvas } from './GemCloseupCanvas'
import { noteLetter, type NoteScore } from '../../lib/necklaceModels'
import type { NecklaceModel } from '../../lib/necklace'
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
 * The bottom **segmented control** picks the focus: **Kaulakoru** shows the whole
 * necklace with a per-note score strip; **Jalokivet** is a single-gem close-up where
 * the focused stone's note name + scores show in the top bar. In Jalokivet, screen-edge
 * arrows (plus swipe / ← → keys) step between gems and an "n / total" counter sits under
 * the switch. Both segments are always visible so the current view is never ambiguous.
 */
export function AdmireView({ model, scaleNotes, noteScores, title, onClose }: AdmireViewProps) {
  // Whole necklace vs. the close-up single-gem viewer, and which gem it is centred on.
  const [admireView, setAdmireView] = useState<'whole' | 'gems'>('whole')
  // `gemIndex` runs unbounded; the necklace is a circle, so we map it back onto a real
  // socket with modulo and the carousel scrolls eternally in either direction.
  const [gemIndex, setGemIndex] = useState(0)
  const n = model.sockets.length
  const gem = (((gemIndex % n) + n) % n) || 0
  const gemsMode = admireView === 'gems'
  const step = (d: number) => setGemIndex((i) => i + d)

  // Total points = every gem's up (mine) + down (polish) score summed across the run.
  const totalScore = noteScores.reduce((sum, s) => sum + (s.mine ?? 0) + (s.polish ?? 0), 0)

  return (
    <div className='fixed inset-0 z-50 bg-[#05060f]'>
      {gemsMode ? (
        <GemCloseupCanvas model={model} index={gemIndex} onIndexChange={setGemIndex} className='absolute inset-0' />
      ) : (
        <NecklaceCanvas model={model} className='absolute inset-0' />
      )}

      {/* Top bar: back arrow (top-left) + scale name + (Kaulakoru only) the score strip.
          In Jalokivet the title drops ~10vh so it clears the notch / status bar and the
          stones below read clearly. */}
      <div className='pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-safe-top pt-3'>
        <button
          onClick={onClose}
          aria-label='Takaisin'
          className='pointer-events-auto absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/90'
        >
          <svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <line x1='19' y1='12' x2='5' y2='12' />
            <polyline points='12 19 5 12 12 5' />
          </svg>
        </button>
        <p className='text-center font-medieval text-lg text-white'>{title} {totalScore} p</p>
        {gemsMode ? (
          // Focused gem: big note name with its mine:polish score just below it, sitting
          // right under the navbar (gap 2 on mobile, 8 on desktop).
          <div className='mt-2 flex flex-col items-center gap-1 md:mt-8'>
            <span className='text-4xl font-bold leading-none text-white md:text-5xl'>{noteLetter(scaleNotes[gem])}</span>
            <span className='text-base leading-none text-white/60 md:text-lg'>
              {noteScores[gem]?.mine ?? '–'}:{noteScores[gem]?.polish ?? '–'}
            </span>
          </div>
        ) : (
          <div className='mt-2 flex justify-around md:mt-8'>
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

      {/* Bottom controls. In Jalokivet a step-arrow row sits just above the switch,
          arrows pushed to the edges with the gem counter between them; the two-segment
          view switch (both views always visible, active one filled) sits below. Closing
          is the back arrow (top-left) / device back / swipe-back. */}
      <div className='absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 px-4 pb-safe-bottom pb-4'>
        {gemsMode && (
          <div className='flex w-full items-center justify-between'>
            <button
              onClick={() => step(-1)}
              aria-label='Edellinen jalokivi'
              className='flex h-12 w-12 items-center justify-center rounded-lg bg-black/40 text-white'
            >
              <svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <polyline points='15 18 9 12 15 6' />
              </svg>
            </button>
            <span className='text-sm font-semibold tabular-nums text-white/70'>
              {gem + 1} / {n}
            </span>
            <button
              onClick={() => step(1)}
              aria-label='Seuraava jalokivi'
              className='flex h-12 w-12 items-center justify-center rounded-lg bg-black/40 text-white'
            >
              <svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <polyline points='9 18 15 12 9 6' />
              </svg>
            </button>
          </div>
        )}
        <div className='flex rounded-lg bg-white/10 p-1'>
          {(['whole', 'gems'] as const).map((view) => {
            const active = admireView === view
            return (
              <button
                key={view}
                onClick={() => setAdmireView(view)}
                aria-pressed={active}
                className={`min-h-[40px] rounded-md px-5 text-sm font-bold transition-colors ${
                  active ? 'bg-[#9fd0ff] text-[#05060f]' : 'text-white/70'
                }`}
              >
                {view === 'whole' ? 'Kaulakoru' : 'Jalokivet'}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
