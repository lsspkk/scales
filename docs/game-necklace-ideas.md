# Necklace Graphics — Procedural Canvas Design Options

Design exploration for the **MVP necklace game** in *Pelikaanin aarteet* (see
`game-gems-draft.md` for the full game concept). This document is a **menu of
techniques**, not a final spec. Each section presents several alternatives with
the math, the canvas drawing procedure, rough cost, and a "pick this for MVP"
note, so a human designer can choose what looks coolest and is realistic to ship.

> **What we're building graphically:** a magic-themed necklace that fills one gem
> per scale note. Ascending the scale *mines / chooses raw material* into each
> socket; descending *sands / shapes / polishes* each gem to its final form. The
> necklace presents the **next empty socket** to the player with some motion
> (spin / bend / turn-into-view) so the active slot is always obvious without a
> tap. Gems and metal must read as "crafted," not flat — gem quality scales with
> intonation; metal is bronze / silver / gold.

---

## 0. Design goals & constraints

These constraints come straight from the game design (`game-gems-draft.md`) and
the existing canvas engine (`architecture.md`). Every option below respects them.

- **Glanceable, never twitchy.** Phone is propped, both hands on the violin. No
  taps mid-play. Motion must *guide the eye to the active socket*, not demand
  reaction. Slow, smooth, readable from a stand at arm's length.
- **Magic style, gender-neutral.** Avoid pink-princess-only and avoid
  swords-and-skulls. Aim for "enchanted treasure / star-forge / rune-jewel":
  glowing gems, starlight, moon-metal, constellation sparkles. Boys and girls
  both like *glowing magic loot*.
- **Theme chosen at round start.** Before mining begins, the player picks a
  theme (palette + motif). Theme only changes colours/decoration, never the
  geometry or game logic — so it's cheap and safe.
- **Procedural, not asset-heavy.** No pre-drawn PNG gem sheets. Everything is
  generated from a few parameters (seed, hue, facet count, polish level). This
  keeps the bundle tiny, lets every necklace look slightly unique, and ties the
  visual quality directly to play quality.
- **Reuse the existing canvas conventions** (next section).
- **Performance:** must hold 60 fps on a mid-range phone while the mic/pitch
  detector also runs. Favour cheap 2D-context tricks over per-pixel work.

---

## 1. Rendering conventions to reuse

The current canvas stack (`musicStave.ts`, `MusicCanvas.tsx`) already nails the
hard parts of canvas hygiene. The necklace renderer should follow the same rules
so it drops into the codebase cleanly:

- **Pure lib + thin React wrapper.** Put all drawing in a pure
  `src/lib/necklace.ts` (no React), mirror `MusicCanvas.tsx` with a
  `NecklaceCanvas.tsx` that owns the `ResizeObserver` + `requestAnimationFrame`
  loop. Drawing functions take `(ctx, layout, state)`.
- **CSS-pixel coordinates, DPR-scaled bitmap.** Set `canvas.width = cssW * dpr`,
  then `ctx.setTransform(dpr,0,0,dpr,0,0)` once per frame and draw in CSS pixels
  (exactly as `MusicCanvas` does). Gradients and sparkles stay crisp on HiDPI.
- **Geometry derived from measured size**, like `computeLayout()`. A
  `computeNecklaceLayout({width,height,socketCount})` returns center, ring
  radius, gem radius, etc. No magic pixel constants.
- **Deterministic randomness.** Seed a small PRNG (e.g. `mulberry32`) per
  necklace so a given scale always regenerates the *same* gems (facet jitter,
  ore lumps). Store only the seed + per-socket quality, never bitmaps.

