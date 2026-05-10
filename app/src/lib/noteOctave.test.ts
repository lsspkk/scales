import { describe, it, expect } from 'vitest'
import {
  getAbsoluteNoteY,
  formatNoteFi,
  formatNoteHelmholtz,
  formatNoteSPN,
} from './noteOctave'
import { buildArpeggioNotesWithOctave } from './practiceMethod'
import { getScale } from './musicScale'

const STAFF_LINES = [95, 120, 145, 170, 195]

describe('getAbsoluteNoteY', () => {
  it('G3 — 2 ledger lines below staff', () => {
    const y = getAbsoluteNoteY({ letter: 'G', accidental: null, octave: 3 }, STAFF_LINES)
    expect(y).toBe(257.5)
  })

  it('E4 — bottom staff line', () => {
    const y = getAbsoluteNoteY({ letter: 'E', accidental: null, octave: 4 }, STAFF_LINES)
    expect(y).toBe(195)
  })

  it('G4 — line 2', () => {
    const y = getAbsoluteNoteY({ letter: 'G', accidental: null, octave: 4 }, STAFF_LINES)
    expect(y).toBe(170)
  })

  it('B4 — line 3', () => {
    const y = getAbsoluteNoteY({ letter: 'B', accidental: null, octave: 4 }, STAFF_LINES)
    expect(y).toBe(145)
  })

  it('F5 — top staff line', () => {
    const y = getAbsoluteNoteY({ letter: 'F', accidental: null, octave: 5 }, STAFF_LINES)
    expect(y).toBe(95)
  })

  it('B5 — 2 ledger lines above staff', () => {
    const y = getAbsoluteNoteY({ letter: 'B', accidental: null, octave: 5 }, STAFF_LINES)
    expect(y).toBe(57.5)
  })
})

describe('formatNoteFi', () => {
  it('C0 → subkontra c', () => {
    expect(formatNoteFi({ letter: 'C', accidental: null, octave: 0 })).toBe('subkontra c')
  })

  it('G3 → pikku g', () => {
    expect(formatNoteFi({ letter: 'G', accidental: null, octave: 3 })).toBe('pikku g')
  })

  it('A4 → 1-viivainen a', () => {
    expect(formatNoteFi({ letter: 'A', accidental: null, octave: 4 })).toBe('1-viivainen a')
  })

  it('F#5 → 2-viivainen fis', () => {
    expect(formatNoteFi({ letter: 'F', accidental: '#', octave: 5 })).toBe('2-viivainen fis')
  })

  it('C8 → 5-viivainen c', () => {
    expect(formatNoteFi({ letter: 'C', accidental: null, octave: 8 })).toBe('5-viivainen c')
  })
})

describe('formatNoteHelmholtz', () => {
  it('C2 → C (suuri)', () => {
    expect(formatNoteHelmholtz({ letter: 'C', accidental: null, octave: 2 })).toBe('C')
  })

  it('G3 → g (pieni)', () => {
    expect(formatNoteHelmholtz({ letter: 'G', accidental: null, octave: 3 })).toBe('g')
  })

  it('A4 → a\' (yksiviivainen)', () => {
    expect(formatNoteHelmholtz({ letter: 'A', accidental: null, octave: 4 })).toBe("a'")
  })

  it('D5 → d\'\' (kaksiviivainen)', () => {
    expect(formatNoteHelmholtz({ letter: 'D', accidental: null, octave: 5 })).toBe("d''")
  })

  it('C1 → C, (kontra)', () => {
    expect(formatNoteHelmholtz({ letter: 'C', accidental: null, octave: 1 })).toBe('C,')
  })
})

describe('formatNoteSPN', () => {
  it('G#3 → G#3', () => {
    expect(formatNoteSPN({ letter: 'G', accidental: '#', octave: 3 })).toBe('G#3')
  })
})

describe('buildArpeggioNotesWithOctave', () => {
  it('G-duuri: G3, B3, D4, G4', () => {
    const scale = getScale('G', 'ionian')
    const arp = buildArpeggioNotesWithOctave(scale, 'G')
    expect(arp).toEqual([
      { letter: 'G', accidental: null, octave: 3 },
      { letter: 'B', accidental: null, octave: 3 },
      { letter: 'D', accidental: null, octave: 4 },
      { letter: 'G', accidental: null, octave: 4 },
    ])
  })

  it('A-molli: A3, C4, E4, A4', () => {
    const scale = getScale('A', 'aeolian')
    const arp = buildArpeggioNotesWithOctave(scale, 'A')
    expect(arp).toEqual([
      { letter: 'A', accidental: null, octave: 3 },
      { letter: 'C', accidental: null, octave: 4 },
      { letter: 'E', accidental: null, octave: 4 },
      { letter: 'A', accidental: null, octave: 4 },
    ])
  })

  it('D-duuri: D4, F#4, A4, D5', () => {
    const scale = getScale('D', 'ionian')
    const arp = buildArpeggioNotesWithOctave(scale, 'D')
    expect(arp).toEqual([
      { letter: 'D', accidental: null, octave: 4 },
      { letter: 'F', accidental: '#', octave: 4 },
      { letter: 'A', accidental: null, octave: 4 },
      { letter: 'D', accidental: null, octave: 5 },
    ])
  })
})
