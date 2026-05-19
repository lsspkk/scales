import { getSample } from './samples.ts'

/**
 * Polyphonic sample-based audio service.
 *
 * Owns a single lazy AudioContext + a sample-buffer cache keyed by sample
 * id. Plays N pitch-shifted voices from the cached AudioBuffer via N
 * AudioBufferSourceNodes routed through per-voice gain nodes for
 * attack/release envelopes.
 *
 * No React inside the service. A thin `useAudio` hook wraps it in
 * `src/hooks/useAudio.ts` for components.
 */

const ATTACK_SECONDS = 0.04
const RELEASE_SECONDS = 0.25
const VOICE_GAIN = 0.25 // headroom: 4 voices × 0.25 = unity peak before saturation.

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let masterVolume = 1
const bufferCache = new Map<string, AudioBuffer>()
const bufferPromises = new Map<string, Promise<AudioBuffer>>()

interface ActiveVoice {
  source: AudioBufferSourceNode
  gain: GainNode
}

let activeVoices: ActiveVoice[] = []

function getContext(): AudioContext {
  if (ctx === null) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
    masterGain = ctx.createGain()
    masterGain.gain.value = masterVolume
    masterGain.connect(ctx.destination)
  }
  return ctx
}

async function ensureBuffer(sampleId: string): Promise<AudioBuffer> {
  const cached = bufferCache.get(sampleId)
  if (cached) return cached
  const inFlight = bufferPromises.get(sampleId)
  if (inFlight) return inFlight

  const sample = getSample(sampleId)
  if (!sample) throw new Error(`Unknown sampleId: ${sampleId}`)

  const audioCtx = getContext()
  const promise = fetch(sample.src)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to fetch ${sample.src}: ${res.status}`)
      return res.arrayBuffer()
    })
    .then((arr) => audioCtx.decodeAudioData(arr))
    .then((buf) => {
      bufferCache.set(sampleId, buf)
      bufferPromises.delete(sampleId)
      return buf
    })
  bufferPromises.set(sampleId, promise)
  return promise
}

export interface PlayChordOptions {
  sampleId: string
  /** Chord root as a MIDI number (e.g. 60 = C4). */
  rootMidi: number
  /** Semitone offsets from the root for each voice. */
  intervals: readonly number[]
  /** When true, each voice loops the buffer indefinitely. Stops via `stopAll`. */
  loop?: boolean
}

/**
 * Stop everything currently sounding and start the given chord. Returns once
 * the new voices are scheduled (decoding may still be in flight on first call).
 *
 * `loop: true` plays each voice via `AudioBufferSourceNode.loop = true`. The
 * buffer's natural length is the loop period (v1 — no crossfade). Stop via
 * `stopAll`.
 */
export async function playChord({ sampleId, rootMidi, intervals, loop }: PlayChordOptions): Promise<void> {
  const audioCtx = getContext()
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume()
  }

  const buffer = await ensureBuffer(sampleId)
  const sample = getSample(sampleId)
  if (!sample) return

  stopAll()

  const now = audioCtx.currentTime
  const newVoices: ActiveVoice[] = []
  for (const interval of intervals) {
    const targetMidi = rootMidi + interval
    const semitoneOffset = targetMidi - sample.rootMidi
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.loop = loop === true
    // `detune` is cents relative to playbackRate; 100 cents = 1 semitone.
    source.detune.value = semitoneOffset * 100

    const gain = audioCtx.createGain()
    gain.gain.value = 0
    gain.gain.linearRampToValueAtTime(VOICE_GAIN, now + ATTACK_SECONDS)
    source.connect(gain)
    gain.connect(masterGain!)
    source.start(now)
    newVoices.push({ source, gain })
  }
  activeVoices = newVoices
}

/**
 * Set the master output gain (0..1). Persisted across context creation, so
 * setting it before the first `playChord` is honoured when the context wakes.
 */
export function setMasterVolume(value: number): void {
  masterVolume = Math.max(0, Math.min(1, value))
  if (masterGain && ctx) {
    // Short ramp avoids zipper noise on continuous slider drag.
    const now = ctx.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setTargetAtTime(masterVolume, now, 0.02)
  }
}

/** Current master volume (0..1). */
export function getMasterVolume(): number {
  return masterVolume
}

/** Release all currently sounding voices with a short fade. */
export function stopAll(): void {
  if (!ctx || activeVoices.length === 0) return
  const now = ctx.currentTime
  const stopping = activeVoices
  activeVoices = []
  for (const voice of stopping) {
    try {
      voice.gain.gain.cancelScheduledValues(now)
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now)
      voice.gain.gain.linearRampToValueAtTime(0, now + RELEASE_SECONDS)
      voice.source.stop(now + RELEASE_SECONDS + 0.05)
    } catch {
      // source may already be stopped; ignore
    }
  }
}

/** Returns true when the AudioContext exists and is running (debug helper). */
export function isAudioReady(): boolean {
  return ctx !== null && ctx.state === 'running'
}
