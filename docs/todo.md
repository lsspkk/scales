# Todo

Active task list. Completed tasks are archived in `completed-tasks.md`; a one-line summary of each is in `log.md`. Unprioritised future ideas live in `ideas.md`.

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

### Out of scope

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
