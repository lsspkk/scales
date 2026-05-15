/**
 * Pure canvas drawing library for music staves.
 * No React dependencies — receives CanvasRenderingContext2D and geometry via parameters.
 *
 * All geometry scales with the canvas's actual CSS-pixel size, which the
 * caller must supply via `computeLayout`. Horizontal 1px strokes use
 * `Math.round(y) + 0.5` so they remain crisp at any device-pixel ratio.
 */

import { getScale } from './musicScale'
import {
  type NoteWithOctave,
  getAbsoluteNoteY,
  isInDrawingRange,
  assignAscendingOctaves,
  SCALE_START_OCTAVE,
  formatNoteSPN,
} from './noteOctave'

export { type NoteWithOctave, getAbsoluteNoteY } from './noteOctave'

/** Configuration for staff layout and sizing. All units are CSS pixels. */
export interface StaveLayout {
  width: number
  height: number
  /** Number of staves: 1 = ascending only, 2 = ascending + descending */
  staves: 1 | 2
  /** Vertical distance between adjacent staff lines */
  lineSpacing: number
  /** Y-positions of the 5 staff lines for the first (upper) staff */
  staffLines: number[]
  /** Vertical gap between the upper staff's top line and the lower staff's top line */
  staffGap: number
  staffStartX: number
  staffEndX: number
  noteStartX: number
  noteSpacing: number
  clefFontSize: number
  clefX: number
  /** Horizontal scale applied to the clef glyph. Wider on desktop-sized canvases. */
  clefScaleX: number
  accidentalFontSize: number
  noteHeadRadiusX: number
  noteHeadRadiusY: number
  stemLength: number
  ledgerHalfWidth: number
  /** Horizontal offset from a note's x to its accidental's x */
  accidentalOffsetX: number
}

/**
 * Compute a layout configuration from the canvas's measured CSS size.
 * Staff geometry scales with `height` (so the staff always fills the
 * available vertical space) and note spacing scales with `width`.
 */
export function computeLayout(options: { width: number; height: number; staves?: 1 | 2 }): StaveLayout {
  const { width, height, staves = 2 } = options

  // Vertical layout
  // - Two staves: upper at top 19%, gap 44% of height, lower below; line spacing = height/20.
  // - One staff: center it in the available height; line spacing = height/8 (caps at width/20
  //   so the staff doesn't dominate wide-and-short canvases).
  // Line spacing and staff top are snapped to whole pixels so the 5 staff
  // lines land at uniformly-spaced integer Ys. Without this, fractional
  // positions round inconsistently in `crispY` and one gap ends up ±1px,
  // which the eye reads as "that line is thicker."
  let lineSpacing: number
  let staffTop: number
  let staffGap: number
  if (staves === 2) {
    lineSpacing = Math.max(2, Math.round(height / 22))
    staffTop = Math.round(height * 0.19)
    staffGap = Math.round(height * 0.44)
  } else {
    lineSpacing = Math.max(2, Math.round(Math.min(height / 14, width / 26)))
    staffTop = Math.round(height / 2 - 2 * lineSpacing)
    staffGap = 0
  }
  const staffLines = [0, 1, 2, 3, 4].map((i) => staffTop + i * lineSpacing)

  // Horizontal layout — scales with width so the same code handles 260px and 1200px
  const staffStartX = 5
  const staffEndX = width - 5
  const noteStartX = Math.max(40, width * 0.115)
  const endPad = Math.max(30, width * 0.06)
  const noteSpacing = (width - noteStartX - endPad) / 7

  // Symbol sizes — anchored to lineSpacing so they keep their proportion
  const clefFontSize = lineSpacing * 5
  const clefX = Math.max(12, lineSpacing * 0.9)
  // Mobile canvases sit inside the 390px MobileShell; anything wider is desktop
  // and gets a 1.4× wider clef so the glyph doesn't look pinched.
  const clefScaleX = width > 500 ? 0.75 * 1.4 : 0.75
  const accidentalFontSize = lineSpacing * 1.85
  const noteHeadRadiusX = lineSpacing * 0.52
  const noteHeadRadiusY = lineSpacing * 0.34
  const stemLength = lineSpacing * 2.8
  const ledgerHalfWidth = lineSpacing * 0.8
  const accidentalOffsetX = lineSpacing * 1.3

  return {
    width,
    height,
    staves,
    lineSpacing,
    staffLines,
    staffGap,
    staffStartX,
    staffEndX,
    noteStartX,
    noteSpacing,
    clefFontSize,
    clefX,
    clefScaleX,
    accidentalFontSize,
    noteHeadRadiusX,
    noteHeadRadiusY,
    stemLength,
    ledgerHalfWidth,
    accidentalOffsetX,
  }
}

