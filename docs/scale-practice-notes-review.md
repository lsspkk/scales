# Scale Practice Notes Review

date: 2026-06-12
review target: docs/scale-practice-notes.md
review scope requested: music-theory validity and note-by-note checking

## Method used

- Manual theory pass over all scale blocks and position tables.
- Automated consistency pass over all coded note lines in the file.
- Total note lines checked: 225.

## Findings

### 1) High-priority notation consistency issue: many high/low tags contradict the file's own definition

Your file defines:
- low = finger pulled back by one semitone
- high = finger reached forward by one semitone

But many note lines mark notes as high even when those notes are the default pitch for that finger in that position (per your own position tables).

Examples:
- F♯4 on D string, 2nd finger, 1st position is written as high repeatedly.
- F♯5 on E string, 1st finger, 1st position is written as high repeatedly.
- C♯5 on A string, 2nd finger, 1st position is written as high repeatedly.
- C♯6 on E string, 3rd finger, 3rd position is written as high repeatedly.

Why this matters:
- The pitch names are correct, but the modifier text is internally inconsistent.
- If a student follows the high marker literally, they may over-shift the finger and play sharp.

Recommendation:
- Remove high where the pitch is the default position pitch for that finger.
- Keep high only for true +1 semitone extensions relative to the position default.

### 2) Medium-priority internal model mismatch in B major block

In B major, these entries use 4th-finger high extensions:
- D♯4 on G string, 4th finger high
- A♯4 on D string, 4th finger high

These can be physically playable for advanced players, but they are not represented in the position reference table and conflict with the no-stretch framing used earlier.

Recommendation:
- Either document these explicitly as advanced 4th-finger extensions,
- or replace with a fingering route that stays inside the documented base map.

### 3) Music-theory and pitch-content verdict

- Scale note spellings by key/mode are musically correct in the reviewed blocks.
- Octave ranges and top-note reach logic (D6 ceiling in 3rd position) are correct.
- Shift decisions (required vs optional) are directionally correct and much better than the older table.

## Conclusion

- The note content is largely valid from a theory and fingerboard-geometry perspective.
- The main corrective action needed is modifier cleanup: many high tags should be removed to match your own reference tables and avoid pedagogical confusion.

## Suggested next step

- Perform a normalization pass on all note lines:
  - keep low only when flattened against the position default
  - keep high only when sharpened against the position default
  - keep untagged for default notes
