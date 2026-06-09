/*
 * DEBUG / TEST ROUTE — Necklace graphics spike (Task 33).
 * Reach it from the shared `#/test` menu or directly via `#/test/necklace`.
 *
 * This is a *pure-visuals playground* for developing the necklace/gem look for the
 * upcoming "Pelikaanin aarteet" game mode. There is NO mic, tuner, or scale logic
 * here — buttons stand in for note events so iteration is instant:
 *
 *   • Lisää malmi  (add ore)    — the ascending "mine" step: the ring spins the
 *                                  next empty socket to the front, then a shiny
 *                                  raw stone drops in.
 *   • Hio jalokivi (refine)     — the descending "shape" step: refines the
 *                                  topmost ore into a finished, sparkling gem.
 *   • Uusi kaulakoru (new)      — rolls a fresh random necklace (new seed).
 *
 * The style toggles (layout / gem / chain / theme / colour) let a human eyeball
 * the alternatives and pick what looks best. All state is in memory only.
 */
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { NecklaceCanvas } from '../components/ui/NecklaceCanvas'
import {
  createNecklace,
  rollQuality,
  rollPalette,
  rollForms,
  rollGemSpec,
  mulberry32,
  COLOR_PATTERNS,
  FORM_SETS,
  THEMES,
  type ChainStyle,
  type ColorPattern,
  type FormSet,
  type GemStyle,
  type LayoutMode,
  type NecklaceModel,
  type SocketFill,
  type ThemeId,
} from '../lib/necklace'

/** Socket count per octave choice: 1 octave = 8 notes, 2 = 15, 3 = 22. */
const OCTAVE_OPTIONS = [
  { value: '8', label: '1 (8)' },
  { value: '15', label: '2 (15)' },
  { value: '22', label: '3 (22)' },
]
/** Beat timing: spin the socket into view first, *then* drop the stone. */
const SPIN_DELAY_MS = 480
/** How long the action buttons stay disabled while a spin+drop plays. */
const BUSY_MS = 780

interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
}

