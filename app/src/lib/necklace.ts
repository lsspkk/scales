/**
 * necklace.ts — pure procedural necklace renderer (no React, no DOM events).
 *
 * This is the "drawing engine" for the necklace look-dev spike (Task 33). It is
 * intentionally split from React so the maths and the painting are easy to read,
 * tweak, and test in isolation. A thin wrapper component (`NecklaceCanvas.tsx`)
 * measures the canvas, runs the animation loop, and calls into here once a frame.
 *
 * The file is organised in the order the pixels are produced:
 *
 *   1. Tiny seeded random        — same necklace every time for a given seed.
 *   2. Data model + themes        — what a necklace *is* (sockets, styles, colours).
 *   3. Layout maths               — where things sit on the canvas.
 *   4. Pseudo-3D ring projection  — the headline "spin the next socket into view".
 *   5. Drawing primitives         — gems, ore, sparkle, metal, chain links.
 *   6. Animation stepper          — eases the spin + runs per-socket effects.
 *   7. drawNecklace()             — the master per-frame paint that ties it together.
 *
 * Everything is plain 2D-canvas (gradients + strokes + paths). No images, no WebGL.
 */

// ---------------------------------------------------------------------------
// Small maths helpers used all over the file.
// ---------------------------------------------------------------------------

/** Full turn in radians. A ring of sockets is spread across one TAU. */
const TAU = Math.PI * 2

/** Linear blend: at t=0 returns a, at t=1 returns b. */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Keep a value inside [lo, hi]. */
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * "Pop" easing with a little overshoot (scale 0 → ~1.1 → 1). Linear growth feels
 * dead; this gentle overshoot is what makes a gem feel like it springs to life.
 */
const easeOutBack = (t: number) => {
  const c = 1.70158
  const p = t - 1
  return 1 + (c + 1) * p * p * p + c * p * p
}

// ---------------------------------------------------------------------------
// 1. Seeded pseudo-random number generator (mulberry32).
//
// Why seeded? Every visual wrinkle of a gem (its facet jitter, the lumpiness of
// its ore, the speckles) is generated from random numbers. If those numbers were
// truly random the necklace would shimmer with noise every frame. Instead we
// seed a generator from a fixed number, so the *same* seed always produces the
// *same* sequence — the gem looks identical frame to frame, and a saved necklace
// can be rebuilt from just its seed. Re-seed per socket so each stone is unique
// but stable.
// ---------------------------------------------------------------------------

/** Returns a function that yields a deterministic stream of floats in [0,1). */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------------------------------------------------------------------------
// 2. Data model — what a necklace is, plus the cosmetic style choices.
//
// These are the knobs the test page lets a human flip to compare looks. Logic
// never depends on them being any particular value, so adding/swapping styles
// is safe and cheap.
// ---------------------------------------------------------------------------

/** A socket is empty, holds raw ore (ascending), or a finished gem (descending). */
export type SocketFill = 'empty' | 'ore' | 'gem'

/** Gem render styles to A/B test. */
export type GemStyle = 'cabochon' | 'faceted'

/**
 * Procedural gem outline shapes. The polygonal forms support corner *cutting*
 * (chamfered corners — the emerald / asscher / trillion look); the round forms
 * (circle + the two ovals) have no corners, so they ignore the cut and read as
 * smooth stones. Named by side count: penta=5, hexa=6, hepta=7, octa=8, dodeca=12.
 */
export type GemForm =
  | 'circle'
  | 'ovalTall' // taller than wide
  | 'ovalWide' // wider than tall
  | 'triangle' // 3 sides
  | 'square' // 4
  | 'pentagon' // 5
  | 'hexagon' // 6
  | 'heptagon' // 7
  | 'octagon' // 8
  | 'dodecagon' // 12

/**
 * The mutable *appearance* of one gem — the data the game tweaks as a note is
 * earned. Quality first picks the colour + `form`; the descending "sanding" sets
 * `cut` / `table`; "polish" (later) raises seam crispness + sparkle. Stored as
 * plain data on the socket so it lives in memory and any field can be overwritten
 * whenever the player or the game situation calls for it.
 */
export interface GemSpec {
  /** Outline shape. */
  form: GemForm
  /** 0..1 corner cut: 0 = sharp corners, 1 = the two cuts meet at the edge midpoints (max). */
  cut: number
  /** 0.5..0.95 sanding: flat-table radius as a fraction of the gem (bigger = larger flat top, thinner edges). */
  table: number
  /** 0..1 polish: crispness of the bevel seams + sparkle gain. */
  polish: number
}

/** How the cord between gems is drawn. */
export type ChainStyle = 'rope' | 'beads' | 'cable'

/** The hero layout/motion — ring spins in 3D; arc is the calm hanging-necklace. */
export type LayoutMode = 'ring' | 'arc'

/** Theme = palette + metal + backdrop motif. Pure cosmetics. */
export type ThemeId = 'starforge' | 'dragonhoard' | 'moongarden'

/** Metal tier keyed by theme. Only the colour stops differ. */
export type MetalKey = 'bronze' | 'silver' | 'gold'

/** One gem slot. `seed` keeps its look stable; `quality` sets at fill time. */
export interface Socket {
  /** Per-socket PRNG seed → stable, unique stone. */
  seed: number
  /** Small hue wobble (±deg) so neighbours of the same colour still differ. */
  hueJitter: number
  /** Current contents. */
  fill: SocketFill
  /** 0..1 brilliance, decided when the socket is filled (here: rolled from seed). */
  quality: number
  /** Mutable gem appearance — shape, corner cut, sanding, polish. */
  gem: GemSpec
}

/** The whole necklace as plain data. The render reads a snapshot of this. */
export interface NecklaceModel {
  seed: number
  sockets: Socket[]
  /** Which socket the necklace presents to the player (spins to front). */
  activeIndex: number
  themeId: ThemeId
  gemStyle: GemStyle
  chainStyle: ChainStyle
  layoutMode: LayoutMode
  /** One hue per socket (cycled if shorter than the socket count); rolled from a colour pattern. */
  palette: number[]
}

interface Metal {
  hi: string
  mid: string
  lo: string
  spec: string
}

/**
 * Metal palettes (light → mid → dark + a bright specular). Flat `#FFD700` reads as
 * plastic; a *banded* gradient between these three stops is what makes metal look
 * curved and shiny (see `metalGradient`).
 */
export const METALS: Record<MetalKey, Metal> = {
  bronze: { hi: '#ffd9a0', mid: '#b87333', lo: '#5c3310', spec: '#fff2d6' },
  silver: { hi: '#ffffff', mid: '#b8c0c8', lo: '#5a626b', spec: '#ffffff' },
  gold: { hi: '#fff6c0', mid: '#e6b422', lo: '#8a6310', spec: '#fffbe6' },
}

export interface Theme {
  id: ThemeId
  /** Finnish UI label for the test page. */
  label: string
  /** Gem hues cycled across the sockets so the necklace reads as varied. */
  hues: number[]
  metal: MetalKey
  /** Backdrop gradient [outer dark, centre slightly lifted]. */
  bg: [string, string]
  /** Cheap background sparkle layer. */
  motif: 'stars' | 'embers' | 'fireflies'
  /** Glow colour around the active socket + motif tint. */
  accent: string
}

/**
 * Three themes to compare. Each keeps a dark anchor so the gems read as actual
 * light sources — that "dark base + luminous glow" combo is the reliable way to
 * look magical rather than flat.
 */
export const THEMES: Record<ThemeId, Theme> = {
  starforge: {
    id: 'starforge',
    label: 'Tähtipaja',
    hues: [190, 265, 210, 300, 175, 230, 280],
    metal: 'silver',
    bg: ['#070a18', '#161f3a'],
    motif: 'stars',
    accent: '#9fd0ff',
  },
  dragonhoard: {
    id: 'dragonhoard',
    label: 'Lohikäärmeen aarre',
    hues: [10, 35, 130, 50, 22, 150, 5],
    metal: 'gold',
    bg: ['#160a06', '#3a1f10'],
    motif: 'embers',
    accent: '#ffcf7a',
  },
  moongarden: {
    id: 'moongarden',
    label: 'Kuutarha',
    hues: [165, 320, 285, 200, 140, 340, 260],
    metal: 'bronze',
    bg: ['#0a0f12', '#1c2a2c'],
    motif: 'fireflies',
    accent: '#bfe6d0',
  },
}

/**
 * Hue families to roll real-gem *shades* from. Picking a random hue from a family
 * keeps a colour recognisable (all "blue") while varying the exact shade, so the
 * same pattern never produces the identical necklace twice.
 */
const HUE_FAMILIES: Record<string, number[]> = {
  red: [350, 358, 8],
  pink: [330, 320, 340],
  orange: [18, 24, 30],
  yellow: [44, 50, 56],
  green: [85, 140, 158],
  teal: [170, 182, 195],
  blue: [205, 222, 238],
  purple: [262, 282, 300],
}

export interface ColorPattern {
  id: string
  label: string
  /** Repeating motif of family names cycled across the sockets, or 'random' (special case). */
  families: string[] | 'random'
}

/**
 * Colour patterns the test page offers. `families` is a small repeating motif —
 * e.g. ['pink','red','yellow'] paints socket 0 pink, 1 red, 2 yellow, 3 pink … —
 * and each socket gets a freshly rolled shade from its family. 'random' is the
 * special case: every socket a freely random hue. Add/tweak entries freely.
 */
