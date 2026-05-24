# Listening Game — Pelikaanin aarteet ("The Pelican's Treasures")

A pitch-listening game that turns scale practice into crafting jewellery for the
pelican. Built on the existing tuner/listening engine (pitch detector, A=442,
see `audio-architecture.md` and `tuner-pitch-detection.md`). Designed for an 8-year-old
violinist, phone propped on a stand (hands full), solo, ~5-minute sessions.
Collection is the hook.

## Core idea

The kid is a royal jeweller. **Each scale is one piece of jewellery crafted for
the pelican to wear.** Notes are gem sockets; playing in tune sets the gems; the
finished piece is worn by the pelican (reuse existing walk/fly animations).

Because the phone is propped and both hands hold the violin: **no taps mid-play,
everything glanceable, nothing twitchy.** The catch mechanic is "find the note
and *hold* it" — which also absorbs mic latency and trains the real violin skill
(start the note, hear it's flat, slide into tune and stay there).

## MVP — the basic necklace game

Scope the first version to a single **necklace** per scale. (Other jewellery
types and the help-tiers below come later — see "Later".)

- A necklace has **one empty socket per scale note**, laid out low → high.
- **Ascending the scale adds a stone:** play a note in tune and hold ~1 s → a gem
  drops into that socket. Work upward, sockets fill left to right.
- **Descending upgrades the stone:** playing back down the scale polishes each
  gem — sets it, makes it sparkle. (Bonus: this is just how you practice a violin
  scale anyway, up *and* down — now the descent has a purpose.)
- Necklace complete → **the pelican wears it** and struts / flies.
- A **treasury** screen holds every necklace made; the pelican can wear any of them.

### Intonation = gem quality (the forgiveness / mastery dial)

- In tune anywhere in a **wide band** + hold → a dull / cloudy gem. Always a win,
  never "wrong." A sloppy player still finishes a plain necklace.
- Dead center → a brilliant, sparkling gem.
- As the kid improves, the bar for "sparkling" quietly tightens. The base catch
  never gets harder (no frustration cliff); there's always a reason to re-craft a
  piece to make it prettier. The necklace literally looks as good as they play.

### Forgiveness rules

- Reward *getting closer*, not just perfect — the socket / gem glows warmer as
  the played pitch homes in on target. The game roots for them.
- Start band ~±30–40 cents. Adaptive, never announced.
- Nothing is ever taken away; you keep what you collect.

## The learning loop (why "boring first" works)

> **Learn (Harjoittelu, the boring part) → Prove (this game).**

The game deliberately **does not show finger positions.** It shows the note (the
stave is already rendered) and expects the kid to *find* it on the violin.

- A kid who knows the scale fills the necklace smoothly.
- A kid who doesn't hunts around, plays wrong pitches, gets no gem — and naturally
  bounces back to Harjoittelu. The boring practice now has a point: it's how you
  get the good loot.
- Session end: empty / dull sockets are a free practice plan ("socket 5 and 6 are
  still empty — go learn G and A").

## Progression

Map **one necklace to each scale** in the existing key progression
(`scale-practice-method.md`). The kid thinks they're filling a jewellery box;
they're actually walking the scale curriculum in order.

## Later (not MVP)

1. **Multiple jewellery types as tiers** — bracelet → necklace → crown → tiara.
   Bigger bling = harder scale.
2. **Bronze / Silver / Gold versions per scale**, graded by how much note help the
   kid uses:
   - **Bronze** — notes shown on screen the whole time.
   - **Silver** — see the notes once, then play without them.
   - **Gold** — play from just the scale name + number of octaves, no notes shown.
   MVP ships **Bronze** behaviour; Silver/Gold are added later.

## Reuses / dependencies

- Pitch detection + tuning: `audio-architecture.md`, `tuner-pitch-detection.md`.
- Scale + stave rendering: existing canvas (see `architecture.md`).
- Key progression / scale list: `scale-practice-method.md`.
- Pelican walk / fly animations: `animations.md`.
