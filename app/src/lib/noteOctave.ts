/**
 * Oktaavijärjestelmä / Octave system
 *
 * Tämä kirjasto käyttää SPN-numerointia (Scientific Pitch Notation) sisäisesti.
 *
 * Suomalaiset oktaavinimet perustuvat Helmholtzin merkintätapaan (1863),
 * joka on peräisin saksalaisesta urkujenrakennusperinteestä.
 *
 * Finnish octave names originate from the Helmholtz pitch notation system (1863),
 * itself derived from the German organ builders' pipe-labeling tradition.
 *
 * ┌─────────────────────────────────────┬────────────────┬────────────┬───────────┐
 * │ Suomeksi (fin)                      │ Helmholtz      │ SPN (C..B) │ Viulu     │
 * ├─────────────────────────────────────┼────────────────┼────────────┼───────────┤
 * │ Subkontraoktaavi                    │ C„ – B„        │ C0 – B0    │ —         │
 * │ Kontraoktaavi                       │ C, – B,        │ C1 – B1    │ —         │
 * │ Suuri (iso) oktaavi                 │ C – B          │ C2 – B2    │ —         │
 * │ Pieni (pikku) oktaavi               │ c – b          │ C3 – B3    │ G3 ↑     │
 * │ Yksiviivainen (1-viivainen) oktaavi │ c' – b'        │ C4 – B4    │ koko     │
 * │ Kaksiviivainen (2-viivainen) okt.   │ c'' – b''      │ C5 – B5    │ → B5     │
 * │ Kolmiviivainen (3-viivainen) okt.   │ c''' – b'''    │ C6 – B6    │ —         │
 * │ Neliviivainen (4-viivainen) okt.    │ c'''' – b''''  │ C7 – B7    │ —         │
 * │ Viisiviivainen (5-viivainen) okt.   │ c'''''         │ C8         │ —         │
 * └─────────────────────────────────────┴────────────────┴────────────┴───────────┘
 *
 * Nimeämisjärjestelmä (OCTAVE_NAMES_FI) kattaa kaikki oktaavit 0–8.
 * Piirtojärjestelmä tukee toistaiseksi vain viulun aluetta.
 *
 * Viulun tuettu alue tässä kirjastossa:
 *   G3 (pieni g, avoin G-kieli) – B5 (kaksiviivainen h, E-kieli 3. asemassa)
 *
 * Nuottiviivaston kiinteät paikat (diskanttivain, treble clef):
 *   Viiva 1 (alin)  = E4 (yksiviivainen e)
 *   Viiva 2          = G4
 *   Viiva 3          = B4
 *   Viiva 4          = D5
 *   Viiva 5 (ylin)   = F5
 *   Keski-C (C4)     = apuviiva alapuolella
 */

import { getScale } from './musicScale'

export interface NoteWithOctave {
  letter: string
  accidental: string | null
  octave: number
}

export const DIATONIC_INDEX: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
}

export const OCTAVE_NAMES_FI: Record<number, {
  name: string
  shortName: string
  helmholtz: string
  nameEn: string
}> = {
  0: { name: 'Subkontraoktaavi',            shortName: 'subkontra',      helmholtz: 'C„ – B„',     nameEn: 'Sub-contra octave' },
  1: { name: 'Kontraoktaavi',               shortName: 'kontra',         helmholtz: 'C, – B,',     nameEn: 'Contra octave' },
  2: { name: 'Suuri oktaavi',               shortName: 'iso',            helmholtz: 'C – B',       nameEn: 'Great octave' },
  3: { name: 'Pieni oktaavi',               shortName: 'pikku',          helmholtz: 'c – b',       nameEn: 'Small octave' },
  4: { name: 'Yksiviivainen oktaavi',       shortName: '1-viivainen',    helmholtz: "c' – b'",     nameEn: 'One-line octave' },
  5: { name: 'Kaksiviivainen oktaavi',      shortName: '2-viivainen',    helmholtz: "c'' – b''",   nameEn: 'Two-line octave' },
  6: { name: 'Kolmiviivainen oktaavi',      shortName: '3-viivainen',    helmholtz: "c''' – b'''", nameEn: 'Three-line octave' },
  7: { name: 'Neliviivainen oktaavi',       shortName: '4-viivainen',    helmholtz: "c'''' – b''''", nameEn: 'Four-line octave' },
  8: { name: 'Viisiviivainen oktaavi',      shortName: '5-viivainen',    helmholtz: "c'''''",      nameEn: 'Five-line octave' },
}

