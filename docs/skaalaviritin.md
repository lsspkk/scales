# Skaalaviritin — leveling scale-practice tuner (Task 32)

A user-facing **scale-practice mode**: the player picks a scale in Harjoittelu,
plays its notes in tune up to the top and back down, and each completed run
**hardens** the precision required across **5 difficulty levels**, with flying-star
celebrations at the top and bottom. This is the **first cut** — kept simple, with
the tunables grouped at the top of the screen file so they are trivial to tweak.

- **Route:** `/skaalaviritin?root=…&mode=…&octaves=…&level=…`
- **Screen:** `app/src/screens/Skaalaviritin.tsx`
- **Reuses:** `MusicCanvas`, `TunerDial`, `SimpleTunerControls` + `useTunerStore`,
  `useMicPitch`, `StarFlight` / `FlyingStar`.

The hidden `#/test/scaletuner` prototype is **untouched** — this is the real,
shipping screen. It deliberately drops that page's extra mechanics (10-run cap,
root/mode rolling, congrats overlay, persistent `★★★…` strip, debug `TunerControls`).

## Entry point

`PracticeListItem` in `Harjoittelu.tsx` shows a **star icon button** next to the
existing "Aloita soittohetki" play button (`aria-label="Aloita skaalaviritin"`).
It navigates to `/skaalaviritin?…` with the **same scale params** the play button
passes to Soittohetki (`root`, `mode`, `octaves`, `level`).

## Screen behaviour

1. **Scale on one stave.** `MusicCanvas` with `staves={1}`, the current target note
   highlighted (`highlightNotes`). Scale comes from the URL params. When all notes
   have been played upward (top reached), the canvas flips to `descending` and the
   target walks back down — the ascending/descending **phase + targetIndex** logic
   mirrors `ScaleTunerTest` (the top note is played again on the way down).
2. **Tuner for the target note.** Below the stave: `TunerDial` + note/cents readout
   and a **hold-progress** bar. Holding the highlighted note in tune long enough
   advances to the next note (`useMicPitch` + in-tune / hold-timer logic).
3. **Aloita kuuntelu button.** Start/stop the mic — **"Aloita kuuntelu"** when
   stopped, **"Lopeta kuuntelu"** when running. Every fresh start restarts the
   game from level 1.
4. **Sensitivity control.** The production **`SimpleTunerControls`**
   ("Mittausnopeus") wired to the persisted **`useTunerStore`** + `calmnessToSettings()`.
5. **Level info line.** Beneath the slider, a Finnish one-liner:
   `Taso {n}. Tarkkuus ±{cents} Aika {hold}s`.

## Leveling + star animations

- 5 levels. The **current level number** equals the **number of stars** in each
  celebration (level 1 → 1 star … level 5 → 5 stars).
- **Reaching the top** → a **silver** burst. **Reaching the bottom** (one full
  up-and-down run) → a **random-colour** burst, then the level **hardens by one**.
- **Final celebration:** the bottom of level 5 flies **5 golden** stars; listening
  then **stops**. Pressing **Aloita kuuntelu** again restarts from level 1.
- **Tuner off during animations.** While stars fly the listening/hold timer is
  **paused** for `ANIMATION_OFF_MS` (3 s), after which the run resumes (or stops,
  if it was the final level-5 burst).
- Stars use the `StarFlight` component — one instance per star, `level` launched at
  once. A **`silver`** tone was added to `StarTone` + `STAR_PALETTES` in
  `FlyingStar.tsx`; random bursts pick from the non-gold/non-silver tones; the
  level-5 bottom is forced to `gold`.
- No always-visible star strip — only the flying animations appear.

## Tunables (clearly editable)

Near the top of `Skaalaviritin.tsx`:

```ts
const PRACTICE_LEVELS = [
  { cents: 30, holdSeconds: 1.0 }, // Taso 1 (easiest)
  { cents: 22, holdSeconds: 1.3 }, // Taso 2
  { cents: 16, holdSeconds: 1.6 }, // Taso 3
  { cents: 11, holdSeconds: 2.0 }, // Taso 4
  { cents: 8,  holdSeconds: 2.5 }, // Taso 5 (hardest)
] as const
const ANIMATION_OFF_MS = 3000
const RANDOM_TONES: StarTone[] = ['indigo', 'purple', 'pink', 'blue', 'green', 'yellow']
```

## Layout / responsiveness

Mobile-first **vertical** layout inside the centred ~390 px viewport: stave →
target line → dial → hold bar → (stretch spacer) → **Aloita kuuntelu** →
`SimpleTunerControls` → level-info line. The controls/info are deliberately small
(`text-xs`) so the whole screen fits a short, old phone in portrait without
scrolling; a `flex-1` spacer soaks up extra height on taller screens so the gaps
breathe rather than crowding the top. Fine on desktop too.

## Out of scope (first cut)

- Persisting progress/levels across reloads (in-memory state only).
- Detection-algorithm or smoothing changes (Tasks 27–28) — this screen only
  *consumes* the tuner via `useMicPitch` + `calmnessToSettings`.
- Multi-octave note walking — the target sequence follows the single drawn octave.
