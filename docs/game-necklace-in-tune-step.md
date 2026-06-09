# Necklace — In-Tune Step Design (settled decisions)

This document records the confirmed design for the active-socket feedback during
play. These decisions are ready to implement.

---

## 1. Active socket — ring focus (no explosion)

When the game advances to a new socket (ascending: next note to mine;
descending: next note to polish):

1. The necklace rotates / pans so that socket arrives at center position (the
   existing ring-spin or arc-pan motion from `game-necklace-ideas.md`).
2. Once the socket settles at center, a **breathing ring** appears around it.
   - The ring is a soft, semi-transparent halo — same hue as the gem slot's
     theme colour, low opacity (roughly 0.25–0.35), slightly larger than the
     socket itself.
   - It pulses in/out slowly — a relaxed breath, not a fast blink. The pulse
     says "here, this one, whenever you're ready." Not urgent, not twitchy.
   - The ring does not react live to pitch proximity. It stays visually simple
     and acts only as a static focus marker for the active socket.
   - When the note phase resolves, the ring simply fades out (maybe 150–200 ms
     ease-out). No burst, no flash from the ring itself. The gem's own
     set-moment juice (bloom from `game-necklace-ideas.md` §8) handles the
     reward beat; the ring just quietly retires.
3. The ring is only ever around one socket at a time — the active one.


---

## 2. Note identification — delayed reveal, then timed evaluation

The active note is not identified immediately. First the kid sees only the
active-socket focus ring. After a level-defined delay, a visual note identifier
appears above the active socket. The moment this identifier becomes visible,
the game's note-evaluation window starts.

This delayed note-name logic is kept intentionally. It is part of the normal
note flow and will be used in later levels of this gem-creation game even
though the first note has its own special count-in behavior.

Before the note identifier appears, the child may already play and search for
the note freely. That pre-evaluation playing has no scoring consequence; it is
allowed exploration, not measured performance.

The identifier should be simple and readable: MVP uses the Finnish letter name
(for example "H", "Fis") as a soft, low-contrast label above the active
socket. Other visual identifiers could be explored later, but the timing model
starts from "identifier becomes visible," not from pitch detection.

**Level timers (MVP ships Level 1 only):**

| Level | Identifier appears after | Evaluation window after reveal | Intent |
|-------|--------------------------|--------------------------------|--------|
| 1     | ~3 s                     | ~3 s                           | Light support; identify the note, then hold reasonably in tune |
| 2     | ~8 s                     | ~2 s                           | More independent; shorter proof window after reveal |
| 3     | never                    | n/a                            | No identifier; play from scale name alone |

The label fades in gradually over ~1 s (not a pop — more like mist). Opacity
max ~0.55 so it reads as a whisper, not a sign. Once visible, it stays visible
for the whole evaluation window.

- On a normal successful or acceptable resolution, the note label disappears
  immediately when the note resolves.
- On a poor-result pause, the label stays visible during the ~1 second feedback
  pause as specified in the resolution rules below.

The evaluation timer starts on the first frame where the note label becomes
visible. The fade-in is decorative only; it does not delay the timer start.

Exception for the first note of the round: the first note is a special start
case. During the `4`, `3`, `2`, `1` countdown, the first note label is already
visible so the child can prepare the correct note before playing begins.

When the countdown completes, the first evaluation window begins immediately.
This first-note behavior intentionally differs from the normal delayed-reveal
flow used for later notes.

For all other normal notes, including descending notes, the game uses the same
delayed reveal rule unless a separate explicit exception is defined.

Display position: centered horizontally above the active socket, a few pixels
above the socket's top edge. This placement uses the empty interior area of the
necklace ring, because the active socket is presented in the lower center of
the screen. Font size: readable at arm's length but clearly smaller than the
socket gem — not competing with the jewellery.

### Round start countdown

Before the first note of the round, the game shows a simple visual countdown:
`4`, `3`, `2`, `1`.

- This countdown is numbers only, with no extra text.
- Each number stays on screen for exactly ~1 second.
- Its purpose is to prepare the child to begin the first note cleanly.
- This countdown happens only before the first note, not before every socket.
- During this countdown, the first note label is already visible.
- After the countdown completes, the first evaluation window begins
  immediately.


---

## 2.5. Note-to-note cadence

The game needs a consistent tempo between note phases so the child can prepare
the bow and finger for the next target.

- After a note resolves, the game waits ~1 second before the next note phase
  begins.
- This same 1 second pause applies between all note changes during play.
- Ascending notes, descending notes, and octave-turn polish repeats all use the
  same timing model unless a later design explicitly overrides it.
- In the normal note flow after the first note, the 1 second between-note pause
  is followed by the active ring with the tuner bar disabled; the note label
  appears only when that note's evaluation window begins.
