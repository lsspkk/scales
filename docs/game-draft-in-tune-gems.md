# In-Tune Gems — What to Show on Screen During Play

Design ideas for the extra content displayed around the necklace while the kid
plays. The stave / finger positions are NOT shown during the game (that's the
whole point — the game tests whether the kid knows the scale from memory). The
tuner and gem system already exist; this document is about the surrounding display.

Phone is propped on a stand. Both hands hold the violin. So everything here
must be:
- Glanceable at arm's length in under one second.
- Never requiring a tap mid-play.
- Large enough to read without glasses in dim practice light.


---

## What information the kid might actually need

There are really only two questions running through the kid's head at any moment:

1. **Which note am I on right now?** (Which socket is active — which string / finger?)
2. **Am I getting closer?** (Is the mic picking up anything? Am I in the right zone?)

Everything else — the scale name, how many notes total, progress — can be
answered by looking at the necklace itself (empty vs. filled sockets). So the
extra display content only needs to answer those two questions.

---

## Option 1 — The note number only (simplest, boldest)

Show a single large number, centered above or below the necklace:

```
          3
  ○  ◉  [ ]  ○  ○  ○  ○
```

The active socket is always socket N; the number is N. Scale note 1 to 7 (or 8
for the octave). That's it.

Why this might be enough: the kid who has practiced knows "note 3 is B, second
finger on A-string." The number is the cue. It's not a full label; it's more like
a chapter marker. Large serif or bold sans, maybe in the theme's accent colour,
roughly 80–100 px tall on a 390 px screen. Hard to miss, easy to ignore once
you know the scale cold — which is the progression you want.

What changes during play:
- The number ticks up as each socket fills (ascending) and ticks back down
  (descending).
- It can briefly pulse or glow when the socket catches a note — simple beat
  feedback without needing sound.

Downside: tells you nothing about what the note actually is. Fine for a kid who
has done Harjoittelu; confusing the first time. Could add a tiny note name
in subscript (e.g. "3 · B") as a Bronze-tier hint that disappears at Silver.


---

## Option 2 — A glowing "breath ring" around the active socket

No text at all. The active socket has a large breathing ring around it — a slow
in-and-out glow — that says "your turn, play this one." As the pitch gets closer
the ring brightens and narrows (focus). When it catches, it explodes and the next
socket's ring awakens.

The ring alone may be sufficient because the necklace layout already tells you
position (socket 3 of 7). The kid looks at the necklace, sees which socket is
glowing, and plays.

Combined with the note number (Option 1) this covers both questions cleanly:
number = which note to play, ring = am I in the zone.


---

## Option 3 — A note name label that fades in slowly

Rather than always showing the note name, it appears after a short delay — say
3 seconds of silence / wrong pitch — as a "hint that earns itself." The kid
first tries from memory; if they're stuck the label materialises like fog.

Display: the Finnish note name (Do/Re/Mi solfège, or letter name like "H" for B
in Finnish convention) appears in a soft label beneath the active socket, low
opacity, maybe slightly blurred. Not a bright neon sign — more like a whisper.

This fits the Bronze / Silver / Gold tier logic from the game design: Bronze
could show the hint quickly (2 s), Silver slowly (6 s), Gold never. Because it
delays, good players never even see it; struggling players get unstuck without
humiliation.

What it looks like in the display (very approximate):

```
  ○  ◉  [ ]  ○  ○  ○  ○
           H       ← fades in after 3 s of silence
```


---

## Option 4 — A simple "tuning bar" strip, like a fuel gauge

A horizontal bar at the bottom of the screen (full width, low height — maybe
12–16 px). The left end = flat, right end = sharp, center = in tune. A dot
slides left/right as the kid plays, and a soft target zone is highlighted in the
middle.

This reuses the existing pitch detection directly. It's different from the full
tuner (Virittaminen) in that it shows no numbers, no cents, no needle — just the
dot position. The kid learns to keep the dot in the lit zone.

Advantages over a standard tuner:
- Glanceable: you don't read numbers, you read position.
- No cognitive load: left = too low, right = too high, center = good.
- Can be themed (the bar looks like a forge heat gauge for Dragonhoard, a star
  beam for Starforge, etc.).

Disadvantages:
- Adds a second active visual element to watch alongside the necklace. Could
  split attention. Probably fine for beginners; experienced players may find it
  patronising.

Could be gated: shown in Bronze (training wheels), hidden in Silver/Gold.


