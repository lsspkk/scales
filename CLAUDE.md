# CLAUDE.md

## Reference Docs

| File | Contents |
|------|----------|
| `docs/react-instructions.md` | React 19 conventions, Zustand, local storage, lazy loading, Vitest testing rules — **read before any work in `app/src/`** |
| `docs/todo.md` | Active task list with statuses and dependencies |
| `docs/completed-tasks.md` | Archive of full specs for finished tasks |
| `docs/ideas.md` | Unprioritised bucket of future ideas (not yet planned) |
| `docs/log.md` | One-line summary per completed task |
| `docs/prompt.md` | Prompt for implementing the next pending task |
| `docs/architecture.md` | Music theory implementation, octave-aware note system, arpeggio rendering, React app architecture, Zustand data flow, canvas layout, responsive design, deployment |
| `docs/deployment.md` | Local build step, `dist/` folder convention, and how the CI/CD workflow deploys to Azure Static Storage |
| `docs/ux-spec.md` | UX specification: screen layouts (ASCII), interaction rules, visual palette, component usage — **read before any screen or UI change** |
| `docs/ui-components.md` | HomeCard, ScreenHeader, AccordionSection, and DesktopNavBar components: props, design decisions, and usage |
| `docs/scale-practice-method-v2.md` | **Authoritative** violin scale practice method (data source for `SCALES` in `practiceMethod.ts`): reach-aware octaves — a 2-octave scale only fits 1st–3rd position if its top ≤ D6, so E/F/Eb major + E/F# minor are "1+" (full 1st octave then climb to D6/C#6 and turn). §2 = the reach constraint; §4/§9 = per-level `oct`/`reachUpTo`/`shiftRequired` tables |
| `docs/scale-practice-method.md` | **Superseded v1** (kept for history): the original method + per-scale notes; its octave/shift data was wrong (impossible full 2-octave claims) and is corrected in v2 above |
| `docs/scale-practice-notes.md` | Note-by-note fingerings (1st/2nd/3rd-position finger maps) for every Level 2/3 scale — the reach source cross-checked when building the v2 `SCALES` data |
| `docs/soittohetki.md` | Soittohetki screen: URL params, layout, scale/arpeggio toggle, countdown timer hook |
| `docs/tahtiasteikko.md` | Tähtiasteikko scale-practice tuner (route `/tahtiasteikko`, formerly Skaalaviritin; launched from the Harjoittelu list via a star button): play the scale up-and-down in tune, 5 hardening levels (`PRACTICE_LEVELS`), silver/random/gold `StarFlight` celebrations (level = star count), 3 s tuner-off pause; reuses `MusicCanvas`/`TunerDial`/`SimpleTunerControls`/`useMicPitch` |
| `docs/jalokiviasteikko.md` | Jalokiviasteikko gem-necklace scale game (route `/jalokiviasteikko`, launched from the Harjoittelu list via a diamond button): play the scale up-and-down, each note's intonation writes `socket.quality`/`gem.polish` so better tuning = a prettier gem; Level-1 phase-timer state machine (count-in → pause → delayed reveal → timed window → resolve), `TuningBar`, info-dialog pause, 20 s auto-replay; adds the `NecklaceOverlay` (focus ring + note label + count-in) to `necklace.ts`/`NecklaceCanvas`; reuses `useMicPitch`/`tunerStore` |
| `docs/theme-generator.md` | Teemapaja necklace theme generator (route `/test/themes`): browse 30 random one-line necklaces (flat static `simplenecklace.ts` renderer reusing the exported `drawFinishedGem`), tap to select, 🎨/◆ re-roll colours/shapes per row, **Vie** exports ticked looks as paste-ready `NecklaceTheme[]` TypeScript for `necklace_themes.ts` |
| `docs/virittaminen.md` | Production tuner screen (route `/virittaminen`): zero-config layout, the one 5-step "calmness" slider (`SimpleTunerControls`) + its step→settings mapping, persisted `tunerStore`, gauge Home-card icon |
| `docs/animations.md` | Pelican timer + time-up celebration animations: variants, CSS keyframe wiring, pause/reset model, anatomical pivots, debug routes |
| `docs/audio-research.md` | Initial design notes for the audio engine: candidate APIs, A=442 pitch math, chord interval table, open questions |
| `docs/audio-architecture.md` | Shipped audio engine: Web Audio voice graph, tuning, YIN pitch detector, sample manifest, how to add samples/chords |
| `docs/audio-samples.md` | Detected pitch + confidence for each shipped sample; how to re-run the CLI detector |
| `docs/harjoittelu-row-challenges.md` | Per-row variation roll + hide-two-notes challenge in Harjoittelu: button placement, state model, canvas dimming, marquee details |
| `docs/tuner-pitch-detection.md` | Tuner pitch-detection design decision: adopt MPM via the `pitchy` library, library audit, concrete settings, why the old hand-rolled YIN/confidence approach was weak, test-page controls — plus the shipped Task 27 (clarity gate, sensitivity knob, `--pitchy` CLI) and Task 28 (detector-side cents smoothing + note-confirm hysteresis + hold/decay, defaults, the two test-page stability sliders) implementation notes |
| `docs/tuner-web-workers.md` | Should tuner detection run off the main thread? Web Worker vs AudioWorklet analysis (mobile-focused); verdict + minimal AudioWorklet sketch |
| `docs/tuner-tuning-worksheet.md` | Manual-testing worksheet for the tuner test pages (`#/test/tuner`, `#/test/scaletuner`): settings reference, scenarios, blank sweep tables to fill on a real phone + violin, and a findings table for locking defaults/ranges |

## Project Structure

```
app/          # React 19 + Vite + TypeScript + Tailwind — the active application
  src/
    screens/  # Full-page views (Home, Kirkkosavellajit, Harjoittelu, Soittohetki)
    components/ui/  # Shared UI primitives (Button, Chip, ScreenHeader, SectionCard, etc.)
    stores/   # Zustand stores (musicStore, practiceStore — both with persist middleware)
    lib/      # Pure logic (musicScale.ts, musicStave.ts, noteOctave.ts, practiceMethod.ts — no React)
```

**App:** Mobile-only music scale visualizer (Finnish church modes / Kirkkosävellajit). Renders a centered ~390px viewport on desktop. Users pick a root key and mode; the app draws the scale on an HTML5 canvas.

**Deployment:** Push to `main` → GitHub Actions uploads to Azure Static Storage.
