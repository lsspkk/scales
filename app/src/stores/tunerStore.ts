import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TunerSettings } from '../lib/audio/tuner.ts'

/**
 * Production tuner preference (Task 31). The user-facing surface is a single
 * 3-step "Mittausnopeus" slider; this store persists that step and nothing else.
 * The four raw detection knobs stay on the hidden test pages — players never
 * see them. See docs/virittaminen.md for the mapping and docs/tuner-pitch-detection.md
 * for the rationale.
 */

export const CALMNESS_MIN = 1
export const CALMNESS_MAX = 3
// Step 2 = the measured sweet spot (smoothing 5 / confirm 4).
export const DEFAULT_CALMNESS = 2

// step → [smoothingFrames, confirmFrames]. Step 1 = fast/responsive (smoothing ≈ off),
// step 2 = the measured defaults, step 3 = slow/steady. The slider drives ONLY the
// smoothing stage; gating is pinned permissive at every step.
const CALMNESS_FRAMES: Record<number, [smoothing: number, confirm: number]> = {
  1: [1, 1],
  2: [5, 4],
  3: [12, 7],
}

const clampStep = (step: number) => Math.min(CALMNESS_MAX, Math.max(CALMNESS_MIN, Math.round(step)))

/**
 * Map the 3-step Mittausnopeus slider to a full TunerSettings. Gating is held
 * permissive at every step — `sensitivity` pinned max and `clarityThreshold`
 * locked at 0.5 (measured best) — so a higher step is only calmer, never pickier.
 * Rationale: docs/virittaminen.md, docs/tuner-pitch-detection.md.
 */
export function calmnessToSettings(calmness: number): TunerSettings {
  const [smoothingFrames, confirmFrames] = CALMNESS_FRAMES[clampStep(calmness)]
  return {
    sensitivity: 1, // pinned max — the volume floor was never the thing that helped
    clarityThreshold: 0.5, // locked permissive (measured best); the slider means "how calm", not "how picky"
    filterEnabled: true,
    smoothingFrames,
    confirmFrames,
  }
}

interface TunerStoreState {
  /** Chosen speed step, 1 (Nopea/fast) .. 3 (Hidas/steady). */
  calmness: number
  setCalmness: (step: number) => void
  /** Restore the default calmness step. */
  reset: () => void
}

export const useTunerStore = create<TunerStoreState>()(
  persist(
    (set) => ({
      calmness: DEFAULT_CALMNESS,
      setCalmness: (step) => set({ calmness: clampStep(step) }),
      reset: () => set({ calmness: DEFAULT_CALMNESS }),
    }),
    {
      name: 'tuner-store',
      partialize: (s) => ({ calmness: s.calmness }),
    },
  ),
)
