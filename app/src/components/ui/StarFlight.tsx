import { useLayoutEffect, useRef } from 'react'
import { FlyingStar, type StarTone } from './FlyingStar'

// Base SVG size in px. The animation drives a CSS scale on top of this, so the
// star's centre stays anchored regardless of how large it grows (see transform
// note in the rAF loop). Half of this is the centring offset.
const BASE = 100
const HALF = BASE / 2

// Phase boundaries as fractions of the total flight (entry → loops → bounces → exit).
const SEG_ENTRY = 0.14
const SEG_LOOPS = 0.5
const SEG_BOUNCE = 0.76

interface Point {
  x: number
  y: number
}

interface Flight {
  entryCenter: Point // near display centre — the small entry spiral winds out from here
  entryTurns: number // loops the small appearing spiral makes
  entryDir: 1 | -1
  loopStart: Point // where the entry lands and the loops begin/end
  loopCenter: Point
  loopRadius: number
  loopAngle: number
  loops: number
  loopDir: 1 | -1
  bounceEnd: Point // also the centre the exit spiral winds out from
  bounceOffsets: number[] // vertical wobble samples, ends pinned to 0
  spiralStartAngle: number
  spiralDir: 1 | -1
  spiralTurns: number // how many loops the widening exit spiral makes
  spiralMaxRadius: number // how wide the spiral grows before vanishing
  spinDir: 1 | -1
  startWidth: number
  midWidth: number
  maxWidth: number
}

