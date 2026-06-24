# Teemapaja — necklace theme generator

Browse-and-pick tool for curating good colour + shape combinations for the gem game.
Route `#/test/themes` (`app/src/screens/ThemeGenerator.tsx`), reached from the `#/test`
menu. Pure look-dev: no mic / tuner / scale logic, all state in memory.

## What it does

- Rolls **30 random 8-gem necklaces**, each a flat one-line render (no 3D ring, no
  animation) of a random backdrop theme + colour pattern + shape set.
- The **Arvotut / Tallennetut** toggle switches between the random batch and the themes
  already saved in `necklace_themes.ts` (each rendered from an id-derived stable seed,
  with its label shown). The saved view is also editable + re-exportable (tap / 🎨 / ◆),
  so the curated set can be tweaked and pasted back.
- **Tap a necklace** to select/deselect it (✓ badge + blue border mark the chosen ones).
- **Per row:** 🎨 re-rolls only the colours, ◆ re-rolls only the shapes (both also refresh
  the per-gem cut/sanding via a new seed); selection is preserved across a re-roll.
- **⟳ Uudet 30** rolls a fresh batch (clears selection). **⬇ Vie (n)** opens an overlay
  with paste-ready TypeScript of the ticked necklaces + a **Kopioi** button.

## Export format

Each ticked necklace exports as a `NecklaceTheme` entry — exactly what `createNecklace`
consumes, so what you browse is what you get:

```ts
{ id, label, themeId, palette: number[], forms: GemForm[] }
```

Paste the emitted `export const NECKLACE_THEMES = [...]` block into
`app/src/lib/necklace_themes.ts` (replacing the placeholder array). The `palette` /
`forms` are 8 long (one octave); the game cycles them for longer necklaces.

## Files

| File | Role |
|------|------|
| `app/src/screens/ThemeGenerator.tsx` | The screen: roll/select/re-roll/export logic + UI. |
| `app/src/lib/simplenecklace.ts` | Lightweight static one-line renderer (`drawSimpleNecklace`) + `NecklaceCandidate` type. Reuses the real gem look; uniform high quality/polish so judging is about hue + shape, not luck. |
| `app/src/components/ui/SimpleNecklaceCanvas.tsx` | React wrapper: DPR-aware canvas, paints once per size/candidate change (no rAF). |
| `app/src/lib/necklace_themes.ts` | Curated-theme library: `NecklaceTheme` interface + `NECKLACE_THEMES` array (the paste target). |
| `app/src/lib/necklace.ts` | Exports `drawFinishedGem(...)` — the static, animation-free core of `paintSocket` (gem body → fire → sparkle → setting) reused by the simple renderer — and the `Metal` type. |

## Not yet wired

`NECKLACE_THEMES` is not consumed by the game yet; the generator only produces the data.
A theme picker in Jalokiviasteikko that pulls from it is the natural follow-up.
