import { getScale } from './musicScale'
import { assignAscendingOctaves, SCALE_START_OCTAVE, type NoteWithOctave } from './noteOctave'
import {
  createNecklace,
  rollQuality,
  rollPalette,
  mulberry32,
  COLOR_PATTERNS,
  FORM_SETS,
  type FormSet,
  type NecklaceModel,
  type SocketFill,
} from './necklace'

/*
 * Pure builders shared by the Jalokiviasteikko game screen and its test screen.
 * No React here — each function just returns a NecklaceModel or scale data the
 * screens render. The look-of-each-level dials live in necklace.ts (LEVEL_*).
 */

/** Per-socket reward levels (0–10) shown in the admire view: the *set* (ascending)
 *  pass and the *polish* (descending) pass, each null until that pass resolves. */
export interface NoteScore {
  mine: number | null
  polish: number | null
}

/** One note phase in the up-and-down run. */
export interface Step {
  /** Socket / scale-note index this step targets. */
  index: number
  /** 'mine' = ascending ore (set pass → colour); 'polish' = descending/turn gem (polish pass → finish). */
  kind: 'mine' | 'polish'
}

/** Build the step list for one up-and-down run over the scale (top = last index).
 *  The top note is played twice (ascending mine, then the octave-turn polish repeat);
 *  both get the normal between-note + reveal cadence so the turn isn't a rushed repeat. */
export function buildSteps(top: number): Step[] {
  const steps: Step[] = []
  for (let i = 0; i <= top; i++) steps.push({ index: i, kind: 'mine' }) // ascending mine
  steps.push({ index: top, kind: 'polish' }) // octave-turn polish repeat (same cadence as the rest)
  for (let i = top - 1; i >= 0; i--) steps.push({ index: i, kind: 'polish' }) // descending polish
  return steps
}

/** Write one step's reward (0–10 level) into its socket and spin it to the front: the
 *  *mine* pass mines an ore + sets the colour intensity, the *polish* pass finishes the
 *  gem. The renderer maps the stored `level/10` carrier back to a 0–10 look via the
 *  LEVEL_* tables in necklace.ts. */
export function applyStepReward(model: NecklaceModel, step: Step, level: number): NecklaceModel {
  const unit = level / 10
  return {
    ...model,
    activeIndex: step.index,
    sockets: model.sockets.map((s, k) => {
      if (k !== step.index) return s
      return step.kind === 'mine'
        ? { ...s, fill: 'ore' as SocketFill, quality: unit } // set pass → colour intensity
        : { ...s, fill: 'gem' as SocketFill, gem: { ...s.gem, polish: unit } } // polish pass → finish
    }),
  }
}

/** A fresh, all-empty necklace with a freshly-rolled colour palette + gem shapes, ready
 *  to fill one socket at a time. */
export function freshNecklace(count: number): NecklaceModel {
  const pattern = COLOR_PATTERNS[Math.floor(Math.random() * COLOR_PATTERNS.length)]
  const formSet = FORM_SETS[Math.floor(Math.random() * FORM_SETS.length)]
  const seed = Math.floor(Math.random() * 1e9)
  return emptyNecklace(seed, count, rollPalette(pattern, count, mulberry32(seed)), formSet)
}

export function parseMode(value: string | null): string {
  return value === 'aeolian' ? 'aeolian' : 'ionian'
}

export function scaleLabel(root: string, mode: string): string {
  return `${root}-${mode === 'aeolian' ? 'molli' : 'duuri'}`
}

/** Letter + accidental for a note identifier, as Tähtiasteikko renders it (e.g. "C", "F#"). */
export const noteLetter = (note: NoteWithOctave) => `${note.letter}${note.accidental ?? ''}`

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
): NoteWithOctave[] {
  const scale = getScale(root, mode) // 8 entries, last = root one octave up
  const rootLetter = root.replace(/[#b].*$/, '')
  const startOctave = SCALE_START_OCTAVE[root] ?? SCALE_START_OCTAVE[rootLetter] ?? 4
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

/** A fully-crafted necklace (every socket a finished gem) for the idle backdrop. */
export function decorativeNecklace(seed: number, count: number): NecklaceModel {
  const formSet = FORM_SETS[Math.floor(Math.random() * FORM_SETS.length)]
  const m = createNecklace(seed, count, { themeId: 'starforge', gemStyle: 'faceted', layoutMode: 'ring', formSet })
  return {
    ...m,
    sockets: m.sockets.map((s) => ({
      ...s,
      fill: 'gem' as SocketFill,
      quality: rollQuality(s.seed), // 0.45..1.0 → colour levels 5–10, all richly coloured
      // Keep the backdrop flawless: high polish → no cracks, plenty of sparkle.
      gem: { ...s.gem, polish: 0.75 + mulberry32(s.seed ^ 0x90115)() * 0.25 },
    })),
  }
}

/** A fresh, all-empty necklace to fill during a round (palette = the rolled gem colours,
 *  formSet = the rolled gem shapes). */
export function emptyNecklace(seed: number, count: number, palette: number[], formSet: FormSet): NecklaceModel {
  return createNecklace(seed, count, { themeId: 'starforge', gemStyle: 'faceted', layoutMode: 'ring', palette, formSet })
}

/** Test-mode necklace: a fresh random palette/shape-set with each socket already a
 *  finished gem whose colour + finish come straight from a hand-set 0–10 level. */
export function testNecklace(levels: number[]): NecklaceModel {
  const pattern = COLOR_PATTERNS[Math.floor(Math.random() * COLOR_PATTERNS.length)]
  const formSet = FORM_SETS[Math.floor(Math.random() * FORM_SETS.length)]
  const seed = Math.floor(Math.random() * 1e9)
  const count = levels.length
  const m = emptyNecklace(seed, count, rollPalette(pattern, count, mulberry32(seed)), formSet)
  return {
    ...m,
    sockets: m.sockets.map((s, k) => {
      const unit = levels[k] / 10
      return { ...s, fill: 'gem' as SocketFill, quality: unit, gem: { ...s.gem, polish: unit } }
    }),
  }
}
