import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_CLARITY_THRESHOLD } from '../lib/audio/tuner.ts'
import type { TunerSettings } from '../lib/audio/tuner.ts'

/**
 * Production tuner preference (Task 29). The user-facing surface is a single
 * 5-step "calmness" slider; this store persists that step and nothing else.
 * The four raw detection knobs stay on the hidden test pages — players never
 * see them. See docs/tuner-pitch-detection.md, "Production filter — one
 * calmness slider, permissive gating".
 */

export const CALMNESS_MIN = 1
export const CALMNESS_MAX = 5
// Step 3 ≈ the Task 28 stability defaults: noticeably calmer than raw, still responsive.
export const DEFAULT_CALMNESS = 3

// step → [smoothingFrames, confirmFrames]. Step 1 = raw/fast (smoothing ≈ off),
// step 3 = the Task 28 defaults (12 / 4), step 5 = very calm/steady. The slider
// drives ONLY the smoothing stage; gating is pinned permissive at every step.
const CALMNESS_FRAMES: Record<number, [smoothing: number, confirm: number]> = {
  1: [1, 1],
  2: [6, 2],
  3: [12, 4],
  4: [18, 6],
  5: [24, 8],
}

const clampStep = (step: number) => Math.min(CALMNESS_MAX, Math.max(CALMNESS_MIN, Math.round(step)))

/**
 * Map the 5-step calmness slider to a full TunerSettings. Gating is held
 * permissive at every step — `sensitivity` pinned max (hear quiet notes) and
 * `clarityThreshold` locked low (~0.6) — so a higher step is only calmer, never
 * pickier. The worst case is a slightly jumpy-but-accurate needle, never a dead
 * one. Rationale: docs/tuner-pitch-detection.md.
 */
export function calmnessToSettings(calmness: number): TunerSettings {
  const [smoothingFrames, confirmFrames] = CALMNESS_FRAMES[clampStep(calmness)]
  return {
    sensitivity: 1, // pinned max — the volume floor was never the thing that helped
    clarityThreshold: DEFAULT_CLARITY_THRESHOLD, // locked permissive; the slider means "how calm", not "how picky"
    filterEnabled: true,
    smoothingFrames,
    confirmFrames,
  }
}

interface TunerStoreState {
  /** Chosen calmness step, 1 (raw/fast) .. 5 (very calm). */
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
