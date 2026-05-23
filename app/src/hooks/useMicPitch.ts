import { useCallback, useEffect, useRef, useState } from 'react'
import { detectPitch } from '../lib/audio/pitchDetect.ts'
import type { PitchResult } from '../lib/audio/pitchDetect.ts'

/**
 * Live microphone → pitch hook. The "mic glue" that the file-based
 * `detectPitch` was written to feed: getUserMedia → AnalyserNode → rAF loop
 * pulling the time-domain waveform → detectPitch.
 *
 * Cleanup filter (deliberately simple):
 *  - getUserMedia constraints turn OFF echoCancellation / noiseSuppression /
 *    autoGainControl — those "improve" speech but distort pitch and level.
 *  - an RMS noise gate skips quiet frames (room hiss, between notes).
 *  - a confidence gate drops YIN results that aren't a clear pitch.
 *  - cents is median-smoothed over the last few frames to kill jitter and the
 *    occasional octave-jump spike.
 */
export interface MicPitchState extends PitchResult {
  /** True while the mic is open and analysing. */
  listening: boolean
  /** Permission / setup error message, or null. */
  error: string | null
}

const SILENT: MicPitchState = {
  hz: null,
  midi: null,
  noteName: null,
  cents: null,
  confidence: 0,
  listening: false,
  error: null,
}

export interface UseMicPitchOptions {
  /** Drop frames below this YIN confidence. Default 0.9. */
  minConfidence?: number
  /** Drop frames quieter than this RMS (the noise gate). Default 0.01. */
  minRms?: number
  /** Lowest pitch to consider, Hz. Default 150 (below open-G ≈ 197 Hz). */
  minHz?: number
  /** Highest pitch to consider, Hz. Default 2500. */
  maxHz?: number
  /** Frames to median-smooth cents over. Default 5. */
  smoothing?: number
}

export function useMicPitch(options: UseMicPitchOptions = {}) {
  const { minConfidence = 0.9, minRms = 0.01, minHz = 150, maxHz = 2500, smoothing = 5 } = options
  const [state, setState] = useState<MicPitchState>(SILENT)
  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const historyRef = useRef<number[]>([])
  const lastEmitRef = useRef(0)

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
    historyRef.current = []
    setState(SILENT)
  }, [])

  const start = useCallback(async () => {
    if (streamRef.current) return // already listening
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      streamRef.current = stream
      const ctx = new AudioContext()
      ctxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume()

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      const buf = new Float32Array(analyser.fftSize)

      setState({ ...SILENT, listening: true })

      const tick = () => {
        analyser.getFloatTimeDomainData(buf)

        // Noise gate: RMS level of this window.
        let sumSq = 0
        for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i]
        const rms = Math.sqrt(sumSq / buf.length)
        const now = performance.now()

        if (rms >= minRms) {
          const result = detectPitch(buf, ctx.sampleRate, { minHz, maxHz })
          if (result.hz !== null && result.cents !== null && result.confidence >= minConfidence) {
            const hist = historyRef.current
            hist.push(result.cents)
            while (hist.length > smoothing) hist.shift()
            const sorted = [...hist].sort((a, b) => a - b)
            const cents = sorted[sorted.length >> 1]
            if (now - lastEmitRef.current > 40) {
              lastEmitRef.current = now
              setState({ ...result, cents, listening: true, error: null })
            }
            rafRef.current = requestAnimationFrame(tick)
            return
          }
        }

        // Silence or no confident pitch: clear the note but keep listening.
        historyRef.current = []
        if (now - lastEmitRef.current > 120) {
          lastEmitRef.current = now
          setState((s) => (s.hz === null ? s : { ...SILENT, listening: true }))
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      streamRef.current = null
      setState({ ...SILENT, error: err instanceof Error ? err.message : 'Mikrofonin avaaminen epäonnistui' })
    }
  }, [minConfidence, minRms, minHz, maxHz, smoothing])

  // Release the mic if the component unmounts mid-listen.
  useEffect(() => () => stop(), [stop])

  return { ...state, start, stop }
}