export const COLOR_PATTERNS: ColorPattern[] = [
  { id: 'rainbow', label: 'Sateenkaari', families: ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'] },
  { id: 'sapphire', label: 'Safiiri', families: ['blue'] }, // one colour
  { id: 'rose', label: 'Ruusu', families: ['pink', 'red'] }, // two colours
  { id: 'sunset', label: 'Aurinko', families: ['pink', 'red', 'yellow'] },
  { id: 'ocean', label: 'Meri', families: ['teal', 'blue', 'green'] },
  { id: 'royal', label: 'Kruunu', families: ['purple', 'yellow'] },
  { id: 'random', label: 'Satunnainen', families: 'random' },
]

/** Roll a per-socket hue array for a pattern. Uses `rand` so each call can differ. */
export function rollPalette(pattern: ColorPattern, count: number, rand: () => number): number[] {
  if (pattern.families === 'random') {
    return Array.from({ length: count }, () => Math.floor(rand() * 360))
  }
  const fams = pattern.families
  return Array.from({ length: count }, (_, i) => {
    const family = HUE_FAMILIES[fams[i % fams.length]]
    return family[Math.floor(rand() * family.length)]
  })
}

/**
 * Gem-shape "themes" — a curated selection of forms a necklace rolls from, plus
 * the special-case `'random'` (any form). This is the jewellery-form sibling of
 * `COLOR_PATTERNS`: the game/test page offers these as the shape menu, and the
 * real game can tie one to a chosen jewellery theme.
 */
export interface FormSet {
  id: string
  label: string
  /** Forms to roll from, or `'random'` for any form (the special case). */
  forms: GemForm[] | 'random'
}

/** Every form, used by the `'random'` set and the test page's shape picker. */
export const ALL_FORMS: GemForm[] = [
  'circle',
  'ovalTall',
  'ovalWide',
  'triangle',
  'square',
  'pentagon',
  'hexagon',
  'heptagon',
  'octagon',
  'dodecagon',
]

/** Shape selections the test page offers. `forms` is the pool a necklace rolls from. */
export const FORM_SETS: FormSet[] = [
  { id: 'classic', label: 'Klassinen', forms: ['circle', 'square', 'octagon'] },
  { id: 'round', label: 'Pyöreät', forms: ['circle', 'ovalTall', 'ovalWide'] },
  { id: 'angular', label: 'Särmikkäät', forms: ['triangle', 'heptagon', 'pentagon'] },
  { id: 'crystal', label: 'Kristallit', forms: ['hexagon', 'octagon', 'dodecagon'] },
  { id: 'mixed', label: 'Sekoitus', forms: [ 'square', 'triangle', 'hexagon'] },
  { id: 'random', label: 'Satunnainen', forms: 'random' },
]

/** Roll a per-socket form array for a form set. `'random'` picks any form per socket. */
export function rollForms(set: FormSet, count: number, rand: () => number): GemForm[] {
  const pool = set.forms === 'random' ? ALL_FORMS : set.forms
  return Array.from({ length: count }, () => pool[Math.floor(rand() * pool.length)])
}

/** Sanding range: 0.95 = big flat table + thin edges; 0.5 = the bevel reaches halfway to the centre. */
const TABLE_MIN = 0.5
const TABLE_MAX = 0.95

/**
 * Roll a gem's appearance deterministically from its seed. The `form` comes from
 * the form set; `cut` / `table` / `polish` are the rolled "cut corners", "sanding",
 * and "polish" knobs. Tiny + deterministic so a socket always rebuilds the same
 * stone, yet every field can be overwritten when play earns a change.
 */
export function rollGemSpec(seed: number, form: GemForm): GemSpec {
  const rand = mulberry32(seed ^ 0x6e3a)
  return {
    form,
    cut: rand(),
    table: lerp(TABLE_MIN, TABLE_MAX, rand()),
    // Wide range so a random necklace shows the full muddy → brilliant spread; in
    // the game this is set from intonation rather than rolled.
    polish: 0.2 + rand() * 0.8,
  }
}

/** Build a fresh, all-empty necklace. Deterministic given the seed. */
export function createNecklace(
  seed: number,
  socketCount: number,
  opts: {
    themeId?: ThemeId
    gemStyle?: GemStyle
    chainStyle?: ChainStyle
    layoutMode?: LayoutMode
    palette?: number[]
    /** Which form set to roll gem shapes from (ignored if `forms` is given). */
    formSet?: FormSet
    /** Explicit per-socket forms (overrides `formSet`). */
    forms?: GemForm[]
  } = {},
): NecklaceModel {
  const rand = mulberry32(seed)
  const forms = opts.forms ?? rollForms(opts.formSet ?? FORM_SETS[0], socketCount, rand)
  const sockets: Socket[] = Array.from({ length: socketCount }, (_, i) => {
    const socketSeed = Math.floor(rand() * 1e9)
    return {
      seed: socketSeed,
      hueJitter: (rand() - 0.5) * 16,
      fill: 'empty' as SocketFill,
      quality: 0,
      gem: rollGemSpec(socketSeed, forms[i % forms.length]),
    }
  })
  return {
    seed,
    sockets,
    activeIndex: 0,
    themeId: opts.themeId ?? 'starforge',
    gemStyle: opts.gemStyle ?? 'cabochon',
    chainStyle: opts.chainStyle ?? 'beads',
    layoutMode: opts.layoutMode ?? 'ring',
    // Default colours: a rainbow rolled from the seed (so it's stable per necklace).
    palette: opts.palette ?? rollPalette(COLOR_PATTERNS[0], socketCount, rand),
  }
}

/** Brilliance rolled deterministically from the socket's seed (no tuner here). */
export function rollQuality(socketSeed: number): number {
  // Bias toward good-looking gems (0.45..1.0) so the necklace always reads nicely,
  // but leave room for the occasional dead-centre stone that earns "fire".
  return 0.45 + mulberry32(socketSeed ^ 0x9e37)() * 0.55
}

// ---------------------------------------------------------------------------
// Score-level gem styling — the editable knobs that tie a played note's score
// (the 0..10 "pisteet" the player earns) to how dramatically the stone looks.
//
// A socket carries two 0..1 numbers, each the score/10 of one pass:
//   • `quality`     — the SET pass (ascending). Drives the gem COLOUR below.
//   • `gem.polish`  — the POLISH pass (descending). Drives CRACKS + SPARKLES.
// `scoreLevel()` turns either back into a 0..10 index into these tables.
//
// Tune these freely — they are the dials for how black a poor stone goes and how
// brilliantly a perfect one gleams. Each array has 11 entries (level 0..10).
// ---------------------------------------------------------------------------

/** A finished gem's sparkle at one score level. */
export interface SparkleLevel {
  /** Number of four-point star glints (0 = no sparkle). */
  count: number
  /** 0..1 brightness + sharpness of each glint. */
  brightness: number
}

/**
 * COLOUR intensity per score level (SET pass): 0 ≈ black, 1 = full colour.
 * Level 4 is deliberately half colour and level 8 reaches full colour.
 */
export const LEVEL_COLOR = [0.0, 0.12, 0.25, 0.38, 0.5, 0.62, 0.74, 0.87, 1.0, 1.0, 1.0] as const
/**
 * Extra WHITE sheen mixed over the colour per score level. Zero up to full colour
 * (level 8); only the top two notes gleam a brighter, whiter shade.
 */
export const LEVEL_WHITE = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.12, 0.28] as const
/**
 * Black CRACK count per score level (POLISH pass). A badly played note crazes the
 * stone with many fissures; they thin out and are gone from level 5 up.
 */
export const LEVEL_CRACKS = [8, 6, 4, 2, 1, 0, 0, 0, 0, 0, 0] as const
/**
 * SPARKLE per score level (POLISH pass). Nothing until level 6, then more glints,
 * brighter and sharper, up to a flawless level 10.
 */
export const LEVEL_SPARKLES: readonly SparkleLevel[] = [
  { count: 0, brightness: 0 }, // 0
  { count: 0, brightness: 0 }, // 1
  { count: 0, brightness: 0 }, // 2
  { count: 0, brightness: 0 }, // 3
  { count: 0, brightness: 0 }, // 4
  { count: 0, brightness: 0 }, // 5
  { count: 1, brightness: 0.3 }, // 6 — 1 sparkle, quite dim
  { count: 2, brightness: 0.5 }, // 7 — 2, brighter
  { count: 2, brightness: 0.7 }, // 8 — 2, brighter still
  { count: 3, brightness: 0.85 }, // 9 — 3, even brighter
  { count: 4, brightness: 1.0 }, // 10 — 4 sparkles, very bright and sharp
]

/** Turn a 0..1 score carrier (as stored on a socket) into a 0..10 score level. */
const scoreLevel = (unit: number) => clamp(Math.round(unit * 10), 0, 10)

/** Effective gem hue: the socket's colour from the palette (cycled), plus a little jitter. */
function socketHue(model: NecklaceModel, i: number): number {
  const base = model.palette[i % model.palette.length]
  return base + model.sockets[i].hueJitter
}

// ---------------------------------------------------------------------------
// 3. Layout — turn the measured canvas size into concrete geometry.
//
// Like `computeLayout` in musicStave.ts, nothing here is a magic pixel constant:
// every radius is derived from the canvas size and the socket count, so the same
// code looks right on a 390px phone and a wide desktop.
// ---------------------------------------------------------------------------

export interface NecklaceLayout {
  width: number
  height: number
  socketCount: number
  /** Ring/arc centre. */
  cx: number
  cy: number
  /** Ellipse radii for the ring. `ry` is squashed to fake a view from slightly above. */
  rx: number
  ry: number
  /** Vertical squash (0..1): smaller = more top-down, flatter ellipse. */
  tilt: number
  /** Base gem radius (front-facing; back gems shrink via projection). */
  gemR: number
  /** Small connector-bead radius for the "beads" chain. */
  linkR: number
  /** Catenary parameters for the arc layout. */
  arc: { padX: number; topY: number; amp: number; k: number }
}

export function computeNecklaceLayout(opts: {
  width: number
  height: number
  socketCount: number
}): NecklaceLayout {
  const { width, height, socketCount } = opts
  const cx = width / 2
  const cy = height * 0.46

  // The ring is an ellipse. Width uses most of the canvas; the vertical radius is
  // the same circle squashed by `tilt` so we appear to look down on it a little.
  const rx = Math.min(width * 0.38, height * 0.34)
  const ry = rx
  const tilt = 0.52

  // Size gems so neighbours nearly touch but don't overlap badly. The arc length
  // between two sockets around the ellipse is ~ TAU*rx / n; take a fraction of it.
  const gap = (TAU * rx) / socketCount
  // Gems take ~a quarter of the gap (was 0.34) so adjacent gems no longer nearly
  // touch — that opens room for a proper run of chain beads between them. The
  // low floor (was 14) is what keeps the 8-gem look while letting denser necklaces
  // (15, 22 …) scale the gems *down* with the shrinking gap instead of clamping
  // them back up to a size that overlaps and hides the chain.
  const gemR = clamp(gap * 0.25, 6, Math.min(width, height) * 0.12)
  // Connector beads / rope thickness scale with the gem so dense necklaces stay
  // thin (22 looks great) while sparse ones get a chunkier chain. Cap raised so
  // the 8-gem necklace isn't clamped down to a thin chain.
  const linkR = clamp(gemR * 0.18, 1.5, 6)

  return {
    width,
    height,
    socketCount,
    cx,
    cy,
    rx,
    ry,
    tilt,
    gemR,
    linkR,
    arc: {
      padX: width * 0.16,
      topY: height * 0.26,
      amp: height * 0.3,
      k: 1.25,
    },
  }
}

// ---------------------------------------------------------------------------
// 4. Pseudo-3D ring projection — the headline effect.
//
// We treat the sockets as beads on a horizontal hoop seen slightly from above,
// and rotate that hoop about its vertical axis. As it turns, each socket sweeps
// from the back (small, dim, behind its neighbours) to the front (big, bright,
// overlapping them). Driving the rotation so the *active* socket lands at the
// front is the whole "the next gem turns into view" idea — done with plain sin/cos,
// no 3D library.
// ---------------------------------------------------------------------------

/** A socket projected to screen space, with the depth cues we draw it with. */
export interface Projected {
  x: number
  y: number
  /** -1 (far back) .. +1 (front, nearest the viewer). */
  z: number
  /** Size multiplier: front beads bigger. */
  scale: number
  /** Opacity: back beads fade into the atmosphere. */
  alpha: number
}

