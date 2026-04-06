/**
 * Practice method data — single source of truth for the scale practice system.
 *
 * Based on Carl Flesch's circle-of-fifths key progression (Scale System, 1926).
 * Three skill levels of increasing technical demand:
 *   Level 1: 1st position only, 0–2 accidentals
 *   Level 2: 1st–3rd position with shifts, 1–3 accidentals
 *   Level 3: 1st–2nd–3rd positions with intermediate shifts, up to 4–5 accidentals
 *
 * To customise: add/remove entries from the SCALES array below.
 * Each entry is self-contained — the level field determines which skill group it belongs to.
 */

import { getScale } from './musicScale'

export interface ScaleEntry {
  key: string
  mode: 'ionian' | 'aeolian'
  level: 1 | 2 | 3
  positions: string[]
  octaves: number
  shiftPattern: string | null
  arpeggio: 'major' | 'minor'
  arpeggioOctaves: number
}

/**
 * Detailed practice info for a single scale, generated from ScaleEntry + musicScale.ts.
 * All text fields are in Finnish for direct display.
 */
export interface ScaleDetail {
  label: string
  notes: string[]
  positionLabel: string
  octaves: number
  shiftExercise: string | null
  shiftRoutine: string[] | null
  arpeggioNotes: string
  arpeggioDescription: string
}

