/*
 * DEBUG / TEST ROUTE
 * Hidden test page for the scale-playing tuner game. Reach via
 * #/test/scaletuner (also linked from #/test). Draws the current scale and
 * listens via the mic: hold the highlighted target note in tune long enough and
 * it advances. Play up to the top note, the top note twice (the canvas flips to
 * descending), then back down to the bottom — that's one run. Each completed run
 * launches flying stars (run N → N stars). Ten runs → a congrats overlay and a
 * fresh random scale. Rolling the root/mode resets the star counter. Uses the
 * key/mode currently stored by the rest of the app.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMusicStore } from '../stores/musicStore.ts'
import { useMicPitch } from '../hooks/useMicPitch.ts'
import { DEFAULT_TUNER_SETTINGS } from '../lib/audio/tuner.ts'
import type { TunerSettings } from '../lib/audio/tuner.ts'
import { TunerDial } from '../components/ui/TunerDial.tsx'
import { TunerControls } from '../components/ui/TunerControls.tsx'
import { MusicCanvas } from '../components/ui/MusicCanvas.tsx'
import { FlyingStar } from '../components/ui/FlyingStar.tsx'
import { getScale, getKeyList, getModeList } from '../lib/musicScale.ts'
import { assignAscendingOctaves, SCALE_START_OCTAVE, formatNoteSPN, formatNoteFi } from '../lib/noteOctave.ts'
import { noteNameToMidi } from '../lib/audio/tuning.ts'

const HIGHLIGHT_COLOR = '#a0069f'
const BASIC_NOTE_COLOR = '#aaaaaa'
const MAX_STARS = 10

const ACCURACY_OPTIONS = [
  { label: 'Helppo', cents: 35 },
  { label: 'Keski', cents: 20 },
  { label: 'Tarkka', cents: 10 },
]

type Phase = 'ascending' | 'descending'
interface Star {
  id: number
  left: number // viewport-width % where the star starts
  delay: number // ms stagger so a burst doesn't move as one block
}

/** Pitch class (0–11) of a note string like "Bb4", tolerant of bad input. */
function pitchClassOf(spn: string): number | null {
  try {
    return ((noteNameToMidi(spn) % 12) + 12) % 12
  } catch {
    return null
  }
}

/** Readable scale name, e.g. "C-duuri" / "D-dorian". */
function scaleDisplayName(key: string, mode: string): string {
  const paren = mode.match(/\(([^)]+)\)/)
  const name = (paren ? paren[1] : mode.split(' ')[0]).toLowerCase()
  return `${key}-${name}`
}

