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

export const DRAWING_RANGE = { min: { letter: 'G', octave: 3 }, max: { letter: 'B', octave: 5 } }

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