---

## Option 5 — The pelican as a live audience

The pelican character already exists (walking and flying animations). During
play, a small pelican silhouette stands at the side of the screen — facing the
necklace, watching. When the kid plays close to in-tune, the pelican leans
forward or bobs its head. When they hit a note cleanly, it does a little wing
flap.

This adds no text, no numbers, no UI chrome. The feedback is purely animal
reaction — which 8-year-olds read very naturally. "The pelican is excited" means
"I'm doing it right."

What the pelican does:
- Idle: slow sway, blinking.
- Getting closer: leans forward, head tilts.
- Caught a note: jumps / claps wings once.
- Necklace complete: full walk / fly celebration (already built).
- Long silence / wrong notes: sits down, tilts head quizzically (not
  disappointed — curious, like it's waiting patiently).

This is soft feedback rather than precision feedback. Good to layer on top of
Options 1–4, not as a replacement for the tuning indicator if you want the kid
to develop actual pitch awareness.


---

## Option 6 — "Forge sparks" as proximity feedback

No UI element at all. Instead, when the played pitch is within the wide catch
band (±30–40 cents), small spark particles drift from the active socket toward
the sound hole of an implied violin shape at the bottom of the screen (or just
upward off the gem socket). The closer to center, the more sparks, the brighter.

The kid reads: "sparks mean I'm in the zone." More sparks = better. The
direction and quantity map to "getting warmer" without any text or bar.

This is purely ambient and works even when the kid is looking at the violin
(peripheral vision picks up bright motion better than text). It also ties the
visual feedback directly to the gem, not to a separate bar at the screen edge.

Cost: reuses the particle system already designed for set-burst. Just fire
continuous low-rate particles while in the catch band, stop when not.


---

## Recommended combinations to prototype

Three distinct options, ranging from minimal to rich:

**Minimal (for testing on the real kid):**
Option 1 (big note number) + Option 2 (glow ring). No text beyond the number.
Clean, almost no UI chrome. See if the number alone is enough as a reminder cue.

**Guided (likely the best MVP):**
Option 1 (note number) + Option 3 (slow-fade note name hint) + Option 6 (forge
sparks for proximity). The sparks give pitch feedback without a bar. The number
keeps orientation. The hint name rescues a stuck kid without shame.

**Training wheels (Bronze tier only):**
All of the above + Option 4 (tuning bar strip). The most information, appropriate
for the very first time a kid plays a scale they are still learning. Hide the bar
as they progress to Silver/Gold.

The pelican reactions (Option 5) layer on top of any of these for free emotional
warmth — it costs nothing to have a small pelican silhouette that reacts, and
kids respond to characters more strongly than to numbers.


---

## Layout sketch (390 px wide screen, approximate)

```
┌──────────────────────────────────────┐
│                                      │
│   Scale: D-duuri  [pelican watches] │  ← top bar: scale name only
│                                      │
│                                      │
│      3                               │  ← big note number, centered
│                                      │
│   ─────────────────────────────      │
│   ○  ◉  [✦]  ○  ○  ○  ○             │  ← necklace (rotating ring or arc)
│            H  ← fades in if stuck   │
│   ─────────────────────────────      │
│                                      │
│  ✦✦✦·····  ← forge sparks if in zone│
│                                      │
│  ▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░       │  ← tuning bar (Bronze only)
│                                      │
└──────────────────────────────────────┘
```

The scale name in the top bar is fixed; it tells the kid which piece of jewellery
they are making, not what to play next. The necklace itself shows progress. The
active number + glow ring + optional hint carries the "what to do now" message.

---

## Open questions

- Does the note number feel like "game UI" to the kid, or does it feel like a
  test label that adds pressure? Might be worth trying a symbol (a star, a rune
  glyph per degree) instead of a plain numeral.
- Does the tuning bar / proximity spark cause the kid to watch the screen instead
  of listening to the violin? That would be the opposite of the intended skill
  development. Consider gating sparks only for the first 2–3 sessions.
- How large does the note number need to be for a propped phone at roughly 50 cm?
  Rule of thumb: text at 50 cm needs to be at least 8–10 mm tall to read easily.
  On a 390 px / ~130 mm wide screen that means roughly 24 px min — a "big"
  number would be 80–100 px, clearly readable.
- Should the ascending and descending phases have different display colours? Up =
  warm (forge glow), down = cool (polish/moonlight)? Ties the visual phase change
  to something the kid notices without explaining it.