/**
 * Perspective strength of the ring. 0 = flat (orthographic) ring; higher = the
 * front of the hoop bulges toward the viewer — front beads sit bigger and spread
 * *wider apart* (taking more of the ring's arc) while back beads shrink and bunch
 * *closer together*. Because spacing and size are driven by the SAME factor, the
 * back never opens gaps between the small gems and the chain. Tune to taste.
 */
const RING_PERSPECTIVE = 0.45

/** Multiplier on the "beads" chain bead radius (rope/cable unaffected). */
const BEAD_R_SCALE = 2

/**
 * Project one ring angle to the screen.
 * `angle` is the socket's fixed position on the hoop; `spin` rotates the whole hoop.
 *   x: cosine across the full horizontal radius.
 *   y: sine across the *squashed* vertical radius → the ellipse / view tilt.
 *   z = sin(a): +1 means the bead is swung to the front (also the lowest point,
 *       exactly where the front gem of a real hanging necklace sits).
 *
 * `fore` is the perspective foreshortening: >1 at the front, 1 at the sides, <1 at
 * the back. It multiplies the radial offset (so front sockets take more arc, back
 * less) AND the draw scale (normalised so the front is ~1), keeping size and
 * spacing in proportion so the back has no gaps.
 */
function projectRing(angle: number, spin: number, L: NecklaceLayout): Projected {
  const a = spin + angle
  const c = Math.cos(a)
  const s = Math.sin(a)
  // Map sin(-1..1) → 0..1 once; reuse it for the opacity depth cue.
  const depth01 = s * 0.5 + 0.5
  const fore = 1 + RING_PERSPECTIVE * s
  return {
    x: L.cx + c * L.rx * fore,
    y: L.cy + s * L.ry * L.tilt * fore,
    z: s,
    scale: fore / (1 + RING_PERSPECTIVE),
    alpha: 0.5 + 0.5 * depth01,
  }
}

/** The base (un-spun) angle of socket i around the hoop. */
const socketAngle = (i: number, n: number) => (i / n) * TAU

/**
 * The spin value that brings socket `i` to the front-centre. Front is where
 * sin(spin+angle) = 1, i.e. spin+angle = π/2. So spin = π/2 - angle.
 */
export function ringSpinTarget(i: number, n: number): number {
  return Math.PI / 2 - socketAngle(i, n)
}

/**
 * Pick the representation of `target` closest to `current` (targets are only
 * meaningful modulo TAU). This makes the ring always take the *short way* round
 * instead of unwinding through several full turns.
 */
function nearestAngle(target: number, current: number): number {
  return target + Math.round((current - target) / TAU) * TAU
}

// Catenary point for the calm "arc" layout (a chain hanging under gravity).
// t in [0,1] across the width; cosh gives the deepest sag in the middle.
function arcPoint(t: number, L: NecklaceLayout): { x: number; y: number } {
  const { padX, topY, amp, k } = L.arc
  const x = padX + t * (L.width - 2 * padX)
  const sag = (amp * Math.cosh((t - 0.5) * 2 * k)) / Math.cosh(k)
  return { x, y: topY + sag }
}

// ---------------------------------------------------------------------------
// 5. Drawing primitives.
//
// Each function paints one piece in plain canvas calls. They take an explicit
// (x, y, r) so they work the same whether the caller is the spinning ring or the
// static arc — the layout decides *where*, these decide *what it looks like*.
// ---------------------------------------------------------------------------

/** A tight HSL string helper (keeps the gem code readable). */
const hsl = (h: number, s: number, l: number, a = 1) =>
  `hsla(${h.toFixed(0)} ${s}% ${l}% / ${a})`

/**
 * BACKDROP — a dark radial wash plus a cheap twinkling motif layer.
 * The dark base is what lets the gems glow; the motif is kept low-contrast so it
 * never competes with the jewellery. Motif dot positions are re-seeded from a
 * fixed number every frame, so only their brightness twinkles (random positions
 * each frame would just look like TV static).
 */
function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  theme: Theme,
  time: number,
): void {
  const g = ctx.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, Math.max(L.width, L.height) * 0.75)
  g.addColorStop(0, theme.bg[1])
  g.addColorStop(1, theme.bg[0])
  ctx.fillStyle = g
  ctx.fillRect(0, 0, L.width, L.height)

  const rand = mulberry32(0xbeef) // fixed seed → stable star field
  const count = Math.round((L.width * L.height) / 9000)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter' // additive so dots read as light
  for (let i = 0; i < count; i++) {
    const x = rand() * L.width
    const y = rand() * L.height
    const phase = rand() * TAU
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 1.5 + phase))
    if (theme.motif === 'embers') {
      // Embers drift gently upward; wrap around the top.
      const ey = (y - time * 12) % L.height
      ctx.fillStyle = hsl(28, 90, 60, 0.5 * twinkle)
      ctx.beginPath()
      ctx.arc(x, ey < 0 ? ey + L.height : ey, 1.4, 0, TAU)
      ctx.fill()
    } else if (theme.motif === 'fireflies') {
      ctx.fillStyle = hsl(150, 70, 70, 0.5 * twinkle)
      ctx.beginPath()
      ctx.arc(x + Math.sin(time * 0.7 + phase) * 4, y, 1.6, 0, TAU)
      ctx.fill()
    } else {
      // Stars: plain twinkling pin-pricks.
      ctx.fillStyle = `rgba(255,255,255,${0.5 * twinkle})`
      ctx.beginPath()
      ctx.arc(x, y, 1.1, 0, TAU)
      ctx.fill()
    }
  }
  ctx.restore()
}

/**
 * METAL GRADIENT (technique M1) — the core "shiny curved metal" look.
 * The trick is *uneven* colour stops: a tight bright band surrounded by quick
 * dark falloff. A smooth fade looks like matte plastic; this sharp band is read
 * by the eye as a reflection sliding off a polished surface.
 */
function metalGradient(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  m: Metal,
): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  g.addColorStop(0.0, m.lo)
  g.addColorStop(0.34, m.mid)
  g.addColorStop(0.47, m.hi) // sharp bright band ...
  g.addColorStop(0.53, m.hi)
  g.addColorStop(0.66, m.mid) // ... quick falloff = "shiny"
  g.addColorStop(1.0, m.lo)
  return g
}

/**
 * A small round metal bead (used for the "beads" chain and as the cheap default
 * connector). Banded gradient body (M1) + a roving specular dot (M3) whose
 * position tracks the spin, so the highlight travels across the metal as the
 * necklace turns — a strong "premium metal" cue for almost no cost.
 */
function drawMetalBead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  m: Metal,
  spin: number,
): void {
  ctx.fillStyle = metalGradient(ctx, x, y - r, x, y + r, m)
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()

  // Roving sheen: a soft bright blob that slides with the rotation.
  const sx = x + Math.cos(spin * 1.3) * r * 0.4
  const sy = y - r * 0.35
  const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.7)
  sg.addColorStop(0, m.spec)
  sg.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = sg
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
  ctx.restore()
}

/**
 * BEZEL setting (technique M2) — the metal rim that holds the gem. It follows the
 * gem's own outline (same `form` + `cut`) so a square stone sits in a square
 * setting, not a circle. A mid-tone body stroke underneath, then each rim edge is
 * re-stroked bright/dark by how much it faces the up-left light → a raised, lit
 * bevel that reads as forged metal. Used for both the empty socket (dim) and the
 * filled gem (bright).
 */
function drawBezel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  m: Metal,
  dim: boolean,
  gem: GemSpec,
): void {
  const lw = Math.max(1, r * 0.11)
  const outline = scaleOutline(buildGemOutline(gem.form, gem.cut), cx, cy, r + lw * 0.3)
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.lineWidth = lw
  // Mid-tone body following the gem silhouette.
  ctx.strokeStyle = dim ? 'rgba(120,120,130,0.55)' : m.mid
  tracePolygon(ctx, outline)
  ctx.stroke()
  if (dim) {
    ctx.restore()
    return
  }
  // Per-edge directional sheen: bright where the rim faces the light, dark away.
  const light = -Math.PI * 0.75 // up-left, matching the gem bevel default
  for (let i = 0; i < outline.length; i++) {
    const a0 = outline[i]
    const a1 = outline[(i + 1) % outline.length]
    const midA = Math.atan2((a0.y + a1.y) / 2 - cy, (a0.x + a1.x) / 2 - cx)
    const lit = Math.cos(midA - light) * 0.5 + 0.5 // 0..1 facing the light
    ctx.strokeStyle = lit > 0.5 ? m.hi : m.lo
    ctx.globalAlpha = 0.25 + 0.75 * Math.abs(lit - 0.5) * 2 // strongest at clear catch/shadow
    ctx.beginPath()
    ctx.moveTo(a0.x, a0.y)
    ctx.lineTo(a1.x, a1.y)
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * ORE CRADLE — a plain *round* metal cup with a concave dark hollow that the lumpy
 * ore fills almost exactly. Used for both the empty socket (dim) and the ascending
 * ore stage (bright rim). Deliberately round, NOT the gem's faceted form: the final
 * sanded shape is only revealed on the descending "refine" pass, so going up the
 * scale you just see raw lumps dropping into their cups. One rim only → no double-ring.
 */
function drawOreCradle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  m: Metal,
  dim: boolean,
): void {
  const wr = r * 0.92
  // Concave hollow so the ore reads as set *into* the cup, not floating on it.
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, wr, 0, TAU)
  ctx.clip()
  const g = ctx.createRadialGradient(cx, cy - wr * 0.2, wr * 0.12, cx, cy, wr)
  g.addColorStop(0, 'rgba(0,0,0,0.5)')
  g.addColorStop(1, 'rgba(18,20,26,0.12)')
  ctx.fillStyle = g
  ctx.fillRect(cx - wr, cy - wr, wr * 2, wr * 2)
  ctx.restore()
  // The cup rim — one ring. Dim grey when empty; lit metal (bright top, dark bottom) when holding ore.
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineWidth = Math.max(2, r * 0.13)
  if (dim) {
    ctx.strokeStyle = 'rgba(150,152,162,0.45)'
    ctx.beginPath()
    ctx.arc(cx, cy, wr, 0, TAU)
    ctx.stroke()
  } else {
    ctx.strokeStyle = m.mid
    ctx.beginPath()
    ctx.arc(cx, cy, wr, 0, TAU)
    ctx.stroke()
    ctx.strokeStyle = m.hi // bright catch, top-left
    ctx.beginPath()
    ctx.arc(cx, cy, wr, Math.PI, TAU)
    ctx.stroke()
    ctx.strokeStyle = m.lo // shadow, bottom-right
    ctx.beginPath()
    ctx.arc(cx, cy, wr, 0, Math.PI)
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * ORE (ascending "mine" step) — NOT a dull block of rock. A slightly lumpy,
 * rounded, *shiny* pebble in a muted version of the gem hue, with an offset
 * highlight so it already catches light. Even the raw stage should feel like a
 * small reward; the descent then refines it into the finished gem.
 */
function drawOre(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  hue: number,
  quality: number,
  seed: number,
): void {
  // The ascending colour-level already shows in the raw ore: a poorly-played note
  // mines a dark, near-black lump; a clean one a richer, brighter ore. Kept a touch
  // more muted than the finished gem so the descent's polish still feels like a lift.
  const col = LEVEL_COLOR[scoreLevel(quality)]
  const white = LEVEL_WHITE[scoreLevel(quality)]
  const sat = (12 + 34 * col) * (1 - 0.6 * white)
  const baseL = lerp(8, 48, col) + 30 * white
  const rand = mulberry32(seed ^ 0x07e)
  const n = 11
  // Lumpy but mostly round outline (radius jitters a little per vertex).
  const verts: [number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU
    const rr = r * (0.82 + rand() * 0.16)
    verts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr])
  }
  // Body: offset radial gradient = a glossy dome, raw + colour-graded.
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r)
  g.addColorStop(0, hsl(hue, sat + 6, clamp(baseL + 14, 0, 100)))
  g.addColorStop(0.55, hsl(hue, sat, clamp(baseL, 0, 100)))
  g.addColorStop(1, hsl(hue, sat, clamp(baseL - 16, 0, 100)))
  ctx.fillStyle = g
  ctx.beginPath()
  verts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)))
  ctx.closePath()
  ctx.fill()
  // A shiny hotspot so it reads as a polished pebble — dimmer on a dark, poor ore.
  const s = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x - r * 0.4, y - r * 0.4, r * 0.5)
  s.addColorStop(0, `rgba(255,255,255,${(0.2 + 0.5 * col).toFixed(3)})`)
  s.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = s
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fill()
  // A couple of dull flecks for "raw material" texture.
  ctx.fillStyle = hsl(hue, clamp(sat - 6, 0, 100), clamp(baseL - 10, 0, 100), 0.8)
  ctx.beginPath()
  ctx.arc(x + r * 0.25, y + r * 0.2, r * 0.12, 0, TAU)
  ctx.fill()
}