```ts
// tiny seeded PRNG — same gem every time for a given necklace
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

---

## 2. Necklace layout & motion — how the next socket "arrives"

This is the big visual decision: the **shape of the necklace** and **how it
moves** so the active (next) socket is the focal point. Four alternatives, from
cheapest to fanciest. They are independent of the gem-rendering choice in §3.

### Option A — Static garland arc + spotlight pan (cheapest, safest)

The necklace is a fixed catenary/arc across the screen, sockets spaced along it
low→high (matches the game's "laid out low→high"). Nothing rotates; instead the
**camera/spotlight** glides to center the active socket and a soft glow ring
pulses around it.

**Math — socket positions on a hanging-chain (catenary) curve:**

```ts
// n sockets spread across width, sagging in the middle like a real necklace
function socketPos(i: number, n: number, L: StaveLayout) {
  const t = n === 1 ? 0.5 : i / (n - 1);          // 0..1 along the chain
  const x = L.padX + t * (L.width - 2 * L.padX);
  const sag = L.sag * Math.cosh((t - 0.5) * 2 * L.k) / Math.cosh(L.k); // U-shape
  const y = L.topY + sag;
  return { x, y };
}
```

**Motion:** translate the whole context so the active socket sits at screen
center, easing with a critically-damped spring (no overshoot = not twitchy):

```ts
// per frame: ease camera toward target; springs feel organic, never jittery
cam.x += (targetX - cam.x) * 0.12;   // 0.12 ≈ smooth ~0.5s settle at 60fps
ctx.translate(W / 2 - cam.x, 0);
```

- **Pros:** trivial, robust, reads instantly, zero depth-sorting. The arc *is* a
  necklace shape, so it's thematically honest.
- **Cons:** least "wow." No 3D.
- **MVP verdict:** **the safe default.** Ship this if the fancier options slip.

### Option B — Pseudo-3D rotating ring (the "turn into view" effect)

Treat the necklace as a ring of beads in 3D, viewed slightly from above, and
**rotate it about the vertical (Y) axis** so the next socket swings to the front.
This is the "necklace spins, each gem slot turns into vision" idea, done with
pure 2D-context math (no WebGL).

**Math — project a ring point at angle θ onto an ellipse, with depth & scale:**

```ts
// ring of n sockets; `spin` is the current global rotation (radians)
function ringSocket(i: number, n: number, spin: number, L: NecklaceLayout) {
  const a = spin + (i / n) * Math.PI * 2;
  const cosA = Math.cos(a), sinA = Math.sin(a);
  return {
    x: L.cx + cosA * L.rx,          // horizontal: full radius
    y: L.cy + sinA * L.ry * L.tilt, // vertical: squashed by view tilt (e.g. 0.45)
    z: sinA,                        // -1 (back) .. +1 (front)  → depth
    scale: 0.7 + 0.3 * (sinA * 0.5 + 0.5), // front beads bigger
    alpha: 0.55 + 0.45 * (sinA * 0.5 + 0.5), // back beads dimmer (atmosphere)
  };
}
```

**Draw order = depth sort.** Sort sockets by `z` ascending and draw back→front
so front gems overlap rear ones (the classic fix for rings of beads). The active
socket's target is `spin` such that its `sinA ≈ 1` (front-center).

**Connecting the beads:** stroke a smooth closed curve through the projected
points (`quadraticCurveTo` between midpoints) to draw the chain itself, also
back→front in two passes (behind-beads pass, then beads, then front-chain pass)
for a convincing over/under weave.

- **Pros:** genuinely 3D-feeling, the "swing the next gem to the front" reads
  beautifully, still cheap (a few dozen draws/frame).
- **Cons:** needs depth sort + two-pass chain; tilt/scale constants need taste
  tuning; many sockets (8) on a phone get small at the back.
- **MVP verdict:** **the recommended "cool" option** — highest wow-to-effort.

**Depth-proportional spacing (no gaps at the back).** With evenly-spaced angles,
back beads are drawn smaller (the `scale` term) but still sit at the *same*
angular spacing as the front — so gaps open up between the small back gems and
the chain looks broken. Fix it with a single **perspective foreshortening
factor** `fore` that is `>1` at the front, `1` at the sides, `<1` at the back,
and drive **both** the radial spread *and* the gem/chain size with it:

```ts
const fore = 1 + RING_PERSPECTIVE * sinA;   // front >1, sides 1, back <1
x = cx + cosA * rx * fore;                   // front beads take more arc, back bunch up
y = cy + sinA * ry * tilt * fore;
scale = fore / (1 + RING_PERSPECTIVE);       // size tracks spread → stays in proportion
```

Because spacing and size scale by the *same* factor, the ratio between a bead's
size and the room around it is constant at every depth, so no gaps appear — the
front simply consumes more of the ring's circumference than the back. The strength
is one tunable constant (`RING_PERSPECTIVE`); raise it for a deeper 3D look, drop
it toward 0 for the old flat ring.

### Option C — Bending serpentine ribbon (a flowing wave)

The necklace is a horizontal ribbon that **undulates** as a travelling sine wave;
the active socket rides the crest nearest center. Feels like a living, magical
chain of light.

```ts
// travelling wave: each socket bobs; phase scrolls so motion flows along chain
const phase = time * speed;
function ribbonSocket(i, n, L) {
  const t = i / (n - 1);
  const x = L.padX + t * (L.width - 2 * L.padX);
  const y = L.midY + Math.sin(t * L.waves * Math.PI * 2 - phase) * L.amp;
  const tangent = Math.cos(t * L.waves * Math.PI * 2 - phase); // for tilting gems
  return { x, y, rot: Math.atan2(tangent * L.amp, 1) };
}
```

Rotate each gem by `rot` so it "lies along" the ribbon — sells the bend. Draw a
thick stroked path through the points as the metal band; gems sit on top.

- **Pros:** lush, organic, very "magic." Cheap (no sorting). Tangent-based gem
  tilt is a nice touch.
- **Cons:** constant motion can be distracting on a propped phone — keep `amp`
  small and `speed` low, or freeze the wave except near the active socket.
- **MVP verdict:** great for the *celebration/treasury* view; maybe too busy
  during play. Consider as a polish layer over A or B.

### Option D — Per-socket coin/medallion flip (localized 3D)

The necklace stays a static arc (Option A), but the **active socket flips** like
a coin to reveal its gem when filled. Single-axis 3D faked with horizontal
squash: `scaleX` from 1 → 0 → 1 while swapping the face at the midpoint.

```ts
// flipPhase 0..1 ; squash X to fake rotation about the vertical axis
const sx = Math.abs(Math.cos(flipPhase * Math.PI));   // 1→0→1
ctx.save();
ctx.translate(p.x, p.y);
ctx.scale(sx, 1);
drawFace(flipPhase < 0.5 ? emptySocket : filledGem);  // swap at edge-on moment
ctx.restore();
```

- **Pros:** dead simple, very satisfying "reveal," localized so the rest is calm.
- **Cons:** not a whole-necklace effect; it's a *moment*, not a layout.
- **MVP verdict:** **combine with A or B** as the gem-set reveal animation.

### The chain itself — link styles (real jewellery vocabulary)

Whatever the layout, the cord *between* sockets is the chain. Real necklaces use
distinct link styles, and each is a different cheap canvas primitive — pick one
per theme for free variety (jewellery findings reference in Sources):

| Link style    | Canvas recipe                                                        | Vibe            |
|---------------|----------------------------------------------------------------------|-----------------|
| **Cable**     | alternating stroked ovals, each rotated 90° from the last            | classic, neutral|
| **Box**       | small rounded squares butted edge-to-edge along the path             | sturdy, modern  |
| **Herringbone**| short parallel slanted strokes (V's) — a flat ribbon of light       | sleek, premium  |
| **Curb**      | overlapping flattened ovals (draw + dark inner stroke for the twist) | bold, chunky    |
| **Filigree**  | scrolling wire: stroke tiny bézier S-curves between sockets          | ornate, magical |

> **Cheapest convincing default:** a **rope/snake** chain — just a thick stroked
> path with a second thin bright stroke offset along its top edge (a highlight
> running the length). One extra `stroke()`; reads as round metal cord instantly.
> Use **filigree** for the ornate "Moongarden/Runeforge" themes where you want the
> chain to feel hand-crafted, and **herringbone** for the sleek "Starforge" look.

> **Recommended motion stack for MVP:** **Option B (rotating ring)** as the base
> layout + **Option D (coin flip)** for the moment a gem is set. Fallback to
> **Option A** if ring tuning eats too much time. Option C reserved for the
> finished-necklace flourish.

---

## 3. Gem rendering — making a socket look like a real jewel

Gem quality is the intonation dial (`game-gems-draft.md`: dull/cloudy → brilliant/
sparkling). So the renderer takes a **`quality` 0..1** and a **`hue`** (from theme)
and produces anything from a murky pebble to a flashing jewel. Three approaches,
combinable.

### Option G1 — Cabochon (smooth domed gem) via offset radial gradient

The cheapest convincing gem. A radial gradient whose *highlight is offset* from
center reads as a glossy 3D dome (per the gradient research: offsetting the inner
circle gives a spherical look).

```ts
function drawCabochon(ctx, x, y, r, hue, quality) {
  // body: offset highlight (upper-left) → mid → dark rim
  const g = ctx.createRadialGradient(x - r*0.35, y - r*0.35, r*0.1, x, y, r);
  g.addColorStop(0,   `hsl(${hue} 90% ${70 + 20*quality}%)`); // bright core
  g.addColorStop(0.5, `hsl(${hue} 75% ${45 + 10*quality}%)`);
  g.addColorStop(1,   `hsl(${hue} 70% ${20 + 5*quality}%)`);  // dark edge
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  // specular hotspot — tiny, only on high quality
  if (quality > 0.3) {
    ctx.globalAlpha = (quality - 0.3) * 1.4;
    const s = ctx.createRadialGradient(x - r*0.4, y - r*0.4, 0, x - r*0.4, y - r*0.4, r*0.4);
    s.addColorStop(0, 'rgba(255,255,255,0.9)'); s.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = s; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }
}
```

- **Quality mapping:** low quality = desaturated + no specular (cloudy pebble);
  high = bright core + crisp hotspot. Same code, one parameter.
- **Pros:** one gradient + one highlight, gorgeous, trivially cheap.
- **Cons:** rounded/soft — less "cut diamond," more "polished stone." (Which
  actually fits the *cabochon* magic-amulet aesthetic well.)
- **MVP verdict:** **recommended base gem.** Add G3 sparkle on top for brilliance.

### Option G2 — Faceted gem (procedural cut) via triangle fan

For a cut-jewel look, generate a polygon outline and fill triangular facets, each
a slightly different shade so light "catches" edges. Procedural & seedable.

```ts
function drawFacetedGem(ctx, x, y, r, hue, quality, rand) {
  const n = 6 + Math.floor(rand() * 3);          // 6–8 outer facets
  const pts = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const rr = r * (0.9 + rand() * 0.1);          // slight irregularity
    return { x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr };
  });
  // outer ring of facets, each shaded by its angle to a fixed light dir
  const light = -Math.PI * 0.75;                  // upper-left light
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const mid = Math.atan2((p.y + q.y)/2 - y, (p.x + q.x)/2 - x);
    const lit = (Math.cos(mid - light) * 0.5 + 0.5); // 0..1 facing light
    const L = 30 + 45 * lit * (0.5 + 0.5 * quality);
    ctx.fillStyle = `hsl(${hue} 80% ${L}%)`;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(p.x, p.y); ctx.lineTo(q.x, q.y);
    ctx.closePath(); ctx.fill();
  }
  // bright table (center polygon) scaled by quality
  ctx.fillStyle = `hsl(${hue} 70% ${60 + 25*quality}%)`;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const tx = x + (p.x - x) * 0.45, ty = y + (p.y - y) * 0.45;
    i ? ctx.lineTo(tx, ty) : ctx.moveTo(tx, ty);
  });
  ctx.closePath(); ctx.fill();
}
```

- **Pros:** real gem-cut sparkle; the per-facet light term means rotating the gem
  (Option B/D) makes facets *flash* if you rotate `light` with `spin` — very
  magical. Seed gives each socket a unique cut.
- **Cons:** more draws; needs a hairline dark stroke around facets to avoid seams
  (anti-alias gaps); tuning to not look like a flat pie chart.
- **MVP verdict:** **the upgrade** if G1 feels too soft. Pairs beautifully with
  the rotating ring.

### Option G3 — Sparkle / star-glint overlay (the "brilliant" payoff)

A composited layer on top of G1/G2 that *is* the reward for dead-center
intonation. Four-point star glints (`+` shaped light streaks) plus an additive
bloom. Drive count/size/alpha by `quality`.

```ts
function drawSparkle(ctx, x, y, r, quality, time, rand) {
  if (quality < 0.4) return;                  // dull gems don't sparkle
  ctx.globalCompositeOperation = 'lighter';   // additive = glowy
  const count = Math.round(quality * 3);
  for (let k = 0; k < count; k++) {
    const tw = 0.5 + 0.5 * Math.sin(time * 3 + k * 2.1);  // twinkle
    const len = r * (0.5 + 0.6 * quality) * tw;
    const px = x + (rand() - 0.5) * r, py = y + (rand() - 0.5) * r;
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * tw})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px - len, py); ctx.lineTo(px + len, py);  // horizontal streak
    ctx.moveTo(px, py - len); ctx.lineTo(px, py + len);  // vertical streak
    ctx.stroke();
  }
  ctx.globalCompositeOperation = 'source-over';
}
```

> Reuse the seeded `rand` *with a fixed re-seed each frame* (e.g. seed from socket
> index) so sparkle positions are stable and only their twinkle animates — random
> per-frame positions look like noise.

- **Pros:** this is the dopamine. Cheap, additive blend reads as light.
- **Cons:** overdo it and it's gaudy; gate hard on `quality`.
- **MVP verdict:** **ship it**, tuned so only near-perfect intonation truly
  blazes. This is the visible link between *playing in tune* and *pretty loot*.

### Option G4 — "Fire" / dispersion (the rainbow flash of a real cut stone)

Real diamonds split white light into a rainbow at facet edges — *dispersion*,
a.k.a. **fire**, the thing that makes a cut stone look alive (Sources). It's the
single biggest "this is a precious jewel, not a coloured circle" cue, and it's
the perfect reward to reserve for **dead-center intonation**. Fake it two ways:

- **Chromatic edge split (cheapest):** when drawing the faceted outline (G2),
  stroke it three times in red / green / blue with a 1px sub-pixel offset each
  (classic chromatic-aberration trick). The facet seams shimmer with colour
  without a single gradient.

```ts
// only at high quality: rainbow fringe on facet edges
if (quality > 0.8) {
  const d = 0.8;                                   // tiny offset in px
  for (const [dx, dy, col] of [[-d,0,'rgba(255,0,0,.5)'],
                               [d,0,'rgba(0,255,0,.5)'],
                               [0,d,'rgba(0,80,255,.5)']]) {
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.save(); ctx.translate(dx, dy); strokeFacetEdges(ctx); ctx.restore();
  }
}
```

- **Rotating rainbow sweep:** lay a narrow conic/`hsl` rainbow gradient clipped to
  the gem, rotate its angle with `spin` (Option B) or `time`. As the gem turns, a
  band of spectrum sweeps across it — exactly how fire "moves" when you tilt a
  real stone. Keep alpha low (~0.25) and blend `'lighter'`.

```ts
// rainbow that sweeps as the stone turns — drop in over the gem, clipped to it
const grad = ctx.createConicGradient(spin, x, y);        // or fake with segments
for (let h = 0; h < 360; h += 60) grad.addColorStop(h/360, `hsl(${h} 100% 60%)`);
ctx.globalAlpha = 0.25; ctx.globalCompositeOperation = 'lighter';
ctx.fillStyle = grad; clipToGem(ctx, x, y, r); ctx.fill();
ctx.globalAlpha = 1;  ctx.globalCompositeOperation = 'source-over';
```

> **Scintillation** (the *blink* of individual facets as the view moves) is just
> G3 sparkle re-aimed at facet centroids instead of random points, flashing in
> sequence as `spin` changes. Brilliance = light *return* (the bright table in
> G2); fire = this rainbow; scintillation = the blinks. Those are literally the
> three things gemologists grade — hitting all three is what sells "real jewel."

- **Pros:** the strongest "wow, it's a real gem" signal; perfectly gated to
  reward perfect play; near-free if you already draw facets.
- **Cons:** garish if always-on or high-alpha — strictly a `quality > ~0.8`
  treat. Conic gradients need a segmented fallback on older Safari.
- **MVP verdict:** **stretch goal, high payoff.** If facets (G2) ship, add the
  chromatic edge split — it's ~8 lines and it's the money shot.

**Quality → visual summary**

| Intonation band      | quality | Look                                                       |
|----------------------|---------|------------------------------------------------------------|
| wide catch (±30–40¢) | ~0.15   | desaturated cabochon, no highlight (cloudy ore-stone)      |
| getting closer       | 0.4–0.7 | saturated, soft hotspot, faint glints                      |
| near center          | 0.7–0.9 | bright core, crisp specular, full star sparkle             |
| dead center          | ~1.0    | + **fire** (rainbow edge/sweep) + scintillation blinks     |

> **Shipped (faceted gem) — the `polish` finish dial.** `drawShapedGem` in
> `necklace.ts` drives the whole "muddy → brilliant" read off one number,
> `gem.polish` (in the game = how in-tune the note was; rolled at random in the
> look-dev page, testable via the **Kiilto** control). It controls, with plain HSL
> math: **colour** (low polish desaturates toward grey + dims — `sat = 16 + 70·polish`);
> **bevel facets** (each a linear gradient from a dark inner edge to a light-facing
> rim that brightens with `polish`); **sanding edges** (the facet ridges are *additive
> white glints* gated by polish + light, **not** the old flat black seam lines — off
> on a dull stone, crisp on a polished one); a **grey cloud** haze over poorly-finished
> stones (denser at the rim, fades out as polish climbs); and a **glossy white table
> highlight** that only shines once polished. `quality` still adds brilliance/sparkle/
> fire on top. So one or two intonation-derived numbers (`polish`, `quality`) move the
> gem from cloudy-grey pebble to bright, well-sanded jewel.

---

## 4. Metal rendering — bronze / silver / gold that looks *forged*

Flat gold = `#FFD700` looks like plastic. Real metal reads via **anisotropic
banding** (sharp light/dark stripes from a brushed or curved surface) plus a
**bevel** (bright top edge, dark bottom edge). All doable with gradients in
vector/2D-context — no textures. This is the technique the gold-gradient research
points to: a multi-stop gradient (≈5 stops) + edge shading.

