# Todo

Active task list. Completed tasks are archived in `completed-tasks.md`; a one-line summary of each is in `log.md`. Unprioritised future ideas live in `ideas.md`.

---

## Task 32: Skaalaviritin — leveling scale-practice tuner launched from the Harjoittelu list

**Status:** done
**Blocked by:** —
**Reference:** `app/src/screens/ScaleTunerTest.tsx` (the hidden `#/test/scaletuner` page — closest existing prototype: up/down phase logic, target-note highlighting, `useMicPitch`, hold-to-advance, accuracy/hold settings), `app/src/screens/StarFlightTest.tsx` + `app/src/components/ui/StarFlight.tsx` + `app/src/components/ui/FlyingStar.tsx` (the multi-colour flying-star animation), `app/src/screens/Soittohetki.tsx` + `app/src/screens/Harjoittelu.tsx` (how the practice list launches a per-scale screen via URL params), `app/src/components/ui/SimpleTunerControls.tsx` + `app/src/stores/tunerStore.ts` (production sensitivity control), `app/src/components/ui/TunerDial.tsx`, `docs/react-instructions.md`, `docs/ux-spec.md`.

### Goal

A new **scale-practice mode** screen, `Skaalaviritin.tsx`, route/URL name **`skaalaviritin`**. The
player picks a scale from the Harjoittelu practice list, then plays its notes in tune up to the top
and back down. Each completed up-and-down run **hardens** the precision required (tighter cents + longer
hold), across **5 difficulty levels**, with a flying-star celebration at each top and bottom. This is
just the **first cut** of this practice mode — it will be extended later, so keep it simple and the
tunables clearly editable.

### Entry point

- In the Harjoittelu practice list (`PracticeListItem` in `Harjoittelu.tsx`), add a **star icon button**
  **next to** the existing "Aloita soittohetki" play button. Tapping it navigates to
  `/skaalaviritin?...` passing the **same scale params** the play button passes to Soittohetki
  (`root`, `mode`, `octaves`, `level`). Give it an `aria-label` like `Aloita skaalaviritin`.
- Register the route in `app/src/App.tsx` (lazy, mirroring `/soittohetki`). The hidden `#/test/scaletuner`
  page stays untouched — this is the real, user-facing screen.

### Screen behaviour

1. **Scale on one stave.** Draw the selected scale on a single stave (reuse `MusicCanvas`, `staves={1}`)
   exactly like `ScaleTunerTest` does, highlighting the current target note. Scale/octaves come from the
   URL params (read like Soittohetki does). When the player has played **all notes upward** (reached the
   top note), the canvas flips to **descending** and the target walks back down from the top to the
   bottom. Reuse the ascending/descending **phase + targetIndex** logic from `ScaleTunerTest`.
2. **Tuner for the target note.** Below the stave: the `TunerDial` + note/cents readout, and a
   **hold-progress** indicator. The player holds the highlighted note in tune long enough → advance to
   the next note (reuse `useMicPitch` + the in-tune / hold-timer logic from `ScaleTunerTest`).
3. **Aloita kuuntelu button.** Start/stop the mic. Label **"Aloita kuuntelu"** when stopped,
   something like **"Lopeta kuuntelu"** when running.
4. **Sensitivity control.** Reuse the production **`SimpleTunerControls`** ("Mittausnopeus") wired to the
   persisted **`useTunerStore`** + `calmnessToSettings()` — that is this screen's tuner-sensitivity knob.
   Do **not** reuse the four-knob debug `TunerControls`.
5. **Level info text.** Directly **beneath the sensitivity slider**, a Finnish one-liner describing the
   current difficulty, format e.g. **`Taso 1. Tarkkuus ±10 Aika 3s`** (level number, accuracy in cents,
   hold time in seconds — read from the level table below).

### Leveling + star animations

- The screen runs through **5 levels**. The **current level number** also equals the **number of stars**
  in each celebration (level 1 → 1 star, level 2 → 2 stars, … level 5 → 5 stars).
- **Reaching the top** of the scale → a **silver** star animation. **Reaching the bottom** (one full
  up-and-down run complete) → a **random-colour** star animation, then the level **hardens by one**.
