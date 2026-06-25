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

export type ScaleDirection = 'ascending' | 'descending'

/** Configuration for staff layout and sizing. All units are CSS pixels. */
export interface StaveLayout {
  width: number
  height: number
  /** Number of staves: 1 = ascending only, 2 = ascending + descending */
  staves: 1 | 2
  /**
   * Number of vertically-stacked "systems" (full staves) the same scale wraps onto.
   * 1 = the whole scale on one staff; 2 = the scale split at the octave boundary into
   * a top system (notes 0–7) and a bottom system (notes 8…top). Distinct from `staves`
   * (which is the ascending/descending mirror used by Kirkkosävellajit).
   */
  systems: 1 | 2
  /** Vertical distance between adjacent staff lines */
  lineSpacing: number
  /** Y-positions of the 5 staff lines for the first (upper) staff */
  staffLines: number[]
  /** Y-positions of the 5 staff lines for the second system (only when `systems === 2`). */
  staffLines2: number[] | null
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
export function computeLayout(options: {
  width: number
  height: number
  staves?: 1 | 2
  /** Wrap a multi-octave scale onto two stacked systems (mobile). Default 1. */
  systems?: 1 | 2
  /** Note count of the fullest line — drives horizontal spacing. Default 8 (one octave). */
  noteCount?: number
}): StaveLayout {
  const { width, height, staves = 2, systems = 1, noteCount = 8 } = options

  // Vertical layout
  // - Two staves (mirror): upper at top 19%, gap 44% of height, lower below.
  // - Two systems (wrapped scale): two equal staves with a generous gap between them
  //   so it's obvious which notes belong to which; the whole block is centered.
  // - One staff: center it in the available height; line spacing = height/8 (caps at width/20
  //   so the staff doesn't dominate wide-and-short canvases).
  // Line spacing and staff top are snapped to whole pixels so the 5 staff
  // lines land at uniformly-spaced integer Ys. Without this, fractional
  // positions round inconsistently in `crispY` and one gap ends up ±1px,
  // which the eye reads as "that line is thicker."
  let lineSpacing: number
  let staffTop: number
  let staffGap: number
  let staffLines2: number[] | null = null
  if (systems === 2) {
    // Each system is a full 4·L-tall staff; `systemGap` (9·L) separates the bottom
    // line of system 1 from the top line of system 2. That gap is the dominant empty
    // zone: it clears system 1's low ledger notes hanging down and system 2's high
    // (D6/C#6 … up to the octave-4 ceiling) ledger notes rising up, and keeps the two
    // systems visually distinct. The 13·L block (top line of system 1 → bottom line of
    // system 2) is centered, leaving ~1.5·L margins for the outermost ledger notes.
    lineSpacing = Math.max(2, Math.round(Math.min(height / 16, width / 24)))
    const systemGap = 9 * lineSpacing // top line of system 1 → top line of system 2
    staffTop = Math.round((height - (systemGap + 4 * lineSpacing)) / 2)
    staffGap = 0
    staffLines2 = [0, 1, 2, 3, 4].map((i) => staffTop + systemGap + i * lineSpacing)
  } else if (staves === 2) {
    lineSpacing = Math.max(2, Math.round(height / 22))
    staffTop = Math.round(height * 0.19)
    staffGap = Math.round(height * 0.44)
  } else {
    const isMobileSingleStaff = width <= 500
    lineSpacing = Math.max(
      2,
      Math.round(Math.min(height / (isMobileSingleStaff ? 10.5 : 14), width / (isMobileSingleStaff ? 22 : 26))),
    )
    staffTop = Math.round(height / 2 - 2 * lineSpacing)
    staffGap = 0
  }
  const staffLines = [0, 1, 2, 3, 4].map((i) => staffTop + i * lineSpacing)

  // Horizontal layout — scales with width so the same code handles 260px and 1200px.
  // Spacing is based on the fullest line: a wrapped scale's first system always holds a
  // full octave (8 notes → 7 gaps) so a short second system left-aligns and lines up
  // under it; an unwrapped one-system scale spreads its actual `noteCount` across the width.
  const staffStartX = 5
  const staffEndX = width - 5
  const noteStartX = Math.max(40, width * 0.115)
  const endPad = Math.max(30, width * 0.06)
  const spacingGaps = systems === 2 ? 7 : Math.max(1, noteCount - 1)
  const noteSpacing = (width - noteStartX - endPad) / spacingGaps

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
    systems,
    lineSpacing,
    staffLines,
    staffLines2,
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

  if (layout.staffLines2) {
    for (const y of layout.staffLines2) {
      const cy = crispY(y)
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
      : layout.staffLines2
        ? [layout.staffLines[4] + baselineOffset, layout.staffLines2[4] + baselineOffset]
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
  color: string = '#000',
): void {
  ctx.fillStyle = color
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
 *
 * `opacity` (0..1, default 1) applies to head, stem, ledger lines, and the
 * accidental — the whole rendered note dims as one unit. Used by the
 * hidden-note challenge in Harjoittelu (Task 26) to draw selected notes at
 * 10% opacity without disturbing layout.
 */
export function drawNoteAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  note: NoteWithOctave,
  staffLineYs: number[],
  layout: StaveLayout,
  opacity: number = 1,
  color: string = '#000',
): void {
  if (!isInDrawingRange(note)) {
    console.error(`Note out of range: ${formatNoteSPN(note)} (allowed G3–G6)`)
    return
  }

  const y = getAbsoluteNoteY(note, staffLineYs)

  ctx.save()
  ctx.globalAlpha = opacity

  ctx.fillStyle = color
  ctx.strokeStyle = color
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
    drawAccidental(ctx, x - layout.accidentalOffsetX, y, note.accidental, layout.accidentalFontSize, color)
  }

  ctx.restore()
}

/**
 * Match a note against a set of hidden-note strings like "F#", "Bb", or "C".
 * Octave is ignored — hiding is by pitch class within the current key
 * spelling so both the ascending and descending instance of e.g. F# disappear
 * together.
 */
function noteKey(note: NoteWithOctave): string {
  return `${note.letter}${note.accidental ?? ''}`
}

function opacityFor(note: NoteWithOctave, hiddenNotes?: ReadonlySet<string> | null): number {
  if (!hiddenNotes || hiddenNotes.size === 0) return 1
  return hiddenNotes.has(noteKey(note)) ? 0.1 : 1
}

function colorFor(
  note: NoteWithOctave,
  highlightNotes: ReadonlySet<string> | null | undefined,
  highlightColor: string,
  basicNoteColor?: string,
): string {
  // Octave-aware first (e.g. "C5" matches only that octave so the root and its
  // octave repeat don't both light up), then fall back to pitch-class ("C").
  if (highlightNotes && (highlightNotes.has(`${noteKey(note)}${note.octave}`) || highlightNotes.has(noteKey(note))))
    return highlightColor
  return basicNoteColor ?? '#000'
}

/**
 * Render a complete scale on the canvas.
 * Uses octave-aware absolute positioning so the root note lands on the same
 * staff line as the matching arpeggio root.
 *
 * `hiddenNotes` (optional, Task 26): set of pitch-class strings such as
 * "F#" / "Bb" / "C". Any rendered instance matching one of these draws at
 * 10% opacity so the student must recall it from memory.
 */
export function renderScale(
  ctx: CanvasRenderingContext2D,
  key: string,
  mode: string,
  layout: StaveLayout,
  hiddenNotes?: ReadonlySet<string> | null,
  highlightNotes?: ReadonlySet<string> | null,
  highlightColor: string = '#a0563f',
  basicNoteColor?: string,
  direction: ScaleDirection = 'ascending',
  /**
   * Precomputed, reach-aware scale sequence (from `getScaleNotes`) for multi-octave /
   * "1+" scales. When omitted, a single ascending octave is built from `key`/`mode`
   * (the original behaviour Kirkkosävellajit + 1-octave callers rely on).
   */
  precomputedNotes?: NoteWithOctave[] | null,
): void {
  ctx.clearRect(0, 0, layout.width, layout.height)

  drawStaffLines(ctx, layout)
  drawTrebleClef(ctx, layout)

  let ascendingNotes: NoteWithOctave[]
  if (precomputedNotes && precomputedNotes.length > 0) {
    ascendingNotes = precomputedNotes
  } else {
    const scale = getScale(key, mode)
    const rootLetter = key.replace(/[#b].*$/, '')
    const startOctave = SCALE_START_OCTAVE[key] ?? SCALE_START_OCTAVE[rootLetter] ?? 4
    ascendingNotes = assignAscendingOctaves(scale, startOctave)
  }

  const drawRow = (rowNotes: NoteWithOctave[], staffLineYs: number[]) => {
    const shift = rowNotes[0]?.accidental ? layout.accidentalOffsetX : 0
    rowNotes.forEach((note, i) => {
      const x = layout.noteStartX + shift + i * layout.noteSpacing
      drawNoteAt(
        ctx,
        x,
        note,
        staffLineYs,
        layout,
        opacityFor(note, hiddenNotes),
        colorFor(note, highlightNotes, highlightColor, basicNoteColor),
      )
    })
  }

  if (layout.staves === 2) {
    // Ascending/descending mirror (Kirkkosävellajit): top staff up, bottom staff down.
    drawRow(ascendingNotes, layout.staffLines)
    drawRow(
      [...ascendingNotes].reverse(),
      layout.staffLines.map((y) => y + layout.staffGap),
    )
    return
  }

  // Single-staff scale. The playing-order sequence reverses when descending so both
  // wrapped systems read in playing order (generalises the old one-octave reverse).
  const ordered = direction === 'descending' ? [...ascendingNotes].reverse() : ascendingNotes

  if (layout.systems === 2 && layout.staffLines2) {
    // Wrap at the octave boundary: system 1 = notes 0–7, system 2 = notes 8…top.
    drawRow(ordered.slice(0, 7), layout.staffLines)
    drawRow(ordered.slice(7), layout.staffLines2)
  } else {
    drawRow(ordered, layout.staffLines)
  }
}

export function renderArpeggio(
  ctx: CanvasRenderingContext2D,
  notes: NoteWithOctave[],
  layout: StaveLayout,
  hiddenNotes?: ReadonlySet<string> | null,
): void {
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
    drawNoteAt(ctx, x, notes[i], staffLineYs, layout, opacityFor(notes[i], hiddenNotes))
  }
}
