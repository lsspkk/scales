import { useCallback } from 'react'
import { playChord, stopAll, setMasterVolume, getMasterVolume } from '../lib/audio/audioService.ts'
import type { PlayChordOptions } from '../lib/audio/audioService.ts'

/**
 * Thin React wrapper around the audio service. The service itself is pure
 * (testable without React) — this hook just gives components stable
 * callbacks.
 */
export function useAudio() {
  const play = useCallback((options: PlayChordOptions) => {
    void playChord(options)
  }, [])

  const stop = useCallback(() => {
    stopAll()
  }, [])

  const setVolume = useCallback((value: number) => {
    setMasterVolume(value)
  }, [])

  return { play, stop, setVolume, getVolume: getMasterVolume }
}
