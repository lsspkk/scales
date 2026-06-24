# Jalokiviasteikko — gem-necklace scale game (Task 34, MVP: Level 1)

Route `/jalokiviasteikko`, screen `app/src/screens/Jalokiviasteikko.tsx`. Launched
from the Harjoittelu practice list (the **diamond** button) with the same scale
params the star/person buttons pass: `?root=C&mode=ionian&octaves=1&level=1`. The
`octaves` param is honoured (1 or 2 → 8 or 15 sockets); anything else falls back to 1.

**Reach-aware "1+" scales (Task 35).** Some 2-octave scales can't complete their
second octave below 4th position (top above the 3rd-position ceiling D6): E, F, Eb
major and E, F# minor. For these the practice data sets `octaves: 1` plus a
`reachUpTo` top note (`"D6"`, or `"C#6"` for E major), and Harjoittelu passes it on as
a `&reachUpTo=D6` param. `getScaleNotes` then builds two octaves and **cuts the
ascending run at that note**, so the necklace shows the correct socket count and the
turn lands on the reachable top (e.g. E major = **13 sockets, turning on C#6**, not 15
on E). See `docs/scale-practice-method-v2.md` §2 for the reach pedagogy.

The player plays the chosen scale **up and then down**; the gem necklace records
**how well each note was played**. Each note mines an ore (ascending) and polishes
it into a gem (descending); **better intonation = a more vivid, better-polished
gem**. One completed up-and-down run = one finished necklace. This is the **MVP —
Level 1 only**; all timers/thresholds are clearly-named editable constants at the
top of the screen file.

Settled gameplay spec: `docs/game-necklace-in-tune-step.md`. Look-dev / render
engine background: `docs/game-necklace-ideas.md`, `docs/game-gems-draft.md`.

## What is reused vs. new

Almost everything hard already existed before this task:

- **The necklace is the scoreboard, and it already grades.** `app/src/lib/necklace.ts`
  + `app/src/components/ui/NecklaceCanvas.tsx` render the full
  `empty → ore → gem` loop, auto-spin the active socket to the front via
  `model.activeIndex`, and fire bloom/bursts on each transition. The 10-level grading
  is two existing 0–1 fields: `socket.quality` (set-pass colour intensity) and
  `socket.gem.polish` (polish-pass muddy→brilliant finish). The game **writes those
  fields from intonation** instead of `rollQuality`/`rollGemSpec` — no engine rewrite.
- **The tuner wiring mirrors `Tahtiasteikko.tsx`**: `useMicPitch(calmnessToSettings(calmness))`,
  `pitchClassOf`/target pitch-class matching, the `getScale` + `assignAscendingOctaves`
  scale build, and the ascending↔descending walk.
- **Genuinely new code:** the **phase-timer state machine** (this game swaps
  Tähtiasteikko's *hold-to-advance* for the doc's timed evaluation window), the
  horizontal **`TuningBar`**, and a small **breathing focus ring** + **note label** +
  **count-in** overlay drawn by the engine.

## Engine additions (small, additive — no rewrite)

`necklace.ts` gained an optional, declarative game overlay so the screen can drive
on-canvas feedback anchored to the live active-socket position:

- `NecklaceOverlay { countdown?, noteLabel?, focusRing? }` — pure *intent* the screen
  passes each render.
- `drawNecklace(ctx, layout, model, draw, overlay?)` and `advanceDrawState(…, overlay?)`
  thread it through; the engine **eases the fades itself** (`labelFade`, `focusFade`
  in `DrawState`) so the screen only toggles booleans/strings:
  - note label **mists in over ~1 s** (`LABEL_RISE_S`) and **disappears promptly**
    on resolve (`LABEL_FALL_S`);
  - focus ring **fades in/out** (`FOCUS_RISE_S`/`FOCUS_FALL_S`, ~180 ms out per §1).
- `drawFocusRing` — a thin, slowly-pulsing **stroked ring** hugging the active socket,
  distinct from the existing filled `drawGlow` halo.
- `paintOverlay` draws (anchored to the active socket's projected point, so the label
  hangs in the empty ring interior): focus ring → note label (max opacity 0.55) →
  count-in number (ring centre).

`NecklaceCanvas` now takes an optional `overlay` prop, mirrored into a ref and read
live by the rAF loop (exactly like `model`). The look-dev page (`#/test/necklace`)
passes no overlay and is unchanged.

## The state machine (`Jalokiviasteikko.tsx`)

The necklace has **one socket per scale note** (1 octave = 8 sockets, 2 octaves = 15;
the octave turn at the top, mirroring Tähtiasteikko). A run is a list of `Step`s
built by `buildSteps(top)`:

