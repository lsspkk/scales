import { describe, it, expect } from 'vitest'
import {
  mulberry32,
  ringSpinTarget,
  createNecklace,
  rollQuality,
  buildGemOutline,
  rollForms,
  rollGemSpec,
  FORM_SETS,
  ALL_FORMS,
} from './necklace'

// Only the pure maths is tested here — the canvas drawing is verified by eye on
// the #/test/necklace page (per the React testing rules, canvas output isn't unit-tested).

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(123)
    const b = mulberry32(123)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('produces values in [0, 1)', () => {
    const r = mulberry32(42)
    for (let i = 0; i < 100; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('ringSpinTarget', () => {
  it('brings socket 0 to the front (sin of the angle = 1)', () => {
    expect(Math.sin(ringSpinTarget(0, 7))).toBeCloseTo(1)
  })

  it('brings any socket to the front', () => {
    for (let i = 0; i < 7; i++) {
      const spin = ringSpinTarget(i, 7)
      const angle = (i / 7) * Math.PI * 2
      expect(Math.sin(spin + angle)).toBeCloseTo(1)
    }
  })
})

describe('createNecklace', () => {
  it('builds the requested number of empty sockets', () => {
    const m = createNecklace(1, 7)
    expect(m.sockets).toHaveLength(7)
    expect(m.sockets.every((s) => s.fill === 'empty')).toBe(true)
    expect(m.activeIndex).toBe(0)
  })

  it('is fully reproducible from its seed', () => {
    const a = createNecklace(99, 5)
    const b = createNecklace(99, 5)
    expect(a.sockets.map((s) => s.seed)).toEqual(b.sockets.map((s) => s.seed))
  })

  it('gives every socket a gem spec with a valid form', () => {
    const m = createNecklace(5, 6, { formSet: FORM_SETS.find((f) => f.id === 'mixed') })
    expect(m.sockets.every((s) => s.gem && ALL_FORMS.includes(s.gem.form))).toBe(true)
  })
})

describe('buildGemOutline', () => {
  it('returns one point per side when corners are not cut', () => {
    expect(buildGemOutline('square', 0)).toHaveLength(4)
    expect(buildGemOutline('triangle', 0)).toHaveLength(3)
    expect(buildGemOutline('dodecagon', 0)).toHaveLength(12)
  })

  it('chamfers every corner into two points when cut', () => {
    expect(buildGemOutline('square', 1)).toHaveLength(8)
    expect(buildGemOutline('triangle', 0.5)).toHaveLength(6)
  })

  it('normalises every form/cut to a round gem width (diameter 2)', () => {
    for (const form of ALL_FORMS) {
      for (const cut of [0, 0.5, 1]) {
        const pts = buildGemOutline(form, cut)
        const xs = pts.map((p) => p.x)
        expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2)
        for (const x of xs) expect(Math.abs(x)).toBeLessThanOrEqual(1 + 1e-9)
      }
    }
  })

  it('makes ovalTall taller than wide and ovalWide wider than tall', () => {
    const extent = (pts: { x: number; y: number }[]) => ({
      w: Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x)),
      h: Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y)),
    })
    const tall = extent(buildGemOutline('ovalTall', 0))
    const wide = extent(buildGemOutline('ovalWide', 0))
    expect(tall.h).toBeGreaterThan(tall.w)
    expect(wide.w).toBeGreaterThan(wide.h)
  })
})

describe('rollForms', () => {
  it('is deterministic for a seed and fills the count', () => {
    const set = FORM_SETS.find((s) => s.id === 'mixed')!
    const a = rollForms(set, 8, mulberry32(7))
    const b = rollForms(set, 8, mulberry32(7))
    expect(a).toEqual(b)
    expect(a).toHaveLength(8)
  })

  it('only draws forms from the set pool', () => {
    const set = FORM_SETS.find((s) => s.id === 'angular')!
    for (const f of rollForms(set, 30, mulberry32(3))) expect(set.forms).toContain(f)
  })

  it('the random set still yields valid forms', () => {
    const set = FORM_SETS.find((s) => s.id === 'random')!
    for (const f of rollForms(set, 30, mulberry32(9))) expect(ALL_FORMS).toContain(f)
  })
})

describe('rollGemSpec', () => {
  it('is deterministic and stays within the rolled ranges', () => {
    for (let seed = 0; seed < 50; seed++) {
      const a = rollGemSpec(seed, 'hexagon')
      const b = rollGemSpec(seed, 'hexagon')
      expect(a).toEqual(b)
      expect(a.form).toBe('hexagon')
      expect(a.cut).toBeGreaterThanOrEqual(0)
      expect(a.cut).toBeLessThanOrEqual(1)
      expect(a.table).toBeGreaterThanOrEqual(0.5)
      expect(a.table).toBeLessThanOrEqual(0.95)
      expect(a.polish).toBeGreaterThanOrEqual(0)
      expect(a.polish).toBeLessThanOrEqual(1)
    }
  })
})

describe('rollQuality', () => {
  it('stays within the pleasing 0.45..1.0 band', () => {
    for (let seed = 0; seed < 50; seed++) {
      const q = rollQuality(seed)
      expect(q).toBeGreaterThanOrEqual(0.45)
      expect(q).toBeLessThanOrEqual(1)
    }
  })
})
