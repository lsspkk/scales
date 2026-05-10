/**
 * Pure canvas drawing library for music staves.
 * No React dependencies — receives CanvasRenderingContext2D and geometry via parameters.
 */

import { getScale, getNoteInfo, getNoteY } from './musicScale'
import { type NoteWithOctave, getAbsoluteNoteY, DRAWING_RANGE, DIATONIC_INDEX } from './noteOctave'

export { type NoteWithOctave, getAbsoluteNoteY } from './noteOctave'

/** Configuration for staff layout and sizing */
export interface StaveLayout {
  width: number
  height: number
  /** Number of staves: 1 = ascending only, 2 = ascending + descending */
  staves: 1 | 2
  /** Y-positions of the 5 staff lines for the first (upper) staff */
  staffLines: number[]
  /** Vertical gap between staves when staves=2 */
  staffGap: number
  /** X coordinate where staff lines start */
  staffStartX: number
  /** X coordinate where staff lines end */
  staffEndX: number
  /** X coordinate where the first note is drawn */
  noteStartX: number
  /** Horizontal spacing between notes */
  noteSpacing: number
  /** Treble clef font size */
  clefFontSize: number
  /** X position for treble clef */
  clefX: number
  /** Accidental font size (larger on mobile) */
  accidentalFontSize: number
  /** Whether this is a compact layout */
  compact: boolean
}

/**
 * Compute a complete layout configuration from high-level options.
 * This replaces scattered arithmetic throughout the drawing code.
 */
export function computeLayout(options: {
  width: number
  height: number
  staves?: 1 | 2
  mobile?: boolean
  compact?: boolean
}): StaveLayout {
  const { width, height, staves = 2, mobile = false, compact = false } = options

  // Staff line positions for upper staff (5 lines)
  const staffLines = [95, 120, 145, 170, 195]
  const staffGap = 220

  // Staff line horizontal bounds
  const staffStartX = compact ? 5 : mobile ? 5 : -5
  const staffEndX = width - 5

  // Note layout
  const noteStartX = compact ? 50 : mobile ? 90 : 115
  const endPad = compact ? 10 : mobile ? 40 : 60
  // For an 8-note scale, we need spacing for 7 intervals
  const noteSpacing = (width - noteStartX - endPad) / 7

  // Clef sizing
  const clefFontSize = compact ? 80 : mobile ? 146 : 126
  const clefX = compact ? 15 : 25

  // Accidental sizing
  const accidentalFontSize = compact ? 24 : mobile ? 48 : 36

  return {
    width,
    height,
    staves,
    staffLines,
    staffGap,
    staffStartX,
    staffEndX,
    noteStartX,
    noteSpacing,
    clefFontSize,
    clefX,
    accidentalFontSize,
    compact,
  }
}

/**
 * Draw the 5 staff lines for one or two staves.
 */
export function drawStaffLines(
  ctx: CanvasRenderingContext2D,
  layout: StaveLayout
): void {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  
  // Upper staff
  for (const y of layout.staffLines) {
    ctx.beginPath()
    ctx.moveTo(layout.staffStartX, y)
    ctx.lineTo(layout.staffEndX, y)
    ctx.stroke()
  }
  
  // Lower staff (if two staves)
  if (layout.staves === 2) {
    for (const y of layout.staffLines) {
      ctx.beginPath()
      ctx.moveTo(layout.staffStartX, y + layout.staffGap)
      ctx.lineTo(layout.staffEndX, y + layout.staffGap)
      ctx.stroke()
    }
  }
}

/**
 * Draw the treble clef (𝄞) for one or two staves.
 */
