import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MusicState {
  key: string
  mode: string
  setKey: (key: string) => void
  setMode: (mode: string) => void
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      key: 'C',
      mode: 'ionian (Duuri)',
      setKey: (key) => set({ key }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'music-store',
    }
  )
)