- **Final celebration:** the bottom of **level 5** must fly **5 golden** stars. After that, listening
  **stops**; pressing **Aloita kuuntelu** again restarts from **level 1**.
- **Tuner off during animations.** While a star animation plays the tuner/listening is **paused**, and
  that period is **3 seconds**. Resume the run (or stop, if it was the final level-5 celebration) when it ends.
- Use the `StarFlight` component (one component instance = one flying star; launch `level` of them).
  This needs a **silver** tone — add a `silver` entry to `StarTone` + `STAR_PALETTES` in `FlyingStar.tsx`.
  Random-colour picks from the existing non-gold/non-silver tones; the level-5 bottom is forced to `gold`.
- **No always-visible star row.** Unlike `#/test/scaletuner`, do **not** render a persistent
  `★★★…` strip — only the flying animations appear.

### Tunables (must be clearly editable)

Define the 5 levels in one clearly-named constant near the top of `Skaalaviritin.tsx` (or a small adjacent
module) so they're trivial to tweak later — e.g.:

```ts
// Difficulty ladder for Skaalaviritin. Each completed up-and-down run advances one level;
// tighter cents + longer hold = harder. Tune these freely.
const PRACTICE_LEVELS = [
  { cents: ??, holdSeconds: ?? }, // Taso 1 (easiest)
  // … up to Taso 5 (hardest, tightest cents + longest hold)
] as const
```

Pick a sensible progression (looser/shorter at level 1 → tighter/longer at level 5); the exact numbers are
the implementer's call (the `Taso 1. Tarkkuus ±10 Aika 3s` above is just the **info-text format**, not a
mandate). Also keep the **3 s animation/tuner-off duration** as a named constant.

### Layout / responsiveness

- Mobile-first **vertical** layout: the **stave, tuner dial, "Aloita kuuntelu", sensitivity control**, and
  the level-info line must all **fit a phone in portrait** without scrolling (centred ~390 px viewport).
  Keep it tight, in the established palette; fine on desktop too.

### Out of scope (Task 32)

- Persisting progress/levels across reloads (this is a first cut — in-memory state is fine).
- Any detection-algorithm or smoothing changes (Tasks 27–28) — only *consume* the tuner.
- The hidden `#/test/scaletuner` page's extra mechanics (10-run cap, root/mode rolling, congrats overlay,
  always-visible star strip, debug `TunerControls`) — those stay on the test page.

### Files (likely)

- `app/src/screens/Skaalaviritin.tsx` (new) — the practice screen (route `skaalaviritin`)
- `app/src/App.tsx` — register the lazy route
- `app/src/screens/Harjoittelu.tsx` — star icon button next to the soittohetki play button, navigates with the same params
- `app/src/components/ui/FlyingStar.tsx` — add a `silver` `StarTone` + palette
- `app/src/components/ui/StarFlight.tsx`, `TunerDial.tsx`, `SimpleTunerControls.tsx`, `app/src/stores/tunerStore.ts`, `app/src/hooks/useMicPitch.ts` — reuse as-is
- `docs/skaalaviritin.md` (new) + `CLAUDE.md` reference row; touch `docs/ux-spec.md` if the screen layout warrants it

---

## Task 31: Production tuner — replace the 5-step calmness slider with a 3-step "Mittausnopeus" speed slider

**Status:** done
**Blocked by:** —
**Reference:** `docs/virittaminen.md` (current 5-step mapping), `docs/tuner-tuning-worksheet.md` ("Measured results (2026-06-06)"), `docs/tuner-pitch-detection.md`, `app/src/stores/tunerStore.ts`, `app/src/components/ui/SimpleTunerControls.tsx`, `app/src/screens/Virittaminen.tsx`

### Goal

A real-device sweep (worksheet "Measured results, 2026-06-06") settled the good
detection values, so the production tuner no longer needs 5 fine steps. Collapse the
single slider to **3 choices** and relabel it **Mittausnopeus** ("measurement speed").
The middle step is the measured sweet spot; one step each side trades speed vs. steadiness.

### Step → settings mapping (3 steps)