// ---------------------------------------------------------------------------
// Gem shape geometry — build the outline edges for each form.
//
// A gem is drawn as: an outer OUTLINE polygon, a smaller flat TABLE polygon in
// the middle (the sanded plateau), and a ring of BEVEL facets joining the two.
// `buildGemOutline` produces the unit outline (radius ≈1, centred on the origin);
// the renderer scales it by the gem radius and again (× table) for the plateau.
// Polygonal forms get their corners chamfered by `cut`; round/oval forms are a
// fine ring and ignore the cut (no corners to cut).
// ---------------------------------------------------------------------------

/** Edge count per polygonal form. 0 marks the round/oval forms (drawn as a ring). */
const FORM_SIDES: Record<GemForm, number> = {
  circle: 0,
  ovalTall: 0,
  ovalWide: 0,
  triangle: 3,
  square: 4,
  pentagon: 5,
  hexagon: 6,
  heptagon: 7,
  octagon: 8,
  dodecagon: 12,
}

/** Extra rotation (radians) so a form sits "naturally" — flat-topped squares etc. */
const FORM_ROTATION: Partial<Record<GemForm, number>> = {
  square: Math.PI / 4,
  hexagon: Math.PI / 6,
  octagon: Math.PI / 8,
  dodecagon: Math.PI / 12,
}

/** Short:long axis ratio for the oval forms (1 = circle). */
const OVAL_RATIO = 0.72
/** Outline resolution for the smooth (cabochon) round forms. */
const ROUND_SEGMENTS = 48
/** Outline resolution for faceted round forms — fewer = chunkier, gem-cut facets. */
const ROUND_FACETS = 18

interface Pt {
  x: number
  y: number
}

/**
 * The unit outline for a gem form (radius ≈1, origin-centred) as points walked in
 * order around the rim. For polygons every corner is chamfered by `cut` (0 = sharp;
 * 1 = the two cuts meet at the edge midpoints — the maximum, where the original
 * corner is gone). `roundSegments` controls how finely the round/oval forms are
 * tessellated (they have no corners, so `cut` is ignored there).
 */
export function buildGemOutline(form: GemForm, cut: number, roundSegments = ROUND_SEGMENTS): Pt[] {
  const sides = FORM_SIDES[form]
  let pts: Pt[]
  if (sides === 0) {
    const rx = form === 'ovalTall' ? OVAL_RATIO : 1
    const ry = form === 'ovalWide' ? OVAL_RATIO : 1
    pts = Array.from({ length: roundSegments }, (_, i) => {
      const a = (i / roundSegments) * TAU - Math.PI / 2
      return { x: Math.cos(a) * rx, y: Math.sin(a) * ry }
    })
  } else {
    const rot = -Math.PI / 2 + (FORM_ROTATION[form] ?? 0)
    const base: Pt[] = Array.from({ length: sides }, (_, i) => {
      const a = (i / sides) * TAU + rot
      return { x: Math.cos(a), y: Math.sin(a) }
    })
    // Map cut 0..1 → chamfer fraction 0..0.49. Capped just under 0.5 so the original
    // edge never collapses to zero length (which would fold neighbouring cuts together).
    const frac = clamp(cut, 0, 1) * 0.49
    if (frac < 1e-3) {
      pts = base
    } else {
      pts = []
      for (let i = 0; i < sides; i++) {
        const cur = base[i]
        const prev = base[(i - 1 + sides) % sides]
        const next = base[(i + 1) % sides]
        pts.push({ x: lerp(cur.x, prev.x, frac), y: lerp(cur.y, prev.y, frac) }) // toward previous corner
        pts.push({ x: lerp(cur.x, next.x, frac), y: lerp(cur.y, next.y, frac) }) // toward next corner
      }
    }
  }
  // Normalise to a round gem's width (diameter 2): a circle spans x∈[-1,1], but a
  // narrow oval, a skinny shape, or a heavily-cut polygon (chamfering shrinks the
  // outline) spans less — leaving the bezel + chain spacing looking broken around
  // a too-small stone. Measure the width and scale uniformly so every gem fills the
  // socket the way a circle does. (No form is wider than a circle, so this only
  // ever scales narrow stones *up*; the aspect ratio is preserved.)
  let minX = Infinity
  let maxX = -Infinity
  for (const p of pts) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
  }
  const width = maxX - minX
  const scale = width > 1e-6 ? 2 / width : 1
  return scale === 1 ? pts : pts.map((p) => ({ x: p.x * scale, y: p.y * scale }))
}

/** Scale a unit outline to a gem centred at (cx,cy) with radius r. */
function scaleOutline(unit: Pt[], cx: number, cy: number, r: number): Pt[] {
  return unit.map((p) => ({ x: cx + p.x * r, y: cy + p.y * r }))
}

/** Trace a closed polygon path through the points (does not fill/stroke). */
function tracePolygon(ctx: CanvasRenderingContext2D, pts: Pt[]): void {
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.closePath()
}

/**
 * GEM (smooth) — a domed, glossy stone clipped to the form outline. One offset
 * radial gradient reads as a 3D dome (the classic cabochon); the form's silhouette
 * (and its cut corners) shows through the clip, and `quality` brightens the core +
 * adds the specular hotspot. Sanding/polish are mostly a faceted-cut affair, so a
 * cabochon shows them only as a gentle inner "table" lift.
 */
function drawShapedCabochon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  hue: number,
  quality: number,
  gem: GemSpec,
): void {
  const outline = scaleOutline(buildGemOutline(gem.form, gem.cut), cx, cy, r)
  ctx.save()
  tracePolygon(ctx, outline)
  ctx.clip()
  // Colour intensity + white sheen from the set-pass score level (see LEVEL_COLOR).
  const col = LEVEL_COLOR[scoreLevel(quality)]
  const white = LEVEL_WHITE[scoreLevel(quality)]
  const sat = (24 + 58 * col) * (1 - 0.6 * white)
  const baseL = lerp(6, 48, col) + 40 * white // near-black → full colour, white lifts it
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r)
  g.addColorStop(0, hsl(hue, sat, clamp(baseL + 22, 0, 100)))
  g.addColorStop(0.5, hsl(hue, sat, clamp(baseL, 0, 100)))
  g.addColorStop(1, hsl(hue, sat, clamp(baseL - 24, 0, 100)))
  ctx.fillStyle = g
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  // Sanded plateau: a soft brighter lift over the inner `table` area; its inner edge
  // sharpens with polish (frosted → crisp). Deliberately subtle on a cabochon.
  const tg = ctx.createRadialGradient(cx, cy, r * gem.table * (1 - 0.4 * gem.polish), cx, cy, r * gem.table)
  tg.addColorStop(0, hsl(hue, sat, clamp(baseL + 18, 0, 100), 0.35))
  tg.addColorStop(1, hsl(hue, sat, clamp(baseL + 18, 0, 100), 0))
  ctx.fillStyle = tg
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  ctx.restore()
  if (col > 0.3) {
    ctx.save()
    ctx.globalAlpha = clamp((col - 0.3) * 1.4, 0, 1)
    const s = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 0, cx - r * 0.4, cy - r * 0.4, r * 0.45)
    s.addColorStop(0, 'rgba(255,255,255,0.95)')
    s.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = s
    tracePolygon(ctx, outline)
    ctx.fill()
    ctx.restore()
  }
}

/**
 * GEM (faceted) — the headline shaped cut, drawn from TWO intonation-derived
 * numbers so the sanding phase is as expressive as the gem-selection phase:
 *
 *   • `quality` — the SELECTION phase: how bright + vivid the gem's *colour* is
 *     (the stone you "chose" by playing the ascending note). Sets `sat`/base lightness.
 *   • `polish`  — the SANDING phase, a 1→10 finish read through three smooth bands:
 *       - `rough`  (≈level 1–4) the first sanding looks WORSE: low contrast, dimmed,
 *         seeded dark STAINS + a few jagged CRACKS + a rim haze (a raw, smudged stone).
 *       - `edge`   (≈level 5) clean crisp facet EDGES appear, only a faint gradient,
 *         the mud gone — a plain but tidy cut.
 *       - `shine`  (≈level 6–10) facet contrast widens, bevels get strong GRADIENTS,
 *         lit facets desaturate toward near-white SPECULAR, and sharp white edge lines
 *         + a glossy table highlight blaze. Mostly bright gradients, a few dark facets.
 *
 * The per-facet light (which rides `spin`) decides lit vs. dark; `cut` shapes the
 * outline; star sparkle + fire are layered on top elsewhere from `quality`.
 */
