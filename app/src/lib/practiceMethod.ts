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
import { type NoteWithOctave, DIATONIC_INDEX, SCALE_START_OCTAVE } from './noteOctave'

export interface ScaleEntry {
  key: string
  mode: 'ionian' | 'aeolian'
  level: 1 | 2 | 3
  positions: string[]
  octaves: number
  /**
   * The exact lowest (starting) note of this scale on the violin, as SPN ("G3",
   * "A3", "C4"). Chosen per practice level + scale so the top of the run stays
   * within the position(s) listed — e.g. a 2-octave A major starts on A3 (A3→A5),
   * not A4. The letter is always the root; only the octave drives rendering, so
   * the practice screens can begin a scale on any octave (incl. future 3-octave
   * forms). Threaded to `getScaleNotes` via the `low` URL param. */
  lowestNote: string
  /**
   * Reach-aware top of a "1+" scale (full first octave + as much of the 2nd octave
   * as 1st–3rd position reaches). For E, F, Eb major and E, F# minor the full 2nd
   * octave tops above the 3rd-position ceiling (D6), so the ascending run climbs only
   * to this note (`"C#6"` for E major, `"D6"` for the rest) and turns around there.
   * `null` for scales that play a full 1 or 2 octaves. See `scale-practice-method-v2.md` §2.
   */
  reachUpTo: string | null
  /** `true` when a 1st→3rd shift is required to reach the top; `false` when the scale
   *  fits 1st position and any shift is optional practice. */
  shiftRequired: boolean
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
  scaleKey: string
  scaleMode: string
  notes: string[]
  positionLabel: string
  octaves: number
  /** Exact lowest note of the scale ("G3", "A3", "C4"); see ScaleEntry.lowestNote. */
  lowestNote: string
  /** Reach-aware top of a "1+" scale (else null); see ScaleEntry.reachUpTo. */
  reachUpTo: string | null
  /** Finnish octave summary, e.g. "2 oktaavia", "1 oktaavi", "1+ oktaavia (kurkotus D6 asti)". */
  octaveLabel: string
  shiftExercise: string | null
  shiftRoutine: string[] | null
  arpeggioNotes: string
  arpeggioDescription: string
  arpeggioNotesWithOctave: NoteWithOctave[]
}

// Required 1st→3rd shift instructions (Finnish). v2's "one shift": E string, 1st finger
// guiding up to A5 (Ab5 for C minor); the "1+" scales then climb to D6 / C#6 and turn.
const SHIFT_TO_A5 = 'Siirto 3. asemaan E-kielellä (1. sormi A5:een)'
const SHIFT_TO_AB5 = 'Siirto 3. asemaan E-kielellä (1. sormi Ab5:een)'
const CLIMB_D6 = 'Siirto 3. asemaan E-kielellä, kurkota D6:een asti'
const CLIMB_CS6 = 'Siirto 3. asemaan E-kielellä, kurkota C#6:een asti'

/**
 * Reach-aware scale data, reconciled to `scale-practice-method-v2.md` (the authoritative
 * pedagogy). A 2-octave scale only fits 1st–3rd position if its top note is ≤ D6: keys
 * topping above that (Eb/E/F major, E/F# minor) are "1+" — full first octave, then a climb
 * to `reachUpTo` (D6, or C#6 for E major) and turn around. Level 1 keys whose 2nd octave
 * needs a shift (D/F/C major, D minor) are 1 octave here; their 2-octave forms live at Level 2.
 */