export function drawTrebleClef(
  ctx: CanvasRenderingContext2D,
  layout: StaveLayout
): void {
  ctx.fillStyle = '#000'
  ctx.font = `${layout.clefFontSize}px serif`
  ctx.textAlign = 'center'
  
  const yOffset = 10
  const baseY = 153 + yOffset // Reference Y for clef positioning
  
  const yPositions = layout.staves === 2
    ? [baseY, baseY + layout.staffGap]
    : [baseY]
  
  for (const clefY of yPositions) {
    const anchorY = clefY - 100
    ctx.save()
    ctx.translate(layout.clefX, anchorY)
    ctx.scale(0.75, 1.3)
    ctx.translate(-layout.clefX, -anchorY)
    ctx.fillText('𝄞', layout.clefX, clefY)
    ctx.restore()
  }
}

/**
 * Draw ledger lines above or below a staff as needed for a note.
 * @param staffLineYs - The 5 Y-positions for the staff the note belongs to
 */
export function drawLedgerLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  staffLineYs: number[]
): void {
  const top = staffLineYs[0]
  const bottom = staffLineYs[4]
  const step = staffLineYs[1] - staffLineYs[0]
  
  ctx.lineWidth = 1.5
  
  // Ledger lines below staff
  if (y > bottom + 2) {
    for (let ly = bottom + step; ly <= y + 2; ly += step) {
      ctx.beginPath()
      ctx.moveTo(x - 20, ly)
      ctx.lineTo(x + 20, ly)
      ctx.stroke()
    }
  }
  
  // Ledger lines above staff
  if (y < top - 2) {
    for (let ly = top - step; ly >= y - 2; ly -= step) {
      ctx.beginPath()
      ctx.moveTo(x - 20, ly)
      ctx.lineTo(x + 20, ly)
      ctx.stroke()
    }
  }
}

/**
 * Draw an accidental symbol (♯, ♭, 𝄪, 𝄫).
 * @param fontSize - Font size for the accidental
 */
export function drawAccidental(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  accidental: string,
  fontSize: number
): void {
  ctx.fillStyle = '#000'
  ctx.font = `bold ${fontSize}px serif`
  ctx.textAlign = 'center'
  
  // Y offset depends on font size and accidental type
  const large = fontSize >= 48
  const sharpY = large ? y + 14 : y + 11
  const flatY = large ? y + 10 : y + 8
  
  if (accidental === '#') ctx.fillText('♯', x, sharpY)
  else if (accidental === '##') ctx.fillText('𝄪', x, sharpY)
  else if (accidental === 'b') ctx.fillText('♭', x, flatY)
  else if (accidental === 'bb') ctx.fillText('𝄫', x, flatY)
}

/**
 * Draw a single note (head, stem, ledger lines, accidental).
 * @param staffLineYs - The 5 Y-positions for the staff this note is on
 */
export function drawNote(
  ctx: CanvasRenderingContext2D,
  x: number,
  note: string,
  staff: 'upper' | 'lower',
  scaleIndex: number,
  currentKey: string,
  staffLineYs: number[],
  accidentalFontSize: number
): void {
  const info = getNoteInfo(note)
  const y = getNoteY(info.noteName, info.octave, staff, scaleIndex, currentKey)
  
  // Note head (ellipse)
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(x, y, 13, 8.5, -Math.PI / 6 - 0.087, 0, 2 * Math.PI)
  ctx.fill()
  
  // Stem direction based on note position relative to B line
  const bLineY = staffLineYs[2] + 10 // B line is roughly at index 2 + offset
  ctx.lineWidth = 2
  if (y < bLineY) {
    // Stem down (on left side)
    ctx.beginPath()
    ctx.moveTo(x - 9, y)
    ctx.lineTo(x - 9, y + 70)
    ctx.stroke()
  } else {
    // Stem up (on right side)
    ctx.beginPath()
    ctx.moveTo(x + 9, y)
    ctx.lineTo(x + 9, y - 70)
    ctx.stroke()
  }
  
  // Ledger lines
  drawLedgerLines(ctx, x, y, staffLineYs)
  
  // Accidental
  if (info.accidental) {
    drawAccidental(ctx, x - 32, y, info.accidental, accidentalFontSize)
  }
}