1. **Ascending mine** — notes `0…top`: each resolves to `fill='ore'` + `quality`
   (the *set* pass → colour intensity).
2. **Octave-turn polish repeat** — the top note plays a second time: `fill='gem'` +
   `gem.polish`. It runs through the **same** pause→reveal→window cadence as every
   other note (no immediate-label shortcut — replaying the top twice in quick
   succession was too hard to time).
3. **Descending polish** — notes `top-1…0`: each `fill='gem'` + `gem.polish` (the
   *polish* pass → finish; colour was already chosen on the way up).

A single **rAF game loop** (one `useEffect`, empty deps, everything read live via
refs) advances the clock and mirrors only the render-relevant outputs into a `View`
React state (so re-renders are bounded — the timer changes 10×/s, other fields
rarely). Per-step phases:

| Phase | What's on screen | Ends after |
|-------|------------------|------------|
| `countdown` | `4 3 2 1` in the centre; first label already visible | `COUNTDOWN_FROM × COUNTDOWN_STEP_MS` → window |
| `pause` | active gem centred, focus ring, bar disabled, no label | player-chosen between-note pause → reveal |
| `reveal` | focus ring, bar disabled, label not yet shown | `LEVEL.revealAfterMs` → window |
| `window` | label visible, bar **active**, timer runs, cents sampled | `LEVEL.windowMs` → resolve |
| `poor` | label stays, bar replaced by neutral message | player-chosen between-note pause → next step |

**Scoring:** during the window each frame samples centeredness
`1 − |cents|/MAX_OFF_CENTS` (0 when silent or the wrong pitch-class — silence counts
against). The window's mean `score` (0–1) → `scoreToLevel` → a 0–10 level. That level,
stored as `level/10`, is written to the socket: the **set** pass (ascending) writes
`quality` (→ gem colour) and the **polish** pass (descending) writes `gem.polish`
(→ cracks / sparkles). The renderer maps that carrier back to the level through the
editable `LEVEL_*` tables in `necklace.ts` (see below). The note **always resolves and
advances**; a `score` below `POOR_SCORE` still grades the gem but triggers the neutral
`En kuullut kunnolla nuottia <note>.` pause (one generic pattern, never shaming).

**Per-level gem appearance (`necklace.ts`, the dials for how dramatic a note reads):**

```ts
LEVEL_COLOR    // colour intensity 0..1 (0 ≈ black, level 4 ≈ half, level 8 = full)
LEVEL_WHITE    // extra white sheen, only on the top notes (levels 9–10)
LEVEL_CRACKS   // black crack count: 8,6,4,2,1 on levels 0–4, then 0
LEVEL_SPARKLES // {count,brightness} per level: none < 6, up to 4 sharp glints at 10
```

All gem stroke detail — sparkle glints, crack hairlines, and the faceted-cut
definition/ridge lines — is sized as a **fraction of the gem radius**, never a fixed
pixel count. A fixed width looked right on a big desktop gem but ~2.5× too thick on the
smaller mobile gem (and bloated further under the close-up zoom); tying every stroke to
`r` keeps the cuts crisp and identical at any size or zoom.

**Pause from the info dialog:** opening it flips `pausedRef`, so the loop stops
accumulating time entirely; closing it resumes from the exact same phase (the
current note never restarts).

**Start screen (idle):** a short prompt — `Soita <scale> (ylös ja alas)`, plus
`(2 oktaavia)` when `octaves=2` — then a **3-stop pause slider** (0,2 s / 0,5 s / 1 s,
default 1 s; `delayIdx` state → `betweenNoteMsRef`, read live by the loop), then the lone
**Aloita** button. The pause choice persists across rounds in the session.

**End of round:** the necklace is full → admire it. With the auto-replay toggle on
(default), a 20 s (`AUTO_REPLAY_MS`) count starts another round; a **Jää ihailemaan**
button cancels it and waits for a manual **Aloita uusi**.

## Tunables (top of `Jalokiviasteikko.tsx`)

```ts
const LEVELS = [{ revealAfterMs: 3000, windowMs: 3000 }] // MVP: Level 1 only
const BETWEEN_NOTE_OPTIONS = [200, 500, 1000] // start-screen slider (ms): cadence + poor pause
const DEFAULT_DELAY_IDX = 2       // default 1 s
const COUNTDOWN_STEP_MS = 1000   // 4 3 2 1
const GOOD_ZONE_CENTS = 12       // §3 shaded band half-width
const MAX_OFF_CENTS = 50         // a frame this far off scores 0 centeredness
const POOR_SCORE = 0.3           // below → neutral "didn't hear it" pause
const AUTO_REPLAY_MS = 20000     // end-of-round auto-advance
// score → level/10 stored on the socket; the *look* of each level lives in the
// LEVEL_COLOR / LEVEL_WHITE / LEVEL_CRACKS / LEVEL_SPARKLES tables in necklace.ts.
```