### The metal palette (3 stops each, light→mid→dark)

```ts
const METALS = {
  bronze: { hi: '#ffd9a0', mid: '#b87333', lo: '#5c3310', spec: '#fff2d6' },
  silver: { hi: '#ffffff', mid: '#b8c0c8', lo: '#5a626b', spec: '#ffffff' },
  gold:   { hi: '#fff6c0', mid: '#e6b422', lo: '#8a6310', spec: '#fffbe6' },
};
```

### Technique M1 — Banded linear gradient (the core metal look)

A single linear gradient with **non-even stops** creates the bright-band-then-
quick-falloff that the eye reads as a shiny curved surface. The trick is a *tight
bright band* surrounded by darker metal, not a smooth fade.

```ts
function metalGradient(ctx, x0, y0, x1, y1, m) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0.00, m.lo);
  g.addColorStop(0.35, m.mid);
  g.addColorStop(0.48, m.hi);   // sharp bright band...
  g.addColorStop(0.52, m.hi);
  g.addColorStop(0.65, m.mid);  // ...quick falloff = "shiny"
  g.addColorStop(1.00, m.lo);
  return g;
}
```

Apply across the chain band or socket bezel **perpendicular to the surface's
length** so the bright band runs along it like a reflection.

### Technique M2 — Bevel via double edge stroke (cheap depth)

