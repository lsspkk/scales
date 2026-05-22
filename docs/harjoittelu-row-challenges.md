# Harjoittelu row challenges — variation roll + hidden notes

Task 26 added two small per-row challenge controls to the practice list in `Harjoittelu.tsx`. They sit inline on the same text row as each scale assignment and let a student quickly make a familiar scale less automatic without leaving the screen.

---

## What's on the row

```
[✓] D-duuri  1.–3. as.  [🎲] [👁]                     [i] [▶]
     Pitkä-lyhyt rytmi ──────────────────────────────────
     (marquee scrolls if the line overflows)
```

- The check, info, and play buttons are unchanged.
- Two new 28×28 inline buttons appear right after the position label, separated by `gap-1.5` from the surrounding text. Both share the same look: white pill, brown stroke when idle, brown-red filled (`#8B2500`) when their state is "armed."
- Below the first line:
  - If a variation is rolled, the **rolled variation text** is displayed in `#8B2500` and wrapped in `MarqueeText` so it scrolls when it overflows the row width.
  - Otherwise the existing shift-pattern line (level 2+) is shown.
  - When both could appear (variation rolled on a level-2+ scale), the variation **replaces** the shift line — the row stays two lines tall.

---

## Variation button

- Icon: small dice SVG (`DiceIcon` inline in `Harjoittelu.tsx`).
- Click → calls `rollVariation(previousId)` from `app/src/lib/scaleVariations.ts`. Returns a uniform random pick from the v1 pool (V02, V03, V05, V07, V10, V14, V16), guaranteed to differ from the previous roll for the same row so repeat-clicking always changes the result.
- The rolled Finnish instruction string (e.g. "Pitkä-lyhyt rytmi", "Murretut terssit") replaces any earlier value for that row.
- State persists per row (keyed by `getScaleKey(scale)`) for the lifetime of the screen — not stored in localStorage.

### Variation pool (v1)

| ID  | Finnish text                       |
| --- | ---------------------------------- |
| V02 | Pitkä-lyhyt rytmi                  |
| V03 | Lyhyt-pitkä rytmi                  |
| V05 | Neljäsosa + kaksi kahdeksasosaa    |
| V07 | 2 sidottuna, 2 erikseen            |
| V10 | Staccato / martelé                 |
| V14 | Murretut terssit                   |
| V16 | Lisää toonika-arpeggio             |

Adding a new variation = one entry in `SCALE_VARIATIONS`. Refining wording = edit the string in-place.

---

## Hide-two-notes button

- Icon: eye-with-slash SVG (`HideIcon` inline in `Harjoittelu.tsx`).
- Click pattern:
  1. **Idle → armed:** rolls two distinct non-tonic notes from the scale via `rollHiddenNotes(scaleNotes)`. Both notes are dimmed in the detail canvases.
  2. **Armed → revealed:** same notes, but `active: false` — the canvases render normally again.
  3. **Revealed → armed (new pair):** rolls a fresh pair, dimming them.
  4. Loop continues.
- The tonic is excluded from the candidate pool (indices 1..6 of the 8-entry scale array — index 0 and 7 are both the root).
- Hidden state is stored as `{ notes: [string, string]; active: boolean } | null` in `PracticeBody`, keyed by `getScaleKey`.

### How the dimming reaches the canvas

```
PracticeBody                            ScaleDetailPanel
  hideByRow[rowKey] = {notes, active}
            │
            └─ selectedScale → selectedHiddenNotes ──► hiddenNotes prop
                                                            │
                                                            ▼
                                                MusicCanvas { hiddenNotes }
                                                            │
                                                            ▼
                                          renderScale / renderArpeggio receive
                                          a Set<pitch-class> and pass per-note
                                          opacity (1 or 0.1) to drawNoteAt.
```

`drawNoteAt` wraps the existing draw with `ctx.save() / ctx.globalAlpha = opacity / ctx.restore()`. Note head, stem, ledger lines, and accidental all dim together so the rendered note is uniformly translucent without disturbing layout.

Matching is by **pitch class string** (`letter + accidental`, e.g. `"F#"`, `"Bb"`, `"C"`). All rendered instances of that pitch class — ascending and descending in the scale, and any matching note in the arpeggio — dim together. This was the simplest fit for the existing renderer: it walks `NoteWithOctave[]` arrays and the check is one set lookup per note.

The dimming is visible only inside `ScaleDetailPanel` (the mobile modal or desktop side panel for the selected row). The button on the row itself is the only on-row indicator: filled-brown-red = armed, white = idle.

---

## Marquee details

`MarqueeText` (see `docs/ui-components.md`) wraps the variation text. It only scrolls when `inner.scrollWidth > wrapper.clientWidth`. The animation is a single CSS keyframe `marquee-scroll` defined in `app/src/index.css` (translates from 0 to `-var(--marquee-distance)`), with ~8 % hold at each end so the start and end of the text stay readable.

Speed: `30 px/s` default — calm, not flashy.

---

## State scope

- Per-row, lives in `PracticeBody` component state, keyed by stable `getScaleKey(scale)`.
- Survives reshuffle (keys are content-based, not position-based).
- Does **not** persist across sessions, page reloads, or screen navigation. Re-entering Harjoittelu starts fresh — intentional per spec.
- Multiple rows can each carry independent variation and hidden-note state simultaneously.

---

## Files touched

- `app/src/lib/scaleVariations.ts` (new) — variation pool + `rollVariation` + `rollHiddenNotes`.
- `app/src/components/ui/MarqueeText.tsx` (new) — overflow-aware marquee.
- `app/src/lib/musicStave.ts` — `drawNoteAt` gained an `opacity` parameter; `renderScale` and `renderArpeggio` accept an optional `hiddenNotes: ReadonlySet<string>`.
- `app/src/components/ui/MusicCanvas.tsx` — forwards `hiddenNotes` prop.
- `app/src/components/ui/ScaleDetailPanel.tsx` — forwards `hiddenNotes` to its two canvases.
- `app/src/screens/Harjoittelu.tsx` — per-row state, two inline buttons, variation/shift line, hidden-notes plumbing.
- `app/src/index.css` — `marquee-scroll` keyframe + `.marquee-on` selector.

---

## Out of scope (for later, if needed)

- Persisting rolled state across sessions.
- Combining two variations into one roll.
- Difficulty weighting / tags per variation.
- Hiding more than two notes, or making the tonic hideable.
- Audio cues for variations.
- Adding the same controls to Soittohetki.