export function formatNoteFi(note: NoteWithOctave, useShortName = true): string {
  const octaveInfo = OCTAVE_NAMES_FI[note.octave]
  if (!octaveInfo) return `${note.letter}${note.accidental ?? ''}${note.octave}`

  const letterLower = note.letter.toLowerCase()
  const accidentalSuffix = note.accidental
    ? ({ '#': 'is', '##': 'isis', 'b': 'es', 'bb': 'eses' }[note.accidental] ?? '')
    : ''

  const prefix = useShortName ? octaveInfo.shortName : octaveInfo.name
  return `${prefix} ${letterLower}${accidentalSuffix}`
}

export function formatNoteHelmholtz(note: NoteWithOctave): string {
  const acc = note.accidental
    ? ({ '#': 'is', '##': 'isis', 'b': 'es', 'bb': 'eses' }[note.accidental] ?? '')
    : ''

  if (note.octave <= 2) {
    const letter = note.letter.toUpperCase()
    const subPrimes = note.octave < 2 ? ','.repeat(2 - note.octave) : ''
    return `${letter}${acc}${subPrimes}`
  }

  const letter = note.letter.toLowerCase()
  const primes = note.octave > 3 ? "'".repeat(note.octave - 3) : ''
  return `${letter}${acc}${primes}`
}

export function formatNoteSPN(note: NoteWithOctave): string {
  return `${note.letter}${note.accidental ?? ''}${note.octave}`
}

export const VIOLIN_OPEN_STRING_OCTAVES: Record<string, number> = {
  G: 3,
  D: 4,
  A: 4,
  E: 5,
}

/**
 * Hard drawing bounds.
 *   min = G3 (pieni g, avoin G-kieli — note one octave below middle C / C4)
 *   max = C7 — raised from G6 so a 2-octave scale rendered from octave 4
 *             (Kirkkosävellajit's fixed convention) still draws its closing top
 *             note instead of being skipped. Practice scales place their own
 *             lowest note explicitly (ScaleEntry.lowestNote) so their tops stay
 *             within reach.
 */
export const DRAWING_RANGE = { min: { letter: 'G', octave: 3 }, max: { letter: 'C', octave: 7 } }

function diatonicPosition(letter: string, octave: number): number {
  return octave * 7 + DIATONIC_INDEX[letter]
}

/**
 * True if the note lies within the allowed drawing range [G3, G6] inclusive.
 * Accidentals are ignored — only the diatonic letter+octave position is checked.
 */
export function isInDrawingRange(note: NoteWithOctave): boolean {
  const pos = diatonicPosition(note.letter, note.octave)
  const minPos = diatonicPosition(DRAWING_RANGE.min.letter, DRAWING_RANGE.min.octave)
  const maxPos = diatonicPosition(DRAWING_RANGE.max.letter, DRAWING_RANGE.max.octave)
  return pos >= minPos && pos <= maxPos
}

export function getAbsoluteNoteY(
  note: NoteWithOctave,
  staffLineYs: number[]
): number {
  const lineSpacing = staffLineYs[1] - staffLineYs[0]
  const stepSize = lineSpacing / 2

  const e4Position = 4 * 7 + DIATONIC_INDEX['E']
  const notePosition = note.octave * 7 + DIATONIC_INDEX[note.letter]

  return staffLineYs[4] - (notePosition - e4Position) * stepSize
}

/**
 * Starting octave for each scale root currently used in the practice method.
 *
 * Reverse-engineered from the existing canvas rendering (NOTE_TO_STAFF_POSITION):
 * every scale root in the visualizer lands at octave 4. For sharp/flat roots
 * (F#, Bb, Eb, Ab) the base letter determines the octave.
 *
 * This map is the single source of truth for the starting octave of both the
 * drawn scale (renderScale) and the drawn arpeggio (buildArpeggioNotesWithOctave),
 * so the two always align on the same staff line.
 */
export const SCALE_START_OCTAVE: Record<string, number> = {
  C: 4, D: 4, E: 4, F: 4, G: 4, A: 4, B: 4,
  'C#': 4, 'D#': 4, 'F#': 4, 'G#': 4, 'A#': 4,
  'Db': 4, 'Eb': 4, 'Gb': 4, 'Ab': 4, 'Bb': 4,
}

