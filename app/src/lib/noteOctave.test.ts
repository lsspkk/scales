import { describe, it, expect } from 'vitest'
import {
  getAbsoluteNoteY,
  formatNoteFi,
  formatNoteHelmholtz,
  formatNoteSPN,
  isInDrawingRange,
  assignAscendingOctaves,
  SCALE_START_OCTAVE,
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

describe('buildArpeggioNotesWithOctave (aligned with scale-start octave)', () => {
  it('G-duuri: G4, B4, D5, G5 (root on staff line 2 = same as scale root)', () => {
    const scale = getScale('G', 'ionian')
    const arp = buildArpeggioNotesWithOctave(scale, 'G')
    expect(arp).toEqual([
      { letter: 'G', accidental: null, octave: 4 },
      { letter: 'B', accidental: null, octave: 4 },
      { letter: 'D', accidental: null, octave: 5 },
      { letter: 'G', accidental: null, octave: 5 },
    ])
  })

  it('A-molli: A4, C5, E5, A5', () => {
    const scale = getScale('A', 'aeolian')
    const arp = buildArpeggioNotesWithOctave(scale, 'A')
    expect(arp).toEqual([
      { letter: 'A', accidental: null, octave: 4 },
      { letter: 'C', accidental: null, octave: 5 },
      { letter: 'E', accidental: null, octave: 5 },
      { letter: 'A', accidental: null, octave: 5 },
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

describe('isInDrawingRange (G3..G6 inclusive)', () => {
  it('G3 is in range', () => {
    expect(isInDrawingRange({ letter: 'G', accidental: null, octave: 3 })).toBe(true)
  })

  it('F#3 is out of range (below G3)', () => {
    expect(isInDrawingRange({ letter: 'F', accidental: '#', octave: 3 })).toBe(false)
  })

  it('G6 is in range', () => {
    expect(isInDrawingRange({ letter: 'G', accidental: null, octave: 6 })).toBe(true)
  })

  it('G#6 is in range (accidental ignored for range check, still on G letter)', () => {
    expect(isInDrawingRange({ letter: 'G', accidental: '#', octave: 6 })).toBe(true)
  })

  it('A6 is out of range (above G6)', () => {
    expect(isInDrawingRange({ letter: 'A', accidental: null, octave: 6 })).toBe(false)
  })
})

describe('assignAscendingOctaves', () => {
  it('G major scale starting at octave 4 → G4..G5', () => {
    const scale = getScale('G', 'ionian')
    const notes = assignAscendingOctaves(scale, 4)
    expect(notes.map(formatNoteSPN)).toEqual(['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'])
  })

  it('A minor scale starting at octave 4 → A4..A5', () => {
    const scale = getScale('A', 'aeolian')
    const notes = assignAscendingOctaves(scale, 4)
    expect(notes.map(formatNoteSPN)).toEqual(['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5'])
  })

  it('D major scale at octave 4 → D4..D5', () => {
    const scale = getScale('D', 'ionian')
    const notes = assignAscendingOctaves(scale, 4)
    expect(notes.map(formatNoteSPN)).toEqual(['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'])
  })
})

describe('Scale root Y position matches arpeggio root Y position', () => {
  it('G root lands at y=170 (staff line 2 of [95,120,145,170,195])', () => {
    const scaleNotes = assignAscendingOctaves(getScale('G', 'ionian'), SCALE_START_OCTAVE.G)
    const arpNotes = buildArpeggioNotesWithOctave(getScale('G', 'ionian'), 'G')
    const scaleRootY = getAbsoluteNoteY(scaleNotes[0], STAFF_LINES)
    const arpRootY = getAbsoluteNoteY(arpNotes[0], STAFF_LINES)
    expect(scaleRootY).toBe(170)
    expect(arpRootY).toBe(170)
  })

  it('D root lands at y=207.5', () => {
    const scaleNotes = assignAscendingOctaves(getScale('D', 'ionian'), SCALE_START_OCTAVE.D)
    const arpNotes = buildArpeggioNotesWithOctave(getScale('D', 'ionian'), 'D')
    expect(getAbsoluteNoteY(scaleNotes[0], STAFF_LINES)).toBe(207.5)
    expect(getAbsoluteNoteY(arpNotes[0], STAFF_LINES)).toBe(207.5)
  })

  it('A root lands at y=157.5', () => {
    const scaleNotes = assignAscendingOctaves(getScale('A', 'ionian'), SCALE_START_OCTAVE.A)
    const arpNotes = buildArpeggioNotesWithOctave(getScale('A', 'ionian'), 'A')
    expect(getAbsoluteNoteY(scaleNotes[0], STAFF_LINES)).toBe(157.5)
    expect(getAbsoluteNoteY(arpNotes[0], STAFF_LINES)).toBe(157.5)
  })
})
