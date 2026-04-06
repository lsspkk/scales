import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type ScaleEntry, getScalesForLevel, shuffleScales } from '../lib/practiceMethod'

interface PracticeItem {
  scale: ScaleEntry
  done: boolean
}

interface PracticeState {
  selectedLevel: number
  practiceSet: PracticeItem[]
  active: boolean
  sessionStartedAt: string | null
  setSelectedLevel: (level: number) => void
  generatePracticeSet: () => void
  toggleDone: (index: number) => void
  resetProgress: () => void
  reshuffleSet: () => void
  clearSession: () => void
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set, get) => ({
      selectedLevel: 1,
      practiceSet: [],
      active: false,
      sessionStartedAt: null,

      setSelectedLevel: (level) => set({ selectedLevel: level }),

      generatePracticeSet: () => {
        const { selectedLevel } = get()
        const scales = shuffleScales(getScalesForLevel(selectedLevel))
        set({
          practiceSet: scales.map((scale) => ({ scale, done: false })),
          active: true,
          sessionStartedAt: new Date().toISOString(),
        })
      },

      toggleDone: (index) => {
        const { practiceSet } = get()
        const updated = practiceSet.map((item, i) => (i === index ? { ...item, done: !item.done } : item))
        set({ practiceSet: updated })
      },

      resetProgress: () => {
        const { practiceSet } = get()
        set({ practiceSet: practiceSet.map((item) => ({ ...item, done: false })) })
      },

      reshuffleSet: () => {
        const { practiceSet } = get()
        const scales = shuffleScales(practiceSet.map((item) => item.scale))
        set({ practiceSet: scales.map((scale) => ({ scale, done: false })) })
      },

      clearSession: () => {
        set({
          practiceSet: [],
          active: false,
          sessionStartedAt: null,
        })
      },
    }),
    {
      name: 'practice-store',
      partialize: (s) => ({
        selectedLevel: s.selectedLevel,
        practiceSet: s.practiceSet,
        active: s.active,
        sessionStartedAt: s.sessionStartedAt,
      }),
    },
  ),
)