- Normal descending polish notes that are not octave-turn repeats use the same
  delayed reveal and the same full evaluation window as any other normal note;
  only the polish-result visual treatment differs.
- During a poor-result pause, this ~1 second feedback pause is the between-note
  pause; the game should not stack an extra second on top of it.
- During a successful result, the game uses a clean ~1 second transition pause
  with no extra text.

### Octave-turn repeat rule

At octave-turn notes, the child must play the same note again after the normal
~1 second between-note pause so that the gem can receive its polished effect.

- For 1-octave material, this repeat happens at note 8.
- For 2-octave material, this repeat happens at notes 8 and 15.
- For 3-octave material, this repeat happens at notes 8, 15, and 22.
- The repeated note is the same pitch class / target note as the just-finished
  octave-turn note.
- The first pass sets the gem; the repeated pass after the ~1 second delay adds
  the polished effect for that same gem.
- On this repeated polish pass, the same note label appears immediately after
  the ~1 second pause; the game does not use the normal delayed reveal again.
- The polished effect is judged from the second play only; the first pass does
  not combine with it into a shared final score.
- The polish result must be visibly graded: poor play produces a visibly bad
  polish result, and good play produces a visibly good polish result.
- The repeat pass therefore always changes the gem's finish state, but the
  visible finish quality depends on how well the child plays that second pass.
- Visually, the game should keep this readable as a second pass on the same gem,
  not as advancement to a new socket.

### Resolution rule

After the identifier appears, the game evaluates how well the kid sustains the
active note during the level-defined time window. The reward is not binary
"inside band / outside band" only; it is based on tuning quality over that
window.

- The system measures cents deviation continuously during the evaluation window.
- Better centered intonation across the whole window yields a better gem result.
- MVP uses 10 pitch-quality levels for gem outcome and polish outcome.
- All 10 levels must be visibly distinct in the gem presentation.
- A primary visible indicator is gem colour intensity: for example, saturation
  can scale from roughly 50% at the weakest acceptable result up to 100% at the
  strongest result.
- The implementor may add secondary cues such as brightness, sparkle, or polish
  strength, but the colour-intensity step should already make the 10 levels
  readable.
- The game does not show the child an explicit numeric quality score; the
  10-level result is communicated through the gem appearance only.
- Every resolved note always maps to one of these 10 visible levels; MVP does
  not use a separate below-level-1 failure state.
- Silence during the evaluation window counts against the result in the same
  way as poor pitch; the child is expected to sustain the note through the
  measured phase.
- The first gem-setting pass and the later polish pass do not share the exact
  same visual scale.
- The set pass uses the gem's base colour intensity as its main 10-level cue.
- The polish pass uses a separate 10-level finish scale, for example a muddy
  gradient at the low end and a brighter / cleaner gradient at the high end.
- The full evaluation window counts. If the kid starts on the wrong pitch and
  then corrects it, that recovery is good, but the earlier instability still
  lowers the final gem quality.
- The note always resolves and the game always advances when the evaluation
  window ends, unless the current note is an octave-turn repeat case where the
  same note returns after the normal between-note delay for its polish pass.
- A kid who stays roughly in tune still succeeds; a kid who stays more centered
  earns a brighter / more polished outcome.
- If the kid was mostly off-pitch during the window, the game still gives the
  lowest-quality gem result rather than blocking progress.
- A poor result also triggers a neutral feedback pause of ~1 second before the
  next socket comes forward.
- During that pause, the current active socket stays centered and visible. The
  necklace does not begin moving toward the next socket until the message pause
  has finished.
- During that same pause, the note label remains visible above the socket so
  the child can clearly connect the feedback message to the target note.
- During that pause, the tuning-bar area is temporarily replaced by a plain,
  easy-to-read text message such as "En kuullut kunnolla nuottia C." where the
  note name matches the active target.
- The poor-result message always includes the target note name.
- MVP uses one generic neutral message pattern for all poor results rather than
  distinguishing between wrong pitch, unstable pitch, or missing pitch.
- The message tone must stay neutral and non-shaming: informative, calm,
  matter-of-fact.
- The feedback text should use a very clear sans-serif UI font (Arial or
  similar easy-reading system sans), because this is functional instruction,
  not decorative jewellery text.
- Good and excellent results do not show extra text; they are communicated only
  through the gem quality, ring behaviour, and normal advance to the next note.
- The exact score-to-reward mapping is a separate tuning constant set and should
  be exposed for playtesting.


---

## 3. Tuning bar

A full-width horizontal strip near the bottom of the screen. Low height
(~14–18 px on a 390 px screen). Always visible during play.

The bar has two states:

- Disabled / waiting: visible, but not measuring the current note yet.
- Active / measuring: enabled during the evaluation window after the note
  identifier appears.

The bar remains on screen throughout play; it does not disappear and reappear
per note. It only switches between its disabled and active states.

