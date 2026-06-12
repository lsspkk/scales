# fix-scales.md

date: 2026-06-12
scope: audit of Level 2 and Level 3 shift-pattern tables in scale-practice-method.md and corresponding app data

## 1) What these tables are currently based on (inside this project)

Evidence in repository:

- docs/log.md (Task 9 entry) says the scale-practice-method document was created as a structured methodology source.
- docs/completed-tasks.md (Task 9 spec) required a practical data table (key/mode/positions/shift/arpeggio) suitable for direct coding.
- app/src/lib/practiceMethod.ts is a direct implementation copy of docs/scale-practice-method.md (same Level 2/3 shift wording, translated to Finnish strings in the app data).

Conclusion:

- Current Level 2/3 shift rows are not generated from instrument-aware logic in code.
- They were authored once in docs, then copied into code as fixed literal text.

## 2) Why the current Level 2/3 shift rows are questionable

Main issue:

- The tables present one designated shift point per key as if it were canonical.
- In real violin pedagogy, shift planning depends on goal (intonation drill, guide-finger drill, staying on one string, minimizing crossings, student hand/frame, teacher tradition).
- So one key normally has multiple valid shift solutions.

Your examples are valid and expose this directly:

- G major Level 2: you can approach the upper segment by shifting on D using a 3rd-finger context on A string depending on fingering pathway; this is musically/pedagogically plausible.
- D major Level 2: similar idea on E string with a later shift point can be valid.
- A major Level 2: can be played with no required shift in some two-octave pathways; if using the level as a shift exercise, a deliberate optional shift point can still be assigned.

Data consistency issue:

- Some rows in Level 2 and Level 3 are generic placeholders (for example "relative minor of ..." or "same shift points as ...") rather than concrete shift instructions.
- This makes the table look exact while being partially non-operational.

## 3) External source check summary used for this audit

Web findings collected in docs/scale-web-research.md.

Useful signal from fetched sources:

- Violin shift-practice materials commonly teach first-finger guide shifts and multiple variations inside the same key/scale.
- Scale and arpeggio shift exercises are commonly presented as families of patterns, not one immutable per-key shift note.

Important limitation:

- The fetched web pages did not provide a complete authoritative row-by-row canonical table matching our exact schema for all keys in Level 2/3.
- Therefore any "single correct" replacement table should be treated as a design decision and then teacher-validated.

## 4) Proposed correction direction

Do not store only one shiftPattern string per scale.

Recommended model:

- Keep one default suggestion for quick use.
- Add alternative validated options per key.
- Mark whether a shift is required or optional at that level.

Suggested data-shape upgrade for app/src/lib/practiceMethod.ts:

- shiftRequired: boolean
- shiftOptions: array of options
  - note
  - finger context
  - string
  - rationale (ear-check / guide-finger / one-string continuity / etc.)
- defaultShiftOptionId: string

This preserves beginner clarity while allowing realistic pedagogy.

## 5) Candidate corrections for the exact user-reported keys (to validate)

These are candidate rows for review, not yet final canonical truth.

Level 2, G ionian:

- current: Shift up on B (2nd finger, A string)
- candidate option A: Shift up on D (3rd-finger context, A string route)
- candidate option B: Shift up earlier with 1st-finger guide to establish 3rd-position frame
- note: keep at least two options; choose default based on intended exercise objective.

Level 2, D ionian:

- current: Shift up on F# (2nd finger, E string)
- candidate option A: Shift up on A (3rd-finger context, E string route)
- candidate option B: earlier guide-finger shift for intonation stability

Level 2, A ionian:

- current: Shift up on C# (2nd finger, A string)
- candidate option A: no required shift (valid two-octave path possible)
- candidate option B: optional shift up on D (3rd-finger context on A string) when the pedagogical goal is explicit shift drilling

## 6) What should be changed in documentation now

In docs/scale-practice-method.md:

- Replace wording "Each scale includes a designated shift point" with wording that allows multiple valid shift options.
- Replace placeholder rows in Level 2/3 with concrete options or explicitly mark as "needs validation".
- Add a short policy note:
  - key order can be fixed by circle-of-fifths
  - shift point is pedagogical and can vary by method/teacher/fingering target.

## 7) What should be changed in implementation after doc update

In app/src/lib/practiceMethod.ts:

- Replace single shiftPattern string with structured shift options.
- Keep one display default in UI, with expandable alternatives.

In Harjoittelu UI:

- Show default concise shift tip on list rows.
- Show all validated shift options in detail modal/panel.

## 8) Confidence statement

High confidence:

- Current data provenance is document-driven and copied directly.
- Current tables overstate certainty by using one fixed shift point per key.
- Your G/D/A critique is technically plausible and reveals real modeling weakness.

Medium confidence:

- Exact replacement row text for all Level 2/3 keys, because authoritative per-key canonical mapping was not fully retrievable from fetched web content alone.

## 9) Recommended immediate next step for confirmation

Run teacher validation on a focused subset first:

- Level 2 major keys G, D, A, E
- For each key, approve 2 shift options + 1 default + required/optional flag

Then propagate the same decision rules to the rest of Level 2 and Level 3.

## 10) Addendum: Galamian/Flesch two-octave fingering research pass

What was confirmed in this follow-up:

- Flesch primary source access is strong:
  - IMSLP page for Das Skalensystem is reachable and exposes complete score + key-specific score files.
  - This is sufficient to treat Flesch as a primary reference track for validating exact fingering/shift choices.

- Galamian source identity is strong, fingering extraction is weak:
  - Contemporary Violin Technique Volumes I-II is clearly identified as The Galamian Scale System.
  - Volume subtitles confirm scale/arpeggio focus, but fetchable pages did not expose a machine-readable two-octave fingering table.

What remains uncertain:

- Exact per-key two-octave Galamian fingering strings that can be quoted with high confidence from extracted web text alone.

Practical implication for this project:

- For documentation correction now:
  - keep the model change (multiple valid shift options, default + alternatives) and remove canonical-sounding single-shift claims.
- For exact per-key fingering authority:
  - validate against primary/authorized editions manually (teacher + score check), then encode into data.

Priority recommendation:

- Use Flesch as first hard-reference baseline for explicit per-key shift/fingering entries.
- Use Galamian to validate alternative pedagogical pathways and bowing/rhythm practice overlays.
