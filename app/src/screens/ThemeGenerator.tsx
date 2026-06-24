/*
 * DEBUG / TEST ROUTE — Necklace theme generator.
 * Reach it from the shared `#/test` menu or directly via `#/test/themes`.
 *
 * A browse-and-pick tool for curating good colour + shape combinations for the gem
 * game. It rolls a long list of random 8-gem necklaces (each a flat one-line render
 * via `simplenecklace.ts`, reusing the real gem look), and a kid can simply tap the
 * ones they like. Per row, 🎨 re-rolls the colours and ◆ re-rolls the shapes, so a
 * near-miss can be nudged. **Vie** (export) opens ready-to-paste TypeScript of the
 * ticked necklaces for `necklace_themes.ts`.
 *
 * No mic / tuner / scale logic — pure look-dev. All state is in memory only.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { SimpleNecklaceCanvas } from '../components/ui/SimpleNecklaceCanvas'
import { type NecklaceCandidate } from '../lib/simplenecklace'
import { NECKLACE_THEMES, type NecklaceTheme } from '../lib/necklace_themes'
import {
  rollPalette,
  rollForms,
  mulberry32,
  COLOR_PATTERNS,
  FORM_SETS,
  THEMES,
  type ThemeId,
} from '../lib/necklace'

/** Gems per browsed necklace (one octave). The game cycles these for longer necklaces. */
const GEMS = 8
/** How many candidates to show at once. */
const COUNT = 30

const THEME_IDS = Object.keys(THEMES) as ThemeId[]
const pick = <T,>(arr: readonly T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length)]
const freshSeed = () => Math.floor(Math.random() * 1e9)

/** Roll a fully random candidate: random backdrop theme + colour pattern + shape set. */
function rollRow(): NecklaceCandidate {
  const rnd = mulberry32(freshSeed())
  return {
    themeId: pick(THEME_IDS, rnd),
    palette: rollPalette(pick(COLOR_PATTERNS, rnd), GEMS, rnd),
    forms: rollForms(pick(FORM_SETS, rnd), GEMS, rnd),
    seed: freshSeed(),
  }
}

/** Stable seed from a theme id so a saved theme renders identically every visit. */
const seedFromId = (id: string) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return h >>> 0
}

/** Show a saved theme as a candidate (its cut/sanding is stable from the id-derived seed). */
const themeToCandidate = (t: NecklaceTheme): NecklaceCandidate => ({
  themeId: t.themeId,
  palette: t.palette,
  forms: t.forms,
  seed: seedFromId(t.id),
  label: t.label,
})

/** Format the ticked necklaces as a paste-ready TypeScript array for necklace_themes.ts. */
function formatExport(cands: NecklaceCandidate[]): string {
  const entries = cands
    .map((c, i) => {
      const palette = `[${c.palette.join(', ')}]`
      const forms = `[${c.forms.map((f) => `'${f}'`).join(', ')}]`
      return [
        '  {',
        `    id: 'theme-${i + 1}',`,
        `    label: 'Teema ${i + 1}',`,
        `    themeId: '${c.themeId}',`,
        `    palette: ${palette},`,
        `    forms: ${forms},`,
        '  },',
      ].join('\n')
    })
    .join('\n')
  return [
    '// Paste into app/src/lib/necklace_themes.ts',
    'export const NECKLACE_THEMES: NecklaceTheme[] = [',
    entries,
    ']',
    '',
  ].join('\n')
}