Stroke the socket rim twice: a bright stroke offset up-left, a dark stroke offset
down-right. Instant raised-metal bezel.

```ts
function drawBezel(ctx, x, y, r, m) {
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.strokeStyle = m.hi;                          // top-left catch
  ctx.beginPath(); ctx.arc(x - 0.6, y - 0.6, r, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = m.lo;                          // bottom-right shadow
  ctx.beginPath(); ctx.arc(x + 0.6, y + 0.6, r, 0, Math.PI); ctx.stroke();
  // mid-tone full ring underneath both for body
}
```

### Technique M3 — Roving specular streak (animated sheen)

A small white radial blob that slides along the metal as the necklace rotates
(`spin` from Option B) — the highlight that "travels" across real metal when you
turn it. Strong premium feel for almost no cost.

```ts
// place a soft specular dot whose position tracks the rotation phase
const sx = x + Math.cos(spin * 1.3) * r * 0.5;
const sy = y - r * 0.4;
const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 0.5);
sg.addColorStop(0, m.spec); sg.addColorStop(1, 'rgba(255,255,255,0)');
ctx.globalCompositeOperation = 'lighter';
ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
ctx.globalCompositeOperation = 'source-over';
```

### Technique M4 — Engraving / filigree on the metal (cheap craft detail)

