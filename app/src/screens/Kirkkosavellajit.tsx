import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getKeyList, getModeList, getBaseModeKey,
  getModeDegree, getModeAlterations,
} from '../lib/musicScale'
import { useViewport } from '../lib/useViewport'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { Chip } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { MusicCanvas } from '../components/ui/MusicCanvas'
import { useMusicStore } from '../stores/musicStore'

export function Kirkkosavellajit() {
  const keys = getKeyList()
  const modes = getModeList()
  const { isDesktop } = useViewport()

  const currentKey = useMusicStore((s) => s.key)
  const currentMode = useMusicStore((s) => s.mode)
  const setCurrentKey = useMusicStore((s) => s.setKey)
  const setCurrentMode = useMusicStore((s) => s.setMode)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<{ key: string; mode: string } | null>(null)

  const openMenu = () => {
    setSnapshot({ key: currentKey, mode: currentMode })
    history.pushState({ mooditMenu: true }, '')
    setMenuOpen(true)
  }
  const confirmMenu = () => {
    setSnapshot(null)
    setMenuOpen(false)
    if (history.state?.mooditMenu) history.back()
  }
  const cancelMenu = () => {
    if (snapshot) {
      setCurrentKey(snapshot.key)
      setCurrentMode(snapshot.mode)
    }
    setSnapshot(null)
    setMenuOpen(false)
    if (history.state?.mooditMenu) history.back()
  }

  useEffect(() => {
    if (!menuOpen) return
    const handlePopState = () => {
      if (snapshot) {
        setCurrentKey(snapshot.key)
        setCurrentMode(snapshot.mode)
      }
      setSnapshot(null)
      setMenuOpen(false)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [menuOpen, snapshot, setCurrentKey, setCurrentMode])

  const selectKey = (key: string) => {
    setCurrentKey(key)
  }

  const selectMode = (mode: string) => {
    setCurrentMode(mode)
  }

  const prevNote = () => {
    const idx = keys.indexOf(currentKey)
    setCurrentKey(keys[(idx + 1) % keys.length])
  }
  const nextNote = () => {
    const idx = keys.indexOf(currentKey)
    setCurrentKey(keys[(idx - 1 + keys.length) % keys.length])
  }
  const prevMode = () => {
    const idx = modes.indexOf(currentMode)
    setCurrentMode(modes[(idx - 1 + modes.length) % modes.length])
  }
  const nextMode = () => {
    const idx = modes.indexOf(currentMode)
    setCurrentMode(modes[(idx + 1) % modes.length])
  }

  const randomKey = () => {
    setCurrentKey(keys[Math.floor(Math.random() * keys.length)])
    setMenuOpen(false)
  }
  const randomMode = () => {
    setCurrentMode(modes[Math.floor(Math.random() * modes.length)])
    setMenuOpen(false)
  }

  const degree = getModeDegree(currentMode)
  const alterations = getModeAlterations(currentMode)
  let alterationText = ''
  if (alterations) {
    if (alterations.raised.length > 0) alterationText = `Ylennetyt sävelet: ${alterations.raised.join(', ')}`
    else if (alterations.lowered.length > 0) alterationText = `Alennetut sävelet: ${alterations.lowered.join(', ')}`
  }

  const formattedMode = currentMode.charAt(0).toUpperCase() + currentMode.slice(1)

  // Shared selection panels (used in both mobile dropdown and desktop sidebar)
  const selectionPanels = (
    <>
      <SectionCard label="Alkusävel (♯):">
        <div className="flex flex-wrap gap-1.5">
          {['C','G','D','A','E','B','F#','C#'].map(k => (
            <Chip
              key={k}
              label={k === 'B' ? 'H' : k.replace('#', '♯')}
              active={currentKey === k}
              color="primary"
              onClick={() => selectKey(k)}
            />
          ))}
        </div>
      </SectionCard>
      <SectionCard label="Alkusävel (♭):">
        <div className="flex flex-wrap gap-1.5">
          {['F','Bb','Eb','Ab','Db'].map(k => (
            <Chip
              key={k}
              label={k.replace('b', '♭')}
              active={currentKey === k}
              color="primary"
              onClick={() => selectKey(k)}
            />
          ))}
        </div>
      </SectionCard>
      <SectionCard label="Moodi:">
        <div className="flex flex-wrap gap-1.5">
          {['ionian','dorian','phrygian','lydian','mixolydian','aeolian','locrian'].map(m => {
            const label = m === 'ionian' ? 'Ionian (Duuri)' : m === 'aeolian' ? 'Aeolian (Molli)' : m.charAt(0).toUpperCase() + m.slice(1)
            const modeValue = m === 'ionian' ? 'ionian (Duuri)' : m === 'aeolian' ? 'aeolian (Molli)' : m
            return (
              <Chip
                key={m}
                label={label}
                active={getBaseModeKey(currentMode) === m}
                color="secondary"
                onClick={() => selectMode(modeValue)}
              />
            )
          })}
        </div>
      </SectionCard>
    </>
  )

  const summaryBlock = (
    <div className={isDesktop ? 'mt-4' : ''}>
      <div className={`text-center font-semibold text-[#333] ${isDesktop ? 'text-base' : 'text-sm'}`}>{currentKey} • {formattedMode}</div>
      <div className="text-center text-xs text-[#666] italic">Alkusävel on duurin {degree}. sävel</div>
      {alterationText && <div className="text-center text-xs text-[#555] font-medium">{alterationText}</div>}
    </div>
  )

  if (isDesktop) {
    return (
      <div className="flex flex-col flex-1 min-h-0 bg-[#fffbe9]">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar — always-visible controls */}
          <div className="w-72 flex-shrink-0 overflow-y-auto p-4 flex flex-col gap-3 border-r border-[#e0d5c0]">
            <div className="flex gap-2">
              <Button variant="outlined" color="primary" size="sm" onClick={randomKey} className="flex-1">
                Arvo sävel
              </Button>
              <Button variant="outlined" color="secondary" size="sm" onClick={randomMode} className="flex-1">
                Arvo moodi
              </Button>
            </div>
            {selectionPanels}
            {summaryBlock}
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center bg-[#fff3c9] overflow-hidden p-4">
            <MusicCanvas
              scaleKey={currentKey}
              mode={currentMode}
              staves={2}
              className="w-full max-w-[1200px] aspect-[2/1]"
            />
          </div>
        </div>
      </div>
    )
  }

  // Mobile layout (unchanged)
  return (
    <div className="flex flex-col h-full bg-[#fffbe9] relative">
      <ScreenHeader title="Moodit" onBack={() => navigate('/')} />

      {/* Controls bar */}
      <div className="flex flex-col gap-1 px-3 pt-2 pb-1 flex-shrink-0">
        {/* Random + menu toggle */}
        <div className="flex gap-2">
          <Button variant="outlined" color="primary" size="sm" onClick={randomKey} className="flex-1">
            Arvo sävel
          </Button>
          <Button variant="outlined" color="secondary" size="sm" onClick={randomMode} className="flex-1">
            Arvo moodi
          </Button>
          <button
            onClick={openMenu}
            className="flex-1 min-h-[36px] px-3 rounded-lg border-2 border-[#8b6f47] text-[#8b6f47] bg-[#fff3c9] active:bg-[#f5ead5] flex items-center justify-center"
            aria-label="Valitse sävel ja moodi"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="4" y1="6" x2="14" y2="6" />
              <line x1="18" y1="6" x2="20" y2="6" />
              <circle cx="16" cy="6" r="2" fill="#fff3c9" />
              <line x1="4" y1="12" x2="6" y2="12" />
              <line x1="10" y1="12" x2="20" y2="12" />
              <circle cx="8" cy="12" r="2" fill="#fff3c9" />
              <line x1="4" y1="18" x2="14" y2="18" />
              <line x1="18" y1="18" x2="20" y2="18" />
              <circle cx="16" cy="18" r="2" fill="#fff3c9" />
            </svg>
          </button>
        </div>

        {/* Arrow navigation */}
        <div className="flex gap-2">
          <button onClick={prevNote} className="flex-1 py-2 rounded-lg border-2 border-[#8b6f47] text-[#8b6f47] bg-transparent active:bg-[#f5ead5] flex items-center justify-center" aria-label="Edellinen sävel">
            <svg width="50" height="26" viewBox="0 0 60 32" aria-hidden="true">
              <path d="M16 27V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 13l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <g transform="rotate(-15 44 25)"><ellipse cx="43" cy="27" rx="5" ry="3.2" fill="currentColor"/></g>
              <rect x="48.5" y="5" width="2" height="22" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <button onClick={nextNote} className="flex-1 py-2 rounded-lg border-2 border-[#8b6f47] text-[#8b6f47] bg-transparent active:bg-[#f5ead5] flex items-center justify-center" aria-label="Seuraava sävel">
            <svg width="50" height="26" viewBox="0 0 60 32" aria-hidden="true">
              <path d="M16 6v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 23l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <g transform="rotate(-15 44 25)"><ellipse cx="43" cy="27" rx="5" ry="3.2" fill="currentColor"/></g>
              <rect x="48.5" y="5" width="2" height="22" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <button onClick={prevMode} className="flex-1 py-2 rounded-lg border-2 border-[#a0563f] text-[#a0563f] bg-transparent active:bg-[#f5e5e0] flex items-center justify-center" aria-label="Edellinen moodi">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <polyline points="16,9 8,16 16,23" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <ellipse cx="20" cy="12" rx="2.2" ry="1.3" fill="currentColor"/>
              <ellipse cx="20" cy="16" rx="2.2" ry="1.3" fill="currentColor"/>
              <ellipse cx="20" cy="20" rx="2.2" ry="1.3" fill="currentColor"/>
            </svg>
          </button>
          <button onClick={nextMode} className="flex-1 py-2 rounded-lg border-2 border-[#a0563f] text-[#a0563f] bg-transparent active:bg-[#f5e5e0] flex items-center justify-center" aria-label="Seuraava moodi">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
              <polyline points="12,9 20,16 12,23" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <ellipse cx="8" cy="12" rx="2.2" ry="1.3" fill="currentColor"/>
              <ellipse cx="8" cy="16" rx="2.2" ry="1.3" fill="currentColor"/>
              <ellipse cx="8" cy="20" rx="2.2" ry="1.3" fill="currentColor"/>
            </svg>
          </button>
        </div>

        {/* Selection summary */}
        {summaryBlock}
      </div>

      {/* Fullscreen selection modal */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#fffbe9]">
          <div className="flex items-center justify-between px-2 min-h-[52px] bg-[#5a2d0c] flex-shrink-0">
            <h2 className="font-medieval text-lg text-white pl-2 truncate pr-2">Valitse sävel ja moodi</h2>
            <button
              onClick={cancelMenu}
              className="w-11 h-11 flex items-center justify-center text-white text-2xl shrink-0"
              aria-label="Sulje"
            >
              &#10005;
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {selectionPanels}
            {summaryBlock}
          </div>
          <div className="flex gap-2 px-3 py-3 border-t border-[#c9a96e] bg-[#fffbe9] flex-shrink-0">
            <button
              onClick={cancelMenu}
              className="flex-1 min-h-[44px] rounded-lg border-2 border-[#8b6f47] text-[#5a2d0c] bg-transparent active:bg-[#f5ead5] flex items-center justify-center gap-2 font-semibold"
              aria-label="Peruuta"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
              Peruuta
            </button>
            <button
              onClick={confirmMenu}
              className="flex-1 min-h-[44px] rounded-lg bg-[#5a2d0c] text-white active:bg-[#3a1a00] flex items-center justify-center gap-2 font-semibold"
              aria-label="OK"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="5 12 10 17 19 7" />
              </svg>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative bg-[#fff3c9]">
        <MusicCanvas
          scaleKey={currentKey}
          mode={currentMode}
          staves={2}
          className="w-full aspect-[2/1] bg-[#fff3c9]"
        />
      </div>
    </div>
  )
}