export function ScaleTunerTest() {
  const scaleKey = useMusicStore((s) => s.key)
  const mode = useMusicStore((s) => s.mode)
  const setKey = useMusicStore((s) => s.setKey)
  const setMode = useMusicStore((s) => s.setMode)

  const [accuracyCents, setAccuracyCents] = useState(20)
  const [holdSeconds, setHoldSeconds] = useState(0.5)
  const [phase, setPhase] = useState<Phase>('ascending')
  const [targetIndex, setTargetIndex] = useState(0)
  const [holdProgress, setHoldProgress] = useState(0)
  const [settings, setSettings] = useState<TunerSettings>(DEFAULT_TUNER_SETTINGS)
  const [starCount, setStarCount] = useState(0)
  const [stars, setStars] = useState<Star[]>([])
  const [showCongrats, setShowCongrats] = useState(false)
  const holdStartRef = useRef<number | null>(null)
  // Mirror of starCount, read in completeRun so it isn't a stale closure and we
  // don't have to do side effects inside a setState updater (StrictMode-safe).
  const starCountRef = useRef(0)
  // True from the 10th run until the congrats overlay is dismissed — freezes
  // advancement during the ~1 s the final star burst is still flying.
  const celebratingRef = useRef(false)

  const pitch = useMicPitch(settings)

  // Ascending scale notes (8 entries; last is the octave repeat of the root).
  const scaleNotes = useMemo(() => {
    const scale = getScale(scaleKey, mode)
    const rootLetter = scaleKey.replace(/[#b].*$/, '')
    const startOctave = SCALE_START_OCTAVE[scaleKey] ?? SCALE_START_OCTAVE[rootLetter] ?? 4
    return assignAscendingOctaves(scale, startOctave)
  }, [scaleKey, mode])
  const top = scaleNotes.length - 1

  const target = scaleNotes[Math.min(targetIndex, top)]
  const targetKey = `${target.letter}${target.accidental ?? ''}`
  const targetPc = useMemo(() => pitchClassOf(formatNoteSPN(target)), [target])

  const detectedPc = pitch.midi == null ? null : ((pitch.midi % 12) + 12) % 12
  const matchesTarget = detectedPc !== null && detectedPc === targetPc
  const inTune = matchesTarget && pitch.cents != null && Math.abs(pitch.cents) <= accuracyCents

  // Launch `n` stars flying up; each removes itself after its flight ends.
  const launchStars = useCallback((n: number) => {
    const base = Date.now()
    const fresh: Star[] = Array.from({ length: n }, (_, i) => ({
      id: base + i,
      left: 8 + Math.random() * 84,
      delay: Math.round(Math.random() * 250),
    }))
    setStars((prev) => [...prev, ...fresh])
    fresh.forEach((s) =>
      window.setTimeout(() => setStars((prev) => prev.filter((x) => x.id !== s.id)), 1000 + s.delay + 60),
    )
  }, [])

  // One full up-and-down run finished: count it, launch that many stars, and at
  // the cap freeze the game and show the congrats overlay once the stars have flown.
  const completeRun = useCallback(() => {
    const next = Math.min(starCountRef.current + 1, MAX_STARS)
    starCountRef.current = next
    setStarCount(next)
    launchStars(next)
    if (next >= MAX_STARS) {
      celebratingRef.current = true
      window.setTimeout(() => setShowCongrats(true), 1100)
    }
  }, [launchStars])

  // Step to the next target: up to the top, the top note again (canvas flips to
  // descending), then back down. Reaching the bottom completes a run.
  const advance = useCallback(() => {
    if (top <= 0) return
    if (phase === 'ascending') {
      if (targetIndex < top) setTargetIndex(targetIndex + 1)
      else setPhase('descending') // top reached — play it again on the way down
    } else {
      if (targetIndex > 0) setTargetIndex(targetIndex - 1)
      else {
        completeRun()
        setPhase('ascending')
        setTargetIndex(0)
      }
    }
  }, [phase, targetIndex, top, completeRun])

  // Back to the first note, ascending, hold timer cleared.
  const resetProgress = useCallback(() => {
    setPhase('ascending')
    setTargetIndex(0)
    setHoldProgress(0)
    holdStartRef.current = null
  }, [])

  // Full reset: progress + star counter + any flying stars + overlay.
  const resetGame = useCallback(() => {
    resetProgress()
    setStarCount(0)
    starCountRef.current = 0
    setStars([])
    setShowCongrats(false)
    celebratingRef.current = false
  }, [resetProgress])

  // Roll a random root / mode (avoid repeating the current one so a roll always
  // visibly changes the drawn scale). Changing the scale resets the star count.
  const rollRoot = useCallback(() => {
    const keys = getKeyList()
    let next = keys[Math.floor(Math.random() * keys.length)]
    if (keys.length > 1 && next === scaleKey) next = keys[(keys.indexOf(next) + 1) % keys.length]
    setKey(next)
    resetGame()
  }, [scaleKey, setKey, resetGame])

  const rollScale = useCallback(() => {
    const modes = getModeList()
    let next = modes[Math.floor(Math.random() * modes.length)]
    if (modes.length > 1 && next === mode) next = modes[(modes.indexOf(next) + 1) % modes.length]
    setMode(next)
    resetGame()
  }, [mode, setMode, resetGame])

  // Congrats → roll a fresh scale + mode (each roll resets the game, incl. counter).
  const continueAfterCongrats = useCallback(() => {
    rollRoot()
    rollScale()
  }, [rollRoot, rollScale])

  // Auto-dismiss the congrats overlay after a few seconds (tap also dismisses).
  useEffect(() => {
    if (!showCongrats) return
    const t = window.setTimeout(continueAfterCongrats, 3500)
    return () => window.clearTimeout(t)
  }, [showCongrats, continueAfterCongrats])

  // Hold timer: while the right note stays in tune, fill the progress bar; when
  // it tops out, advance. Frozen while celebrating / the overlay is up.
  useEffect(() => {
    if (!pitch.listening || !inTune || showCongrats || celebratingRef.current) {
      holdStartRef.current = null
      setHoldProgress(0)
      return
    }
    if (holdStartRef.current == null) holdStartRef.current = performance.now()
    const elapsed = performance.now() - holdStartRef.current
    const p = Math.min(1, elapsed / (holdSeconds * 1000))
    setHoldProgress(p)
    if (p >= 1) {
      holdStartRef.current = null
      setHoldProgress(0)
      advance()
    }
  }, [inTune, pitch.cents, pitch.midi, pitch.listening, holdSeconds, advance, showCongrats])

  const rollBtn =
    'flex min-h-[30px] shrink-0 items-center gap-1 rounded-lg border-2 border-[#8B4513] px-2 text-xs font-bold text-[#5a2d0c]'

  return (
    <div className='flex min-h-screen flex-col items-center bg-[#fffbe9] p-2'>
      <div className='flex w-full max-w-[420px] flex-col gap-2'>
        {/* header: rolls + scale name + back, all on one row */}
        <div className='flex items-center gap-1'>
          <button onClick={rollRoot} aria-label='Arvo uusi pohjasävel' className={rollBtn}>
            <span aria-hidden>🎲</span> Sävel
          </button>
          <button onClick={rollScale} aria-label='Arvo uusi asteikko' className={rollBtn}>
            <span aria-hidden>🎲</span> Asteikko
          </button>
          <span className='flex-1 truncate text-center text-xs font-bold text-[#5a2d0c]'>
            {scaleDisplayName(scaleKey, mode)}
          </span>
          <Link
            to='/test'
            aria-label='Takaisin testisivuille'
            className='flex min-h-[30px] shrink-0 items-center rounded-lg border-2 border-[#5a2d0c] px-2 text-xs font-bold text-[#5a2d0c]'
          >
            ←
          </Link>
        </div>

        {/* star progress: filled = runs completed this scale */}
        <p className='text-center text-sm font-bold text-[#a0563f]' aria-label={`${starCount} / ${MAX_STARS} tähteä`}>
          {'★'.repeat(starCount)}
          <span className='text-[#e3d1ad]'>{'★'.repeat(MAX_STARS - starCount)}</span>
        </p>

        <MusicCanvas
          scaleKey={scaleKey}
          mode={mode}
          staves={1}
          scaleDirection={phase}
          highlightNotes={[targetKey]}
          highlightColor={HIGHLIGHT_COLOR}
          basicNoteColor={BASIC_NOTE_COLOR}
          className='w-full aspect-[5/2] rounded-lg border-2 border-[#8B4513] bg-white'
        />

        {/* target note + direction arrow, one line above the dial */}
        <p className='text-center text-xs text-[#5a2d0c]'>
          Soita <span aria-hidden>{phase === 'ascending' ? '↑' : '↓'}</span>{' '}
          <span className='text-lg font-bold text-[#a0563f]'>
            {target.letter}
            {target.accidental ?? ''}
          </span>{' '}
          <span className='text-[10px] text-[#8B4513]'>({formatNoteFi(target)})</span>
        </p>

        <div className='flex justify-center'>
          <TunerDial noteName={pitch.noteName} cents={pitch.cents} accuracyCents={accuracyCents} inTune={inTune} />
        </div>

        {/* hold progress */}
        <div className='h-2 w-full overflow-hidden rounded-full bg-[#f0dbb8]'>
          <div
            className='h-full rounded-full bg-[#7c6fd6] transition-[width] duration-100'
            style={{ width: `${Math.round(holdProgress * 100)}%` }}
          />
        </div>

        {/* accuracy presets */}
        <div className='flex gap-1'>
          {ACCURACY_OPTIONS.map((opt) => (
            <button
              key={opt.cents}
              onClick={() => setAccuracyCents(opt.cents)}
              className={`min-h-[32px] flex-1 rounded-lg px-1 text-xs font-bold ${
                accuracyCents === opt.cents ? 'bg-[#5a2d0c] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
              }`}
            >
              {opt.label} ±{opt.cents}¢
            </button>
          ))}
        </div>

        {/* hold time — label + slider on one row */}
        <label className='flex items-center gap-2 text-xs font-bold text-[#5a2d0c]'>
          <span className='shrink-0'>Kesto {holdSeconds.toFixed(1)} s</span>
          <input
            type='range'
            min={0.2}
            max={2}
            step={0.1}
            value={holdSeconds}
            onChange={(e) => setHoldSeconds(Number(e.target.value))}
            className='h-6 flex-1 accent-[#a0563f]'
          />
        </label>

        {pitch.error && <p className='text-center text-xs text-red-700'>{pitch.error}</p>}

        <button
          onClick={() => (pitch.listening ? pitch.stop() : void pitch.start())}
          className={`min-h-[40px] rounded-lg px-4 text-sm font-bold text-white ${
            pitch.listening ? 'bg-[#a0563f]' : 'bg-[#5a2d0c]'
          }`}
        >
          {pitch.listening ? 'Lopeta' : 'Aloita kuuntelu'}
        </button>

        <TunerControls
          settings={settings}
          onChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          readout={[
            `clarity ${pitch.clarity.toFixed(2)}`,
            pitch.hz != null
              ? `${pitch.hz.toFixed(1)} Hz`
              : `RMS ${pitch.rms.toFixed(3)} / portti ${pitch.gate.toFixed(3)}`,
            pitch.rawCents != null && pitch.cents != null
              ? `raaka ${pitch.rawCents > 0 ? '+' : ''}${pitch.rawCents}¢→tasattu ${pitch.cents > 0 ? '+' : ''}${pitch.cents}¢`
              : null,
            pitch.held ? 'pidossa' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
      </div>

      {/* Flying-star celebration layer (above the page, ignores clicks). */}
      <div className='pointer-events-none fixed inset-0 z-40 overflow-hidden'>
        {stars.map((s) => (
          <span key={s.id} className='star-fly' style={{ left: `${s.left}%`, animationDelay: `${s.delay}ms` }}>
            <FlyingStar size={28} />
          </span>
        ))}
      </div>

      {/* Congratulations overlay after MAX_STARS runs. Tap (or wait) → new scale. */}
      {showCongrats && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6'
          onClick={continueAfterCongrats}
        >
          <div className='flex flex-col items-center gap-2 rounded-2xl border-4 border-[#ffcf33] bg-[#fffbe9] px-8 py-8 text-center shadow-xl'>
            <div className='text-5xl' aria-hidden>
              🌟
            </div>
            <h2 className='text-2xl font-bold text-[#5a2d0c]'>Onnittelut</h2>
            <p className='text-base font-bold text-[#a0563f]'>Hienosti soitettu.</p>
            <p className='text-sm text-[#8B4513]'>Vaihdetaan asteikko…</p>
          </div>
        </div>
      )}
    </div>
  )
}
