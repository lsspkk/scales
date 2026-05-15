import { useEffect, useRef, useState } from 'react'

/**
 * Countdown timer hook with drift-free wall-clock ticking.
 * Updates `remainingMs` ~10× per second while running and fires
 * `onComplete` once when it reaches zero.
 */
export function useCountdownTimer(durationMs: number, onComplete?: () => void) {
  const [remainingMs, setRemainingMs] = useState(durationMs)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<number | null>(null)
  const startTimeRef = useRef(0)
  const initialRemainingRef = useRef(0)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (!isRunning) setRemainingMs(durationMs)
  }, [durationMs, isRunning])

  const clear = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const start = () => {
    if (isRunning || remainingMs <= 0) return
    startTimeRef.current = performance.now()
    initialRemainingRef.current = remainingMs
    setIsRunning(true)
    intervalRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current
      const next = Math.max(0, initialRemainingRef.current - elapsed)
      setRemainingMs(next)
      if (next === 0) {
        clear()
        setIsRunning(false)
        onCompleteRef.current?.()
      }
    }, 100)
  }

  const pause = () => {
    clear()
    setIsRunning(false)
  }

  const reset = () => {
    clear()
    setIsRunning(false)
    setRemainingMs(durationMs)
  }

  useEffect(() => () => clear(), [])

  return { remainingMs, isRunning, start, pause, reset }
}