/** Snap a Y coordinate to a crisp 1px horizontal stroke. */
function crispY(y: number): number {
  return Math.round(y) + 0.5
}

/**
 * Draw the 5 staff lines for one or two staves.
 */
export function drawStaffLines(ctx: CanvasRenderingContext2D, layout: StaveLayout): void {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1

  for (const y of layout.staffLines) {
    const cy = crispY(y)
    ctx.beginPath()
    ctx.moveTo(layout.staffStartX, cy)
    ctx.lineTo(layout.staffEndX, cy)
    ctx.stroke()
  }

  if (layout.staves === 2) {
    for (const y of layout.staffLines) {
      const cy = crispY(y + layout.staffGap)
      ctx.beginPath()
      ctx.moveTo(layout.staffStartX, cy)
      ctx.lineTo(layout.staffEndX, cy)
      ctx.stroke()
    }
  }
}

/**
 * Draw the treble clef (𝄞) for one or two staves.
 */
export function drawTrebleClef(ctx: CanvasRenderingContext2D, layout: StaveLayout): void {
  ctx.fillStyle = '#000'
  ctx.font = `${layout.clefFontSize}px serif`
  ctx.textAlign = 'center'

  // The clef glyph's baseline sits just below the bottom staff line for a
  // visually centered curl on the G line (line 2 from the bottom = staffLines[3]).
  // Move the clef baseline up by 3 staff steps (D → G = 1.5 line spacings)
  // from just below the bottom staff line.
  const baselineOffset = layout.lineSpacing * 0.4 - layout.lineSpacing * 1.5
  const yPositions =
    layout.staves === 2
      ? [layout.staffLines[4] + baselineOffset, layout.staffLines[4] + layout.staffGap + baselineOffset]
      : [layout.staffLines[4] + baselineOffset]

  for (const clefY of yPositions) {
    const anchorY = clefY - layout.clefFontSize * 0.8
    ctx.save()
    ctx.translate(layout.clefX, anchorY)
    ctx.scale(layout.clefScaleX, 1.3)
    ctx.translate(-layout.clefX, -anchorY)
    ctx.fillText('𝄞', layout.clefX, clefY)
    ctx.restore()
  }
}

/**
 * Draw ledger lines above or below a staff as needed for a note.
 */
export function drawLedgerLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  staffLineYs: number[],
  halfWidth: number,
): void {
  const top = staffLineYs[0]
  const bottom = staffLineYs[4]
  const step = staffLineYs[1] - staffLineYs[0]

  ctx.lineWidth = 1

  if (y > bottom + 2) {
    for (let ly = bottom + step; ly <= y + 2; ly += step) {
      const cy = crispY(ly)
      ctx.beginPath()
      ctx.moveTo(x - halfWidth, cy)
      ctx.lineTo(x + halfWidth, cy)
      ctx.stroke()
    }
  }

  if (y < top - 2) {
    for (let ly = top - step; ly >= y - 2; ly -= step) {
      const cy = crispY(ly)
      ctx.beginPath()
      ctx.moveTo(x - halfWidth, cy)
      ctx.lineTo(x + halfWidth, cy)
      ctx.stroke()
    }
  }
}

/**
 * Draw an accidental symbol (♯, ♭, 𝄪, 𝄫).
 */
export function drawAccidental(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  accidental: string,
  fontSize: number,
): void {
  ctx.fillStyle = '#000'
  ctx.font = `bold ${fontSize}px serif`
  ctx.textAlign = 'center'

  const sharpY = y + fontSize * 0.31
  const flatY = y + fontSize * 0.22

  if (accidental === '#') ctx.fillText('♯', x, sharpY)
  else if (accidental === '##') ctx.fillText('𝄪', x, sharpY)
  else if (accidental === 'b') ctx.fillText('♭', x, flatY)
  else if (accidental === 'bb') ctx.fillText('𝄫', x, flatY)
}