A few dark hairline strokes + a parallel bright stroke offset 1px = incised
lines that read as engraving. Scrolling bézier S-curves around the bezel =
filigree; a ring of tiny dots = milgrain (the beaded edge real jewellers use).
This is what turns "a metal ring" into "a *crafted* metal ring." Gate by tier:
bronze plain, silver milgrain, gold full filigree — visually escalating reward.

### Gem settings — how the metal *holds* the stone (bezel / prong / channel)

Real settings are distinct silhouettes (jewellery Sources) and each is a cheap,
recognizable canvas recipe. The setting is the socket's personality:

| Setting     | Canvas recipe                                                      | Reads as          |
|-------------|--------------------------------------------------------------------|-------------------|
| **Bezel**   | full metal ring (M1+M2) wrapping the gem edge                      | safe, bold, modern|
| **Prong**   | 4–6 little metal claws (small rounded triangles) over the gem rim; gem shows between them — *lets more light through, sparkles more* | classic, sparkly  |
| **Channel** | two parallel metal rails; gems sit in the groove between them      | sleek, set-in-a-row|
| **Empty**   | just the engraved socket ring, dim — the "not yet mined" state     | a goal to fill    |

```ts
// prong setting: N claws gripping the gem rim (drawn after the gem, over its edge)
function drawProngs(ctx, x, y, r, m, n = 4) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 4;
    const cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r;
    ctx.fillStyle = m.hi;                       // bright metal claw catching light
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.16, 0, 7); ctx.fill();
    ctx.fillStyle = m.lo;                       // tiny shadow underside
    ctx.beginPath(); ctx.arc(cx + .5, cy + .8, r * 0.10, 0, 7); ctx.fill();
  }
}
```