/** Parse the octave number off a note string ("G3" → 3, "C#4" → 4). Returns null
 *  for a note with no trailing octave (e.g. a bare "G"). */
export function parseNoteOctave(note: string | null | undefined): number | null {
  if (!note) return null
  const m = note.match(/(-?\d+)\s*$/)
  return m ? Number(m[1]) : null
}

/**
 * Assign ascending octaves to a sequence of note letter strings (e.g. ['G','A','B','C','D','E','F#','G']),
 * starting from the given octave. The octave increments whenever the diatonic letter
 * wraps past B back to C.
 */
export function assignAscendingOctaves(
  noteStrings: string[],
  startOctave: number
): NoteWithOctave[] {
  const out: NoteWithOctave[] = []
  let octave = startOctave
  let prev = -1
  for (const raw of noteStrings) {
    const m = raw.match(/^([A-G])(bb|##|b|#)?$/)
    const letter = m ? m[1] : raw[0]
    const accidental = m && m[2] ? m[2] : null
    const d = DIATONIC_INDEX[letter]
    if (prev !== -1 && d < prev) octave++
    prev = d
    out.push({ letter, accidental, octave })
  }
  return out
}

/** Parse a reach-top note string ("C#6", "D6") into its letter + accidental. */
function parseReachNote(note: string): { letter: string; accidental: string | null } | null {
  const m = note.match(/^([A-G])(##|bb|#|b)?\d*$/)
  return m ? { letter: m[1], accidental: m[2] ?? null } : null
}

/** Ascending scale notes for root/mode over `octaves` octaves. One octave = 8 entries
 *  (last = the octave repeat of the root); each extra octave adds the 7 degrees again
 *  before the final closing root (2 octaves = 15 entries). Socket count = note count and
 *  the turn is the top, mirroring Tähtiasteikko.
 *
 *  Reach-aware: when `reachUpTo` is given (a "1+" scale — full first octave, then climb
 *  the 2nd octave only as far as 1st–3rd position reaches, e.g. "D6" / "C#6"), the
 *  ascending run is cut at that note in the 2nd octave so the necklace shows the correct
 *  socket count and turn note. The cap is letter-based within the 2nd octave; for every
 *  reach-limited key the SCALE_START_OCTAVE=4 convention already coincides with real
 *  violin pitch, so the cut note's octave label is correct. See scale-practice-method-v2.md §2. */
export function getScaleNotes(
  root: string,
  mode: string,
  octaves = 1,
  reachUpTo: string | null = null,
  lowestNote: string | null = null,
): NoteWithOctave[] {
  const scale = getScale(root, mode) // 8 entries, last = root one octave up
  const rootLetter = root.replace(/[#b].*$/, '')
  // Practice callers pass `lowestNote` (e.g. "G3") — the exact note the scale starts
  // on, chosen per level + scale (ScaleEntry.lowestNote). Only its octave is used (the
  // first degree is always the root). Falls back to the SCALE_START_OCTAVE convention.
  const startOctave =
    parseNoteOctave(lowestNote) ?? SCALE_START_OCTAVE[root] ?? SCALE_START_OCTAVE[rootLetter] ?? 4
  const degrees = scale.slice(0, -1) // the 7 distinct degrees (drop the closing root)
  const closingRoot = scale[scale.length - 1]

  // "1+" reach-limited scale: build two octaves, then cut the ascending run at the
  // reachable top note (first match in the 2nd octave, i.e. from index `degrees.length`).
  if (reachUpTo) {
    const target = parseReachNote(reachUpTo)
    const notes = assignAscendingOctaves([...degrees, ...degrees, closingRoot], startOctave)
    if (target) {
      const cut = notes.findIndex(
        (n, i) =>
          i >= degrees.length && n.letter === target.letter && (n.accidental ?? null) === target.accidental,
      )
      if (cut !== -1) return notes.slice(0, cut + 1)
    }
    return notes
  }

  const reps = Math.max(1, octaves)
  if (reps === 1) return assignAscendingOctaves(scale, startOctave)
  const seq: string[] = []
  for (let o = 0; o < reps; o++) seq.push(...degrees)
  seq.push(closingRoot) // single closing root at the very top
  return assignAscendingOctaves(seq, startOctave)
}