## Admire mode: close-up gem viewer (`AdmireView`)

At end of round the player can tap **Jää ihailemaan** to enter the full-screen admire
overlay, the reusable `components/ui/AdmireView.tsx` (shared by the game and the test
screen below — it owns its own view/index state; the parent passes `model`, `scaleNotes`,
`noteScores`, `title`, `onClose`). Two focus modes, picked by a bottom-centre **segmented
control** (both options always visible, active one filled — no ambiguous toggle):

- **Kaulakoru** — the whole necklace (`NecklaceCanvas`, the default), with a per-note
  score **strip** across the top bar.
- **Jalokivet** — a close-up viewer (`GemCloseupCanvas`) where one gem fills the screen
  with the chain running off both edges; the focused stone's note name + `mine:polish`
  score show in the top bar. Step between gems with the **edge-of-row step arrows** (just
  above the switch, with an `n / total` counter between them), **swipe**, or **← / →**.

The gem carousel **wraps around eternally**: the index is unclamped and mapped onto the
ring with modulo, so going past the last gem rotates straight on to the first (and back).
There is no restart here — closing returns to the end-of-round screen, which owns the
*Aloita uusi* / auto-replay controls.

**Admire mode is a real URL** — `…/jalokiviasteikko/kaulakoru` (and
`…/test/jalokiviasteikko/kaulakoru` for the test screen), so both screens use a **splat
route** (`/jalokiviasteikko/*`) to stay mounted across it (the round's state survives).
`onClose` is `navigate(-1)`, so the **X** (top-right close icon), the device **back**
button, and the edge **swipe-back** gesture all pop the overlay back into the game rather
than leaving the screen. Entering it (`Jää ihailemaan` / `Ihaile`) is a history push.

`GemCloseupCanvas` is **controlled** — `AdmireView` owns the `gemIndex` state and renders
the arrow buttons; the canvas reports navigation back via `onIndexChange` and eases its
internal `focus` toward the index for a smooth slide. The captions are passed in as a
`labels` prop (`CloseupLabel[]`, socket order) and painted by `drawCloseup` in screen
space (after the zoom transform is popped) so the text stays crisp. (Its wrapper takes
the parent `className`/`style` straight through — no forced `position`, so `absolute
inset-0` fills the screen.)

The close-up is pure reuse of the **circular** necklace engine: `drawCloseup` (in
`necklace.ts`) spins the pseudo-3D ring so the eased fractional `focus` gem swings to
the front-centre (exactly like the game), then zooms the whole ring in with one
`ctx.scale` about that fixed front point. Sliding just rotates the hoop, so the
focused stone stays centred while its neighbours curve up and away to the sides and the
chain runs off both edges — the same circular necklace as **Kaulakoru**, seen close.
`drawRing`'s body was extracted into the shared `paintRingBody` so the whole necklace
and the close-up draw identical jewellery. No new gem renderer, no flat-arc layout.

## Shared model helpers + test screen

The pure necklace/scale builders the screens share live in `app/src/lib/necklaceModels.ts`
(no React): `parseMode`, `scaleLabel`, `noteLetter`, `getScaleNotes`, `decorativeNecklace`,
`emptyNecklace`, `freshNecklace`, `testNecklace`, the `Step`/`NoteScore` types, plus
`buildSteps` and `applyStepReward` — the **same** up-then-down two-pass sequence (ascending
`mine` → ore + colour, octave-turn + descending `polish` → finished gem) the game's rAF
loop drives. The game screen and the test screen both call these, so the test mirrors real
gameplay exactly.

**Test screen** `screens/JalokiviasteikkoTest.tsx`, route `#/test/jalokiviasteikko` (in the
`#/test` menu). No mic, no timers: it walks `buildSteps` one note at a time with a single
slider (drag, or keyboard **← → / ↑ ↓** then **Enter** to apply + advance), so each step
sets that note's quality and `applyStepReward` writes colour (ascending) / finish
(descending). **Arvo kivet** fills a whole random necklace at once; at the end **Ihaile**
opens the shared `AdmireView`. It reuses `NecklaceCanvas`, `AdmireView`, and the
`necklaceModels` builders — nothing gameplay-specific is duplicated.

## Out of scope (Task 34)

- Levels 2–3 and their timers (Level-1 MVP only).
- Distinguishing wrong/unstable/missing pitch in the poor-result message.
- Star-flight celebrations, themes/jewellery selection, persisted necklaces, sound
  effects, and any detection/smoothing changes — the screen only *consumes* the tuner.
- The hidden `#/test/necklace` page stays untouched.
