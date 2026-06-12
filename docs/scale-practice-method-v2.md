# Violin Scale Practice Method — v2

A structured scale practice routine for adult violin learners (~3 years), covering 1st–3rd
position with progressive key introduction, shifts, and arpeggios.

**This supersedes `scale-practice-method.md` (v1).** v1's pedagogy (circle-of-fifths key
order, Galamian shift principles, three skill levels, source list) was sound, but its
per-scale **octave and shift data was wrong** — it claimed 2-octave scales that don't fit the
hand below 4th position and invented shift points for scales that need none. v2 keeps the
method and rebuilds the technical data on the physical reach of the hand.

| Companion doc | What it gives |
|---------------|---------------|
| `scale-practice-notes.md` | **Note-by-note fingerings** (string + finger + position) for every Level 2/3 scale, plus the full 1st/2nd/3rd position finger maps. This v2 references it instead of duplicating the note lists. |

---

## 1. What changed from v1

1. **Reach-aware octaves.** A 2-octave scale only fits within 1st–3rd position if its top
   note is ≤ **D6** (the 3rd-position ceiling on the E string). v1 ignored this.
2. **D is the highest full 2-octave scale.** C and D (major and minor) are the only scales
   that genuinely need a 1st→3rd shift to complete two octaves.
3. **Scales topping above D6** — E, F, Eb major and E, F# minor — **cannot be played in a
   full 2 octaves** here. They play the full first octave, then shift to 3rd position and
   climb the 2nd octave **as far as the hand reaches** (to D6, or **C#6 for E major**), then
   turn around. v1 wrongly listed them as full 2-octave with fake shift points.
4. **Fake shifts removed.** G, A, Bb, B, Ab major and G, B minor fit entirely in 1st
   position; any shift in them is *optional* practice, not required.
5. **Level 1 corrected.** D major, F major, C major, D minor were listed as 2-octave in 1st
   position — impossible (tops D6/F6/C6/D6 exceed the 1st-position ceiling B5). They are now
   1-octave at Level 1; their 2-octave (shifting) forms appear at Level 2.

---

## 2. The reach constraint (core principle)

A 2-octave scale runs from a low string up to the E string. Whether it fits within a given
set of positions depends on whether its **top note is reachable**. Highest note per position
(4th finger on the E string, no stretch):

| Position | E-string fingers           | Ceiling |
|----------|----------------------------|---------|
| 1st      | 0=E5 1=F#5 2=G5 3=A5 4=B5    | **B5**  |
| 2nd      | 1=G#5 2=A5 3=B5 4=C6        | **C6**  |
| 3rd      | 1=A5 2=B5 3=C6 4=D6         | **D6**  |

This sorts every scale into three buckets:

- **Fits 1st position** (top ≤ B5) → no shift needed. *G, A, Bb, B, Ab major; G, B minor.*
- **Needs a shift to 3rd position** (top C6 or D6) → *C, D major; C, D minor.*
- **Can't reach a full 2nd octave** (top > D6) → *Eb, E, F major; E, F# minor.* Play the
  full first octave, shift to 3rd, climb to D6 (C#6 for E major), and turn around.

Full finger maps for all three positions: see `scale-practice-notes.md` §2.

---

## 3. Key Progression Method

Keys follow **Carl Flesch's** circle-of-fifths ordering — the standard in violin pedagogy.
Keys are introduced by adding one sharp or flat at a time, alternating major and its relative
minor, so each new key changes only one finger placement from the last. Flesch (*Scale
System*, 1926) and Galamian (*Principles of Violin Playing and Teaching*, 1962) both use this
because the left hand adapts gradually, unlike chromatic ordering which jumps unpredictably
between finger patterns.

The progression is split into three levels by technical demand (accidentals, string
crossings, position requirements). The **key order is unchanged from v1**; only the octave
and shift data per key is corrected.

---

## 4. Skill Levels

`oct` = octaves played. `1+` = full first octave, then climb the 2nd octave into 3rd
position as far as the hand reaches (top note shown), then turn around.

### Level 1 — First Position Foundations

Keys with 0–2 sharps/flats, **1st position only**. Two octaves where the top note is ≤ B5,
one octave otherwise.

| # | Key | Mode    | oct | Top  | Notes |
|---|-----|---------|-----|------|-------|
| 1 | G   | ionian  | 2   | G5   | Open G start, fits 1st position |
| 2 | D   | ionian  | 1   | D5   | 2-octave D needs 3rd position → Level 2 |
| 3 | A   | ionian  | 2   | A5   | Open A start |
| 4 | F   | ionian  | 1   | F5   | 1 flat; full 2 oct impossible below 4th pos |
| 5 | Bb  | ionian  | 2   | Bb5  | 2 flats; top Bb5 fits 1st position |
| 6 | C   | ionian  | 1   | C5   | 2-octave C needs 3rd position → Level 2 |
| 7 | D   | aeolian | 1   | D5   | 2-octave D minor needs 3rd position → Level 2 |
| 8 | G   | aeolian | 2   | G5   | Relative minor of Bb |
| 9 | A   | aeolian | 2   | A5   | Relative minor of C |
| 10| E   | aeolian | 1   | E5   | Full 2 oct impossible below 4th pos |

**Mastered when:** all Level 1 scales play in tune with consistent tone.

### Level 2 — Introducing the 1st→3rd Shift

Keys with 1–3 sharps/flats, **1st and 3rd position**. Practice all of these *with* a shift
to 3rd position; the `shift?` column says whether the shift is **required** to reach the top
or merely an optional drill (the scale already fits 1st position).

| # | Key | Mode    | oct | Top  | shift? | Shift point |
|---|-----|---------|-----|------|--------|-------------|
| 1 | G   | ionian  | 2   | G5   | optional | top octave in 3rd pos on A string (D5 = 1st finger) |
| 2 | D   | ionian  | 2   | D6   | **required** | E string, shift 1st finger up to A5 |
| 3 | A   | ionian  | 2   | A5   | optional | — |
| 4 | E   | ionian  | 1+  | C#6  | **required** | E string up to A5, climb to C#6 |
| 5 | F   | ionian  | 1+  | D6   | **required** | E string up to A5, climb to D6 |
| 6 | Bb  | ionian  | 2   | Bb5  | optional | — |
| 7 | Eb  | ionian  | 1+  | D6   | **required** | E string up to A5, climb to D6 |
| 8 | E   | aeolian | 1+  | D6   | **required** | E string up to A5, climb to D6 |
| 9 | B   | aeolian | 2   | B5   | optional | top B5 = 1st-pos ceiling |
| 10| D   | aeolian | 2   | D6   | **required** | E string, shift up to A5 |
| 11| G   | aeolian | 2   | G5   | optional | — |
| 12| C   | aeolian | 2   | C6   | **required** | E string, shift up to A♭5 |

### Level 3 — Adding 2nd Position

Keys up to 4 sharps/flats, **1st, 2nd, and 3rd position**. 2nd position adds a middle
waypoint for shifting and alternative fingerings — it does **not** raise the D6 ceiling, so
the octave verdicts match Level 2. The new work is practising each scale through the
positions and the 1st→2nd / 2nd→3rd shifts.

| # | Key | Mode    | oct | Top  | shift? | Notes |
|---|-----|---------|-----|------|--------|-------|
| 1 | G   | ionian  | 2   | G5   | optional | practice through positions |
| 2 | D   | ionian  | 2   | D6   | **required** | E string up to A5 |
| 3 | A   | ionian  | 2   | A5   | optional | |
| 4 | E   | ionian  | 1+  | C#6  | **required** | climb to C#6 |
| 5 | B   | ionian  | 2   | B5   | optional | 5 sharps; fits 1st pos, advanced fingering |
| 6 | F   | ionian  | 1+  | D6   | **required** | climb to D6 |
| 7 | Bb  | ionian  | 2   | Bb5  | optional | |
| 8 | Eb  | ionian  | 1+  | D6   | **required** | climb to D6 |
| 9 | Ab  | ionian  | 2   | Ab5  | optional | 4 flats; fits 1st pos |
| 10| E   | aeolian | 1+  | D6   | **required** | climb to D6 |
| 11| B   | aeolian | 2   | B5   | optional | |
| 12| F#  | aeolian | 1+  | D6   | **required** | climb to D6 |
| 13| C   | aeolian | 2   | C6   | **required** | E string up to A♭5 |
| 14| D   | aeolian | 2   | D6   | **required** | E string up to A5 |

> **Future Level 4 (out of scope here):** to play E, F, Eb major and E, F# minor as *full*
> 2 octaves, go into 4th/5th position to reach E6 / F6 / Eb6 / F#6.

---

## 5. Position Work

(Finger maps: `scale-practice-notes.md` §2.)

### 1st position
The home position; four fingers in natural spacing above the open string.
- 1st finger: a whole step above the open string (half step for a lowered note).
- 2nd finger: high (major 3rd above open) or low (minor 3rd) depending on key.
- 3rd finger: a perfect 4th above the open string.
- 4th finger: a perfect 5th above (= the next higher open string's pitch).

Ceiling: **B5** (4th finger, E string).

### 2nd position
The hand moves up so the 1st finger sits where the 2nd finger was. Introduce (Galamian) with
a scale already known in 1st position: play the first notes in 1st position, then shift and
continue in 2nd, checking intonation against the known version.

*Example — one-octave G major entirely in 2nd position:* G4(D-2) A4(D-3) B4(D-4) C5(A-1 low)
D5(A-2) E5(A-3) F#5(A-4) G5(E-1 low). Ceiling: **C6**.

### 3rd position
The hand moves up so the 1st finger sits where the 3rd finger was — a perfect 4th above the
open string. On the A string the 1·2·3·4 fingers reach **D E F G**; on the E string they reach
**A B C D**. This is the ceiling that defines the whole method: **D6** (4th finger, E string).

Introduce (Suzuki Bk 4–5, Sassmannshaus Vol. 3) on the A string, where 1st finger plays D5 —
a perfect 4th above the open A and easy to check by ear.

---

## 6. Shift Practice

### Principles (Galamian)
1. **Anticipate** — hear the target note before moving.
2. **Release pressure** during the shift — the hand glides, it does not jump.
3. **Guide finger** — the finger already down guides the hand; the target finger drops on
   arrival.
4. **Slow audible slide first**, then gradually eliminate it.
5. **Check intonation** against an open string or harmonic.

### The one shift this method leans on
Every required-shift scale uses the **same move: shift to 3rd position on the E string, 1st
finger guiding up to A5.** After the shift the whole top sits on the E string in 3rd
position (A5=1, B5=2, C6/C#6=3, D6=4). Learn this shift well and it covers D, F, Eb, E major
and D, E, F# minor; C minor is the same shift landing a half-step lower on A♭5.

### Shift exercises (verified against the position maps)

**A — 1st→3rd on the E string** (the core move):
```
1st pos:  E5(0)  F#5(1)  G5(2)   ── 1st finger slides up ──▶  3rd pos:  A5(1)  B5(2)  C#6(3)  D6(4)
```

**B — 1st→3rd on the A string** (the gentle introduction):
```
1st pos:  A4(0)  B4(1)   ── 1st finger slides B4 → D5 ──▶  3rd pos:  D5(1)  E5(2)  F#5(3)  G5(4)
```

**C — 1st→2nd on the A string** (Level 3):
```
1st pos:  A4(0)  B4(1)   ── shift ──▶  2nd pos:  C#5(1)  D5(2)  E5(3)  F#5(4)
```

**D — 2nd→3rd on the E string** (Level 3):
```
2nd pos:  G#5(1)  A5(2)  B5(3)   ── 3rd finger slides B5 → C#6 ──▶  3rd pos:  C#6(3)  D6(4)
```

### Routine (per scale that shifts)
1. Play the shift pair (last note before + first note after) 5× slowly with audible slide.
2. Play it 5× at tempo with minimal slide.
3. Play the full scale slowly, pausing at the shift.
4. Play the full scale at tempo. Descending: release pressure before shifting down, keep arm
   support, check open strings.

---

## 7. Arpeggios

Pair each scale with its tonic arpeggio (root–3rd–5th–octave, up and back). Major keys use a
major triad, minor keys a minor triad.

Arpeggio range follows the same reach rule as the scale:
- **Full 2-octave scales** → 2-octave arpeggio (same top note as the scale).
- **Reach-limited scales** (E, F, Eb major; E, F# minor) → play the arpeggio up to its
  highest chord tone within reach (≤ D6), then back. (E major's top chord tone in reach is
  B5; the others reach their tonic-or-below within D6.)
- **Level 1** → one-octave tonic arpeggio in 1st position.

```
G major:  Level 1 (1st pos):  G3 B3 D4 G4              (one octave)
          Level 2 (1st→3rd):  G3 B3 D4 G4 B4 D5 G5     (two octaves, top in 1st pos)
D major:  Level 2 (1st→3rd):  D4 F#4 A4 D5 F#5 A5 D6    (shift to 3rd pos for top A5–D6)
```

---

## 8. Structured Data for Implementation

Schema for `practiceMethod.ts` (corrected from v1; new fields `reachUpTo`, `shiftRequired`).

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Root (`"G"`, `"Bb"`, `"F#"`) |
| `mode` | string | `"ionian"` or `"aeolian"` |
| `level` | number | 1 / 2 / 3 |
| `positions` | string[] | `["1st"]`, `["1st","3rd"]`, `["1st","2nd","3rd"]` |
| `octaves` | number | full octaves played (1 or 2) |
| `reachUpTo` | string \| null | for reach-limited scales, the top note climbed to in the 2nd octave (e.g. `"C#6"`, `"D6"`); else `null` |
| `shiftRequired` | boolean | `true` if a shift is needed to reach the top; `false` if the scale fits 1st position (shift optional) |
| `shift` | string \| null | human-readable shift instruction |
| `arpeggio` | string | `"major"` or `"minor"` |
| `arpeggioOctaves` | number | 1 or 2 |

### Level 1
```
{ key: "G",  mode: "ionian",  level: 1, positions: ["1st"], octaves: 2, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "major", arpeggioOctaves: 1 }
{ key: "D",  mode: "ionian",  level: 1, positions: ["1st"], octaves: 1, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "major", arpeggioOctaves: 1 }
{ key: "A",  mode: "ionian",  level: 1, positions: ["1st"], octaves: 2, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "major", arpeggioOctaves: 1 }
{ key: "F",  mode: "ionian",  level: 1, positions: ["1st"], octaves: 1, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "major", arpeggioOctaves: 1 }
{ key: "Bb", mode: "ionian",  level: 1, positions: ["1st"], octaves: 2, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "major", arpeggioOctaves: 1 }
{ key: "C",  mode: "ionian",  level: 1, positions: ["1st"], octaves: 1, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "major", arpeggioOctaves: 1 }
{ key: "D",  mode: "aeolian", level: 1, positions: ["1st"], octaves: 1, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "minor", arpeggioOctaves: 1 }
{ key: "G",  mode: "aeolian", level: 1, positions: ["1st"], octaves: 2, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "minor", arpeggioOctaves: 1 }
{ key: "A",  mode: "aeolian", level: 1, positions: ["1st"], octaves: 2, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "minor", arpeggioOctaves: 1 }
{ key: "E",  mode: "aeolian", level: 1, positions: ["1st"], octaves: 1, reachUpTo: null, shiftRequired: false, shift: null, arpeggio: "minor", arpeggioOctaves: 1 }
```

### Level 2
```
{ key: "G",  mode: "ionian",  level: 2, positions: ["1st","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "optional: top octave in 3rd position on A string (D5 = 1st finger)", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "D",  mode: "ionian",  level: 2, positions: ["1st","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: true,  shift: "3rd position on E string — shift 1st finger up to A5", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "A",  mode: "ionian",  level: 2, positions: ["1st","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "optional (fits 1st position)", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "E",  mode: "ionian",  level: 2, positions: ["1st","3rd"], octaves: 1, reachUpTo: "C#6", shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to C#6", arpeggio: "major", arpeggioOctaves: 1 }
{ key: "F",  mode: "ionian",  level: 2, positions: ["1st","3rd"], octaves: 1, reachUpTo: "D6",  shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to D6", arpeggio: "major", arpeggioOctaves: 1 }
{ key: "Bb", mode: "ionian",  level: 2, positions: ["1st","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "optional (fits 1st position)", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "Eb", mode: "ionian",  level: 2, positions: ["1st","3rd"], octaves: 1, reachUpTo: "D6",  shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to D6", arpeggio: "major", arpeggioOctaves: 1 }
{ key: "E",  mode: "aeolian", level: 2, positions: ["1st","3rd"], octaves: 1, reachUpTo: "D6",  shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to D6", arpeggio: "minor", arpeggioOctaves: 1 }
{ key: "B",  mode: "aeolian", level: 2, positions: ["1st","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "optional (top B5 = 1st-position ceiling)", arpeggio: "minor", arpeggioOctaves: 2 }
{ key: "D",  mode: "aeolian", level: 2, positions: ["1st","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: true,  shift: "3rd position on E string — shift 1st finger up to A5", arpeggio: "minor", arpeggioOctaves: 2 }
{ key: "G",  mode: "aeolian", level: 2, positions: ["1st","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "optional (fits 1st position)", arpeggio: "minor", arpeggioOctaves: 2 }
{ key: "C",  mode: "aeolian", level: 2, positions: ["1st","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: true,  shift: "3rd position on E string — shift 1st finger up to A♭5", arpeggio: "minor", arpeggioOctaves: 2 }
```

### Level 3
```
{ key: "G",  mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "practice through 2nd & 3rd positions", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "D",  mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: true,  shift: "3rd position on E string (up to A5)", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "A",  mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "practice through positions", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "E",  mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 1, reachUpTo: "C#6", shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to C#6", arpeggio: "major", arpeggioOctaves: 1 }
{ key: "B",  mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "fits 1st position (advanced); practice through positions", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "F",  mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 1, reachUpTo: "D6",  shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to D6", arpeggio: "major", arpeggioOctaves: 1 }
{ key: "Bb", mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "practice through positions", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "Eb", mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 1, reachUpTo: "D6",  shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to D6", arpeggio: "major", arpeggioOctaves: 1 }
{ key: "Ab", mode: "ionian",  level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "fits 1st position; practice through positions", arpeggio: "major", arpeggioOctaves: 2 }
{ key: "E",  mode: "aeolian", level: 3, positions: ["1st","2nd","3rd"], octaves: 1, reachUpTo: "D6",  shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to D6", arpeggio: "minor", arpeggioOctaves: 1 }
{ key: "B",  mode: "aeolian", level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: false, shift: "practice through positions", arpeggio: "minor", arpeggioOctaves: 2 }
{ key: "F#", mode: "aeolian", level: 3, positions: ["1st","2nd","3rd"], octaves: 1, reachUpTo: "D6",  shiftRequired: true,  shift: "3rd position on E string (up to A5), climb to D6", arpeggio: "minor", arpeggioOctaves: 1 }
{ key: "C",  mode: "aeolian", level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: true,  shift: "3rd position on E string (up to A♭5)", arpeggio: "minor", arpeggioOctaves: 2 }
{ key: "D",  mode: "aeolian", level: 3, positions: ["1st","2nd","3rd"], octaves: 2, reachUpTo: null,  shiftRequired: true,  shift: "3rd position on E string (up to A5)", arpeggio: "minor", arpeggioOctaves: 2 }
```

---

## 9. Sources

1. **Flesch, Carl.** *Scale System.* Carl Fischer, 1926 (rev. 1987). Primary key-progression
   source — circle-of-fifths ordering with progressive technical demand.
2. **Galamian, Ivan.** *Principles of Violin Playing and Teaching.* Prentice-Hall, 1962.
   Primary source for shift technique: guide-finger method, mental preparation, release of
   pressure.
3. **Galamian, Ivan & Neumann, Frederick.** *Contemporary Violin Technique, Vol. 1.* Galaxy
   Music, 1962. Shift exercises and arpeggio patterns across positions.
4. **Sassmannshaus, Kurt.** *Early Start on the Violin, Vols. 1–4.* Bärenreiter, 2008.
   Position-introduction sequencing (3rd position in Vol. 3, 2nd+ in Vol. 4).
5. **Suzuki, Shinichi.** *Suzuki Violin School, Vols. 1–8.* 3rd position introduced Bk 4–5.
6. **Fischer, Simon.** *Practice: 250 Step-by-Step Practice Methods for the Violin.* Edition
   Peters, 2004. Supplementary shift, arpeggio, and routine guidance.

> **Note on the technical data:** the reach analysis, octave verdicts, and shift points in
> v2 are derived from the physical layout of 1st–3rd position on a standard violin (see
> `scale-practice-notes.md`), not copied from any single edition. Exact fingerings vary by
> teacher and edition; these are sensible, playable defaults.