export const SCALES: ScaleEntry[] = [
  // ── Level 1 — First Position Foundations ──
  { key: 'G', mode: 'ionian', level: 1, positions: ['1st'], octaves: 2, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'D', mode: 'ionian', level: 1, positions: ['1st'], octaves: 2, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'A', mode: 'ionian', level: 1, positions: ['1st'], octaves: 2, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'F', mode: 'ionian', level: 1, positions: ['1st'], octaves: 2, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'Bb', mode: 'ionian', level: 1, positions: ['1st'], octaves: 1, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'C', mode: 'ionian', level: 1, positions: ['1st'], octaves: 2, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'D', mode: 'aeolian', level: 1, positions: ['1st'], octaves: 2, shiftPattern: null, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'G', mode: 'aeolian', level: 1, positions: ['1st'], octaves: 2, shiftPattern: null, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'A', mode: 'aeolian', level: 1, positions: ['1st'], octaves: 2, shiftPattern: null, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'E', mode: 'aeolian', level: 1, positions: ['1st'], octaves: 1, shiftPattern: null, arpeggio: 'minor', arpeggioOctaves: 1 },

  // ── Level 2 — Introducing Shifts (1st–3rd Position) ──
  {
    key: 'G',
    mode: 'ionian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös B:llä (2. sormi, A-kieli)',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'D',
    mode: 'ionian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös F#:lla (2. sormi, E-kieli)',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'A',
    mode: 'ionian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös C#:lla (2. sormi, A-kieli)',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'E',
    mode: 'ionian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös G#:lla (2. sormi, E-kieli)',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'F',
    mode: 'ionian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös A:lla (1. sormi, E-kieli)',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'Bb',
    mode: 'ionian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös D:llä (1. sormi, A-kieli)',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'Eb',
    mode: 'ionian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös G:llä (1. sormi, D-kieli)',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'E',
    mode: 'aeolian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös G:llä (2. sormi, E-kieli)',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
  {
    key: 'B',
    mode: 'aeolian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös D:llä (1. sormi, A-kieli)',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
  {
    key: 'D',
    mode: 'aeolian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös F:llä (1. sormi, E-kieli)',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
  {
    key: 'G',
    mode: 'aeolian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös Bb:llä (1. sormi, A-kieli)',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
  {
    key: 'C',
    mode: 'aeolian',
    level: 2,
    positions: ['1st', '3rd'],
    octaves: 2,
    shiftPattern: 'Siirto ylös Eb:llä (1. sormi, D-kieli)',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },

  // ── Level 3 — Three Positions with Intermediate Shifts ──
  {
    key: 'G',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. A-kielellä, 2.→3. E-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'D',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. A-kielellä, 2.→3. E-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'A',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. D-kielellä, 2.→3. A-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'E',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. A-kielellä, 2.→3. E-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'B',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. E-kielellä, 2.→3. E-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'F',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. D-kielellä, 2.→3. A-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'Bb',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. G-kielellä, 2.→3. D-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'Eb',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. G-kielellä, 2.→3. D-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'Ab',
    mode: 'ionian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. D-kielellä, 2.→3. A-kielellä',
    arpeggio: 'major',
    arpeggioOctaves: 2,
  },
  {
    key: 'E',
    mode: 'aeolian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. A-kielellä, 2.→3. E-kielellä',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
  {
    key: 'B',
    mode: 'aeolian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. E-kielellä, 2.→3. E-kielellä',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
  {
    key: 'F#',
    mode: 'aeolian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. A-kielellä, 2.→3. E-kielellä',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
  {
    key: 'C',
    mode: 'aeolian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. G-kielellä, 2.→3. D-kielellä',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
  {
    key: 'D',
    mode: 'aeolian',
    level: 3,
    positions: ['1st', '2nd', '3rd'],
    octaves: 2,
    shiftPattern: '1.→2. D-kielellä, 2.→3. A-kielellä',
    arpeggio: 'minor',
    arpeggioOctaves: 2,
  },
]

/**
 * Generate a stable unique key for a scale entry.
 * Used as React key to avoid re-renders on reshuffle.
 */
export function getScaleKey(scale: ScaleEntry): string {
  return `${scale.key}-${scale.mode}-${scale.level}-${scale.positions.join('-')}`
}

export function getScalesForLevel(level: number): ScaleEntry[] {
  return SCALES.filter((s) => s.level === level)
}

export function shuffleScales(scales: ScaleEntry[]): ScaleEntry[] {
  const arr = [...scales]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function formatScaleLabel(scale: ScaleEntry): string {
  const mode = scale.mode === 'ionian' ? 'duuri' : 'molli'
  return `${scale.key}-${mode}`
}

export function formatPositions(scale: ScaleEntry): string {
  return scale.positions.map((p) => p.replace('st', '.').replace('nd', '.').replace('rd', '.')).join('–')
}

// ── Shift routine (4-step, from Galamian) ──

const SHIFT_ROUTINE_FI: string[] = [
  'Soita siirtymäpari (viimeinen nuotti ennen siirtoa + ensimmäinen sen jälkeen) 5 kertaa hitaasti kuuluvalla liukumalla.',
  'Soita siirtymäpari 5 kertaa tempossa minimaalisella liukumalla.',
  'Soita koko asteikko hitaasti, pysähdy hetkeksi siirtymäkohdassa.',
  'Soita koko asteikko tempossa.',
]

/**
 * Build a tonic triad arpeggio from a scale's notes.
 * For major: root, 3rd, 5th. For minor: root, minor 3rd, 5th.
 * The notes come from getScale() which returns [1,2,3,4,5,6,7,8] (8 = octave).
 */
function buildArpeggioNotes(scaleNotes: string[], mode: 'ionian' | 'aeolian'): string {
  // scaleNotes has 8 entries: indices 0–6 are the 7 degrees, index 7 is the octave root
  const root = scaleNotes[0]
  const third = scaleNotes[2] // 3rd degree
  const fifth = scaleNotes[4] // 5th degree
  const octave = scaleNotes[7] // octave root
  const triadType = mode === 'ionian' ? 'duuri' : 'molli'
  return `${root} – ${third} – ${fifth} – ${octave} (${triadType}kolmisointu)`
}

/**
 * Generate full detail info for a ScaleEntry using musicScale.ts for note generation.
 */
export function getScaleDetail(scale: ScaleEntry): ScaleDetail {
  const modeStr = scale.mode === 'ionian' ? 'duuri' : 'molli'
  const label = `${scale.key}-${modeStr}`
  const notes = getScale(scale.key, scale.mode)
  const positionLabel = formatPositions(scale) + ' asema'

  // Shift info — only for level 2+
  let shiftExercise: string | null = null
  let shiftRoutine: string[] | null = null
  if (scale.level >= 2 && scale.shiftPattern) {
    shiftExercise = scale.shiftPattern
    shiftRoutine = SHIFT_ROUTINE_FI
  }

  const arpeggioNotes = buildArpeggioNotes(notes, scale.mode)
  const octaveWord = scale.arpeggioOctaves === 1 ? 'yhden oktaavin' : 'kahden oktaavin'
  const noteValue = scale.level >= 3 ? 'kahdeksasosanuoteilla' : 'neljäsosanuoteilla'
  const arpeggioDescription = `${octaveWord} toonika-arpeggio, ${noteValue}`

  return {
    label,
    notes,
    positionLabel,
    octaves: scale.octaves,
    shiftExercise,
    shiftRoutine,
    arpeggioNotes,
    arpeggioDescription,
  }
}