While the bar is disabled, pitch input is still allowed, but the game does not
score or judge it yet.

### Layout (left → right)

```
┌────────────────────────────────────────────────────────┐
│  -18   │░░░░░░│▓▓▓▓▓▓▓▓▓▓▓│░░░░░░│      2.1 s        │
└────────────────────────────────────────────────────────┘
          ↑                           ↑
       needle                   hold counter
       (moves)
```

Elements from left to right inside the bar:

**Cents readout — left side, inside bar**
A small number at the left interior edge showing how many cents the current
pitch deviates from the target note. Negative = flat, positive = sharp.
Updates live. Example: "-18" means 18 cents flat. Uses a monospace or
tabular-numeral font so the number does not jump in width.
When the bar is disabled or no pitch is detected, the field is blank (or shows
"—").

**Needle**
A thin vertical line (1–2 px wide, same height as the bar) that slides
left/right with the current pitch. Center = in tune. The needle is the main
moving element; the kid glances at "is the line in the middle?"

When the bar is disabled, the needle is hidden or parked neutrally at center so
the strip reads as present but inactive.

**Shaded good zone**
A lighter / highlighted band in the center of the bar marking the zone that
represents clearly centered intonation. The exact width of the band is a design
parameter (call it GOOD_ZONE_CENTS, e.g. ±10–15 cents) — something to tune
during playtesting. The shaded area is always the same visual width regardless
of the exact cents value; only the implementation constant changes.
When the needle is inside the zone the zone highlight intensifies slightly
(e.g. opacity 0.4 → 0.65) to confirm "yes, you are centered."

**Timer — right side, inside bar**
A small number at the right interior edge showing how much time has elapsed in
the current evaluation window after the note identifier appears. Example:
"2.1 s". One decimal place is enough.

This is not a strict "continuous hold inside catch band" counter. It is a phase
timer: once the note identifier appears, the timer runs for the level-defined
window and the game judges the reward from tuning quality during that period.
When the phase resolves, the timer resets for the next socket.

When the bar is disabled, the timer is hidden or empty.

### Visual style

The bar background is dark, matching the general backdrop. The shaded zone is
the theme accent colour at low opacity. The needle is white or the accent
colour. The numbers are small (≈10–11 px), same colour as the needle, slightly
transparent to keep them secondary to the necklace.

In the disabled state, the whole bar should read slightly quieter: lower
contrast, no live motion, clearly present but not currently judging.

The bar does not animate or breathe on its own — it is a passive readout,
not a reward element. All the reward lives in the gem and the ring above.

When the game shows the neutral poor-result feedback message, the bar yields its
space to that message for ~1 second, then returns for the next socket.


---

## 4. Info access — simple explanation on demand

Because the game loop is more complex than a pure tuner, the player or parent
should be able to open a very simple explanation of what is happening.

- A visible info button should be available from the game screen.
- The info button should live in the existing nav bar pattern used elsewhere in
  the app.
- Because it sits in the nav bar, it remains available throughout active play.
- Tapping it opens a lightweight dialog or overlay.
- Opening the info dialog pauses the round completely.
- While paused, countdowns, between-note pauses, reveal delays, and evaluation
  timers are all suspended until the dialog is closed.
- When the dialog closes, the round resumes exactly from the paused state; the
  current note phase does not restart.
- MVP help copy should stay very short and explain only the core rule loop in
  plain language: wait for the active socket, watch for the note identifier,
  play and keep the note steady during the timed window, and better tuning
  gives a prettier gem.
- MVP help does not need to explain every UI element separately.
- MVP help also omits the poor-result message details; it stays focused on the
  main play loop only.
- This help is explanatory only; it must not interrupt active play unless the
  user explicitly opens it.
- MVP copy should stay short enough to scan quickly on a phone.


---

## Summary — what is on screen at any moment during play

| Element              | Position          | Purpose |
|----------------------|-------------------|---------|
| Necklace             | center of screen  | overall progress, active socket visible |
| Start countdown      | center / focal area | prepares the first note with simple numbers |
| Breathing ring       | around active gem | simple static focus on the active socket |
| Note identifier      | above active gem  | appears after delay; starts evaluation window |
| Tuning bar           | bottom strip      | pitch proximity + phase timer |
| Cents number         | left of bar       | exact deviation; trains ear awareness |
| Timer                | right of bar      | shows elapsed evaluation time |
| Neutral feedback text| bottom strip      | replaces tuning bar briefly after a poor result |
| Info button          | corner / header   | opens simple explanation dialog |

The overall rhythm of play is: countdown for the first note, evaluate note,
pause ~1 second, evaluate next note. At octave turns, the same note returns
after that pause for its polish pass before play continues onward.

Scale name and total note count can sit in a small fixed header above the
necklace; they do not change during a round and require no attention.
