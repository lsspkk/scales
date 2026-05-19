/*
 * DEBUG / TEST ROUTE
 * Hidden test page for the polyphonic sample-based audio engine (Task 24).
 * Reach via #/test/audio (also linked from #/test). Lets a developer pick
 * a sample, a chord root, and a chord type, then play / stop the chord.
 * Utilitarian — no design polish.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CHORD_TYPES } from '../lib/audio/chords.ts'
import { SAMPLES } from '../lib/audio/samples.ts'
import { playChord, stopAll } from '../lib/audio/audioService.ts'
import { midiToNoteName, noteNameToMidi } from '../lib/audio/tuning.ts'
import { useAudio } from '../hooks/useAudio.ts'

const ROOT_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
const ROOT_OCTAVE = 4

/*
 * Minimal Web Audio playback path — kept here, in the test screen, so it can
 * be compared side-by-side with the full `audioService`. Same building
 * blocks (AudioContext + BufferSource), but stripped of the cache, gain
 * envelope, pitch shift, and lifecycle bookkeeping. If both buttons sound
 * the same, the engine's added machinery is behaving; if only the minimal
 * version works, the difference points at the engine.
 */
let minimalCtx: AudioContext | null = null
let minimalSource: AudioBufferSourceNode | null = null

async function playSampleMinimal(src: string): Promise<void> {
  if (minimalCtx === null) minimalCtx = new AudioContext()
  if (minimalCtx.state === 'suspended') await minimalCtx.resume()
  const arr = await fetch(src).then((res) => res.arrayBuffer())
  const buf = await minimalCtx.decodeAudioData(arr)
  minimalSource?.stop()
  minimalSource = minimalCtx.createBufferSource()
  minimalSource.buffer = buf
  minimalSource.connect(minimalCtx.destination)
  minimalSource.start()
}

function stopSampleMinimal(): void {
  minimalSource?.stop()
  minimalSource = null
}

