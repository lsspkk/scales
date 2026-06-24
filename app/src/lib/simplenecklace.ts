/**
 * simplenecklace.ts — a tiny, static, one-line necklace renderer.
 *
 * The hero `necklace.ts` engine draws a pseudo-3D spinning ring with a per-frame
 * animation loop. That is overkill for *browsing* looks: the theme generator shows
 * ~30 finished necklaces at once, so it just needs a cheap straight row of stones it
 * can paint once. This module is that — it reuses the real gem look (`drawFinishedGem`)
 * and the real theme/metal tables, but lays the gems out on a flat horizontal cord
 * with no projection, no morph, no rAF.
 *
 * A "candidate" is the minimal data a curated look needs: a backdrop/metal `themeId`,
 * one hue per gem (`palette`), one shape per gem (`forms`), and a `seed` that keeps the
 * per-gem cut/sanding stable. That triple {themeId, palette, forms} is exactly what the
 * game's `createNecklace` consumes, so what you browse is what you can export.
 */
import {
  drawFinishedGem,
  rollGemSpec,
  METALS,
  THEMES,
  type GemForm,
  type ThemeId,
} from './necklace'

/** The minimal look-defining data for one browsable necklace. */
export interface NecklaceCandidate {
  themeId: ThemeId
  /** One hue per gem. */
  palette: number[]
  /** One shape per gem. */
  forms: GemForm[]
  /** Stabilises each gem's rolled cut / table. */
  seed: number
  /** Optional name shown on the row (saved themes carry their label here). */
  label?: string
}

// Browsing stones look best clean + bright, so judging is about hue + shape, not luck:
// a uniform high quality (vivid colour) and high polish (crisp facets + sparkle).
const BROWSE_QUALITY = 0.9
const BROWSE_POLISH = 0.85
// A fixed light angle that reads well head-on (matches the gem bevel's up-left default).
const BROWSE_SPIN = Math.PI / 2

/**
 * Paint one candidate as a flat row of finished gems on a cord, filling `w × h` (CSS
 * pixels — the caller applies the DPR transform). Static: call it once per change.
 */
export function drawSimpleNecklace(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cand: NecklaceCandidate,
): void {
  const theme = THEMES[cand.themeId]
  const metal = METALS[theme.metal]
  const n = cand.forms.length

  // Backdrop: the theme's dark gradient so each row reads as its own little scene.
  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, theme.bg[1])
  bg.addColorStop(1, theme.bg[0])
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const slot = w / n
  const cy = h / 2
  const r = Math.min(slot * 0.42, h * 0.42)

  // Cord behind the stones: a simple metal line linking the gem centres.
  ctx.save()
  ctx.strokeStyle = metal.lo
  ctx.lineWidth = Math.max(1.5, r * 0.12)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(slot * 0.5, cy)
  ctx.lineTo(w - slot * 0.5, cy)
  ctx.stroke()
  ctx.restore()

  for (let i = 0; i < n; i++) {
    const cx = slot * (i + 0.5)
    const hue = cand.palette[i % cand.palette.length]
    const seed = cand.seed ^ (i * 0x9e3779b1)
    const gem = { ...rollGemSpec(seed, cand.forms[i % cand.forms.length]), polish: BROWSE_POLISH }
    drawFinishedGem(ctx, cx, cy, r, hue, BROWSE_QUALITY, gem, metal, BROWSE_SPIN, seed)
  }
}
