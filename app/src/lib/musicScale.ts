// Pure music theory functions ported from script.js

export type AccidentalPreference = 'sharp' | 'flat'

export interface ModeAlterations {
  raised: number[]
  lowered: number[]
}

const LETTER_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const BASE_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

export const MODES: Record<string, number[]> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
}

export function getKeyList(): string[] {
  return ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db']
}

export function getModeList(): string[] {
  return ['ionian (Duuri)', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian (Molli)', 'locrian']
}

export function getBaseModeKey(mode: string): string {
  return mode.split(' ')[0].toLowerCase()
}

export function getModeDegree(mode: string): number {
  const degrees: Record<string, number> = {
    ionian: 1, dorian: 2, phrygian: 3, lydian: 4,
    mixolydian: 5, aeolian: 6, locrian: 7,
  }
  return degrees[getBaseModeKey(mode)] ?? 1
}

export function getModeAlterations(mode: string): ModeAlterations | null {
  const baseName = getBaseModeKey(mode)
  if (!MODES[baseName] || baseName === 'ionian') return null

  const ionianIntervals = MODES.ionian
  const currentIntervals = MODES[baseName]
  const raised: number[] = []
  const lowered: number[] = []

  for (let i = 1; i < ionianIntervals.length; i++) {
    const diff = currentIntervals[i] - ionianIntervals[i]
    if (diff > 0) raised.push(i + 1)
    else if (diff < 0) lowered.push(i + 1)
  }
  return { raised, lowered }
}

function parsePC(note: string): number {
  const letter = note.replace(/[#b].*$/, '')
  const acc = note.slice(letter.length)
  let pc = BASE_PC[letter] ?? 0
  for (const ch of acc) {
    if (ch === '#') pc = (pc + 1) % 12
    else if (ch === 'b') pc = (pc + 11) % 12
  }
  return pc
}

function getAccidentalString(delta: number): string {
  const map: Record<number, string> = { 0: '', 1: '#', 2: '##', 11: 'b', 10: 'bb' }
  if (delta in map) return map[delta]
  throw new Error(`Unsupported accidental delta: ${delta}`)
}

export function getScale(currentKey: string, currentMode: string): string[] {
  const baseName = getBaseModeKey(currentMode)
  const intervals = MODES[baseName] ?? MODES.ionian
  const rootPC = parsePC(currentKey)
  const rootLetter = currentKey.replace(/[#b].*$/, '')
  const startIdx = LETTER_NAMES.indexOf(rootLetter as typeof LETTER_NAMES[number])

  const scale: string[] = []
  for (let i = 0; i < 7; i++) {
    const targetPC = (rootPC + intervals[i]) % 12
    const letter = LETTER_NAMES[(startIdx + i) % 7]
    const base = BASE_PC[letter]
    const delta = (targetPC - base + 12) % 12
    scale.push(letter + getAccidentalString(delta))
  }
  scale.push(scale[0])
  return scale
}

export interface NoteInfo {
  noteName: string
  accidental: string | null
  octave: number
}

export function getNoteInfo(note: string): NoteInfo {
  const m = note.match(/^([A-G])(bb|##|b|#)?$/)
  if (m) return { noteName: m[1], accidental: m[2] ?? null, octave: 5 }
  return { noteName: note, accidental: null, octave: 5 }
}

export function calculateStaffSteps(keyLetter: string, noteLetter: string, scaleIndex: number): number {
  const startIndex = LETTER_NAMES.indexOf(keyLetter as typeof LETTER_NAMES[number])
  const currentIndex = LETTER_NAMES.indexOf(noteLetter as typeof LETTER_NAMES[number])
  if (scaleIndex === 7) return 7
  if (scaleIndex === 0) return 0
  let steps = (currentIndex - startIndex + 7) % 7
  if (currentIndex < startIndex) steps = currentIndex + (7 - startIndex)
  return steps
}

const NOTE_TO_STAFF_POSITION: Record<string, number> = {
  C: 230, D: 218, E: 205, F: 193, G: 180, A: 168, B: 155,
}
const STAFF_GAP = 220

export function getNoteY(noteName: string, _octave: number, staff: 'upper' | 'lower', scaleIndex: number, currentKey: string): number {
  const baseNoteName = noteName.replace(/[#b]/g, '')[0]
  const keyBaseLetter = currentKey.replace(/[#b].*$/, '')
  const startY = NOTE_TO_STAFF_POSITION[keyBaseLetter] + (staff === 'lower' ? STAFF_GAP : 0)
  const staffSteps = calculateStaffSteps(keyBaseLetter, baseNoteName, scaleIndex)
  return startY - staffSteps * 12.5 - 10
}