| Step             | `smoothingFrames` | `confirmFrames` | `sensitivity` | `clarityThreshold` |
| ---------------- | ----------------- | --------------- | ------------- | ------------------ |
| 1 (Nopea)        | 1                 | 1               | **1** (max)   | 0.5 (locked)       |
| **2 (default)**  | **5**             | **4**           | **1**         | **0.5**            |
| 3 (Hidas)        | 12                | 7               | **1**         | 0.5                |

- Step 2 = the measured defaults (smoothing 5 / confirm 4) and is the baked zero-config default.
- `sensitivity` stays **pinned max**, `clarityThreshold` stays **locked permissive** — but
  drop it from 0.6 to the measured-best **0.5**. The slider still only calms/quickens
  the smoothing stage; it never re-tightens gating.
- Step 1 = fast/responsive (smoothing ≈ off), step 3 = slow/steady.

### Requirements

1. **Store (`tunerStore.ts`).** Rework the slider model: range 1..3, default 2, new
   `CALMNESS_FRAMES` (or rename to a "speed" concept) per the table above. Lower the
   locked `clarityThreshold` to 0.5. Keep the persist key/shape working (existing
   persisted values outside 1..3 must clamp, not crash).
2. **Control (`SimpleTunerControls.tsx`).** Label **Mittausnopeus**, 3 ticks, ends still
   **Nopea** / **Hidas**, **Oletus** reset disabled at default (step 2).
3. **Screen (`Virittaminen.tsx`).** No structural change beyond the slider min/max/default.
4. **Docs.** Update `docs/virittaminen.md` (mapping table + "5-step" wording → "3-step",
   "calmness"/"Herkkyys" → "Mittausnopeus") and the relevant chapter in
   `docs/tuner-pitch-detection.md`.

### Out of scope

- Detection algorithm or smoothing-logic changes (Tasks 27–28).
- The hidden `/test/...` pages and the four-knob `TunerControls` — leave untouched.

### Files (likely)

- `app/src/stores/tunerStore.ts` — 3-step range/default/mapping, clarity 0.5
- `app/src/components/ui/SimpleTunerControls.tsx` — relabel + 3 ticks
- `app/src/screens/Virittaminen.tsx` — slider min/max/default
- `docs/virittaminen.md`, `docs/tuner-pitch-detection.md` — sync the mapping + wording

---

## Task 33: Necklace graphics spike — `#/test/necklace` (gem/necklace render + spin, no tuner)

**Status:** done
**Blocked by:** —
**Reference:** `docs/game-necklace-ideas.md` (the full menu of techniques — layout/motion §2, gem rendering §3, metal §4, mining-vs-shaping phases §5, juice §8, and the opinionated MVP pick in §9; **this spike is how we answer the §10 open questions**), `docs/game-gems-draft.md` (game concept), `app/src/components/ui/MusicCanvas.tsx` + `app/src/lib/musicStave.ts` (canvas conventions: pure-lib draw + thin React wrapper, DPR-scaled bitmap, `computeLayout` pattern, `ResizeObserver` + `requestAnimationFrame` loop), `docs/architecture.md`, `docs/react-instructions.md`.

### Goal

A **hidden test page** (route `#/test/necklace`, like the other `#/test/...` pages — not in any menu) to develop the necklace/gem graphics **in isolation, with zero tuner/mic involvement and no detection delay**. This is a pure-visuals playground so a human can eyeball the 3D look and pick the best version; gameplay wiring comes later. Keep it simple — **do not over-engineer**; the implementor chooses the concrete look/animation that reads best.

### What to build

1. **Necklace fills most of the screen.** A procedurally-drawn necklace on canvas is the hero — give it nearly the whole viewport. Controls are small and out of the way.
2. **Put the effort into the 3D feel + spin.** The headline of this spike is the **pseudo-3D necklace that rotates/turns so the next empty socket swings into view** (see ideas doc §2 Option B as a starting point — the implementor may try the arc/ribbon/flip alternatives too and keep whichever looks best). The spin should be smooth/eased, not snappy.
3. **Bigger stones for gems, small neutral stones as the chain.** Use a necklace where the **gem sockets are the larger pebbles/stones**, with just a **few small neutral/metal stones in between** forming the chain. Pick a **simple metal technique** for those connectors (ideas doc §4 — e.g. the cheap rope/snake chain or a banded-gradient bead).
4. **Simple gem graphics.** Choose a simple, good-looking gem render (ideas doc §3 — cabochon G1 is the easy base; sparkle/facets optional). Don't gold-plate it.
5. **Ore phase already looks rewarding.** When a socket gets its raw material (ascending), it must **not** be a dull block of rock — at minimum a **shiny stone**, so even the ore stage feels like a small reward. Descending then **refines** that ore into the finished gem.