/**
 * Draw a single note (head, stem, ledger lines, accidental) at an absolute
 * staff position derived from its pitch.
 *
 * Enforces the hard drawing range [G3, G6]. Notes outside this range are
 * logged via console.error and skipped — nothing is drawn for them.
 */
export function drawNoteAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  note: NoteWithOctave,
  staffLineYs: number[],
  layout: StaveLayout,
): void {
  if (!isInDrawingRange(note)) {
    console.error(`Note out of range: ${formatNoteSPN(note)} (allowed G3–G6)`)
    return
  }

  const y = getAbsoluteNoteY(note, staffLineYs)

  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(x, y, layout.noteHeadRadiusX, layout.noteHeadRadiusY, -Math.PI / 6 - 0.087, 0, 2 * Math.PI)
  ctx.fill()

  const middleLineY = staffLineYs[2] + layout.lineSpacing * 0.4
  const stemOffsetX = layout.noteHeadRadiusX * 0.7
  ctx.lineWidth = 1.5
  ctx.beginPath()
  if (y < middleLineY) {
    ctx.moveTo(x - stemOffsetX, y)
    ctx.lineTo(x - stemOffsetX, y + layout.stemLength)
  } else {
    ctx.moveTo(x + stemOffsetX, y)
    ctx.lineTo(x + stemOffsetX, y - layout.stemLength)
  }
  ctx.stroke()

  drawLedgerLines(ctx, x, y, staffLineYs, layout.ledgerHalfWidth)

  if (note.accidental) {
    drawAccidental(ctx, x - layout.accidentalOffsetX, y, note.accidental, layout.accidentalFontSize)
  }
}

/**
 * Render a complete scale on the canvas.
 * Uses octave-aware absolute positioning so the root note lands on the same
 * staff line as the matching arpeggio root.
 */
export function renderScale(ctx: CanvasRenderingContext2D, key: string, mode: string, layout: StaveLayout): void {
  ctx.clearRect(0, 0, layout.width, layout.height)

  drawStaffLines(ctx, layout)
  drawTrebleClef(ctx, layout)

  const scale = getScale(key, mode)
  const rootLetter = key.replace(/[#b].*$/, '')
  const startOctave = SCALE_START_OCTAVE[key] ?? SCALE_START_OCTAVE[rootLetter] ?? 4
  const notes = assignAscendingOctaves(scale, startOctave)

  const upperStaffLines = layout.staffLines
  const lowerStaffLines = layout.staffLines.map((y) => y + layout.staffGap)

  const ascShift = notes[0]?.accidental ? layout.accidentalOffsetX : 0
  notes.forEach((note, i) => {
    const x = layout.noteStartX + ascShift + i * layout.noteSpacing
    drawNoteAt(ctx, x, note, upperStaffLines, layout)
  })

  if (layout.staves === 2) {
    const reversed = [...notes].reverse()
    const descShift = reversed[0]?.accidental ? layout.accidentalOffsetX : 0
    reversed.forEach((note, i) => {
      const x = layout.noteStartX + descShift + i * layout.noteSpacing
      drawNoteAt(ctx, x, note, lowerStaffLines, layout)
    })
  }
}

export function renderArpeggio(ctx: CanvasRenderingContext2D, notes: NoteWithOctave[], layout: StaveLayout): void {
  ctx.clearRect(0, 0, layout.width, layout.height)

  drawStaffLines(ctx, layout)
  drawTrebleClef(ctx, layout)

  const staffLineYs = layout.staffLines
  const noteCount = notes.length
  if (noteCount === 0) return

  const endX = layout.staffEndX - Math.max(20, layout.width * 0.06)
  const startX = notes[0]?.accidental ? layout.noteStartX + layout.accidentalOffsetX : layout.noteStartX
  const spacing = noteCount > 1 ? (endX - startX) / (noteCount - 1) : 0

  for (let i = 0; i < noteCount; i++) {
    const x = startX + i * spacing
    drawNoteAt(ctx, x, notes[i], staffLineYs, layout)
  }
}