export function ThemeGenerator() {
  // Two lists: freshly rolled candidates, and the themes already saved in
  // necklace_themes.ts. `view` picks which the list/actions act on.
  const [view, setView] = useState<'random' | 'saved'>('random')
  const [randomRows, setRandomRows] = useState<NecklaceCandidate[]>(() => Array.from({ length: COUNT }, rollRow))
  const [savedRows, setSavedRows] = useState<NecklaceCandidate[]>(() => NECKLACE_THEMES.map(themeToCandidate))
  const rows = view === 'random' ? randomRows : savedRows
  const setRows = view === 'random' ? setRandomRows : setSavedRows
  // Selection tracked by row index so re-rolling a row keeps its tick.
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const [exportText, setExportText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const switchView = (v: 'random' | 'saved') => {
    setView(v)
    setSelected(new Set())
  }

  const regenerate = () => {
    setRandomRows(Array.from({ length: COUNT }, rollRow))
    setSelected(new Set())
  }

  const toggle = (i: number) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  // Re-roll one row's colours (keep its shapes) or shapes (keep its colours); both get a
  // fresh seed so the per-gem cut/sanding refreshes too. Selection is preserved.
  const rerollColors = (i: number) =>
    setRows((rs) =>
      rs.map((c, k) => {
        if (k !== i) return c
        const rnd = mulberry32(freshSeed())
        return { ...c, palette: rollPalette(pick(COLOR_PATTERNS, rnd), GEMS, rnd), seed: freshSeed() }
      }),
    )
  const rerollForms = (i: number) =>
    setRows((rs) =>
      rs.map((c, k) => {
        if (k !== i) return c
        const rnd = mulberry32(freshSeed())
        return { ...c, forms: rollForms(pick(FORM_SETS, rnd), GEMS, rnd), seed: freshSeed() }
      }),
    )

  const openExport = () => {
    const chosen = rows.filter((_, i) => selected.has(i))
    setExportText(formatExport(chosen))
    setCopied(false)
  }

  const copyExport = async () => {
    if (!exportText) return
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className='flex min-h-[100svh] flex-col bg-[#05060f] text-white'>
      {/* Sticky top bar: back + title + the two batch actions. */}
      <div className='sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-[#05060f]/95 px-2 py-2'>
        <Link
          to='/test'
          aria-label='Takaisin testisivuille'
          className='flex h-8 items-center rounded-lg border-2 border-white/40 bg-black/30 px-2 text-sm font-bold text-white/90'
        >
          ←
        </Link>
        <span className='font-medieval text-base'>Teemapaja</span>
        <span className='text-xs text-white/50'>{selected.size} valittu</span>
        <div className='ml-auto flex gap-1'>
          {/* Toggle: browse a fresh random batch vs. the themes already saved. */}
          <div className='flex overflow-hidden rounded-lg border border-white/20'>
            <button
              onClick={() => switchView('random')}
              className={`px-2 py-1 text-[11px] font-semibold ${view === 'random' ? 'bg-[#9fd0ff] text-[#05060f]' : 'text-white/70'}`}
            >
              Arvotut
            </button>
            <button
              onClick={() => switchView('saved')}
              className={`px-2 py-1 text-[11px] font-semibold ${view === 'saved' ? 'bg-[#9fd0ff] text-[#05060f]' : 'text-white/70'}`}
            >
              Tallennetut ({NECKLACE_THEMES.length})
            </button>
          </div>
          {view === 'random' && (
            <Button size='sm' variant='outlined' color='primary' className='!px-2 !py-1 !text-[11px]' onClick={regenerate}>
              ⟳ Uudet {COUNT}
            </Button>
          )}
          <Button size='sm' color='primary' className='!px-2 !py-1 !text-[11px]' onClick={openExport} disabled={selected.size === 0}>
            ⬇ Vie ({selected.size})
          </Button>
        </div>
      </div>

      {/* The scrollable list of one-line necklaces. Tap a necklace to (de)select it. */}
      <div className='flex flex-col gap-2 p-2'>
        {view === 'saved' && rows.length === 0 && (
          <p className='py-8 text-center text-sm text-white/50'>
            Ei tallennettuja teemoja vielä. Valitse arvotuista ja vie ne tiedostoon <code>necklace_themes.ts</code>.
          </p>
        )}
        {rows.map((cand, i) => {
          const isSel = selected.has(i)
          return (
            <div
              key={i}
              role='button'
              tabIndex={0}
              onClick={() => toggle(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggle(i)
                }
              }}
              className={`relative h-24 w-full cursor-pointer overflow-hidden rounded-xl border-2 text-left transition-colors ${
                isSel ? 'border-[#9fd0ff]' : 'border-white/10'
              }`}
            >
              <SimpleNecklaceCanvas candidate={cand} className='absolute inset-0' />

              {/* Big tick badge so a kid sees at a glance what's chosen. */}
              <span
                className={`absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border-2 text-lg font-bold ${
                  isSel ? 'border-[#9fd0ff] bg-[#9fd0ff] text-[#05060f]' : 'border-white/50 bg-black/40 text-transparent'
                }`}
              >
                ✓
              </span>

              {/* Name (saved label if any) + backdrop theme, small, bottom-left. */}
              <span className='absolute bottom-1 left-2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] text-white/80'>
                {cand.label ? `${cand.label} · ` : ''}
                {THEMES[cand.themeId].label}
              </span>

              {/* Per-row re-roll: colours / shapes. stopPropagation so they don't toggle. */}
              <span className='absolute right-2 top-1/2 flex -translate-y-1/2 gap-1'>
                <span
                  role='button'
                  tabIndex={0}
                  aria-label='Vaihda värit'
                  onClick={(e) => {
                    e.stopPropagation()
                    rerollColors(i)
                  }}
                  className='flex h-9 w-9 items-center justify-center rounded-lg bg-black/55 text-base'
                >
                  🎨
                </span>
                <span
                  role='button'
                  tabIndex={0}
                  aria-label='Vaihda muodot'
                  onClick={(e) => {
                    e.stopPropagation()
                    rerollForms(i)
                  }}
                  className='flex h-9 w-9 items-center justify-center rounded-lg bg-black/55 text-base'
                >
                  ◆
                </span>
              </span>
            </div>
          )
        })}
      </div>

      {/* Export overlay: the ready-to-paste TypeScript. */}
      {exportText !== null && (
        <div className='fixed inset-0 z-50 flex flex-col bg-black/80 p-3'>
          <div className='flex items-center gap-2 pb-2'>
            <span className='font-medieval text-base'>Vie teemat</span>
            <div className='ml-auto flex gap-1'>
              <Button size='sm' color='primary' className='!px-2 !py-1 !text-[11px]' onClick={copyExport}>
                {copied ? '✓ Kopioitu' : '⧉ Kopioi'}
              </Button>
              <Button size='sm' variant='outlined' color='neutral' className='!px-2 !py-1 !text-[11px]' onClick={() => setExportText(null)}>
                Sulje
              </Button>
            </div>
          </div>
          <textarea
            readOnly
            value={exportText}
            className='min-h-0 flex-1 w-full resize-none rounded-lg bg-[#0c1020] p-2 font-mono text-[11px] text-white/90'
            onFocus={(e) => e.currentTarget.select()}
          />
          <p className='pt-2 text-[10px] text-white/50'>
            Liitä tämä tiedostoon <code>app/src/lib/necklace_themes.ts</code>.
          </p>
        </div>
      )}
    </div>
  )
}
