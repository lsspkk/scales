import { useCallback, useEffect, useRef, useState } from 'react'
import { Tuner, TUNER_FFT_SIZE, DEFAULT_TUNER_SETTINGS } from '../lib/audio/tuner.ts'
import type { TunerReading, TunerSettings } from '../lib/audio/tuner.ts'

/**
 * Live microphone → pitch hook. Owns getUserMedia + the AudioContext/analyser
 * graph and the rAF loop; all detection settings, gating and the adaptive noise
 * floor live in the Tuner service. Settings update live via a ref (no restart).
 */
export interface MicPitchState extends TunerReading {
  listening: boolean
  error: string | null
}

const SILENT: MicPitchState = {
  hz: null,
  midi: null,
  noteName: null,
  cents: null,
  rawCents: null,
  clarity: 0,
  rms: 0,
  noiseFloor: 0,
  gate: 0,
  detected: false,
  held: false,
  listening: false,
  error: null,
}

export function useMicPitch(settings: Partial<TunerSettings> = {}) {
  const { sensitivity, clarityThreshold, filterEnabled, smoothingFrames, confirmFrames } = {
    ...DEFAULT_TUNER_SETTINGS,
    ...settings,
  }
  const [state, setState] = useState<MicPitchState>(SILENT)
  const ctxRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastEmitRef = useRef(0)
  // Bumped on every stop()/start(); an in-flight async start() compares against
  // it after each await and bails (releasing its stream) if it's been torn down
  // or superseded — so unmounting mid-permission-prompt can't leave the mic on.
  const sessionRef = useRef(0)
  const tunerRef = useRef<Tuner>(new Tuner())
  const settingsRef = useRef<TunerSettings>({ sensitivity, clarityThreshold, filterEnabled, smoothingFrames, confirmFrames })
  useEffect(() => {
    settingsRef.current = { sensitivity, clarityThreshold, filterEnabled, smoothingFrames, confirmFrames }
  }, [sensitivity, clarityThreshold, filterEnabled, smoothingFrames, confirmFrames])

  const stop = useCallback(() => {
    sessionRef.current++ // invalidate any start() still awaiting permission/resume
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
    setState(SILENT)
  }, [])

  const start = useCallback(async () => {
    if (streamRef.current) return
    const session = ++sessionRef.current
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
      // Unmounted or stopped while the permission prompt was open: don't go live,
      // just release the mic we were just granted.
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const ctx = new AudioContext()
      ctxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume()
      // Torn down during resume(): tear back down what we opened and stop.
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        void ctx.close()
        streamRef.current = null
        ctxRef.current = null
        return
      }

      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = TUNER_FFT_SIZE
      source.connect(analyser)
      const buf = new Float32Array(analyser.fftSize)

      tunerRef.current.reset()
      setState({ ...SILENT, listening: true })

      const tick = () => {
        analyser.getFloatTimeDomainData(buf)
        const reading = tunerRef.current.process(buf, ctx.sampleRate, settingsRef.current)
        const now = performance.now()
        if (now - lastEmitRef.current > 50) {
          lastEmitRef.current = now
          setState({ ...reading, listening: true, error: null })
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      streamRef.current = null
      setState({ ...SILENT, error: err instanceof Error ? err.message : 'Mikrofonin avaaminen epäonnistui' })
    }
  }, [])

  useEffect(() => () => stop(), [stop])

  // Release the mic the moment the page is backgrounded — switching apps or
  // locking the phone fires `visibilitychange` → hidden (the page is not
  // unmounted, so the unmount cleanup above won't run), and `pagehide` covers
  // tab close / bfcache. Coming back requires tapping start again, which is the
  // correct behaviour: the mic indicator must not linger while the app is away.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') stop()
    }
    document.addEventListener('visibilitychange', onHidden)
    window.addEventListener('pagehide', stop)
    return () => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', stop)
    }
  }, [stop])

  return { ...state, start, stop }
}