function drawShapedGem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  hue: number,
  quality: number,
  gem: GemSpec,
  spin: number,
  seed: number,
): void {
  const unit = buildGemOutline(gem.form, gem.cut, ROUND_FACETS)
  const outline = scaleOutline(unit, cx, cy, r)
  const table = scaleOutline(unit, cx, cy, r * gem.table)
  const n = outline.length
  const light = -Math.PI * 0.75 + spin // light sweeps as the gem turns

  // SELECTION: colour intensity + white sheen from the set-pass score level
  // (LEVEL_COLOR / LEVEL_WHITE). col 0 → near-black, 1 → full colour; white lifts
  // the very best notes toward a brighter, whiter shade.
  const col = LEVEL_COLOR[scoreLevel(quality)]
  const white = LEVEL_WHITE[scoreLevel(quality)]
  const sat = (22 + 60 * col) * (1 - 0.7 * white) // dark + whitened stones desaturate
  const baseL = lerp(5, 46, col) + 42 * white // near-black → full colour, white pushes it bright
  // SANDING: split polish into three expressive bands.
  const polish = clamp(gem.polish, 0, 1)
  const rough = clamp((0.4 - polish) / 0.4, 0, 1) // 1→0 over 0..0.4 (stains/cracks/dim)
  const edge = clamp((polish - 0.32) / 0.28, 0, 1) // 0→1 over 0.32..0.6 (clean edges appear)
  const shine = clamp((polish - 0.55) / 0.45, 0, 1) // 0→1 over 0.55..1 (gradients + white sparkle)

  // Bevel facets: a gradient-filled quad per edge, inner (table) → outer (rim). The
  // lit→dark spread (contrast) widens with polish — low contrast reads dull, wide
  // contrast reads polished. lit² specular makes the lit half blaze near-white.
  for (let i = 0; i < n; i++) {
    const o0 = outline[i]
    const o1 = outline[(i + 1) % n]
    const t0 = table[i]
    const t1 = table[(i + 1) % n]
    const omx = (o0.x + o1.x) / 2
    const omy = (o0.y + o1.y) / 2
    const imx = (t0.x + t1.x) / 2
    const imy = (t0.y + t1.y) / 2
    const litRaw = Math.cos(Math.atan2(omy - cy, omx - cx) - light) * 0.5 + 0.5
    const lit = clamp(litRaw + 0.12 * shine, 0, 1) // polished stones skew bright ("mostly bright")
    const spec = lit * lit * shine // near-white mirror, only in the polished band
    const mid = baseL - 10 * rough // colour-level brightness, rough dims further
    const L = mid + (lit - 0.5) * (22 + 54 * polish) // contrast grows with polish
    const innerL = clamp(L - (4 + 10 * polish), 0, 100)
    const outerL = clamp(L + (4 + 30 * shine) * lit + 34 * spec, 0, 100)
    const outerSat = sat * (1 - 0.85 * spec)
    const g = ctx.createLinearGradient(imx, imy, omx, omy)
    g.addColorStop(0, hsl(hue, sat, innerL))
    g.addColorStop(1, hsl(hue, outerSat, outerL))
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(o0.x, o0.y)
    ctx.lineTo(o1.x, o1.y)
    ctx.lineTo(t1.x, t1.y)
    ctx.lineTo(t0.x, t0.y)
    ctx.closePath()
    ctx.fill()
  }

  // Flat table plateau: colour from selection (dimmed when rough), glossy white
  // highlight that grows with shine.
  ctx.fillStyle = hsl(hue, sat, clamp(baseL + 6 - 14 * rough, 0, 100))
  tracePolygon(ctx, table)
  ctx.fill()
  const gloss = 0.1 + 0.65 * shine * (0.4 + 0.6 * quality)
  if (gloss > 0.02) {
    const hg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r * gem.table)
    hg.addColorStop(0, `rgba(255,255,255,${gloss.toFixed(3)})`)
    hg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = hg
    tracePolygon(ctx, table)
    ctx.fill()
  }

  // ROUGH — the first sanding looks worse: dark stains, cracks, and a rim haze, all
  // clipped to the gem and fading out as the stone is polished past ~level 4.
  if (rough > 0.02) {
    ctx.save()
    tracePolygon(ctx, outline)
    ctx.clip()
    // Rim haze: dull, dirty film, denser toward the edge.
    const hz = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r)
    hz.addColorStop(0, `rgba(120,118,128,${(0.06 * rough).toFixed(3)})`)
    hz.addColorStop(1, `rgba(54,52,62,${(0.5 * rough).toFixed(3)})`)
    ctx.fillStyle = hz
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    // Stains: a few seeded dark blotches.
    const rand = mulberry32(seed ^ 0x57a1)
    const blotches = 2 + Math.floor(rough * 3)
    for (let k = 0; k < blotches; k++) {
      const px = cx + (rand() - 0.5) * r * 1.3
      const py = cy + (rand() - 0.5) * r * 1.3
      const rad = r * (0.18 + rand() * 0.36)
      const bg = ctx.createRadialGradient(px, py, 0, px, py, rad)
      bg.addColorStop(0, `rgba(34,30,40,${(0.5 * rough).toFixed(3)})`)
      bg.addColorStop(1, 'rgba(34,30,40,0)')
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.arc(px, py, rad, 0, TAU)
      ctx.fill()
    }
    ctx.restore()
  }

  // CRACKS — jagged near-black fissures, their count set straight from the score
  // level via LEVEL_CRACKS (8 on the worst note, thinning to 1 at level 4, gone from
  // level 5). Drawn solid with flat (butt) caps + sharp miter joins so they read as
  // crisp black cracks at any zoom — not a soft grey haze. Driven by the table rather
  // than the `rough` band so a single level-4 crack still shows on an otherwise clean
  // stone.
  const crackCount = LEVEL_CRACKS[scoreLevel(polish)]
  if (crackCount > 0) {
    ctx.save()
    tracePolygon(ctx, outline)
    ctx.clip()
    const rand = mulberry32(seed ^ 0x57a1)
    ctx.strokeStyle = 'rgba(6,5,9,0.92)'
    // Hairline crack proportional to the gem (was a 0.8 px floor that, magnified by
    // the close-up zoom, bloated cracks on small mobile gems). A tiny floor keeps it
    // visible without going chunky.
    ctx.lineWidth = Math.max(0.5, r * 0.035)
    ctx.lineCap = 'butt'
    ctx.lineJoin = 'miter'
    for (let k = 0; k < crackCount; k++) {
      let px = cx + (rand() - 0.5) * r * 1.4
      let py = cy + (rand() - 0.5) * r * 1.4
      ctx.beginPath()
      ctx.moveTo(px, py)
      const segs = 2 + Math.floor(rand() * 3)
      for (let s = 0; s < segs; s++) {
        px += (rand() - 0.5) * r * 0.9
        py += (rand() - 0.5) * r * 0.9
        ctx.lineTo(px, py)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  // SANDING EDGES — crisp facet ridges. A subtle definition line appears once the
  // stone is sanded clean (`edge`); additive white glints blaze on the lit ridges
  // once it's polished (`shine`). No black comic seams at any level.
  if (edge > 0.02) {
    ctx.save()
    ctx.lineCap = 'round'
    // Definition lines: thin, pale, source-over → "the facets are visible". Width
    // tracks the gem radius (was fixed px) so the seams stay hair-fine on small gems.
    ctx.strokeStyle = `rgba(255,255,255,${(0.1 + 0.22 * edge).toFixed(3)})`
    ctx.lineWidth = r * (0.008 + 0.012 * edge)
    for (let i = 0; i < n; i++) {
      ctx.beginPath()
      ctx.moveTo(table[i].x, table[i].y)
      ctx.lineTo(outline[i].x, outline[i].y)
      ctx.stroke()
    }
    tracePolygon(ctx, table)
    ctx.stroke()
    // Bright sparkle glints: additive white on the lit ridges, only when polished.
    if (shine > 0.02) {
      ctx.globalCompositeOperation = 'lighter'
      ctx.lineWidth = r * (0.008 + 0.02 * shine)
      for (let i = 0; i < n; i++) {
        const ridgeLit = Math.cos(Math.atan2(outline[i].y - cy, outline[i].x - cx) - light) * 0.5 + 0.5
        const a = shine * (0.12 + 0.7 * ridgeLit * ridgeLit) // sharp on the best-lit ridges
        const sg = ctx.createLinearGradient(table[i].x, table[i].y, outline[i].x, outline[i].y)
        sg.addColorStop(0, `rgba(255,255,255,${(a * 0.25).toFixed(3)})`)
        sg.addColorStop(1, `rgba(255,255,255,${a.toFixed(3)})`)
        ctx.strokeStyle = sg
        ctx.beginPath()
        ctx.moveTo(table[i].x, table[i].y)
        ctx.lineTo(outline[i].x, outline[i].y)
        ctx.stroke()
      }
    }
    ctx.restore()
  }
}

/**
 * SPARKLE (G3) — the "brilliant" payoff layered over a finished gem. Four-point
 * star glints drawn additively so they read as light. The glint count and their
 * brightness/sharpness come straight from the POLISH-pass score level via
 * LEVEL_SPARKLES (nothing below level 6, up to 4 sharp glints at level 10), so the
 * sparkle is one of the clearest "you nailed it" cues. `fade` (0..1) eases them in
 * with the ore→gem reveal; positions re-seed each frame from the socket seed so only
 * the twinkle animates, not the placement.
 */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  level: number,
  fade: number,
  time: number,
  seed: number,
): void {
  const spec = LEVEL_SPARKLES[level]
  if (!spec || spec.count <= 0 || fade <= 0.01) return
  const rand = mulberry32(seed ^ 0x5447)
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (let k = 0; k < spec.count; k++) {
    const tw = 0.5 + 0.5 * Math.sin(time * 3 + k * 2.1)
    // Brighter levels: longer rays, higher alpha, a thicker crisp white core.
    const len = r * (0.3 + 0.45 * spec.brightness) * (0.65 + 0.35 * tw)
    const px = x + (rand() - 0.5) * r
    const py = y + (rand() - 0.5) * r
    const alpha = clamp((0.2 + 0.7 * spec.brightness) * tw * fade, 0, 1)
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
    // Stroke width scales with the gem radius (was a fixed 1.4–3.2 px): a small gem
    // on mobile got the same absolute width as a big one on desktop, so the glints
    // read ~2.5× thicker there. Tying it to `r` keeps a sharp glint at any size/zoom.
    ctx.lineWidth = r * lerp(0.03, 0.06, spec.brightness)
    ctx.beginPath()
    ctx.moveTo(px - len, py)
    ctx.lineTo(px + len, py)
    ctx.moveTo(px, py - len)
    ctx.lineTo(px, py + len)
    ctx.stroke()
    // A sharp bright pinpoint at the centre of the brightest glints.
    if (spec.brightness > 0.4) {
      ctx.fillStyle = `rgba(255,255,255,${(alpha).toFixed(3)})`
      ctx.beginPath()
      ctx.arc(px, py, r * lerp(0.025, 0.055, spec.brightness), 0, TAU)
      ctx.fill()
    }
  }
  ctx.restore()
}

/**
 * FIRE (G4) — the rainbow dispersion of a real cut stone, reserved for near-perfect
 * quality only. A faint conic rainbow clipped to the gem, rotated by `spin`, so a
 * band of spectrum sweeps across the gem as it turns. Low alpha + additive blend
 * keeps it a tasteful flash rather than a gaudy disco ball.
 */
function drawFire(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  quality: number,
  spin: number,
): void {
  if (quality < 0.82) return
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r * 0.95, 0, TAU)
  ctx.clip()
  const grad = ctx.createConicGradient(spin * 2, x, y)
  for (let h = 0; h <= 360; h += 60) grad.addColorStop(h / 360, `hsl(${h} 100% 60%)`)
  ctx.globalAlpha = 0.22 * (quality - 0.82) * (1 / 0.18)
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = grad
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
  ctx.restore()
}

