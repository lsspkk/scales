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
| `docs/scale-practice-method.md` | Violin scale practice method: skill levels, key progression, shifts, arpeggios — data source for Harjoittelu |
| `docs/soittohetki.md` | Soittohetki screen: URL params, layout, scale/arpeggio toggle, countdown timer hook |
| `docs/animations.md` | Pelican timer + time-up celebration animations: variants, CSS keyframe wiring, pause/reset model, anatomical pivots, debug routes |
| `docs/audio-research.md` | Initial design notes for the audio engine: candidate APIs, A=442 pitch math, chord interval table, open questions |
| `docs/audio-architecture.md` | Shipped audio engine: Web Audio voice graph, tuning, YIN pitch detector, sample manifest, how to add samples/chords |
| `docs/audio-samples.md` | Detected pitch + confidence for each shipped sample; how to re-run the CLI detector |
| `docs/harjoittelu-row-challenges.md` | Per-row variation roll + hide-two-notes challenge in Harjoittelu: button placement, state model, canvas dimming, marquee details |

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