/**
 * Render a complete scale on the canvas.
 * Clears the canvas and draws staff, clef, and all notes.
 */
export function renderScale(
  ctx: CanvasRenderingContext2D,
  key: string,
  mode: string,
  layout: StaveLayout
): void {
  // Clear canvas
  ctx.clearRect(0, 0, layout.width, layout.height)
  
  // Draw staff lines and clef
  drawStaffLines(ctx, layout)
  drawTrebleClef(ctx, layout)
  
  // Get scale notes
  const scale = getScale(key, mode)
  
  // Upper staff Y-positions
  const upperStaffLines = layout.staffLines
  // Lower staff Y-positions (offset by staffGap)
  const lowerStaffLines = layout.staffLines.map(y => y + layout.staffGap)
  
  // Draw ascending scale on upper staff
  scale.forEach((note, i) => {
    const x = layout.noteStartX + i * layout.noteSpacing
    drawNote(ctx, x, note, 'upper', i, key, upperStaffLines, layout.accidentalFontSize)
  })
  
  // Draw descending scale on lower staff (if two staves)
  if (layout.staves === 2) {
    const reversed = [...scale].reverse()
    reversed.forEach((note, i) => {
      const x = layout.noteStartX + i * layout.noteSpacing
      drawNote(ctx, x, note, 'lower', scale.length - 1 - i, key, lowerStaffLines, layout.accidentalFontSize)
    })
  }
}

function isInDrawingRange(note: NoteWithOctave): boolean {
  const pos = note.octave * 7 + DIATONIC_INDEX[note.letter]
  const minPos = DRAWING_RANGE.min.octave * 7 + DIATONIC_INDEX[DRAWING_RANGE.min.letter]
  const maxPos = DRAWING_RANGE.max.octave * 7 + DIATONIC_INDEX[DRAWING_RANGE.max.letter]
  return pos >= minPos && pos <= maxPos
}

export function drawNoteAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  accidental: string | null,
  accidentalFontSize: number,
  staffLineYs: number[]
): void {
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(x, y, 13, 8.5, -Math.PI / 6 - 0.087, 0, 2 * Math.PI)
  ctx.fill()

  const bLineY = staffLineYs[2] + 10
  ctx.lineWidth = 2
  if (y < bLineY) {
    ctx.beginPath()
    ctx.moveTo(x - 9, y)
    ctx.lineTo(x - 9, y + 70)
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.moveTo(x + 9, y)
    ctx.lineTo(x + 9, y - 70)
    ctx.stroke()
  }

  drawLedgerLines(ctx, x, y, staffLineYs)

  if (accidental) {
    drawAccidental(ctx, x - 32, y, accidental, accidentalFontSize)
  }
}

export function renderArpeggio(
  ctx: CanvasRenderingContext2D,
  notes: NoteWithOctave[],
  layout: StaveLayout
): void {
  ctx.clearRect(0, 0, layout.width, layout.height)

  drawStaffLines(ctx, layout)
  drawTrebleClef(ctx, layout)

  const staffLineYs = layout.staffLines
  const noteCount = notes.length
  if (noteCount === 0) return

  const endX = layout.staffEndX - (layout.compact ? 10 : 60)
  const spacing = noteCount > 1 ? (endX - layout.noteStartX) / (noteCount - 1) : 0

  for (let i = 0; i < noteCount; i++) {
    const note = notes[i]
    if (!isInDrawingRange(note)) {
      console.warn(`Note ${note.letter}${note.accidental ?? ''}${note.octave} is outside drawing range G3–B5`)
      continue
    }
    const x = layout.noteStartX + i * spacing
    const y = getAbsoluteNoteY(note, staffLineYs)
    drawNoteAt(ctx, x, y, note.accidental, layout.accidentalFontSize, staffLineYs)
  }
}