/**
 * Active-socket GLOW — a soft halo so the next socket is unmistakably the loudest
 * thing on screen (the rule for guiding the eye without a tap). Pulses gently so
 * it feels alive.
 */
function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  time: number,
): void {
  const pulse = 0.75 + 0.25 * Math.sin(time * 2.2)
  const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 2.4)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save()
  ctx.globalAlpha = 0.55 * pulse
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r * 2.4, 0, TAU)
  ctx.fill()
  ctx.restore()
}

// ---------------------------------------------------------------------------
// 6. Animation state + stepper.
//
// The *model* (sockets, styles) is plain data owned by React. The *animation*
// (where the spin currently is, mid-flight ore drops, fading set-bursts) lives
// here and is advanced a little every frame by `advanceDrawState`. Keeping it
// separate means a button press just mutates the model; the engine notices the
// change and animates toward it.
// ---------------------------------------------------------------------------

/** Per-socket animation, parallel to model.sockets. */
interface SocketAnim {
  /** 0..1 eased ore→gem morph (0 while ore, animates to 1 when refined). */
  morph: number
  /** 0..1 drop-in progress when ore first lands (0 = just above, 1 = settled). */
  oreDrop: number
  /** 0..1 decaying flash used as a bloom on set. */
  bloom: number
}

/**
 * One celebratory mote flung out when a gem is set. Stored *relative* to its gem
 * (a unit direction + age), so it follows the gem if the ring keeps turning.
 */
interface Particle {
  dx: number
  dy: number
  speed: number
  age: number
  life: number
  hue: number
}

interface Burst {
  socket: number
  particles: Particle[]
}

/**
 * Game feedback drawn *on top* of the necklace, anchored to the active socket.
 * This is purely declarative *intent* the game screen passes each render; the
 * engine animates the soft fades (mist label, breathing-ring strength) itself in
 * `advanceDrawState`, exactly like it eases the spin/morph. Leave it undefined for
 * the look-dev test page, which wants no overlay.
 */
export interface NecklaceOverlay {
  /** Big centre number for the round-start count-in (4,3,2,1), or null when idle. */
  countdown?: number | null
  /** Note identifier (e.g. "C", "F#") shown above the active socket, or null to hide. */
  noteLabel?: string | null
  /** Whether the breathing focus ring should be present around the active socket. */
  focusRing?: boolean
}

// Fade ramps (seconds) for the overlay elements, eased frame-by-frame in the engine.
const LABEL_RISE_S = 1.0 // note label fades in like mist (§2)
const LABEL_FALL_S = 0.12 // …but disappears promptly when the note resolves
const FOCUS_RISE_S = 0.3 // breathing ring appears gently once the socket settles
const FOCUS_FALL_S = 0.18 // …and fades out on resolve (§1: 150–200 ms)

/** Linear ramp of `cur` toward `target`, slower up (riseS) than down (fallS). */
function approach(cur: number, target: number, riseS: number, fallS: number, dt: number): number {
  const s = target > cur ? riseS : fallS
  if (s <= 0) return target
  const step = dt / s
  return cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step)
}

/** All the moving state the renderer keeps between frames. */
export interface DrawState {
  spin: number
  spinTarget: number
  /** Arc-layout camera pan (eased toward the active socket's x). */
  camX: number
  /** Seconds since start, for twinkle / sheen / idle breathing. */
  time: number
  anim: SocketAnim[]
  bursts: Burst[]
  /** Snapshot of last frame's fills, to detect when a socket changes. */
  prevFill: SocketFill[]
  /** Detect a brand-new necklace (seed change) to snap rather than animate. */
  prevSeed: number
  /** Honour the OS "reduce motion" setting → calmer idle. */
  reduceMotion: boolean
  /** 0..1 eased opacity of the note label (mist fade-in / quick fade-out). */
  labelFade: number
  /** 0..1 eased strength of the breathing focus ring. */
  focusFade: number
}

/** Build the initial animation state for a model (no triggers fired). */
export function createDrawState(model: NecklaceModel, reduceMotion = false): DrawState {
  const target = ringSpinTarget(model.activeIndex, model.sockets.length)
  return {
    spin: target,
    spinTarget: target,
    camX: 0,
    time: 0,
    anim: model.sockets.map((s) => ({
      morph: s.fill === 'gem' ? 1 : 0,
      oreDrop: s.fill === 'empty' ? 0 : 1,
      bloom: 0,
    })),
    bursts: [],
    prevFill: model.sockets.map((s) => s.fill),
    prevSeed: model.seed,
    reduceMotion,
    labelFade: 0,
    focusFade: 0,
  }
}

/** Spawn a ring of motes from a socket, brighter/bigger the higher the quality. */
function spawnBurst(socket: number, quality: number, hue: number): Burst {
  const count = Math.round(5 + quality * 9)
  const particles: Particle[] = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * TAU + Math.random() * 0.4
    return {
      dx: Math.cos(a),
      dy: Math.sin(a),
      speed: 40 + quality * 90 + Math.random() * 30,
      age: 0,
      life: 0.5 + quality * 0.35,
      hue,
    }
  })
  return { socket, particles }
}

/**
 * Advance everything one frame. `dt` is seconds since the last frame.
 *
 * Spin/cam use *exponential (critically-damped) easing*: each frame we move a
 * fixed fraction of the remaining distance, normalised by dt so the speed is the
 * same at any frame rate. It approaches the target smoothly and never overshoots,
 * which is exactly the calm, non-twitchy navigation the game wants.
 */
export function advanceDrawState(
  draw: DrawState,
  model: NecklaceModel,
  layout: NecklaceLayout,
  dt: number,
  overlay?: NecklaceOverlay,
): void {
  draw.time += dt

  // Ease the overlay fades toward the screen's current intent (engine-side, so the
  // game just toggles booleans/strings and the mist + breathing-ring fades are smooth).
  draw.labelFade = approach(draw.labelFade, overlay?.noteLabel ? 1 : 0, LABEL_RISE_S, LABEL_FALL_S, dt)
  draw.focusFade = approach(draw.focusFade, overlay?.focusRing ? 1 : 0, FOCUS_RISE_S, FOCUS_FALL_S, dt)

  // A new necklace (seed changed): reset animation to match, don't animate in.
  if (draw.prevSeed !== model.seed || draw.anim.length !== model.sockets.length) {
    draw.prevSeed = model.seed
    draw.anim = model.sockets.map((s) => ({
      morph: s.fill === 'gem' ? 1 : 0,
      oreDrop: s.fill === 'empty' ? 0 : 1,
      bloom: 0,
    }))
    draw.prevFill = model.sockets.map((s) => s.fill)
    draw.bursts = []
    draw.spinTarget = ringSpinTarget(model.activeIndex, model.sockets.length)
    draw.spin = draw.spinTarget
  }

  // --- Spin toward the active socket (short way round) ---
  const rawTarget = ringSpinTarget(model.activeIndex, model.sockets.length)
  draw.spinTarget = nearestAngle(rawTarget, draw.spin)
  const spinK = 1 - Math.exp(-5 * dt) // ~0.6s smooth settle
  draw.spin = lerp(draw.spin, draw.spinTarget, spinK)

  // --- Arc camera pan toward the active socket's x ---
  const t = model.sockets.length === 1 ? 0.5 : model.activeIndex / (model.sockets.length - 1)
  const targetCam = arcPoint(t, layout).x
  draw.camX = lerp(draw.camX, targetCam, 1 - Math.exp(-6 * dt))

  // --- Per-socket effects + change detection ---
  model.sockets.forEach((socket, i) => {
    const a = draw.anim[i]
    const was = draw.prevFill[i]
    if (was !== socket.fill) {
      if (socket.fill === 'ore') {
        a.oreDrop = 0 // start the drop-in
        a.bloom = 0.55 // small catch flash
      } else if (socket.fill === 'gem') {
        a.bloom = 1 // big set flash ...
        draw.bursts.push(spawnBurst(i, socket.quality, socketHue(model, i))) // ... + motes
      }
      draw.prevFill[i] = socket.fill
    }
    // Ease the morph toward its target (1 if gem, else 0) → the ore→gem reveal.
    const morphTarget = socket.fill === 'gem' ? 1 : 0
    a.morph = lerp(a.morph, morphTarget, 1 - Math.exp(-7 * dt))
    // Drive the drop-in and let the bloom decay.
    a.oreDrop = clamp(a.oreDrop + dt * 3.2, 0, 1)
    a.bloom = Math.max(0, a.bloom - dt * 2.6)
  })

  // --- Advance + cull set-burst particles (just age them; paint derives position) ---
  for (const b of draw.bursts) {
    for (const p of b.particles) p.age += dt
    b.particles = b.particles.filter((p) => p.age < p.life)
  }
  draw.bursts = draw.bursts.filter((b) => b.particles.length > 0)
}

// ---------------------------------------------------------------------------
// 7. drawNecklace — the master per-frame paint.
//
// Order matters for a believable result:
//   backdrop → (ring: depth-sorted chain+gems) OR (arc: cords, chain, gems)
// In the ring, chain spans and gems are interleaved by depth so the front of the
// necklace correctly overlaps the back — the classic fix for a ring of beads.
// ---------------------------------------------------------------------------

/** One thing to paint at a known depth; lets us sort the whole scene back→front. */
interface RenderItem {
  z: number
  paint: () => void
}

export function drawNecklace(
  ctx: CanvasRenderingContext2D,
  layout: NecklaceLayout,
  model: NecklaceModel,
  draw: DrawState,
  overlay?: NecklaceOverlay,
): void {
  const theme = THEMES[model.themeId]
  const metal = METALS[theme.metal]
  const n = model.sockets.length

  ctx.clearRect(0, 0, layout.width, layout.height)
  drawBackdrop(ctx, layout, theme, draw.time)

  if (model.layoutMode === 'ring') {
    drawRing(ctx, layout, model, draw, theme, metal, n, overlay)
  } else {
    drawArc(ctx, layout, model, draw, theme, metal, n, overlay)
  }
}

/**
 * Game-feedback overlay (focus ring + note label + count-in number), drawn last so
 * it sits above the jewellery. Anchored to the active socket's projected point so
 * the label hangs in the empty interior of the ring, just above the active gem.
 */