### Controls (small buttons, off to the side)

- **Add gem / next socket** — advances one socket: with a short **delay**, the necklace spins the next empty socket into view and an **ore** is selected/dropped in (the ascending "mine" step).
- **Refine gem** — the descending step: turns the current ore into a polished gem (and/or steps back down a socket, implementor's call).
- **Reset / new necklace** — clear, and/or **random-roll** a fresh necklace (new seed → different stones). A simple **colour selection** (a few swatches) to recolour the gems — **no full theme selection**, just colour.

### Notes / constraints

- Reuse the canvas conventions from `MusicCanvas`/`musicStave.ts` (pure `src/lib/necklace.ts` + thin `NecklaceCanvas` wrapper, DPR scaling, rAF loop, seeded PRNG) per `docs/react-instructions.md`.
- **No mic, no `useMicPitch`, no tuner, no real scale logic** — buttons stand in for note events so iteration is instant.
- In-memory state only; nothing persisted. Register the route alongside the other hidden test pages in `App.tsx`.

### Out of scope (Task 33)

- Wiring to real pitch/intonation, scales, levels, or the Harjoittelu list.
- Themes/motifs, full juice pass, persistence — this is a look-dev spike only.

### Files (likely)

- `app/src/lib/necklace.ts` (new) — pure draw + layout + seeded PRNG
- `app/src/components/ui/NecklaceCanvas.tsx` (new) — rAF/ResizeObserver wrapper (mirrors `MusicCanvas`)
- `app/src/screens/NecklaceTest.tsx` (new) — the `#/test/necklace` playground + small controls
- `app/src/App.tsx` — register the hidden `#/test/necklace` route

---

## Task 30: CI builds the app; pre-push hook prevents broken builds

**Status:** pending
**Blocked by:** —

### Goal

Two related improvements so that broken code never reaches Azure:

1. **CI workflow builds before deploying.** The current `deploy-to-azure.yml` uploads whatever is in the local `dist/` folder — it never compiles. The workflow should run `npm ci && npm run build` inside `app/` first and deploy the freshly built output.

2. **Pre-push git hook that builds locally.** A `pre-push` hook in `.git/hooks/` (or via a committed script + setup instructions) that runs `npm run build` inside `app/` before any `git push`. If the build fails the push is aborted.

### Requirements

1. **Workflow (`deploy-to-azure.yml`):**
   - Add a Node.js setup step (`actions/setup-node`) before the Azure CLI step.
   - Run `npm ci && npm run build` in `app/`.
   - Deploy from the workflow-generated `dist/`, not from a committed folder.
   - Remove `dist/` from git tracking (it should stay gitignored; the workflow is the only publisher).

2. **Pre-push hook:**
   - Script lives at `scripts/pre-push.sh` (committed, so it's visible in the repo).
   - Running `npm run build` in `app/`; exits non-zero on failure to abort the push.
   - A `scripts/install-hooks.sh` helper that symlinks/copies the script into `.git/hooks/pre-push` and makes it executable.
   - Brief setup note in `README.md` or `docs/deployment.md` telling contributors to run `scripts/install-hooks.sh` once after cloning.

### Out of scope

- Changing the build command or Vite config.
- Running tests in CI (separate concern).

### Files (likely)

- `.github/workflows/deploy-to-azure.yml` — add build steps, remove dist dependency
- `scripts/pre-push.sh` (new) — the hook script
- `scripts/install-hooks.sh` (new) — symlinks hook into `.git/hooks/`
- `.gitignore` — ensure `dist/` is excluded at repo root
- `docs/deployment.md` — document the one-time hook setup step

---

## Task 29: Ship the production tuner — lock defaults, simple screen, persisted preset/custom settings

**Status:** done
**Blocked by:** Task 27, Task 28
**Reference:** `docs/tuner-pitch-detection.md` (the "ship a tuner with zero sliders — just start/stop and the dial" goal; **see its _"Production filter — one calmness slider, permissive gating"_ chapter for the chosen 5-step slider design + why gating stays permissive**), `docs/tuner-web-workers.md`, `app/src/components/ui/TunerDial.tsx`, `app/src/components/ui/TunerControls.tsx`, `app/src/screens/TunerTest.tsx`, `docs/react-instructions.md` (Zustand + localStorage persist), `docs/ux-spec.md`

Tasks 27–28 find good detection + stability defaults on the **hidden test pages**. This task turns that into the actual user-facing tuner — the **"fast, easy to use"** half of the goal: calm, zero-config by default, with an optional settings menu that remembers each player's preferences. Both earlier tasks explicitly deferred this (production UI + settings persistence were out of scope), so it needs its own task.

### Product direction

- Opening the tuner just works: **no sliders**, start/stop + the dial + a note/cents readout.
- The detection + smoothing knobs from Tasks 27–28 are baked in as defaults; tweaking them is an _optional_ menu, not the default surface.
- Per-player preferences survive reloads.

### Requirements

1. **Lock the empirical defaults.** Bake the values into the default tuner settings so the default experience needs no adjustment. Gating stays **permissive** (`sensitivity` pinned max, `clarityThreshold` locked low ~0.6); only smoothing/confirm are user-adjustable. See the **"Production filter — one calmness slider, permissive gating"** chapter in `docs/tuner-pitch-detection.md` for the full rationale (we have no mobile-violin measurements yet, so start permissive and biased toward the known-good "filter off" behaviour).

2. **Production tuner screen.** A real route — path **`virittaminen`**, menu + nav title **"Virittäminen"** — showing only: start/stop, the `TunerDial` (the elliptical/cut dial), and the note + cents readout. Mobile-first inside the centred ~390 px viewport; fine on desktop. **No debug info.** Reuse `TunerDial`; do **not** reuse the full `TunerControls`.

3. **Simple controls — one 5-step "calmness" slider** (new `SimpleTunerControls`, leaving `TunerControls` untouched for the test pages, which still need all knobs). The slider drives **only** smoothing/confirm: step 1 = raw/fast, step 5 = very calm/steady; default ≈ step 3. It never re-tightens gating. (Mapping + reasoning live in the `docs/tuner-pitch-detection.md` chapter referenced above.)

4. **Persistence.** Save the chosen slider step in local storage via a Zustand `persist` store (follow `docs/react-instructions.md` and the existing `stores/` pattern — e.g. `tunerStore.ts`), with a "reset to default" action.

5. **Entry point.** A **Home card** with a tuner-**gauge SVG icon downloaded from the web** (not hand-drawn), wired into the router + `DesktopNavBar` as "Virittäminen". The hidden `/test/...` pages stay for future tuning work.

6. **Validation.** Manual: default tuner is calm and accurate on sustained violin notes with zero configuration; a changed preset/custom value persists across reload; "reset to preset" restores defaults.

### Out of scope (Task 29)

- Algorithm changes (Task 27) and smoothing logic (Task 28) — this task only _locks and exposes_ them.
- AudioWorklet / Web Worker offloading — not needed (`docs/tuner-web-workers.md`).
- A full automated audio test harness.

### Files (likely)

- `app/src/screens/Virittaminen.tsx` (new) — production tuner screen (route `virittaminen`)
- `app/src/components/ui/SimpleTunerControls.tsx` (new) — the 5-step calmness slider
- `app/src/stores/tunerStore.ts` (new) — persisted slider step + reset
- `app/src/components/ui/TunerDial.tsx` — reuse as-is; `TunerControls.tsx` stays test-page-only
- gauge SVG icon asset (downloaded from the web) for the Home card
- `app/src/App.tsx` — register the production route
- Home screen + `app/src/components/ui/DesktopNavBar.tsx` — entry point ("Virittäminen")
- `docs/ux-spec.md`, `docs/ui-components.md` — document the tuner screen + settings menu
- `CLAUDE.md` — reference entry if a dedicated tuner doc is added