export function AudioTest() {
  const { play, stop } = useAudio()
  const [sampleId, setSampleId] = useState<string>(SAMPLES[0].id)
  const [rootName, setRootName] = useState<string>('C')
  const [activeChordId, setActiveChordId] = useState<string | null>(null)

  const rootMidi = useMemo(() => noteNameToMidi(`${rootName}${ROOT_OCTAVE}`), [rootName])

  const activeChord = activeChordId ? CHORD_TYPES.find((c) => c.id === activeChordId) ?? null : null

  const playingNotes = useMemo(() => {
    if (!activeChord) return ''
    return activeChord.intervals.map((iv) => midiToNoteName(rootMidi + iv)).join(' ')
  }, [activeChord, rootMidi])

  const handleChord = (chordId: string) => {
    const chord = CHORD_TYPES.find((c) => c.id === chordId)
    if (!chord) return
    play({ sampleId, rootMidi, intervals: chord.intervals })
    setActiveChordId(chordId)
  }

  const handleStop = () => {
    stop()
    stopSampleMinimal()
    setActiveChordId(null)
  }

  /** Play one sample at its recorded pitch through the full engine — no chord, no pitch shift. */
  const handlePlaySampleEngine = (id: string) => {
    const sample = SAMPLES.find((s) => s.id === id)
    if (!sample) return
    void playChord({ sampleId: id, rootMidi: sample.rootMidi, intervals: [0] })
    setActiveChordId(null)
  }

  const handlePlaySampleMinimal = (src: string) => {
    stopAll() // make sure the engine doesn't keep playing in parallel
    setActiveChordId(null)
    void playSampleMinimal(src)
  }

  return (
    <div className='min-h-screen bg-[#fffbe9] p-4 flex flex-col items-center gap-5'>
      <Link
        to='/test'
        className='flex min-h-[44px] items-center self-start rounded-xl border-2 border-[#5a2d0c] px-3 py-2 text-sm font-bold text-[#5a2d0c]'
      >
        ← Testisivut
      </Link>

      <div className='w-full max-w-[640px] flex flex-col gap-5'>
        <h1 className='text-[#5a2d0c] text-lg font-bold'>Äänimoottorin testi</h1>

        <section className='flex flex-col gap-2'>
          <h2 className='text-sm font-bold text-[#5a2d0c]'>Sample</h2>
          <div className='flex flex-wrap gap-2'>
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSampleId(s.id)}
                className={`min-h-[44px] rounded-lg px-3 text-sm font-bold ${
                  sampleId === s.id ? 'bg-[#5a2d0c] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-sm font-bold text-[#5a2d0c]'>Soita näyte suoraan</h2>
          <p className='text-xs text-[#8B4513]'>
            Vertailu: täysi moottori (envelope, cache, pitch-shift voimassa pohjasäveleen) vs. minimaalinen Web
            Audio -polku (fetch → decode → BufferSource → destination). Soittaa aina näytteen alkuperäisellä
            sävelkorkeudella.
          </p>
          <div className='flex flex-col gap-2'>
            {SAMPLES.map((s) => (
              <div key={s.id} className='flex items-center gap-2'>
                <span className='flex-1 text-sm text-[#5a2d0c]'>{s.label}</span>
                <button
                  onClick={() => handlePlaySampleEngine(s.id)}
                  className='min-h-[44px] rounded-lg px-3 bg-[#5a2d0c] text-white text-sm font-bold'
                >
                  Engine
                </button>
                <button
                  onClick={() => handlePlaySampleMinimal(s.src)}
                  className='min-h-[44px] rounded-lg px-3 bg-[#8B4513] text-white text-sm font-bold'
                >
                  Yksinkertainen
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-sm font-bold text-[#5a2d0c]'>Soinnun pohjasävel</h2>
          <div className='flex flex-wrap gap-2'>
            {ROOT_NOTE_NAMES.map((n) => (
              <button
                key={n}
                onClick={() => setRootName(n)}
                className={`min-w-[44px] min-h-[44px] rounded-lg px-2 text-sm font-bold ${
                  rootName === n ? 'bg-[#a0563f] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className='text-xs text-[#8B4513]'>Oktaavi: {ROOT_OCTAVE} (MIDI {rootMidi})</p>
        </section>

        <section className='flex flex-col gap-2'>
          <h2 className='text-sm font-bold text-[#5a2d0c]'>Sointu</h2>
          <div className='flex flex-wrap gap-2'>
            {CHORD_TYPES.map((c) => (
              <button
                key={c.id}
                onClick={() => handleChord(c.id)}
                className={`min-h-[44px] rounded-lg px-3 text-sm font-bold ${
                  activeChordId === c.id ? 'bg-[#5a2d0c] text-white' : 'bg-[#f0dbb8] text-[#5a2d0c]'
                }`}
              >
                {c.label}
              </button>
            ))}
            <button
              onClick={handleStop}
              className='min-h-[44px] rounded-lg px-4 bg-[#a0563f] text-white text-sm font-bold'
            >
              Hiljaa
            </button>
          </div>
        </section>

        <section className='rounded-xl border-2 border-[#8B4513] bg-white px-4 py-3'>
          <h2 className='text-sm font-bold text-[#5a2d0c]'>Soimassa</h2>
          {activeChord ? (
            <p className='mt-1 text-sm text-[#5a2d0c]'>
              {SAMPLES.find((s) => s.id === sampleId)?.label} · {rootName}
              {ROOT_OCTAVE} {activeChord.label} → <span className='font-mono'>{playingNotes}</span>
            </p>
          ) : (
            <p className='mt-1 text-sm text-[#8B4513]'>(ei mitään)</p>
          )}
        </section>

        <p className='text-xs text-[#8B4513]'>
          Reitti: <code>#/test/audio</code>. Ensimmäinen sointupainike käynnistää selaimen
          AudioContextin (selaimen sääntö).
        </p>
      </div>
    </div>
  )
}
