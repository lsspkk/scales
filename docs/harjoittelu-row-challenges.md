# Soittohetki scale-line challenges — variation roll + hidden notes

Task 26 adds two small challenge controls to the scale-note line in `Soittohetki.tsx`. They sit inline on the row directly below the scale canvas and let a student quickly make the current scale less automatic without leaving the timed-practice screen.

---

## What's on the row

```
C – D – E – F# – G – A – B – C ─────────── [🎲] [👁]
(marquee scrolls if the line overflows)
```

- The row appears only in **scale mode** in Soittohetki.
- The left side is a `MarqueeText` container. It shows either:
  - the current scale notes joined with `–`, or
  - the rolled Finnish variation instruction, if one has been rolled.
- The right side holds two tiny inline icon buttons:
  - dice = roll a practice variation
  - eye-with-slash = hide/reveal two notes on the scale canvas
- Arpeggio mode keeps the existing plain text line with no extra buttons.

---

## Variation button

- Icon: small dice SVG (`DiceIcon` inline in `Soittohetki.tsx`).
- Click → calls `rollVariation(previousId)` from `app/src/lib/scaleVariations.ts`. Returns a uniform random pick from the v1 pool (V02, V03, V05, V07, V10, V14, V16), guaranteed to differ from the previous roll so repeat-clicking always changes the result.
- The rolled Finnish instruction string (e.g. "Pitkä-lyhyt rytmi", "Murretut terssit") replaces the note list in the marquee area.
- State lives in `Soittohetki` component state for the lifetime of that screen instance — not stored in localStorage.

### Variation pool (v1)

| ID  | Finnish text                    |
| --- | ------------------------------- |
| V02 | Pitkä-lyhyt rytmi               |
| V03 | Lyhyt-pitkä rytmi               |
| V05 | Neljäsosa + kaksi kahdeksasosaa |
| V07 | 2 sidottuna, 2 erikseen         |
| V10 | Staccato / martelé              |
| V14 | Murretut terssit                |
| V16 | Lisää toonika-arpeggio          |

Adding a new variation = one entry in `SCALE_VARIATIONS`. Refining wording = edit the string in-place.

---

## Hide-two-notes button

- Icon: eye-with-slash SVG (`HideIcon` inline in `Soittohetki.tsx`).
- Click pattern:
  1. **Idle → armed:** rolls two distinct non-tonic notes from the current scale via `rollHiddenNotes(scaleNotes)`. Both notes are dimmed in the Soittohetki scale canvas.
  2. **Armed → revealed:** same notes, but `active: false` — the canvas renders normally again.
  3. **Revealed → armed (new pair):** rolls a fresh pair, dimming them.
  4. Loop continues.
- The tonic is excluded from the candidate pool (indices 1..6 of the 8-entry scale array — index 0 and 7 are both the root).
- Hidden state is stored as `{ notes: [string, string]; active: boolean } | null` in `Soittohetki`.

### How the dimming reaches the canvas

```
Soittohetki
  hiddenNoteState = {notes, active}
            │
            └─ active notes ──► MusicCanvas { hiddenNotes }
                                      │
                                      ▼
                            renderScale receives a Set<pitch-class>
                            and passes per-note opacity (1 or 0.1)
                            to drawNoteAt.
```

`drawNoteAt` wraps the existing draw with `ctx.save() / ctx.globalAlpha = opacity / ctx.restore()`. Note head, stem, ledger lines, and accidental all dim together so the rendered note is uniformly translucent without disturbing layout.

Matching is by **pitch class string** (`letter + accidental`, e.g. `"F#"`, `"Bb"`, `"C"`). All rendered instances of that pitch class dim together. This was the simplest fit for the existing renderer: it walks `NoteWithOctave[]` arrays and the check is one set lookup per note.

The dimming is visible only in the Soittohetki **scale canvas**. The button itself is the on-row indicator: filled brown-red = armed, white = idle.

---

## Marquee details

`MarqueeText` (see `docs/ui-components.md`) wraps the left side of the scale-note row. It only scrolls when `inner.scrollWidth > wrapper.clientWidth`. The animation is a single CSS keyframe `marquee-scroll` defined in `app/src/index.css` (translates from 0 to `-var(--marquee-distance)`), with ~8 % hold at each end so the start and end of the text stay readable.

Speed: `30 px/s` default — calm, not flashy.

---

## State scope

- Per-screen, lives in `Soittohetki` component state.
- Resets when the screen is opened for a different root/mode.
- Does **not** persist across sessions, page reloads, or screen navigation.
- Only one active variation / hidden-note pair exists per Soittohetki instance.

---

## Files touched

- `app/src/lib/scaleVariations.ts` (new) — variation pool + `rollVariation` + `rollHiddenNotes`.
- `app/src/components/ui/MarqueeText.tsx` (new) — overflow-aware marquee.
- `app/src/lib/musicStave.ts` — `drawNoteAt` gained an `opacity` parameter; `renderScale` and `renderArpeggio` accept an optional `hiddenNotes: ReadonlySet<string>`.
- `app/src/components/ui/MusicCanvas.tsx` — forwards `hiddenNotes` prop.
- `app/src/screens/Soittohetki.tsx` — scale-line state, two inline buttons, marquee text, hidden-notes plumbing.
- `app/src/index.css` — `marquee-scroll` keyframe + `.marquee-on` selector.

---

## Out of scope (for later, if needed)

- Persisting rolled state across sessions.
- Combining two variations into one roll.
- Difficulty weighting / tags per variation.
- Hiding more than two notes, or making the tonic hideable.
- Audio cues for variations.
- Adding the same controls to Harjoittelu rows.