> **Design payoff:** prong settings physically expose more gem → more sparkle, so
> they suit the *brilliant* gems; bezel suits cabochons (G1). You can even tie
> setting to the **phase**: the ore drops into an open prong cradle (claws splayed),
> and the descent/polish step is when the prongs *close* over the finished gem —
> a literal "set the stone" beat.

> **Tier meaning:** bronze/silver/gold are the **note-help tiers** from the game
> (Bronze = notes always shown, ships in MVP; Silver/Gold later). So MVP only
> needs **bronze** metal to look great — but build the `METALS` table now so
> Silver/Gold drop in free later. Brighter `hi`/`spec` + tighter bright band +
> escalating engraving (plain → milgrain → filigree) = more precious-looking as
> you climb tiers.

- **MVP verdict:** **M1 + M2 always; M3 if using the rotating ring.** Together
  they turn flat shapes into believable metal with three gradients and two
  strokes per socket.

---

## 5. The two phases — mining (up) vs. shaping (down)

The game's signature loop: **ascending picks raw material, descending sands it to
final form.** Graphics should make these feel like two distinct crafting stages
on the *same* socket.

### Phase 1 — Ascending = raw material drops in

Each in-tune held note spawns a **rough ore lump** in its socket: an irregular,
matte blob in the gem's hue, no facets, no shine. Procedural lump = a noisy
polygon (the seeded `rand` jitters each vertex radius).

```ts
function drawOre(ctx, x, y, r, hue, rand) {
  const n = 9;
  ctx.fillStyle = `hsl(${hue} 25% 38%)`;       // desaturated, dull
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.7 + rand() * 0.45);       // lumpy
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  // a couple of dull flecks so it reads as ore, not a shadow
}
```

A small **drop-in animation** (ore falls from above into the socket with a squash-
and-settle ease) marks the catch — satisfying without being twitchy.

### Phase 2 — Descending = sanding / form-giving reveals the gem

Coming back down the scale, each held note **morphs the ore into the finished
gem** (G1/G2): interpolate the lumpy polygon toward the smooth/faceted outline,
fade desaturation → full hue, and ramp `quality` toward its final (intonation-
based) value. Visually it's the rough rock being ground and polished.

```ts
// morph 0..1: lerp each vertex radius from lumpy ore → clean gem radius,
// and crossfade ore fill → gem gradient. Drive `morph` by hold progress.
const rr = oreR[i] * (1 - morph) + gemR * morph;
// fill: draw ore at alpha (1-morph) then gem at alpha morph on top
```

Optional flourish: **sanding sparks** — a few short bright particles flick off the
gem edge during the morph (reuse the §3 sparkle generator in a warm hue). The gem
"wakes up": dull → glowing as it's shaped.