function paintOverlay(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  draw: DrawState,
  _theme: Theme,
  active: Projected,
  overlay: NecklaceOverlay,
): void {
  const r = L.gemR * active.scale

  // The active socket already carries the breathing halo (drawGlow); the stroked
  // focus ring on top only obscured the gem, so it is intentionally omitted here.

  // Note identifier: a soft, low-contrast whisper above the active socket.
  if (draw.labelFade > 0.01 && overlay.noteLabel) {
    const fs = clamp(r * 0.95, 13, 32)
    ctx.save()
    ctx.globalAlpha = 0.55 * draw.labelFade
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 ${fs.toFixed(0)}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(overlay.noteLabel, active.x, active.y - r - r * 0.5)
    ctx.restore()
  }

  // Round-start count-in: a big, calm number in the ring's focal centre.
  if (overlay.countdown != null) {
    const fs = Math.min(L.width, L.height) * 0.22
    ctx.save()
    ctx.globalAlpha = 0.82
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${fs.toFixed(0)}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(overlay.countdown), L.cx, L.cy)
    ctx.restore()
  }
}

// --- Ring layout: pseudo-3D, depth-sorted ---
function drawRing(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  model: NecklaceModel,
  draw: DrawState,
  theme: Theme,
  metal: Metal,
  n: number,
  overlay?: NecklaceOverlay,
): void {
  // Idle "breathing": a tiny extra spin wobble so the necklace feels alive at rest
  // without the active socket ever leaving the front. Damped when reduce-motion is on.
  const wobble = (draw.reduceMotion ? 0.008 : 0.036) * Math.sin(draw.time * 0.7)
  const spin = draw.spin + wobble

  const gemP = paintRingBody(ctx, L, model, draw, theme, metal, n, spin)

  // Bursts last (additive light on top of everything).
  paintBursts(ctx, draw, gemP)

  // Game overlay anchored to the active socket (front-centre after the spin settles).
  if (overlay) paintOverlay(ctx, L, draw, theme, gemP[model.activeIndex], overlay)
}

/**
 * Paint the pseudo-3D ring (chain spans + gems) at a given `spin`, depth-sorted so
 * the front of the hoop overlaps the back. Split out of `drawRing` so the close-up
 * gem viewer can reuse the *same* circular necklace under a zoom transform — no
 * second, flat renderer. Returns the projected gem points so the caller can layer
 * bursts / overlays on top.
 */
function paintRingBody(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  model: NecklaceModel,
  draw: DrawState,
  theme: Theme,
  metal: Metal,
  n: number,
  spin: number,
): Projected[] {
  const gemP = model.sockets.map((_, i) => projectRing(socketAngle(i, n), spin, L))

  const items: RenderItem[] = []

  // Chain spans connect each socket to the next, closing the loop. Depth = the
  // average of the two endpoints so a span tucks behind/in-front correctly.
  for (let i = 0; i < n; i++) {
    const a0 = socketAngle(i, n)
    const a1 = socketAngle(i + 1, n) // i+1 wraps via the angle maths
    const z = (Math.sin(spin + a0) + Math.sin(spin + a1)) / 2
    items.push({
      z: z - 0.001, // nudge chain just behind its gems at equal depth
      paint: () => paintChainSpan(ctx, L, model, metal, spin, a0, a1),
    })
  }

  // Gems.
  model.sockets.forEach((_, i) => {
    items.push({
      z: gemP[i].z,
      paint: () => paintSocket(ctx, L, model, draw, theme, metal, i, gemP[i], spin),
    })
  })

  // Back → front.
  items.sort((p, q) => p.z - q.z)
  for (const it of items) it.paint()

  return gemP
}

// --- Arc layout: calm hanging necklace with a spotlight pan ---
function drawArc(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  model: NecklaceModel,
  draw: DrawState,
  theme: Theme,
  metal: Metal,
  n: number,
  overlay?: NecklaceOverlay,
): void {
  ctx.save()
  // Pan so the active socket sits at screen centre (the "spotlight" glides to it).
  ctx.translate(L.width / 2 - draw.camX, 0)
  paintArcBody(ctx, L, model, draw, theme, metal, n, overlay)
  ctx.restore()
}

/**
 * Paint the hanging-necklace contents (cord stubs, chain, gems, set-bursts) in the
 * caller's current transform. Split out of `drawArc` so the close-up gem viewer can
 * reuse the exact same jewellery under a zoom transform — no second gem renderer.
 */
function paintArcBody(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  model: NecklaceModel,
  draw: DrawState,
  theme: Theme,
  metal: Metal,
  n: number,
  overlay?: NecklaceOverlay,
): void {
  const gemP: Projected[] = model.sockets.map((_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1)
    const p = arcPoint(t, L)
    // Active gem gets a gentle size bump so it still reads as the focus.
    const boost = i === model.activeIndex ? 1.16 : 1
    return { x: p.x, y: p.y, z: 0, scale: boost, alpha: 1 }
  })

  // Cord stubs from the end sockets up to the top corners → "it hangs round a neck".
  paintCord(ctx, metal, gemP[0], { x: L.arc.padX * 0.5, y: 0 })
  paintCord(ctx, metal, gemP[n - 1], { x: L.width - L.arc.padX * 0.5, y: 0 })

  // Chain between sockets (no depth sort needed — everything faces us).
  for (let i = 0; i < n - 1; i++) paintArcChain(ctx, L, model, metal, draw.spin, i)

  // Gems, active one last so its glow overlaps neighbours.
  const order = model.sockets.map((_, i) => i).sort((a, b) => (a === model.activeIndex ? 1 : 0) - (b === model.activeIndex ? 1 : 0))
  for (const i of order) paintSocket(ctx, L, model, draw, theme, metal, i, gemP[i], draw.spin)

  paintBursts(ctx, draw, gemP)

  // Game overlay anchored to the active socket (inside the translated arc space).
  if (overlay) paintOverlay(ctx, L, draw, theme, gemP[model.activeIndex], overlay)
}

/**
 * Render a *single* gem big and centred, the same circular necklace curving off
 * both edges, so the player can inspect each stone up close and slide left/right
 * along the hoop. Pure reuse of the pseudo-3D ring: it spins the hoop so the focused
 * gem swings to the front-centre (exactly like the game), then zooms the whole ring
 * in with one `ctx.scale` about that fixed front point. Because the front-centre is
 * always the zoom anchor, sliding just spins the ring and the neighbouring gems
 * curve up and away to the sides — reading as a real necklace seen close, not a flat
 * strip.
 *
 * `focus` is a *fractional* gem index (e.g. 2.4 while sliding from gem 2 to 3); the
 * caller eases it for a smooth glide. `layout` is the standard ring layout sized to
 * the real canvas; `screenW/H` are that canvas size.
 */
/** Per-gem caption drawn over the close-up (note name + a small sub-line of scores). */
export interface CloseupLabel {
  note: string
  sub: string
}

export function drawCloseup(
  ctx: CanvasRenderingContext2D,
  layout: NecklaceLayout,
  model: NecklaceModel,
  draw: DrawState,
  focus: number,
  screenW: number,
  screenH: number,
  labels?: CloseupLabel[],
): void {
  const theme = THEMES[model.themeId]
  const metal = METALS[theme.metal]
  const n = model.sockets.length

  ctx.clearRect(0, 0, screenW, screenH)
  drawBackdrop(ctx, layout, theme, draw.time)

  // Spin the hoop so the (fractional) focused gem sits at the front-centre, where
  // sin(spin + angle) = 1. Sliding `focus` just rotates the ring through that point.
  const f = n <= 1 ? 0 : clamp(focus, 0, n - 1)
  const focusAngle = socketAngle(f, n)
  const spin = Math.PI / 2 - focusAngle
  const anchor = projectRing(focusAngle, spin, layout) // the fixed front-centre point
  // Zoom so a front gem fills ~60% of the smaller screen dimension; clamp for tiny/huge canvases.
  const zoom = clamp((Math.min(screenW, screenH) * 0.3) / layout.gemR, 1.5, 9)

  ctx.save()
  ctx.translate(screenW / 2, screenH / 2)
  ctx.scale(zoom, zoom)
  ctx.translate(-anchor.x, -anchor.y)
  // No "active" gem in the viewer → no game glow / size-boost; show the stones as-is.
  const quiet: NecklaceModel = model.activeIndex === -1 ? model : { ...model, activeIndex: -1 }
  paintRingBody(ctx, layout, quiet, draw, theme, metal, n, spin)
  ctx.restore()

  // Captions: drawn in *screen* space (after the zoom transform is popped) so the
  // text stays crisp at a fixed size. Each front-facing gem gets its note name above
  // it; the focused gem reads boldest, neighbours fade out as they curve away.
  if (labels) paintCloseupLabels(ctx, layout, n, spin, anchor, zoom, screenW, screenH, f, labels)
}

