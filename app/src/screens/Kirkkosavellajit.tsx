import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getKeyList, getModeList, getBaseModeKey,
  getModeDegree, getModeAlterations, getScale, getNoteInfo, getNoteY,
} from '../lib/musicScale'
import { useViewport } from '../lib/useViewport'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { Chip } from '../components/ui/Chip'
import { Button } from '../components/ui/Button'
import { useMusicStore } from '../stores/musicStore'

const STAFF_GAP = 220
const UPPER_STAFF_LINES = [95, 120, 145, 170, 195]
const LOWER_STAFF_LINES = UPPER_STAFF_LINES.map(y => y + STAFF_GAP)

// Canvas drawing helpers
function drawStaff(ctx: CanvasRenderingContext2D, w: number, mobile: boolean) {
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1.5
  const startX = mobile ? 5 : -5
  for (const lines of [UPPER_STAFF_LINES, LOWER_STAFF_LINES]) {
    for (const y of lines) {
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(w - 5, y); ctx.stroke()
    }
  }
}

function drawTrebleClef(ctx: CanvasRenderingContext2D, mobile: boolean) {
  ctx.fillStyle = '#000'
  const fontSize = mobile ? 146 : 126
  ctx.font = `${fontSize}px serif`
  ctx.textAlign = 'center'
  const xPos = 25
  const yOffset = 10
  for (const baseY of [153 + yOffset, 153 + yOffset + STAFF_GAP]) {
    const anchorY = baseY - 100
    ctx.save()
    ctx.translate(xPos, anchorY)
    ctx.scale(0.75, 1.3)
    ctx.translate(-xPos, -anchorY)
    ctx.fillText('𝄞', xPos, baseY)
    ctx.restore()
  }
}

function drawLedgerLines(ctx: CanvasRenderingContext2D, x: number, y: number, staff: 'upper' | 'lower') {
  const lines = staff === 'upper' ? UPPER_STAFF_LINES : LOWER_STAFF_LINES
  const top = lines[0], bottom = lines[4], step = lines[1] - lines[0]
  ctx.lineWidth = 1.5
  if (y > bottom + 2) {
    for (let ly = bottom + step; ly <= y + 2; ly += step) {
      ctx.beginPath(); ctx.moveTo(x - 20, ly); ctx.lineTo(x + 20, ly); ctx.stroke()
    }
  }
  if (y < top - 2) {
    for (let ly = top - step; ly >= y - 2; ly -= step) {
      ctx.beginPath(); ctx.moveTo(x - 20, ly); ctx.lineTo(x + 20, ly); ctx.stroke()
    }
  }
}

function drawAccidental(ctx: CanvasRenderingContext2D, x: number, y: number, accidental: string, large: boolean) {
  ctx.fillStyle = '#000'
  ctx.font = large ? 'bold 48px serif' : 'bold 36px serif'
  ctx.textAlign = 'center'
  const sharpY = large ? y + 14 : y + 11
  const flatY = large ? y + 10 : y + 8
  if (accidental === '#') ctx.fillText('♯', x, sharpY)
  else if (accidental === '##') ctx.fillText('𝄪', x, sharpY)
  else if (accidental === 'b') ctx.fillText('♭', x, flatY)
  else if (accidental === 'bb') ctx.fillText('𝄫', x, flatY)
}

function drawNote(
  ctx: CanvasRenderingContext2D,
  x: number,
  note: string,
  staff: 'upper' | 'lower',
  scaleIndex: number,
  currentKey: string,
  largeAccidentals: boolean,
) {
  const info = getNoteInfo(note)
  const y = getNoteY(info.noteName, info.octave, staff, scaleIndex, currentKey)
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.ellipse(x, y, 13, 8.5, -Math.PI / 6 - 0.087, 0, 2 * Math.PI)
  ctx.fill()
  const bLineY = staff === 'upper' ? 155 : 155 + STAFF_GAP
  ctx.lineWidth = 2
  if (y < bLineY) {
    ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x - 9, y + 70); ctx.stroke()
  } else {
    ctx.beginPath(); ctx.moveTo(x + 9, y); ctx.lineTo(x + 9, y - 70); ctx.stroke()
  }
  drawLedgerLines(ctx, x, y, staff)
  if (info.accidental) drawAccidental(ctx, x - 32, y, info.accidental, largeAccidentals)
}

function renderScale(ctx: CanvasRenderingContext2D, key: string, mode: string, canvasWidth: number, mobile: boolean) {
  ctx.clearRect(0, 0, canvasWidth, 500)
  drawStaff(ctx, canvasWidth, mobile)
  drawTrebleClef(ctx, mobile)
  const scale = getScale(key, mode)
  const startX = mobile ? 90 : 115
  const endPad = mobile ? 40 : 60
  const spacing = (canvasWidth - startX - endPad) / (scale.length - 1)
  scale.forEach((note, i) => drawNote(ctx, startX + i * spacing, note, 'upper', i, key, mobile))
  const rev = [...scale].reverse()
  rev.forEach((note, i) => drawNote(ctx, startX + i * spacing, note, 'lower', scale.length - 1 - i, key, mobile))
}

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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasWidth = isDesktop ? 1000 : 1000

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    renderScale(ctx, currentKey, currentMode, canvasWidth, !isDesktop)
  }, [currentKey, currentMode, canvasWidth, isDesktop])

  useEffect(() => { draw() }, [draw])

  const selectKey = (key: string) => {
    setCurrentKey(key)
    setMenuOpen(false)
  }

  const selectMode = (mode: string) => {
    setCurrentMode(mode)
    setMenuOpen(false)
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
      <div className="flex flex-col h-screen bg-[#fffbe9]">
        <ScreenHeader title="Moodit" onBack={() => navigate('/')} />

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
            <canvas
              ref={canvasRef}
              width={1000}
              height={500}
              style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
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
          <Button variant="outlined" color="primary" size="sm" onClick={() => setMenuOpen(o => !o)} className="flex-1 bg-[#fff3c9]">
            Valitse ▾
          </Button>
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

      {/* Dropdown selection menu */}
      {menuOpen && (
        <div className="absolute left-3 right-3 z-50 shadow-2xl" style={{ top: '140px' }}>
          {selectionPanels}
          <Button variant="outlined" color="neutral" size="sm" onClick={() => setMenuOpen(false)} className="mt-2 w-full">
            Sulje
          </Button>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-hidden relative bg-[#fff3c9]"
        style={{ aspectRatio: '2 / 1' }}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={500}
          className="w-full h-full"
          style={{ display: 'block' }}
        />
      </div>
    </div>
  )
}
