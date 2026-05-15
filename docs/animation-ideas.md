# Procedural CSS Pelican Animation Ideas

> **Related tasks:** [Task 21](todo.md#task-21-procedural-timer-animation-for-soittohetki) (timer animation) and [Task 22](todo.md#task-22-time-up-celebration-animation) (celebration animation) in `docs/todo.md`. The intended direction is now a single pelican theme with four deliverables: two timer variants and two ending variants, implemented in order from walking-based motion first to flying/fishing-based motion second.

## What "procedural" means here

Rather than hand-crafting every pixel, each body part is a separate `div`
positioned absolutely inside a parent container. All movement comes from
`@keyframes` applied to `transform` (rotate, translate, scaleY) on each part.
Because every parameter — sizes, timings, amplitudes, easing curves — lives in
the CSS (or in CSS custom properties / SCSS variables), you can tune the whole
character by editing code, not by redrawing art assets.

The key technique for lifelike joints:

- Set `transform-origin` to the anatomical pivot point of each limb.
- Use `animation-delay` with negative values to phase-shift parts that move
  together but slightly out of sync.
- Layer multiple animations on the same element (e.g. a leg gets a `swing`
  animation AND the parent body gets a `bob` animation) — the motions compose.

---

## Pelican body blueprint

Based on pelican anatomy, a simplified cartoon pelican has these parts:

| Part               | Shape                                                            | Approximate size (relative to body) |
| ------------------ | ---------------------------------------------------------------- | ----------------------------------- |
| Body               | Wide horizontal oval (`border-radius: 55% 55% 60% 60%`)          | 1× (reference)                      |
| Head               | Small circle                                                     | 0.35× body width                    |
| Upper bill         | Long tapered rectangle, angled 20° down                          | 0.9× body width                     |
| Lower bill + pouch | Same length, `border-radius` on bottom to form the pendulous bag | 0.9× bill length                    |
| Neck               | Short fat rect connecting head to body                           |                                     |
| Wing (each)        | Broad rounded trapezoid                                          | 1.1× body width                     |
| Leg (each)         | Two segments — thigh + lower leg                                 | 0.4× body height                    |
| Foot               | Three short splayed rects (webbed look)                          |                                     |
| Tail               | Small triangle at rear, angled slightly upward                   |                                     |

Colours for a great white pelican: body `#f5f0e8`, wingtip accents `#222`,
bill `#f0a030`, pouch `#e8820a`, legs `#f0a030`, eye `#222`.

---

## Recommended themed set for Soittohetki

Use one shared pelican rig and split the motion into four variants:

### Timer variants

1. **Timer Variant A — Walking / waddling pelican**

- Role: the first timer animation to implement.
- Mood: steady, calm, clearly shows time passing.
- Best use: default countdown state.
- Progress mapping ideas: distance walked, repeating shoreline segments, subtle speed increase near the end.

2. **Timer Variant B — Gliding / flying pelican**

- Role: the second timer animation to implement.
- Mood: lighter and more airy than the walk cycle.
- Best use: alternate timer mode within the same pelican theme.
- Progress mapping ideas: arc traveled through the sky, cloud positions, wingbeat intensity, sun position.

### Celebration variants

1. **Celebration Variant A — Walking-theme happy finish**

- Role: the first ending animation to implement.
- Mood: small success, friendly and simple.
- Suggested action: the pelican stops, straightens up, gives a proud bounce, flaps lightly, or does a short "ta-da" pose.
- This keeps the first celebration visually tied to the walking timer variant.

2. **Celebration Variant B — Flying / fishing success dive**

- Role: the second ending animation to implement.
- Mood: bigger finale, more dramatic payoff.
- Suggested action: glide → spot fish → fold wings → dive → splash → surface with inflated pouch.
- This is the natural celebration partner for the flying/fishing timer variant.

### Recommended implementation order

1. Build the **walking timer**.
2. Build the **walking-theme celebration**.
3. Build the **gliding/flying timer**.
4. Build the **fishing-dive celebration**.

That gives two complete themed pairs:

- **Theme Pair 1:** walking timer + walking-theme ending
- **Theme Pair 2:** flying/gliding timer + fishing ending

This is preferable to mixing unrelated visual ideas, because the same pelican body rig,
palette, and scene language can be reused while still giving two distinct moods.

---

## Animation 1 — The Waddling Walk

**Scene:** The pelican walks placidly from left to right across the screen.
Its body rocks side to side, the enormous bill bobs gently, and the heavy
throat pouch swings like a pendulum.

### Motion breakdown

| Part            | Keyframe motion                           | Period               | Notes                            |
| --------------- | ----------------------------------------- | -------------------- | -------------------------------- |
| Whole character | `translateX` from –120% to 120%           | 4 s linear           | Moves across screen              |
| Body            | `rotate(–2deg → +2deg)` pendulum          | 0.6 s                | Side-to-side waddle              |
| Body            | `translateY(0 → –4px → 0)` bob            | 0.3 s                | Rises with each step             |
| Head + neck     | `rotate(–3deg → +3deg)`                   | 0.6 s, delay –0.15 s | Follows body but slightly behind |
| Upper bill      | `rotate(2deg → –2deg)` around base        | 1.2 s                | Slow lazy bob                    |
| Pouch           | `rotate(5deg → –5deg) scaleY(0.9 → 1.05)` | 0.6 s                | Swings and squishes              |
| Left leg        | `rotate(20deg → –20deg)` around hip       | 0.6 s                | Steps forward and back           |
| Right leg       | same, delay –0.3 s                        | 0.6 s                | Opposite phase                   |
| Left foot       | `rotate(10deg → –5deg)` around ankle      | 0.6 s                | Lifts toe on swing-forward       |
| Right foot      | same, delay –0.3 s                        |                      |                                  |
| Wings (resting) | `rotate(2deg → –2deg)` slight fold        | 1.2 s ease-in-out    | Barely moves — folded at sides   |

### Skeleton HTML

```html
<div class="pelican walk">
  <div class="wing wing--left"></div>
  <div class="wing wing--right"></div>
  <div class="body">
    <div class="tail"></div>
    <div class="neck">
      <div class="head">
        <div class="eye"></div>
        <div class="upper-bill"></div>
        <div class="pouch"></div>
      </div>
    </div>
  </div>
  <div class="leg leg--left">
    <div class="lower-leg">
      <div class="foot"></div>
    </div>
  </div>
  <div class="leg leg--right">
    <div class="lower-leg">
      <div class="foot"></div>
    </div>
  </div>
</div>
```

### Key CSS patterns

```css
/* Body waddle */
@keyframes waddle {
  0%,
  100% {
    transform: rotate(-2deg) translateY(0);
  }
  50% {
    transform: rotate(2deg) translateY(-4px);
  }
}
.body {
  animation: waddle 0.6s ease-in-out infinite;
}

/* Leg swing — pivot at hip */
@keyframes leg-swing {
  0%,
  100% {
    transform: rotate(20deg);
  }
  50% {
    transform: rotate(-20deg);
  }
}
.leg {
  transform-origin: top center;
  animation: leg-swing 0.6s ease-in-out infinite;
}
.leg--right {
  animation-delay: -0.3s;
} /* half-phase offset */

/* Pouch pendulum */
@keyframes pouch-swing {
  0%,
  100% {
    transform: rotate(6deg) scaleY(1);
  }
  50% {
    transform: rotate(-6deg) scaleY(0.92);
  }
}
.pouch {
  transform-origin: top center;
  animation: pouch-swing 0.6s ease-in-out infinite;
}

/* Walk across screen */
.pelican.walk {
  animation: walk-across 4s linear infinite;
}
@keyframes walk-across {
  from {
    transform: translateX(-120%);
  }
  to {
    transform: translateX(120vw);
  }
}
```

### Parameters you can tune

- `--step-period: 0.6s` — faster/slower waddling
- `--waddle-angle: 2deg` — how much the body rocks
- `--pouch-swing: 6deg` — how loose the throat bag hangs
- `--bob-height: 4px` — vertical bounce per step

### Soittohetki use

- Primary basis for **Timer Variant A**.
- Also provides motion vocabulary for **Celebration Variant A**, where the pelican can stop walking and transition into a short proud bounce / flap finish.

---

## Animation 2 — The Fishing Dive

**Scene:** The pelican glides in from the upper right, circles with slow
wing beats, spots a fish, folds its wings back and arrow-dives straight
down, hits the water with a splash, then bobs upright with the pouch
distended and full of fish — the pouch inflates visibly.

### Motion breakdown

**Phase 1 – Glide (0 s → 2 s)**

| Part            | Motion                                                              |
| --------------- | ------------------------------------------------------------------- |
| Whole character | `translateX(120vw → 60vw)` + gentle `translateY(–10px → 10px)` soar |
| Wings           | `rotate(–25deg → –10deg → –25deg)` slow flaps every 1.5 s           |
| Body            | `rotate(–5deg)` nose-down glide angle                               |
| Neck            | `rotate(10deg)` pulled back in classic pelican glide S-curve        |
| Pouch           | resting, barely moves                                               |

**Phase 2 – Spot & Orient (2 s → 2.5 s)**

| Part  | Motion                                              |
| ----- | --------------------------------------------------- |
| Head  | Snaps forward — `rotate(–30deg)` locking onto fish  |
| Neck  | Quickly straightens                                 |
| Wings | Begin folding: `rotate(–60deg)` pulling toward body |

**Phase 3 – Dive (2.5 s → 3.2 s)**

| Part            | Motion                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------- |
| Whole character | `translateY(0 → 300px)` rapid downward plunge + `rotate(90deg)` to point nose straight down |
| Wings           | Fully folded against body (`rotate(–90deg)`) — arrow shape                                  |
| Neck            | Extended forward, straight                                                                  |
| Bill            | Slightly open at bottom                                                                     |

**Phase 4 – Impact & Surface (3.2 s → 4 s)**

| Part            | Motion                                                              |
| --------------- | ------------------------------------------------------------------- |
| Whole character | Stops (`translateY` held), brief `scaleX(1.2) scaleY(0.7)` squash   |
| Pouch           | `scaleY(1 → 2.2) scaleX(1 → 1.6)` — inflates dramatically with fish |
| Wings           | Spread back out: `rotate(–10deg)` flap to stabilise                 |
| Body            | Rotates back upright `rotate(0deg)` over 0.8 s                      |

### CSS pattern for multi-phase via animation-delay chain

```css
/* Use one long keyframe that encodes the full timeline at % positions */
@keyframes dive-sequence {
  0% {
    transform: translateX(120vw) translateY(0) rotate(-5deg);
  } /* glide in */
  40% {
    transform: translateX(60vw) translateY(-10px) rotate(-5deg);
  }
  50% {
    transform: translateX(55vw) translateY(0) rotate(20deg);
  } /* orient */
  70% {
    transform: translateX(52vw) translateY(300px) rotate(90deg);
  } /* dive */
  80% {
    transform: translateX(52vw) translateY(295px) rotate(5deg);
  } /* surface */
  100% {
    transform: translateX(52vw) translateY(290px) rotate(0deg);
  } /* bob */
}

/* Pouch inflation — timed to hit at the 70%-80% impact moment */
@keyframes pouch-inflate {
  0%,
  69% {
    transform: scaleY(1) scaleX(1);
  }
  75% {
    transform: scaleY(2.2) scaleX(1.6);
  }
  100% {
    transform: scaleY(1.8) scaleX(1.4);
  } /* stays full */
}
.pouch {
  transform-origin: top center;
  animation: pouch-inflate 4s ease-out forwards;
}

/* Wing fold */
@keyframes wing-fold {
  0%,
  40% {
    transform: rotate(-25deg);
  } /* extended glide */
  55% {
    transform: rotate(-90deg);
  } /* fully folded for dive */
  85% {
    transform: rotate(-20deg);
  } /* spread for landing */
  100% {
    transform: rotate(-15deg);
  }
}
.wing {
  transform-origin: center right; /* pivot at shoulder */
}
.wing--left {
  animation: wing-fold 4s ease-in-out forwards;
}
.wing--right {
  transform: scaleX(-1); /* mirror */
  animation: wing-fold 4s ease-in-out forwards;
}
```

### Soittohetki use

- Primary basis for **Celebration Variant B**.
- Its opening glide phase can also be simplified into **Timer Variant B**, using the same rig with gentler looping flight instead of the full dive sequence.

---

## General tips for procedural CSS character animation

### 1. Use CSS custom properties for all parameters

```css
.pelican {
  --step-period: 0.6s;
  --waddle-angle: 2deg;
  --pouch-swing: 6deg;
}
/* Then reference in keyframes via var() where supported,
   or just change the class to switch between "slow/fast" states. */
```

### 2. `transform-origin` is everything

Every joint pivot must be set precisely — wrong transform-origin makes limbs
fly off into space. Set it relative to the element's own bounding box.
Example: a leg element that represents the thigh needs `transform-origin: top center`
so it rotates around the hip socket.

### 3. Compose animations with `animation` shorthand lists

```css
.body {
  animation:
    waddle 0.6s ease-in-out infinite,
    walk-across 4s linear infinite;
}
```

Each animation is independent; they multiply. This is the core of the
procedural approach — you get emergent behaviour from simple independent rules.

### 4. Phase offsets with negative `animation-delay`

Left/right limb pairs: same keyframes, `animation-delay: calc(-1 * var(--step-period) / 2)`
on the second one. This creates the alternating gait without duplicating code.

### 5. `ease-in-out` for organic movement, `linear` only for travel

Limb swings should ease in and out (deceleration at extremes) — this is what
makes motion feel biological. Horizontal travel across screen uses `linear`.

### 6. `will-change: transform` on animated elements

Promotes them to GPU compositing layers. Essential for keeping 60 fps with
many simultaneously animated parts.

### 7. `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  .pelican * {
    animation: none;
  }
}
```

---

## Reference sources

- Pelican anatomy: 8 species, wingspan up to 3.6 m, large oval body, S-curve
  neck retracted in flight/glide, distinctive pendulous pouch on lower mandible,
  short legs set far back (hence the waddling gait), webbed feet, broad rounded
  wings. Source: howtodrawanimals.net, Britannica.
- Brown pelican dive-fishing technique: folds wings, dives from ~10 m altitude
  headfirst, pouch expands on impact to scoop ~3 l of water + fish, drains
  water before swallowing.
- CSS animation mechanics: `transform` + `opacity` are GPU-composited and the
  only properties that should animate for performance. Source: joshwcomeau.com.
