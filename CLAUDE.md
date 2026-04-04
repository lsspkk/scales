# CLAUDE.md

## Reference Docs

| File | Contents |
|------|----------|
| `docs/react-instructions.md` | React 19 conventions, Zustand, local storage, lazy loading, Vitest testing rules — **read before any work in `app/src/`** |
| `docs/todo.md` | Task list with statuses and dependencies |
| `docs/log.md` | Completed task log |
| `docs/prompt.md` | Prompt for implementing the next pending task |
| `docs/architecture.md` | Music theory implementation, React app architecture, Zustand data flow, canvas layout, responsive design, deployment |
| `docs/deployment.md` | Local build step, `dist/` folder convention, and how the CI/CD workflow deploys to Azure Static Storage |
| `docs/ux-spec.md` | UX specification: screen layouts (ASCII), interaction rules, visual palette, component usage — **read before any screen or UI change** |
| `docs/ui-components.md` | HomeCard and ScreenHeader components: props, design decisions, and usage |

## Project Structure

```
app/          # React 19 + Vite + TypeScript + Tailwind — the active application
  src/
    screens/  # Full-page views (Home, Kirkkosavellajit, Harjoittelu)
    components/ui/  # Shared UI primitives (Button, Chip, ScreenHeader, SectionCard, etc.)
    stores/   # Zustand stores (musicStore with persist middleware)
    lib/      # Pure music theory logic (no React)
```

**App:** Mobile-only music scale visualizer (Finnish church modes / Kirkkosävellajit). Renders a centered ~390px viewport on desktop. Users pick a root key and mode; the app draws the scale on an HTML5 canvas.

**Deployment:** Push to `main` → GitHub Actions uploads to Azure Static Storage.
