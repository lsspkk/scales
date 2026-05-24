# Tuner: should pitch detection run off the main thread?

A focused look at whether moving the tuner's pitch detection to a **Web Worker** or an
**AudioWorklet** would help — especially on modern mobile phones. Companion to
`docs/tuner-pitch-detection.md` (which picks the algorithm/library); this doc is only
about *where the computation runs*.

**TL;DR: not worth it yet.** The detection is sub-millisecond per frame, so it isn't what
would make a phone stutter. If profiling on a real low-end phone ever shows dropped
frames, the right move is an **AudioWorklet**, *not* a plain Web Worker. Reasoning below.

---

## First: how expensive is the detection, really?

You only offload work that's actually heavy. This work isn't.

- Current YIN (`pitchDetect.ts`) at `fftSize` 2048, violin range: the difference loop is
  ~`266 × ~1064` ≈ **0.28 M** multiply-adds per frame.
- `pitchy` (MPM) does the autocorrelation via FFT — **O(n·log n)**, even cheaper.

Either way that's **well under 1 ms per frame** on any phone made in the last several
years. At 60 fps you have a ~16.7 ms budget; the pitch math uses a few percent of it. The
thing that can actually make a mobile tuner stutter is **React re-renders + redrawing the
dial/canvas on the main thread**, not the DSP. Offloading sub-millisecond math to dodge a
rendering problem fixes the wrong thread.

So before considering any worker, the cheap wins (most already in place) are:

- Throttle React state updates — `useMicPitch` already emits at ~50 ms (20 Hz), not every
  frame. Good; keep it.
- Draw the dial on a `<canvas>` driven by the rAF loop, decoupled from React state, so
  needle movement never triggers a component re-render.

---

## Web Worker vs AudioWorklet — they are not interchangeable here

The deciding fact: **`AnalyserNode.getFloatTimeDomainData()` can only be called on the
main thread.** That single constraint settles the choice.

**Web Worker — the wrong tool for this.**
A worker can't read the analyser itself. You'd still poll on the main thread, then
`postMessage` a copy of each ~2048-sample buffer to the worker, run a <1 ms computation,
and message a result back. The copy + structured-clone/IPC overhead is on the same order
as — or larger than — the work you offloaded. You add latency and complexity to save
nothing. (Zero-copy via `SharedArrayBuffer` would help, but it needs COOP/COEP
cross-origin-isolation headers, which our **Azure Static Storage** deployment can't
readily set — so SAB is effectively off the table here anyway.)

**AudioWorklet — the architecturally correct offload, if you ever need one.**
An `AudioWorkletProcessor` runs on the high-priority **audio render thread**. It receives
the raw samples directly (128-sample render quanta) — no `AnalyserNode`, no main-thread
poll, no rAF. You accumulate quanta into a ring buffer, run the detector when you have a
full window, and post only the tiny `{hz, clarity}` result to the main thread for display.
This decouples the DSP from both the UI thread *and* rAF jitter. Supported on current
mobile browsers (iOS Safari 14.5+, Android Chrome).

| | Web Worker | AudioWorklet |
|---|---|---|
| Gets audio directly | No — needs main-thread analyser read + copy | **Yes** (render quanta) |
| Decouples from rAF timing | No (still polled on main thread) | **Yes** (audio-thread driven) |
| Overhead vs the <1 ms work | copy + IPC per frame — net loss | minimal; results are tiny messages |
| Complexity | medium | medium-high (ring buffer + bundling) |
| Verdict here | ❌ don't | ✅ the one to use *if* offloading |

---

## Does mobile change the answer?

Not enough to flip it. Modern phones run this DSP at 60 fps without breaking a sweat. The
genuine mobile risk is that the **main thread gets busy** (React work, layout, GC), which
delays the rAF callback and makes the analyser read irregular. Note that a Web Worker does
**not** fix this — the read is still gated by the main thread. Only the AudioWorklet path
escapes it, because the audio thread drives detection regardless of UI load. That's the
*only* mobile-specific reason to reach for AudioWorklet — and only if you measure the
problem first.

---

## Recommendation

1. **Ship the simple thing:** detection in the rAF loop on the main thread with `pitchy`.
   Keep the ~50 ms state throttle; draw the dial on canvas from the rAF loop, not via
   React state.
2. **Profile on a real low-end phone** (Chrome DevTools remote / Safari Web Inspector).
   If frames hold at 60 fps — and they should — stop here.
3. **Only if you measure dropped frames**, move detection to an **AudioWorklet**. Skip the
   Web Worker option entirely for this use case.

---

## Minimal AudioWorklet sketch (only if step 3 happens)

Just enough to show the shape; not production code.

```ts
// pitch-processor.ts — bundled into its own worklet entry (Vite separate build),
// with `pitchy` bundled in (the worklet scope has no module import at runtime).
import { PitchDetector } from 'pitchy'

class PitchProcessor extends AudioWorkletProcessor {
  private buf = new Float32Array(2048)
  private filled = 0
  private detector = PitchDetector.forFloat32Array(2048)

  process(inputs: Float32Array[][]) {
    const ch = inputs[0]?.[0]
    if (!ch) return true
    // accumulate 128-sample quanta into a 2048 window
    for (let i = 0; i < ch.length; i++) {
      this.buf[this.filled++] = ch[i]
      if (this.filled === this.buf.length) {
        const [hz, clarity] = this.detector.findPitch(this.buf, sampleRate)
        this.port.postMessage({ hz, clarity }) // tiny message → main thread
        this.filled = 0
      }
    }
    return true
  }
}
registerProcessor('pitch-processor', PitchProcessor)
```

```ts
// main thread: wire it up, then just listen for results
await ctx.audioWorklet.addModule(pitchProcessorUrl)
const node = new AudioWorkletNode(ctx, 'pitch-processor')
source.connect(node) // mic → worklet (no AnalyserNode needed)
node.port.onmessage = (e) => updateDial(e.data.hz, e.data.clarity)
```

The window-vs-quantum accumulation means detection runs ~every 43 ms (2048 / 48 kHz),
which is plenty for a tuner and naturally throttles the result messages.

### Sources

- MDN, *Background audio processing using AudioWorklet* — https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet
- Chrome for Developers, *Audio Worklet design pattern* (ring buffer, SAB, messaging cost) — https://developer.chrome.com/blog/audio-worklet-design-pattern/
- Mozilla Hacks, *High Performance Web Audio with AudioWorklet in Firefox* — https://hacks.mozilla.org/2020/05/high-performance-web-audio-with-audioworklet-in-firefox/
