import { noteNameToMidi } from './tuning.ts'

/**
 * Manifest of one-note pad/drone samples.
 *
 * `rootMidi` is the actual recorded pitch of the sample, used by the engine
 * to compute pitch-shift ratios. The values here come from
 * `scripts/detect-pitch.mjs` and a sanity-check cross-pass with FFT — see
 * `docs/audio-samples.md` for the detection log.
 *
 * Adding a new sample: drop the file in `public/samples/`, append an entry,
 * done. The engine reads `src` + `rootMidi` and pitch-shifts from there.
 */

export interface SampleEntry {
  /** Stable id used by the UI / service. */
  id: string
  /** URL path relative to the served root. */
  src: string
  /** Recorded fundamental, as a MIDI number. */
  rootMidi: number
  /** Human-readable name shown in the test UI. */
  label: string
}

export const SAMPLES: readonly SampleEntry[] = [
  {
    id: 'major-pad',
    src: '/samples/major-pad-G4.mp3',
    rootMidi: noteNameToMidi('G4'),
    label: 'Mellow Pad',
  },
  {
    id: 'major-space',
    src: '/samples/major-space-A3.mp3',
    rootMidi: noteNameToMidi('A3'),
    label: 'Organic Pad',
  },
  {
    id: 'minor-space',
    src: '/samples/minor-space-F2.mp3',
    rootMidi: noteNameToMidi('F2'),
    label: 'Aero Space',
  },
] as const

export function getSample(id: string): SampleEntry | undefined {
  return SAMPLES.find((s) => s.id === id)
}