export const SCALES: ScaleEntry[] = [
  // ── Level 1 — First Position Foundations (1st position only, top ≤ B5 → 2 oct, else 1 oct) ──
  { key: 'G', mode: 'ionian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'G4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'D', mode: 'ionian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'D4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'A', mode: 'ionian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'A4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'F', mode: 'ionian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'F4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'Bb', mode: 'ionian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'Bb4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'C', mode: 'ionian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'C4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'D', mode: 'aeolian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'D4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'G', mode: 'aeolian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'G4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'A', mode: 'aeolian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'A4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'E', mode: 'aeolian', level: 1, positions: ['1st'], octaves: 1, lowestNote: 'E4', reachUpTo: null, shiftRequired: false, shiftPattern: null, arpeggio: 'minor', arpeggioOctaves: 1 },

  // ── Level 2 — Introducing the 1st→3rd Shift (top ≤ D6 → full 2 oct; top > D6 → "1+") ──
  { key: 'G', mode: 'ionian', level: 2, positions: ['1st', '3rd'], octaves: 2, lowestNote: 'G3', reachUpTo: null, shiftRequired: false, shiftPattern: 'Yläoktaavi 3. asemassa A-kielellä (D5 = 1. sormi)', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'D', mode: 'ionian', level: 2, positions: ['1st', '3rd'], octaves: 2, lowestNote: 'D4', reachUpTo: null, shiftRequired: true, shiftPattern: SHIFT_TO_A5, arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'A', mode: 'ionian', level: 2, positions: ['1st', '3rd'], octaves: 2, lowestNote: 'A3', reachUpTo: null, shiftRequired: false, shiftPattern: 'Yläoktaavi 3. asemassa A-kielellä', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'E', mode: 'ionian', level: 2, positions: ['1st', '3rd'], octaves: 1, lowestNote: 'E4', reachUpTo: 'C#6', shiftRequired: true, shiftPattern: CLIMB_CS6, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'F', mode: 'ionian', level: 2, positions: ['1st', '3rd'], octaves: 1, lowestNote: 'F4', reachUpTo: 'D6', shiftRequired: true, shiftPattern: CLIMB_D6, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'Bb', mode: 'ionian', level: 2, positions: ['1st', '3rd'], octaves: 2, lowestNote: 'Bb3', reachUpTo: null, shiftRequired: false, shiftPattern: 'Yläoktaavi 3. asemassa A-kielellä', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'Eb', mode: 'ionian', level: 2, positions: ['1st', '3rd'], octaves: 1, lowestNote: 'Eb4', reachUpTo: 'D6', shiftRequired: true, shiftPattern: CLIMB_D6, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'E', mode: 'aeolian', level: 2, positions: ['1st', '3rd'], octaves: 1, lowestNote: 'E4', reachUpTo: 'D6', shiftRequired: true, shiftPattern: CLIMB_D6, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'B', mode: 'aeolian', level: 2, positions: ['1st', '3rd'], octaves: 2, lowestNote: 'B3', reachUpTo: null, shiftRequired: false, shiftPattern: 'Yläoktaavi 3. asemassa A-kielellä (yläsävel B5 = 1. aseman katto)', arpeggio: 'minor', arpeggioOctaves: 2 },
  { key: 'D', mode: 'aeolian', level: 2, positions: ['1st', '3rd'], octaves: 2, lowestNote: 'D4', reachUpTo: null, shiftRequired: true, shiftPattern: SHIFT_TO_A5, arpeggio: 'minor', arpeggioOctaves: 2 },
  { key: 'G', mode: 'aeolian', level: 2, positions: ['1st', '3rd'], octaves: 2, lowestNote: 'G3', reachUpTo: null, shiftRequired: false, shiftPattern: 'Yläoktaavi 3. asemassa A-kielellä', arpeggio: 'minor', arpeggioOctaves: 2 },
  { key: 'C', mode: 'aeolian', level: 2, positions: ['1st', '3rd'], octaves: 2, lowestNote: 'C4', reachUpTo: null, shiftRequired: true, shiftPattern: SHIFT_TO_AB5, arpeggio: 'minor', arpeggioOctaves: 2 },

  // ── Level 3 — Adding 2nd Position (ceiling still D6; octave verdicts match Level 2) ──
  { key: 'G', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'G3', reachUpTo: null, shiftRequired: false, shiftPattern: '1.→2. A-kielellä, 2.→3. E-kielellä', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'D', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'D4', reachUpTo: null, shiftRequired: true, shiftPattern: '1.→2. A-kielellä, 2.→3. E-kielellä', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'A', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'A3', reachUpTo: null, shiftRequired: false, shiftPattern: '1.→2. D-kielellä, 2.→3. A-kielellä', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'E', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 1, lowestNote: 'E4', reachUpTo: 'C#6', shiftRequired: true, shiftPattern: CLIMB_CS6, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'B', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'B3', reachUpTo: null, shiftRequired: false, shiftPattern: '1.→2. E-kielellä, 2.→3. E-kielellä', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'F', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 1, lowestNote: 'F4', reachUpTo: 'D6', shiftRequired: true, shiftPattern: CLIMB_D6, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'Bb', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'Bb3', reachUpTo: null, shiftRequired: false, shiftPattern: '1.→2. G-kielellä, 2.→3. D-kielellä', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'Eb', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 1, lowestNote: 'Eb4', reachUpTo: 'D6', shiftRequired: true, shiftPattern: CLIMB_D6, arpeggio: 'major', arpeggioOctaves: 1 },
  { key: 'Ab', mode: 'ionian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'Ab3', reachUpTo: null, shiftRequired: false, shiftPattern: '1.→2. D-kielellä, 2.→3. A-kielellä', arpeggio: 'major', arpeggioOctaves: 2 },
  { key: 'E', mode: 'aeolian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 1, lowestNote: 'E4', reachUpTo: 'D6', shiftRequired: true, shiftPattern: CLIMB_D6, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'B', mode: 'aeolian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'B3', reachUpTo: null, shiftRequired: false, shiftPattern: '1.→2. E-kielellä, 2.→3. E-kielellä', arpeggio: 'minor', arpeggioOctaves: 2 },
  { key: 'F#', mode: 'aeolian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 1, lowestNote: 'F#4', reachUpTo: 'D6', shiftRequired: true, shiftPattern: CLIMB_D6, arpeggio: 'minor', arpeggioOctaves: 1 },
  { key: 'C', mode: 'aeolian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'C4', reachUpTo: null, shiftRequired: true, shiftPattern: '1.→2. G-kielellä, 2.→3. D-kielellä', arpeggio: 'minor', arpeggioOctaves: 2 },
  { key: 'D', mode: 'aeolian', level: 3, positions: ['1st', '2nd', '3rd'], octaves: 2, lowestNote: 'D4', reachUpTo: null, shiftRequired: true, shiftPattern: '1.→2. D-kielellä, 2.→3. A-kielellä', arpeggio: 'minor', arpeggioOctaves: 2 },
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

function parseNoteLetter(note: string): { letter: string; accidental: string | null } {
  const m = note.match(/^([A-G])(bb|##|b|#)?$/)
  if (m) return { letter: m[1], accidental: m[2] ?? null }
  return { letter: note, accidental: null }
}

export function buildArpeggioNotesWithOctave(
  scaleNotes: string[],
  rootKey: string
): NoteWithOctave[] {
  const rootLetter = rootKey.replace(/[#b].*$/, '')
  const startOctave = SCALE_START_OCTAVE[rootKey] ?? SCALE_START_OCTAVE[rootLetter] ?? 4

  const arpeggioIndices = [0, 2, 4, 7]
  const result: NoteWithOctave[] = []
  let currentOctave = startOctave
  let prevDiatonic = DIATONIC_INDEX[rootLetter]

  for (const idx of arpeggioIndices) {
    const parsed = parseNoteLetter(scaleNotes[idx])
    const diatonic = DIATONIC_INDEX[parsed.letter]

    if (result.length > 0 && diatonic < prevDiatonic) {
      currentOctave++
    }
    prevDiatonic = diatonic

    result.push({
      letter: parsed.letter,
      accidental: parsed.accidental,
      octave: currentOctave,
    })
  }

  return result
}

/**
 * Generate full detail info for a ScaleEntry using musicScale.ts for note generation.
 */
export function getScaleDetail(scale: ScaleEntry): ScaleDetail {
  const modeStr = scale.mode === 'ionian' ? 'duuri' : 'molli'
  const label = `${scale.key}-${modeStr}`
  const notes = getScale(scale.key, scale.mode)
  const positionLabel = formatPositions(scale) + ' asema'

  // Shift info — only for level 2+. Optional shifts (the scale already fits 1st
  // position) are flagged so the panel doesn't read them as mandatory.
  let shiftExercise: string | null = null
  let shiftRoutine: string[] | null = null
  if (scale.level >= 2 && scale.shiftPattern) {
    shiftExercise = scale.shiftRequired ? scale.shiftPattern : `Valinnainen: ${scale.shiftPattern}`
    shiftRoutine = SHIFT_ROUTINE_FI
  }

  // "1+" scales play a full first octave then climb to reachUpTo; plain scales play 1/2.
  const octaveLabel = scale.reachUpTo
    ? `1+ oktaavia (kurkotus ${scale.reachUpTo} asti)`
    : scale.octaves === 1
      ? '1 oktaavi'
      : `${scale.octaves} oktaavia`

  const arpeggioNotes = buildArpeggioNotes(notes, scale.mode)
  const arpeggioNotesWithOctave = buildArpeggioNotesWithOctave(notes, scale.key)
  const octaveWord = scale.arpeggioOctaves === 1 ? 'yhden oktaavin' : 'kahden oktaavin'
  const noteValue = scale.level >= 3 ? 'kahdeksasosanuoteilla' : 'neljäsosanuoteilla'
  const arpeggioDescription = `${octaveWord} toonika-arpeggio, ${noteValue}`

  return {
    label,
    scaleKey: scale.key,
    scaleMode: scale.mode,
    notes,
    positionLabel,
    octaves: scale.octaves,
    lowestNote: scale.lowestNote,
    reachUpTo: scale.reachUpTo,
    octaveLabel,
    shiftExercise,
    shiftRoutine,
    arpeggioNotes,
    arpeggioDescription,
    arpeggioNotesWithOctave,
  }
}

/**
 * Resolve a ScaleDetail directly from URL-style scale params. Used by Soittohetki,
 * which always has exactly one active scale known from its query string. When the
 * practice level is supplied it pins the exact SCALES entry (so shift guidance is
 * correct); otherwise it falls back to the closest octave match, then to a
 * synthetic first-position entry for keys outside the practice set.
 */
export function findScaleDetail(
  key: string,
  mode: 'ionian' | 'aeolian',
  octaves: number,
  level?: number
): ScaleDetail {
  const matches = SCALES.filter((s) => s.key === key && s.mode === mode)
  const entry: ScaleEntry =
    (level != null ? matches.find((s) => s.level === level) : undefined) ??
    matches.find((s) => s.octaves === octaves) ??
    matches[0] ?? {
      key,
      mode,
      level: 1,
      positions: ['1st'],
      octaves,
      lowestNote: `${key}4`,
      reachUpTo: null,
      shiftRequired: false,
      shiftPattern: null,
      arpeggio: mode === 'ionian' ? 'major' : 'minor',
      arpeggioOctaves: 1,
    }
  return getScaleDetail(entry)
}