interface Pose {
  x: number
  y: number
  rotate: number
  scale: number
  opacity: number
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeIn(t: number): number {
  return t * t * t
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** Randomise every parameter of one flight, sized to the current viewport. */
function makeFlight(w: number, h: number): Flight {
  const minSide = Math.min(w, h)

  // Keep the appearance and loops centred — the star comes up near the middle
  // of the display with only small variation (loopStart stays within ~20vw).
  const loopCenter: Point = { x: rand(0.42, 0.58) * w, y: rand(0.4, 0.56) * h }
  const loopRadius = rand(0.08, 0.15) * minSide
  const loopAngle = rand(0, Math.PI * 2)
  const loopStart: Point = {
    x: loopCenter.x + loopRadius * Math.cos(loopAngle),
    y: loopCenter.y + loopRadius * Math.sin(loopAngle),
  }

  // Random up/down wobble: a handful of samples, ends pinned so it joins smoothly.
  const sampleCount = 6
  const bounceOffsets = Array.from({ length: sampleCount }, (_, i) =>
    i === 0 || i === sampleCount - 1 ? 0 : rand(-1, 1) * rand(0.06, 0.16) * h,
  )

  const bounceEnd: Point = { x: rand(0.4, 0.6) * w, y: rand(0.4, 0.55) * h }

  return {
    entryCenter: { x: (0.5 + rand(-0.04, 0.04)) * w, y: (0.5 + rand(-0.04, 0.04)) * h },
    entryTurns: rand(1.5, 2.5),
    entryDir: Math.random() < 0.5 ? 1 : -1,
    loopStart,
    loopCenter,
    loopRadius,
    loopAngle,
    loops: Math.random() < 0.5 ? 2 : 3,
    loopDir: Math.random() < 0.5 ? 1 : -1,
    bounceEnd,
    bounceOffsets,
    spiralStartAngle: rand(0, Math.PI * 2),
    spiralDir: Math.random() < 0.5 ? 1 : -1,
    spiralTurns: rand(3, 4.5),
    spiralMaxRadius: rand(0.3, 0.5) * minSide,
    spinDir: Math.random() < 0.5 ? 1 : -1,
    startWidth: 0.01 * w, // ~1vw
    midWidth: 0.16 * w,
    maxWidth: 0.3 * w, // ~30vw (75% of the former 40vw)
  }
}

/** Interpolate the wobble samples at progress p (0..1). */
function bounceAt(offsets: number[], p: number): number {
  const f = p * (offsets.length - 1)
  const i = Math.floor(f)
  return lerp(offsets[i], offsets[Math.min(i + 1, offsets.length - 1)], f - i)
}

/** Cumulative spin in turns — slow on entry, fast through loops, accelerating out. */
function turnsAt(f: Flight, t: number): number {
  const TA = 0.5
  const TB = f.loops
  const TC = 1
  const TD = 5 // exit self-spin, ramped up via easeIn so it starts slow then whips
  if (t < SEG_ENTRY) return TA * (t / SEG_ENTRY)
  if (t < SEG_LOOPS) return TA + TB * ((t - SEG_ENTRY) / (SEG_LOOPS - SEG_ENTRY))
  if (t < SEG_BOUNCE) return TA + TB + TC * ((t - SEG_LOOPS) / (SEG_BOUNCE - SEG_LOOPS))
  return TA + TB + TC + TD * easeIn((t - SEG_BOUNCE) / (1 - SEG_BOUNCE))
}

/** Position, size, spin and fade at normalised flight time t (0..1). */
function computePose(f: Flight, t: number): Pose {
  let x: number
  let y: number
  let width: number

  if (t < SEG_ENTRY) {
    // Entry: appear tiny near the centre and wind out on a small spiral that
    // lands on the loop's start, growing as it goes — mirrors the exit spiral.
    const p = t / SEG_ENTRY
    const endX = f.loopStart.x - f.entryCenter.x
    const endY = f.loopStart.y - f.entryCenter.y
    const endRadius = Math.hypot(endX, endY)
    const endAngle = Math.atan2(endY, endX)
    const angle = endAngle - f.entryDir * Math.PI * 2 * f.entryTurns * (1 - p)
    const radius = endRadius * easeIn(p)
    x = f.entryCenter.x + radius * Math.cos(angle)
    y = f.entryCenter.y + radius * Math.sin(angle)
    width = lerp(f.startWidth, f.midWidth, easeOut(p))
  } else if (t < SEG_LOOPS) {
    // Loops: circle the top a few times while swelling to full size.
    const p = (t - SEG_ENTRY) / (SEG_LOOPS - SEG_ENTRY)
    const a = f.loopAngle + f.loopDir * Math.PI * 2 * f.loops * p
    x = f.loopCenter.x + f.loopRadius * Math.cos(a)
    y = f.loopCenter.y + f.loopRadius * Math.sin(a)
    width = lerp(f.midWidth, f.maxWidth, easeInOut(p))
  } else if (t < SEG_BOUNCE) {
    // Bounce: drift toward centre with random up/down wobble, near full size.
    const p = (t - SEG_LOOPS) / (SEG_BOUNCE - SEG_LOOPS)
    const e = easeInOut(p)
    x = lerp(f.loopStart.x, f.bounceEnd.x, e)
    y = lerp(f.loopStart.y, f.bounceEnd.y, e) + bounceAt(f.bounceOffsets, p)
    width = lerp(f.maxWidth, f.maxWidth * 0.92, p)
  } else {
    // Exit: wind out in a widening spiral — slow at first, more and faster
    // circles as it goes — while shrinking quickly, then vanish.
    const p = (t - SEG_BOUNCE) / (1 - SEG_BOUNCE)
    const angle = f.spiralStartAngle + f.spiralDir * Math.PI * 2 * f.spiralTurns * easeIn(p)
    const radius = f.spiralMaxRadius * easeIn(p)
    x = f.bounceEnd.x + radius * Math.cos(angle)
    y = f.bounceEnd.y + radius * Math.sin(angle)
    width = lerp(f.maxWidth * 0.92, 0, easeOut(p)) // shrink fast early
  }

  const fadeIn = clamp01(t / 0.05)
  const fadeOut = t > 0.9 ? clamp01((1 - t) / 0.1) : 1

  return {
    x,
    y,
    rotate: 360 * turnsAt(f, t) * f.spinDir,
    scale: width / BASE,
    opacity: Math.min(fadeIn, fadeOut),
  }
}

function applyPose(el: HTMLElement, pose: Pose): void {
  // Centre is kept anchored by the trailing translate(-HALF,-HALF): being the
  // rightmost (local) transform it is scaled/rotated with the star, so growth
  // happens about the centre rather than the top-left.
  el.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotate}deg) scale(${pose.scale}) translate(-${HALF}px, -${HALF}px)`
  el.style.opacity = String(pose.opacity)
}

interface StarFlightProps {
  durationMs?: number
  tone?: StarTone
  onDone?: () => void
}

/**
 * A single coloured star that flies a randomised path across the whole viewport
 * once, then calls `onDone`. Driven by requestAnimationFrame with imperative
 * transforms (per React conventions for animation/imperative DOM). Used by the
 * flight test page (#/test/starflight).
 */
export function StarFlight({ durationMs = 6000, tone = 'indigo', onDone }: StarFlightProps) {
  const ref = useRef<HTMLDivElement>(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const flight = makeFlight(window.innerWidth, window.innerHeight)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dur = reduce ? 1 : durationMs

    // Paint frame 0 synchronously so there is no flash at the default transform.
    applyPose(el, computePose(flight, 0))

    let raf = 0
    let start = 0
    const tick = (now: number) => {
      if (!start) start = now
      const t = Math.min((now - start) / dur, 1)
      applyPose(el, computePose(flight, t))
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        onDoneRef.current?.()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs])

  return (
    <div
      ref={ref}
      aria-hidden
      className='pointer-events-none fixed left-0 top-0 z-50 origin-top-left opacity-0 will-change-transform'
    >
      <FlyingStar size={BASE} tone={tone} />
    </div>
  )
}