/** Compact labelled segmented control used for each style toggle. */
function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className='flex items-center gap-1'>
      <span className='w-8 shrink-0 text-[8px] font-bold uppercase tracking-wide text-[#8a6f4a]'>{label}</span>
      <div className='flex flex-1 gap-0.5'>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded px-0.5 py-0.5 text-[8px] font-semibold transition-colors ${
              value === o.value ? 'bg-[#5a2d0c] text-white' : 'bg-[#efe2c8] text-[#5a2d0c] active:bg-[#e3d0aa]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A ready-made necklace with every socket already a finished gem (looks good at a glance). */
function freshFullNecklace(
  seed: number,
  count: number,
  opts: Parameters<typeof createNecklace>[2] = {},
): NecklaceModel {
  const m = createNecklace(seed, count, opts)
  return {
    ...m,
    sockets: m.sockets.map((s) => ({ ...s, fill: 'gem' as SocketFill, quality: rollQuality(s.seed) })),
  }
}

export function NecklaceTest() {
  // Load fully crafted so the necklace look lands immediately; "Tyhjennä" empties
  // it to demo the ascending mine → descending refine animation from scratch.
  // Default to the faceted style so the new shaped cuts (corner cut + sanding) show.
  const [model, setModel] = useState<NecklaceModel>(() =>
    freshFullNecklace(0x51a7e, 8, { themeId: 'starforge', gemStyle: 'faceted' }),
  )
  const [busy, setBusy] = useState(false)
  // Which colour pattern is selected (for the highlight). Re-clicking re-rolls it.
  const [patternId, setPatternId] = useState('rainbow')
  const pattern = COLOR_PATTERNS.find((p) => p.id === patternId) ?? COLOR_PATTERNS[0]
  // Which gem-shape set is selected (the pool forms roll from). Re-clicking re-rolls shapes.
  const [formSetId, setFormSetId] = useState('classic')
  const formSet = FORM_SETS.find((f) => f.id === formSetId) ?? FORM_SETS[0]
  // Last-applied uniform preset for each sanding knob, just for the button highlight.
  const [cutPreset, setCutPreset] = useState('')
  const [tablePreset, setTablePreset] = useState('')
  const [polishPreset, setPolishPreset] = useState('')
  // A ref mirror of `busy` so the action handlers can guard re-entry synchronously.
  const busyRef = useRef(false)
  const timers = useRef<number[]>([])

  // Roll a fresh per-socket colour array for a pattern (random seed → varies each time).
  const rollFor = (p: ColorPattern, count: number) =>
    rollPalette(p, count, mulberry32(Math.floor(Math.random() * 1e9)))

  // Clear any pending timeouts on unmount so a delayed drop never fires late.
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  const beginBusy = () => {
    busyRef.current = true
    setBusy(true)
    after(BUSY_MS, () => {
      busyRef.current = false
      setBusy(false)
    })
  }

  // Ascending: fill the lowest empty socket with shiny ore (after the spin).
  const addOre = () => {
    if (busyRef.current) return
    const i = model.sockets.findIndex((s) => s.fill === 'empty')
    if (i === -1) return
    beginBusy()
    setModel((m) => ({ ...m, activeIndex: i })) // spin the socket into view
    after(SPIN_DELAY_MS, () =>
      setModel((m) => ({
        ...m,
        activeIndex: i,
        sockets: m.sockets.map((s, k) =>
          k === i ? { ...s, fill: 'ore' as SocketFill, quality: rollQuality(s.seed) } : s,
        ),
      })),
    )
  }

  // Descending: refine the highest ore into a finished gem (after the spin).
  const refine = () => {
    if (busyRef.current) return
    let i = -1
    for (let k = model.sockets.length - 1; k >= 0; k--) {
      if (model.sockets[k].fill === 'ore') {
        i = k
        break
      }
    }
    if (i === -1) return
    beginBusy()
    setModel((m) => ({ ...m, activeIndex: i }))
    after(SPIN_DELAY_MS, () =>
      setModel((m) => ({
        ...m,
        activeIndex: i,
        sockets: m.sockets.map((s, k) => (k === i ? { ...s, fill: 'gem' as SocketFill } : s)),
      })),
    )
  }

  // Re-roll just the gem colours using the current pattern (different shades each click).
  const applyPattern = (p: ColorPattern) => {
    setPatternId(p.id)
    setModel((m) => ({ ...m, palette: rollFor(p, m.sockets.length) }))
  }

  // Re-roll every gem's shape from a form set, with fresh random cut/sanding/polish.
  const applyFormSet = (set: FormSet) => {
    setFormSetId(set.id)
    setCutPreset('')
    setTablePreset('')
    setPolishPreset('')
    setModel((m) => {
      const forms = rollForms(set, m.sockets.length, mulberry32(Math.floor(Math.random() * 1e9)))
      return {
        ...m,
        sockets: m.sockets.map((s, i) => ({ ...s, gem: rollGemSpec(Math.floor(Math.random() * 1e9), forms[i]) })),
      }
    })
  }

  // Set one sanding knob (cut / table / polish) uniformly on every gem, to study it.
  const setGemField = (field: 'cut' | 'table' | 'polish', value: number) =>
    setModel((m) => ({
      ...m,
      sockets: m.sockets.map((s) => ({ ...s, gem: { ...s.gem, [field]: value } })),
    }))

  // Roll a fresh, fully-crafted random necklace, keeping the current style + colour pattern.
  const newNecklace = () => {
    if (busyRef.current) return
    setModel((m) =>
      freshFullNecklace(Math.floor(Math.random() * 1e9), m.sockets.length, {
        themeId: m.themeId,
        gemStyle: m.gemStyle,
        chainStyle: m.chainStyle,
        layoutMode: m.layoutMode,
        palette: rollFor(pattern, m.sockets.length),
        formSet,
      }),
    )
  }

  // Rebuild the necklace with a new socket count (octave choice), re-rolling colours to fit.
  const setSocketCount = (count: number) => {
    if (busyRef.current) return
    setModel((m) =>
      freshFullNecklace(m.seed, count, {
        themeId: m.themeId,
        gemStyle: m.gemStyle,
        chainStyle: m.chainStyle,
        layoutMode: m.layoutMode,
        palette: rollFor(pattern, count),
        formSet,
      }),
    )
  }

  // Empty every socket (same necklace) so the mine/refine sequence can be replayed.
  const emptyNecklace = () => {
    if (busyRef.current) return
    setModel((m) => ({
      ...m,
      activeIndex: 0,
      sockets: m.sockets.map((s) => ({ ...s, fill: 'empty' as SocketFill, quality: 0 })),
    }))
  }

  const hasEmpty = model.sockets.some((s) => s.fill === 'empty')
  const hasOre = model.sockets.some((s) => s.fill === 'ore')
  const hasFilled = model.sockets.some((s) => s.fill !== 'empty')

  return (
    // Dark base so the canvas blends into the screen; the necklace is the hero.
    <div className='relative flex min-h-[100svh] flex-col bg-[#05060f]'>
      <Link
        to='/test'
        aria-label='Takaisin testisivuille'
        className='absolute left-2 top-2 z-10 flex h-8 items-center rounded-lg border-2 border-white/40 bg-black/30 px-2 text-sm font-bold text-white/90'
      >
        ←
      </Link>

      {/* The procedurally-drawn necklace fills most of the viewport. */}
      <NecklaceCanvas model={model} className='min-h-0 w-full flex-1' />

      {/* Small controls, tucked into a compact panel below the hero canvas. */}
      <div className='shrink-0 space-y-1 border-t border-[#e3d0aa] bg-[#fffbe9] px-2 pb-2 pt-1'>
        {/* Row 1 — all 4 action buttons on one row. */}
        <div className='flex gap-1'>
          <Button size='sm' color='primary' className='flex-1 !px-1 !py-1 !text-[11px]' onClick={addOre} disabled={busy || !hasEmpty}>
            + Malmi
          </Button>
          <Button size='sm' color='secondary' className='flex-1 !px-1 !py-1 !text-[11px]' onClick={refine} disabled={busy || !hasOre}>
            ✦ Hio
          </Button>
          <Button size='sm' variant='outlined' color='primary' className='flex-1 !px-1 !py-1 !text-[11px]' onClick={newNecklace} disabled={busy}>
            ⟳ Uusi
          </Button>
          <Button size='sm' variant='outlined' color='neutral' className='flex-1 !px-1 !py-1 !text-[11px]' onClick={emptyNecklace} disabled={busy || !hasFilled}>
            ○ Tyhjennä
          </Button>
        </div>

        <Segmented<string>
          label='Oktaavi'
          value={String(model.sockets.length)}
          onChange={(v) => setSocketCount(Number(v))}
          options={OCTAVE_OPTIONS}
        />
        <Segmented<LayoutMode>
          label='Muoto'
          value={model.layoutMode}
          onChange={(v) => setModel((m) => ({ ...m, layoutMode: v }))}
          options={[
            { value: 'ring', label: 'Rengas' },
            { value: 'arc', label: 'Kaari' },
          ]}
        />
        <Segmented<GemStyle>
          label='Kivi'
          value={model.gemStyle}
          onChange={(v) => setModel((m) => ({ ...m, gemStyle: v }))}
          options={[
            { value: 'cabochon', label: 'Sileä' },
            { value: 'faceted', label: 'Hiottu' },
          ]}
        />
        {/* Corner cut applied to every gem (visible on the angular/crystal shapes). */}
        <Segmented<string>
          label='Kulma'
          value={cutPreset}
          onChange={(v) => {
            setCutPreset(v)
            setGemField('cut', Number(v))
          }}
          options={[
            { value: '0', label: 'Terävä' },
            { value: '0.5', label: 'Viiste' },
            { value: '1', label: 'Maks' },
          ]}
        />
        {/* Sanding: how big the flat table is vs. the bevel edges. */}
        <Segmented<string>
          label='Tasanne'
          value={tablePreset}
          onChange={(v) => {
            setTablePreset(v)
            setGemField('table', Number(v))
          }}
          options={[
            { value: '0.95', label: 'Iso' },
            { value: '0.72', label: 'Keski' },
            { value: '0.5', label: 'Pieni' },
          ]}
        />
        {/* Polish: crispness of the sanding edges + sparkle gain. */}
        <Segmented<string>
          label='Kiilto'
          value={polishPreset}
          onChange={(v) => {
            setPolishPreset(v)
            setGemField('polish', Number(v))
          }}
          options={[
            { value: '0.1', label: 'Matta' },
            { value: '0.55', label: 'Keski' },
            { value: '1', label: 'Kirkas' },
          ]}
        />
        <Segmented<ChainStyle>
          label='Ketju'
          value={model.chainStyle}
          onChange={(v) => setModel((m) => ({ ...m, chainStyle: v }))}
          options={[
            { value: 'beads', label: 'Helmet' },
            { value: 'rope', label: 'Köysi' },
            { value: 'cable', label: 'Lenkit' },
          ]}
        />
        <Segmented<ThemeId>
          label='Teema'
          value={model.themeId}
          onChange={(v) => setModel((m) => ({ ...m, themeId: v }))}
          options={[
            { value: 'starforge', label: 'Tähti' },
            { value: 'dragonhoard', label: 'Aarre' },
            { value: 'moongarden', label: 'Kuu' },
          ]}
        />

        {/* Colour patterns — click to roll a fresh set of shades following the pattern. */}
        <div className='flex items-start gap-1'>
          <span className='w-8 shrink-0 pt-0.5 text-[8px] font-bold uppercase tracking-wide text-[#8a6f4a]'>Väri</span>
          <div className='flex flex-1 flex-wrap gap-0.5'>
            {COLOR_PATTERNS.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPattern(p)}
                className={`rounded px-0.5 py-0.5 text-[8px] font-semibold transition-colors ${
                  patternId === p.id ? 'bg-[#5a2d0c] text-white' : 'bg-[#efe2c8] text-[#5a2d0c] active:bg-[#e3d0aa]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gem-shape sets — click to re-roll the necklace's shapes (+ fresh cut/sanding). */}
        <div className='flex items-start gap-1'>
          <span className='w-8 shrink-0 pt-0.5 text-[8px] font-bold uppercase tracking-wide text-[#8a6f4a]'>Kide</span>
          <div className='flex flex-1 flex-wrap gap-0.5'>
            {FORM_SETS.map((f) => (
              <button
                key={f.id}
                onClick={() => applyFormSet(f)}
                className={`rounded px-0.5 py-0.5 text-[8px] font-semibold transition-colors ${
                  formSetId === f.id ? 'bg-[#5a2d0c] text-white' : 'bg-[#efe2c8] text-[#5a2d0c] active:bg-[#e3d0aa]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <p className='text-center text-[10px] text-[#8a6f4a]'>
          {THEMES[model.themeId].label} · {model.sockets.filter((s) => s.fill === 'gem').length}/{model.sockets.length} hiottu ·
          Kide vaihtaa muodot; Kulma/Tasanne/Kiilto näkyvät parhaiten Hiottu-kivissä ·
          Tyhjennä ja kokeile: + Malmi (nouseva) → ✦ Hio (laskeva). Grafiikkaluonnos <code>#/test/necklace</code>
        </p>
      </div>
    </div>
  )
}