- **Why this is good:** it gives the violin scale's *descent* a real purpose
  (the game's core insight) and makes the second pass visually richer than the
  first, rewarding the full up-and-down practice.
- **State to store:** per socket `{ seed, oreSet: bool, polished: 0..1, quality }`.
  Tiny. Everything else regenerates from these.

---

## 6. Themes (chosen at round start)

Theme = a palette + a motif overlay. **Pure cosmetics**; geometry/logic unchanged.
Pick at the "what shall we forge today?" screen before mining.

| Theme            | Gem hues            | Metal default | Backdrop / motif                          |
|------------------|---------------------|---------------|-------------------------------------------|
| **Starforge**    | cyan, violet, white | silver        | deep navy, drifting stars, constellation lines between set gems |
| **Dragonhoard**  | red, amber, green   | gold          | warm cave glow, faint ember particles     |
| **Moongarden**   | teal, pink, lilac   | bronze→silver | soft night-garden, fireflies              |
| **Runeforge**    | orange, blue, jade  | bronze        | dark stone, glowing rune etched on metal  |

Implementation: a `THEME[id]` object feeding `hue` per socket (cycle the theme's
hue list across the scale degrees) and `metal`. Motif is one extra cheap layer
(e.g. a starfield is N seeded dots with twinkle; constellation lines are strokes
between *set* sockets — a lovely "your progress connects the stars" read).

**Palette principle — "dark base + luminous glow."** The single most reliable way
to read as *magical* is a near-black / midnight-navy / charcoal backdrop with a
few luminous accent hues popping off it (cyan, magenta, violet, gold) — the
deep base makes the gems and sparkles act as actual light sources (palette
research in Sources). Every theme above keeps a dark anchor for exactly this. For
a softer "whimsy" variant, airy pastels work *only if* one dark anchor colour
stays in the frame, or it washes out.

**Clarity & kid-appeal rules (from match-3 / kids-UI research):**
- **Bold, high-contrast colours** for the gems; young kids prefer saturated and
  clearly-distinct hues. Make sure adjacent sockets' hues are easy to tell apart.
- **The active socket must be the visually loudest thing** — bigger, brighter,
  haloed. Make interactive/important elements larger with a glow/contour so the
  eye goes straight there (standard kids-UI guidance).
- **Background motif stays low-contrast** so it never competes with the gems.
- Check the palette for colour-blind separation; don't rely on hue alone to tell
  notes apart (shape or position helps — see the open question on per-degree
  shapes).

Gender-neutral by construction: glowing magic loot + cosmic/forge themes, no
gendered framing. The "dark + luminous treasure" look tests well across boys and
girls precisely because it reads as *power/wonder*, not *pretty/cute*. The kid
picks the vibe.

---

## 7. Animation & integration model

- **One `requestAnimationFrame` loop** in `NecklaceCanvas.tsx`. Each frame: clear,
  apply DPR transform, draw backdrop → chain (back) → gems (depth-sorted) →
  chain (front) → active-socket glow → sparkle/sheen overlays.
- **State lives in Zustand** (`necklaceStore`, persist middleware like the others):
  per-socket `{seed, oreSet, polished, quality}`, `phase` (up/down), `activeIndex`,
  `themeId`. The render reads a snapshot; pitch events mutate the store.
- **Pitch coupling** (reuse `useMicPitch` / detector from `audio-architecture.md`):
  while the played pitch is within the catch band of the active note, advance a
  `holdProgress` 0→1 over ~1 s; the socket glow warms as `holdProgress` rises
  (the game "roots for them"). On completion, set ore (phase up) or bump `polished`
  (phase down). `quality` = `f(centsError)` sampled at the moment of completion.
- **Springs, not linear tweens**, for camera/spin/scale so nothing snaps. Target =
  active socket; ease ~0.1–0.15 per frame.
- **Reduced-motion:** honour `prefers-reduced-motion` → fall back to Option A
  (static arc), kill the travelling wave and roving sheen, keep gem/metal shading.

### Performance budget (8 sockets, mid phone)

| Work / frame              | Approx cost            | Note                                  |
|---------------------------|------------------------|---------------------------------------|
| 8 gems (G1 + bezel)       | ~3 gradients × 8       | cheap                                 |
| sparkle (only set+good)   | ≤ ~6 strokes each      | gated by quality                      |
| chain strokes (2 passes)  | 2 paths                | trivial                               |
| backdrop starfield        | N dots, prebuilt path  | draw to an offscreen layer, blit      |

Everything is vector/gradient/stroke — well within 60 fps. The one rule:
**don't `createRadialGradient` for an unchanging gem every frame** — cache the
gradient (or render a settled gem to an offscreen canvas and only redraw when its
state changes / it's the animating active one).

---

## 8. Juice & game feel — the "consequences bigger than expected" payoff

Match-3 and casual-jewel games live on **juice**: feedback that feels bigger than
the input (Sources). Our input is *holding a note in tune* — a quiet, sustained
act — so the payoff at the **moment a gem sets** is where all the juice should
land. None of this is per-frame expensive; it's a short burst on one event.

- **Bloom via `shadowBlur` (canvas-native glow).** Set `ctx.shadowBlur` +
  `shadowColor` to the gem hue while drawing the gem/sparkle and it haloes for
  free — no blur passes. Pulse `shadowBlur` up on set, decay over ~400 ms.

```ts
// on gem-set: bloom that swells then settles (call each frame during the burst)
ctx.save();
ctx.shadowColor = `hsl(${hue} 100% 70%)`;
ctx.shadowBlur  = 4 + 24 * burstEnv;   // burstEnv: 1→0 ease over ~0.4s
drawGem(ctx, x, y, r, hue, quality);
ctx.restore();
```

- **Set-burst particle ring.** On set, fire 6–10 short-lived motes outward from
  the gem (additive, fade + gravity). Tie count/brightness to `quality` — a
  perfect note *erupts*; a sloppy one gives a polite puff. This is the single most
  important "did something good just happen?" cue.
- **Micro screen-shake (use sparingly).** A 2–3 px decaying translate on a
  *perfect* set only. Subtle; never on ordinary sets — the phone is on a stand and
  the player can't tap, so big shake reads as "error," not reward. Honour
  `prefers-reduced-motion` (skip entirely).
- **Chromatic-aberration flash.** On the *necklace-complete* beat, redraw the
  whole scene 1–2 px R/B split for ~150 ms — a cheap "camera-flash of magic"
  reusing the §G4 trick at full scene scale.
- **Anticipation + overshoot easing.** Gems pop in with a tiny `back`/elastic
  ease (scale 0 → 1.15 → 1.0). The overshoot is what makes it feel *alive*; linear
  scale feels dead. Reserve the camera/spin springs (no overshoot) for navigation
  so guidance stays calm while *rewards* bounce.
- **Cascade the polish pass.** On the descent, when several gems polish in a row,
  stagger their bloom/sparkle by ~80 ms so it ripples down the necklace like a
  combo cascade — turns "playing the scale down" into a satisfying chain reaction.

> **The juice budget rule:** calm during the *hold* (only the warming
> getting-closer glow), explosive at the *set*. Quiet → bang → quiet. That
> contrast is what makes each in-tune note feel earned.

---

## 9. Recommended MVP combination (one opinionated pick)

If the designer just wants a default to start from:

1. **Layout/motion:** Option **B** rotating pseudo-3D ring + Option **D** coin-flip
   on gem-set. (Reduced-motion / time-crunch fallback: Option **A** arc.)
2. **Gems:** **G1** cabochon base + **G3** sparkle overlay gated on intonation.
   (Upgrade path to **G2** facets later — they shine extra under the ring's
   rotating light — with the **G4** chromatic edge-split reserved for perfect
   notes as the "fire" money shot.)
3. **Metal:** **M1** banded gradient + **M2** bevel, plus **M3** roving sheen
   because we're already rotating. **Bezel** setting for MVP (simplest), with the
   prong "claws close on the stone" beat as a stretch. Bronze only for MVP; the
   `METALS` table + escalating engraving (M4) are ready for silver/gold.
4. **Phases:** ore lump (up) → polish-morph + sanding sparks (down), exactly as §5.
5. **Juice:** `shadowBlur` bloom + a small additive particle burst on set, scaled
   by `quality`; cascade the descent polish. Calm-hold → bang-on-set (§8).
6. **Themes:** ship **Starforge** + **Dragonhoard** at launch (constellation motif
   is the standout); dark-base + luminous-glow palette; others later.

This is all pure-2D-context, asset-free, seedable, and ties every visual flourish
directly to *how well the kid plays* — which is the whole point.

---

## 10. Open questions for the designer

- **Ring vs. arc as the hero shape** — does the rotating ring stay readable with 8
  small sockets on a phone, or is the calmer arc actually nicer to play against?
  (Build a quick spike of both at `#/test/necklace`.)
- **How "cut" should gems look** — soft magical cabochons (G1) or sharp cut jewels
  (G2)? Affects how precious vs. how playful it feels.
- **How loud is sparkle at perfect intonation** — find the line between
  "rewarding" and "gaudy" with the real 8-year-old.
- **Number of launch themes** — two strong ones, or four lighter ones?
- **Does the descent morph need to be per-note, or one big "polish sweep"** at the
  bottom? Per-note ties to practice better but is more animation work.
- **Distinct shape per scale degree?** Match-3 games rely on instant
  shape+colour recognition. Should each of the 7 notes get its own gem cut
  (round / oval / teardrop / marquise), so the kid reads the necklace as "notes"
  at a glance — or does one shape per necklace look more like real jewellery?
- **Setting style as theme flavour or fixed?** Bezel everywhere (simplest), or
  let each theme bring its own (prong for Starforge sparkle, filigree-bezel for
  Moongarden)?
- **How much fire at perfect intonation** — is the rainbow flash a delight or a
  distraction for an 8-year-old mid-scale? Test on the real kid.

---

## 11. Reuses / dependencies

- Canvas conventions, DPR sizing, `computeLayout` pattern: `architecture.md`.
- Pitch detection, catch band, A=442: `audio-architecture.md`,
  `tuner-pitch-detection.md`.
- Game design, intonation→quality dial, phases, tiers: `game-gems-draft.md`.
- Pelican wear/celebrate animations for the finished necklace: `animations.md`.
- Scale/key progression (one necklace per scale): `scale-practice-method.md`.

## Sources (technique research)

- [MDN — createRadialGradient()](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/createRadialGradient)
- [HTML5 Canvas Radial Gradient Tutorial](https://www.html5canvastutorials.com/tutorials/html5-canvas-radial-gradients/)
- [Mamboleoo — How to render 3D in 2D canvas](https://www.mamboleoo.be/articles/how-to-render-3d-in-2d-canvas)
- [Charles Petzold — Rudimentary 3D on the 2D HTML Canvas](https://www.charlespetzold.com/blog/2024/09/Rudimentary-3D-on-the-2D-HTML-Canvas.html)
- [MDN rotate() method](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate)
- [Logos By Nick — Gold effect (layered gradients + bevel)](https://logosbynick.com/inkscape-gold-effect/)
- [Metallic SVG Gradients (CodePen)](https://codepen.io/natacoops/pen/xLxQVj)
- [MDN — Gradients in SVG](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Gradients)
- [All Diamond — The science of shine: lustre, brilliance, dispersion, scintillation](https://alldiamond.com/a/blog/the-beauty-of-gemstones-the-science-of-shine-and-sparkle)
- [Beyond4Cs — What is diamond fire (dispersion)](https://beyond4cs.com/grading/what-is-diamond-fire/)
- [The Gemology Project — Dispersion](https://gemologyproject.com/wiki/index.php?title=Dispersion)
- [Bootcamp / Medium — Design analysis of match-3 games (clarity, juice, cascades)](https://medium.com/design-bootcamp/design-analysis-of-match-3-games-fb63879ecd8f)
- [Unity — Gem Hunter Match: lighting & visual effects in a match-3 sample](https://unity.com/blog/engine-platform/2d-puzzle-match-3-sample-gem-hunter-match)
- [MDN — HTML canvas shadowBlur (native glow/bloom)](https://www.w3schools.com/tags/canvas_shadowblur.asp)
- [Feel — Screen shakes & game-feel patterns](https://feel-docs.moremountains.com/screen-shakes.html)
- [Angara — Types of necklace & pendant settings (bezel / prong / channel)](https://www.angara.com/blog/necklace-and-pendant-settings/)
- [Market Square Jewelers — The big guide to chain types](https://www.marketsquarejewelers.com/blogs/msj-handbook/the-big-guide-to-chain-types)
- [Kongregate — Color in video games: choosing a palette (dark base + luminous)](https://blog.kongregate.com/color-in-video-games-how-to-choose-a-palette/)
- [UXmatters — Effective use of color & graphics in apps for children](https://www.uxmatters.com/mt/archives/2011/10/effective-use-of-color-and-graphics-in-applications-for-children-part-i-toddlers-and-preschoolers.php)
