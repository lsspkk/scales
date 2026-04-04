# Work Log

Format — one line per entry:
`YYYY-MM-DD | Task N | <one sentence describing what was done`

---

2026-04-02 | Setup | Created docs/todo.md, docs/prompt.md, and docs/log.md to plan the React 19 migration.
2026-04-02 | Task 1 | Scaffolded React 19 + Vite SWC + TypeScript + Tailwind CSS v4 project in app/, ported music theory logic to src/lib/musicScale.ts, and added Home/Kirkkosavellajit/Harjoittelu screens with state-based routing and mobile-first MobileShell layout.
2026-04-02 | Task 2 | Created six reusable TypeScript components in src/components/ui/: Button (key/mode variants), MobileShell, ScreenHeader, SectionCard, ModeChip, and HomeCard, all using Tailwind utility classes with the medieval parchment aesthetic.
2026-04-03 | Task 3 | Migrated all screens to use UI components from Task 2, added Zustand store with persist middleware for key/mode state, wired lazy loading with Suspense in App.tsx, and removed legacy vanilla JS files (script.js, events.js, index.html, styles.css).
2026-04-04 | Task 4 | Configured vite.config.ts to output build to repo-root dist/, added deploy:build script in app/package.json, updated CI workflow to deploy from dist/ with per-extension MIME types (no build step in CI), and created docs/deployment.md.
2026-04-04 | Task 5 | Redesigned HomeCard with solid gradient backgrounds, inline SVG icons (book-with-note and violin), subtitle prop, depth shadows, and active:scale-95 tap feedback; updated Home.tsx to pass new icons and subtitles.
2026-04-04 | Task 6 | Replaced ← text character in ScreenHeader with an inline SVG chevron-left icon, set 44×44px touch target on the back button, left-aligned the title, and added min-h-[52px] to keep header height in the 48–56px range.
2026-04-04 | Task 7 | Reduced canvas left/right staff margins (80→5, w-30→w-5), enlarged treble clef (105→126px, shifted 10px up, x adjusted from 100 to 25), and updated note layout (startX 190→115, spacing 100→123) to fill horizontal space in mobile portrait.
2026-04-04 | Task 8 | Added desktop view mode: created useViewport hook (769px breakpoint), App.tsx conditionally skips MobileShell on desktop, Kirkkosavellajit renders two-column layout with always-visible sidebar controls and centered 1000×500 canvas, Home shows side-by-side cards, and accidental font sizes adapt to viewport.