/** Note-name + score captions above the visible gems in the close-up viewer. */
function paintCloseupLabels(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  n: number,
  spin: number,
  anchor: Projected,
  zoom: number,
  screenW: number,
  screenH: number,
  focus: number,
  labels: CloseupLabel[],
): void {
  ctx.save()
  ctx.textAlign = 'center'
  for (let i = 0; i < n; i++) {
    const label = labels[i]
    if (!label) continue
    const P = projectRing(socketAngle(i, n), spin, L)
    if (P.z < -0.1) continue // skip gems on the far side of the hoop
    const sx = screenW / 2 + (P.x - anchor.x) * zoom
    const sy = screenH / 2 + (P.y - anchor.y) * zoom
    const gemR = L.gemR * P.scale * zoom
    // Fade with distance from the focused gem so neighbours don't clutter.
    const fade = clamp(1 - Math.abs(i - focus) * 0.55, 0.12, 1)
    const fs = clamp(gemR * 0.4, 12, 30)
    const baseY = sy - gemR - fs * 0.5
    ctx.globalAlpha = fade
    ctx.shadowColor = 'rgba(0,0,0,0.85)'
    ctx.shadowBlur = 4
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 ${fs.toFixed(0)}px ui-sans-serif, system-ui, sans-serif`
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(label.note, sx, baseY)
    if (label.sub) {
      ctx.globalAlpha = fade * 0.8
      ctx.font = `600 ${(fs * 0.52).toFixed(0)}px ui-sans-serif, system-ui, sans-serif`
      ctx.fillStyle = '#cfe2ff'
      ctx.textBaseline = 'top'
      ctx.fillText(label.sub, sx, baseY + 2)
    }
  }
  ctx.restore()
}

/**
 * Paint one socket at a projected point: glow (if active) → bezel → contents
 * (empty / ore / morphing gem) → sparkle/fire → bloom. `scale` shrinks back
 * beads; `alpha` fades them into the atmosphere.
 */
function paintSocket(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  model: NecklaceModel,
  draw: DrawState,
  theme: Theme,
  metal: Metal,
  i: number,
  P: Projected,
  spin: number,
): void {
  const socket = model.sockets[i]
  const a = draw.anim[i]
  const r = L.gemR * P.scale
  const hue = socketHue(model, i)
  const isActive = i === model.activeIndex

  ctx.save()
  ctx.globalAlpha = P.alpha

  if (isActive) drawGlow(ctx, P.x, P.y, r, theme.accent, draw.time)

  // Empty socket: a plain round cradle waiting to be filled (plus the glow if active).
  if (socket.fill === 'empty') {
    drawOreCradle(ctx, P.x, P.y, r, metal, true)
    ctx.restore()
    return
  }

  // Bloom: canvas-native glow that swells on a fresh set and decays.
  if (a.bloom > 0) {
    ctx.shadowColor = hsl(hue, 100, 70)
    ctx.shadowBlur = 4 + 26 * a.bloom
  }

  // The ore drop-in: the stone starts above the socket and settles into place
  // with a tiny overshoot bounce (easeOutBack can exceed 1 just before it lands).
  const oreY = P.y - (1 - easeOutBack(a.oreDrop)) * r * 1.6

  // Crossfade ore → gem by the eased morph value (the descending "refine" reveal).
  const morph = a.morph
  if (morph < 1) {
    ctx.save()
    ctx.globalAlpha = P.alpha * (1 - morph)
    // Round cradle + a lumpy ore that fills it almost exactly (the raw "mined" stage).
    drawOreCradle(ctx, P.x, P.y, r, metal, false)
    drawOre(ctx, P.x, oreY, r * 0.97, hue, socket.quality, socket.seed)
    ctx.restore()
  }

  if (morph > 0) {
    // Gem grows out of the ore with a little overshoot.
    const gr = r * (0.6 + 0.4 * easeOutBack(clamp(morph, 0, 1)))
    ctx.save()
    ctx.globalAlpha = P.alpha * morph
    if (model.gemStyle === 'cabochon') {
      drawShapedCabochon(ctx, P.x, P.y, gr, hue, socket.quality, socket.gem)
    } else {
      drawShapedGem(ctx, P.x, P.y, gr, hue, socket.quality, socket.gem, spin, socket.seed)
    }
    ctx.shadowBlur = 0
    drawFire(ctx, P.x, P.y, gr, socket.quality, spin)
    // Sparkle is the polish-pass payoff: its count + brightness come from that score
    // level (LEVEL_SPARKLES), eased in with the ore→gem reveal (`morph`).
    drawSparkle(ctx, P.x, P.y, gr, scoreLevel(socket.gem.polish), morph, draw.time, socket.seed)
    ctx.restore()
  }

  // The faceted metal setting that holds the finished stone — only once it refines
  // into a gem, so the ascending ore stage keeps its plain round cradle.
  ctx.shadowBlur = 0
  if (morph > 0) drawBezel(ctx, P.x, P.y, r, metal, false, socket.gem)

  ctx.restore()
}

/** Sample points along a ring span (between two angles) so the chain follows the ellipse. */
function ringSpanPoints(a0: number, a1: number, count: number, spin: number, L: NecklaceLayout): Projected[] {
  const pts: Projected[] = []
  for (let k = 0; k < count; k++) {
    const t = count === 1 ? 0.5 : k / (count - 1)
    pts.push(projectRing(lerp(a0, a1, t), spin, L))
  }
  return pts
}

/**
 * Evenly-spaced connector positions for one ring span (gem i → gem i+1).
 * Beads are inset just past both gem rims and spread across the *whole* visible
 * gap, with the count scaled to the gap length. This both (a) fixes the old
 * "broken in the middle" look — the previous version only placed beads at 1/3 and
 * 2/3, leaving the centre empty — and (b) with the smaller gems/beads gives about
 * 3× as much chain between gems.
 */
function ringChainPoints(a0: number, a1: number, spin: number, L: NecklaceLayout): Projected[] {
  const arcLen = (TAU / L.socketCount) * L.rx // ≈ centre-to-centre distance along the hoop
  // Start just past each gem rim, then push 5% further into both gems so the
  // bead/chain run actually reaches them instead of stopping short (the gap).
  const inset = clamp((L.gemR + L.linkR) / arcLen, 0.08, 0.45) - 0.1
  const usable = 1 - 2 * inset
  const count = clamp(Math.round((usable * arcLen) / (L.linkR * 2.2)), 1, 12)
  const pts: Projected[] = []
  for (let k = 0; k < count; k++) {
    const t = inset + ((k + 0.5) / count) * usable // even, gap-filling, never on a gem
    pts.push(projectRing(lerp(a0, a1, t), spin, L))
  }
  return pts
}

/** Paint the chosen chain style for one ring span between socket angles a0..a1. */
function paintChainSpan(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  model: NecklaceModel,
  metal: Metal,
  spin: number,
  a0: number,
  a1: number,
): void {
  if (model.chainStyle === 'rope') {
    // Snake/rope chain: one continuous cord from gem to gem (no gaps by construction).
    const pts = ringSpanPoints(a0, a1, 10, spin, L)
    paintRopePath(ctx, pts, metal, L.linkR)
    return
  }
  // Beads + cable share the same evenly-spaced, gap-filling positions.
  const pts = ringChainPoints(a0, a1, spin, L)
  if (model.chainStyle === 'beads') {
    for (const p of pts) {
      ctx.save()
      ctx.globalAlpha = p.alpha
      drawMetalBead(ctx, p.x, p.y, L.linkR * BEAD_R_SCALE * p.scale, metal, spin)
      ctx.restore()
    }
  } else {
    paintCableLinks(ctx, pts, metal, L.linkR * 1.7)
  }
}

/** Arc-layout equivalent of a chain span (along the catenary between two gems). */
function paintArcChain(
  ctx: CanvasRenderingContext2D,
  L: NecklaceLayout,
  model: NecklaceModel,
  metal: Metal,
  spin: number,
  i: number,
): void {
  const n = model.sockets.length
  const t0 = i / (n - 1)
  const t1 = (i + 1) / (n - 1)
  if (model.chainStyle === 'rope') {
    // Continuous cord following the catenary between the two gems.
    const pts = Array.from({ length: 10 }, (_, k) => {
      const p = arcPoint(lerp(t0, t1, k / 9), L)
      return { x: p.x, y: p.y, z: 0, scale: 1, alpha: 1 }
    })
    paintRopePath(ctx, pts, metal, L.linkR)
    return
  }
  // Even, gap-filling beads/links between the two gems (same logic as the ring).
  const p0 = arcPoint(t0, L)
  const p1 = arcPoint(t1, L)
  const spanPx = Math.hypot(p1.x - p0.x, p1.y - p0.y)
  // Push 5% further into both gems (matching the ring span) so the run reaches them.
  const inset = clamp((L.gemR + L.linkR) / spanPx, 0.08, 0.45) - 0.1
  const usable = 1 - 2 * inset
  const count = clamp(Math.round((usable * spanPx) / (L.linkR * 2.2)), 1, 12)
  const pts: Projected[] = []
  for (let k = 0; k < count; k++) {
    const sub = inset + ((k + 0.5) / count) * usable
    const p = arcPoint(lerp(t0, t1, sub), L)
    pts.push({ x: p.x, y: p.y, z: 0, scale: 1, alpha: 1 })
  }
  if (model.chainStyle === 'beads') {
    for (const p of pts) drawMetalBead(ctx, p.x, p.y, L.linkR * BEAD_R_SCALE, metal, spin)
  } else {
    paintCableLinks(ctx, pts, metal, L.linkR * 1.7)
  }
}

/** Thick metal cord through the points + a thin offset highlight (the "snake chain"). */
function paintRopePath(ctx: CanvasRenderingContext2D, pts: Projected[], m: Metal, linkR: number): void {
  const avgScale = pts.reduce((s, p) => s + p.scale, 0) / pts.length
  // Rope thickness tracks linkR (which scales with gem size), so the cord is
  // chunky on sparse necklaces and thin on dense ones.
  const w = linkR * avgScale
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = m.lo
  ctx.lineWidth = w * 4
  strokePolyline(ctx, pts)
  ctx.strokeStyle = m.mid
  ctx.lineWidth = w * 2.7
  strokePolyline(ctx, pts)
  // Bright highlight offset slightly up = round cord catching light from above.
  ctx.strokeStyle = m.hi
  ctx.lineWidth = w * 0.95
  ctx.save()
  ctx.translate(0, -1.2 * avgScale)
  strokePolyline(ctx, pts)
  ctx.restore()
  ctx.restore()
}

/** Stroke a smooth-ish polyline through the points. */
function strokePolyline(ctx: CanvasRenderingContext2D, pts: Projected[]): void {
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.stroke()
}

/**
 * Small oval links at *every* position (was skipping the first/last, which left a
 * gap), each oriented along the cord. Direction comes from the neighbours, falling
 * back to the point itself at the ends.
 */
function paintCableLinks(ctx: CanvasRenderingContext2D, pts: Projected[], m: Metal, linkR: number): void {
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k]
    const prev = pts[k - 1] ?? p
    const next = pts[k + 1] ?? p
    const ang = Math.atan2(next.y - prev.y, next.x - prev.x)
    const r = linkR * p.scale
    ctx.save()
    ctx.globalAlpha = p.alpha
    ctx.translate(p.x, p.y)
    ctx.rotate(ang + (k % 2) * (Math.PI / 2)) // alternate link orientation
    ctx.strokeStyle = m.mid
    ctx.lineWidth = Math.max(1.5, r * 0.4)
    ctx.beginPath()
    ctx.ellipse(0, 0, r, r * 0.6, 0, 0, TAU)
    ctx.stroke()
    ctx.strokeStyle = m.hi
    ctx.lineWidth = Math.max(0.8, r * 0.22)
    ctx.beginPath()
    ctx.ellipse(0, -0.6, r, r * 0.6, 0, Math.PI, TAU)
    ctx.stroke()
    ctx.restore()
  }
}

/** A single straight cord segment (used for the arc's hanging stubs). */
function paintCord(ctx: CanvasRenderingContext2D, m: Metal, a: Projected, b: { x: number; y: number }): void {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = m.mid
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.restore()
}

/** Paint all live set-burst motes, positioned relative to their (moving) gem. */
function paintBursts(ctx: CanvasRenderingContext2D, draw: DrawState, gemP: Projected[]): void {
  if (draw.bursts.length === 0) return
  ctx.save()
  ctx.globalCompositeOperation = 'lighter' // additive → motes read as flecks of light
  for (const b of draw.bursts) {
    const g = gemP[b.socket]
    if (!g) continue
    for (const p of b.particles) {
      // Position from age: fly out along the direction, plus a gravity sag.
      const dist = p.speed * p.age * g.scale
      const fall = 60 * p.age * p.age * g.scale
      const px = g.x + p.dx * dist
      const py = g.y + p.dy * dist + fall
      const a = clamp(1 - p.age / p.life, 0, 1) // fade out as it ages
      const rad = (1 + 2.5 * a) * g.scale
      const grd = ctx.createRadialGradient(px, py, 0, px, py, rad * 2)
      grd.addColorStop(0, hsl(p.hue, 100, 80, a))
      grd.addColorStop(1, hsl(p.hue, 100, 80, 0))
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(px, py, rad * 2, 0, TAU)
      ctx.fill()
    }
  }
  ctx.restore()
}
