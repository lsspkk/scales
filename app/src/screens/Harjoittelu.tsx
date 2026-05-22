import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { ScaleDetailPanel } from '../components/ui/ScaleDetailPanel'
import { ScaleDetailModal } from '../components/ui/ScaleDetailModal'
import { MarqueeText } from '../components/ui/MarqueeText'
import { useViewport } from '../lib/useViewport'
import { usePracticeStore } from '../stores/practiceStore'
import { formatScaleLabel, formatPositions, getScaleDetail, getScaleKey, type ScaleEntry } from '../lib/practiceMethod'
import { getScale } from '../lib/musicScale'
import { rollVariation, rollHiddenNotes } from '../lib/scaleVariations'

type HiddenNoteState = { notes: [string, string]; active: boolean } | null

const DiceIcon = (
  <svg width='14' height='14' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
    <rect x='3' y='3' width='14' height='14' rx='2.5' stroke='currentColor' strokeWidth='1.5' />
    <circle cx='7' cy='7' r='1.1' fill='currentColor' />
    <circle cx='13' cy='13' r='1.1' fill='currentColor' />
    <circle cx='10' cy='10' r='1.1' fill='currentColor' />
  </svg>
)

const HideIcon = (
  <svg width='16' height='16' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
    <path
      d='M2.5 10 C 4.5 6, 7 4.5, 10 4.5 C 13 4.5, 15.5 6, 17.5 10 C 15.5 14, 13 15.5, 10 15.5 C 7 15.5, 4.5 14, 2.5 10 Z'
      stroke='currentColor'
      strokeWidth='1.4'
      strokeLinejoin='round'
    />
    <circle cx='10' cy='10' r='2.2' stroke='currentColor' strokeWidth='1.4' />
    <line x1='4' y1='16.5' x2='16' y2='3.5' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
  </svg>
)

function pickRandomAnimationVariant(): 'walking' | 'flying' {
  return Math.random() < 0.5 ? 'walking' : 'flying'
}

function LevelSelector({ selectedLevel, onSelect }: { selectedLevel: number; onSelect: (level: number) => void }) {
  const levels = [
    { num: 1, label: 'Taso 1', desc: '1. asema' },
    { num: 2, label: 'Taso 2', desc: '1.–3. asema' },
    { num: 3, label: 'Taso 3', desc: '1.–2.–3. asema' },
  ]

  return (
    <div className='space-y-2'>
      <h3 className='text-base font-bold text-[#5a2d0c]'>Valitse taitotaso</h3>
      <div className='flex gap-2 flex-wrap'>
        {levels.map((l) => {
          const selected = selectedLevel === l.num
          return (
            <button
              key={l.num}
              onClick={() => onSelect(l.num)}
              className={`min-h-[44px] px-4 py-2 rounded-lg border-2 text-base font-semibold transition-colors ${
                selected ? 'bg-[#8B2500] border-[#8B2500] text-white' : 'bg-[#fffbe9] border-[#c9a96e] text-[#5a2d0c]'
              }`}
            >
              <div>{l.label}</div>
              <div className='text-xs font-normal opacity-80'>{l.desc}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PracticeListItem({
  item,
  index,
  selected,
  isMobile,
  variationText,
  hideActive,
  onToggleDone,
  onSelectInfo,
  onPlay,
  onRollVariation,
  onToggleHide,
}: {
  item: { scale: ScaleEntry; done: boolean }
  index: number
  selected: boolean
  isMobile: boolean
  variationText: string | null
  hideActive: boolean
  onToggleDone: (index: number) => void
  onSelectInfo: () => void
  onPlay: () => void
  onRollVariation: () => void
  onToggleHide: () => void
}) {
  const baseClasses = isMobile
    ? 'w-full min-h-[44px] flex items-center gap-2 py-2 border-b border-[#c9a96e] transition-colors'
    : 'w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg transition-colors'
  const bgClasses = item.done
    ? 'bg-[#f0dbb8] opacity-60'
    : isMobile
      ? 'bg-[#fffbe9]'
      : 'bg-[#fffbe9] border border-[#c9a96e]'
  const secondLineText = variationText ?? item.scale.shiftPattern
  return (
    <div className={`${baseClasses} ${bgClasses}`}>
      <button
        onClick={() => onToggleDone(index)}
        className='flex-shrink-0 w-10 h-10 flex items-center justify-center'
        aria-label={item.done ? 'Merkitse harjoittelemattomaksi' : 'Merkitse harjoitelluksi'}
      >
        <span
          className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
            item.done ? 'bg-[#8B2500] border-[#8B2500] text-white' : 'border-[#c9a96e] bg-white'
          }`}
        >
          {item.done && <span className='text-sm'>&#10003;</span>}
        </span>
      </button>

      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-1.5 flex-wrap'>
          <span className={`text-base font-semibold ${item.done ? 'line-through text-[#8B4513]' : 'text-[#5a2d0c]'}`}>
            {formatScaleLabel(item.scale)}
          </span>
          <span className='text-sm text-[#8B4513]'>{formatPositions(item.scale)} as.</span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onRollVariation()
            }}
            className={`ml-1 inline-flex items-center justify-center w-7 h-7 rounded-md border transition-colors ${
              variationText
                ? 'bg-[#8B2500] border-[#8B2500] text-white'
                : 'bg-[#fffbe9] border-[#c9a96e] text-[#8B4513] hover:bg-[#f0dbb8]'
            }`}
            aria-label={variationText ? 'Arvo uusi harjoitusmuunnos' : 'Arvo harjoitusmuunnos'}
            title='Arvo harjoitusmuunnos'
          >
            {DiceIcon}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleHide()
            }}
            className={`inline-flex items-center justify-center w-7 h-7 rounded-md border transition-colors ${
              hideActive
                ? 'bg-[#8B2500] border-[#8B2500] text-white'
                : 'bg-[#fffbe9] border-[#c9a96e] text-[#8B4513] hover:bg-[#f0dbb8]'
            }`}
            aria-label={hideActive ? 'Näytä piilotetut nuotit' : 'Piilota kaksi nuottia'}
            title='Piilota kaksi nuottia'
          >
            {HideIcon}
          </button>
        </div>
        {secondLineText && (
          variationText ? (
            <MarqueeText text={variationText} className='text-xs mt-0.5 text-[#8B2500] font-medium' />
          ) : (
            <div className='text-xs mt-0.5 text-[#8B4513]'>{secondLineText}</div>
          )
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onSelectInfo()
        }}
        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
          selected ? 'bg-[#8B2500] text-white' : 'text-[#8B4513] hover:bg-[#f0dbb8]'
        }`}
        aria-label='Näytä tiedot'
      >
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='10' cy='10' r='9' stroke='currentColor' strokeWidth='1.5' />
          <text
            x='10'
            y='14.5'
            textAnchor='middle'
            fill='currentColor'
            fontSize='12'
            fontWeight='600'
            fontFamily='serif'
          >
            i
          </text>
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onPlay()
        }}
        className='flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-[#8B4513] hover:bg-[#f0dbb8] transition-colors'
        aria-label='Aloita soittohetki'
      >
        <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
          <circle cx='10' cy='10' r='9' stroke='currentColor' strokeWidth='1.5' />
          <circle cx='10' cy='5.5' r='1.7' fill='currentColor' />
          <line x1='10' y1='7.5' x2='10' y2='12.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
          <line x1='10' y1='9' x2='6.8' y2='10.8' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
          <line x1='10' y1='9' x2='13.2' y2='10.8' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
          <line x1='10' y1='12.5' x2='7.5' y2='15.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
          <line x1='10' y1='12.5' x2='12.5' y2='15.5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        </svg>
      </button>
    </div>
  )
}

function PracticeBody({
  selectedScale,
  onSelectScale,
}: {
  selectedScale: ScaleEntry | null
  onSelectScale: (scale: ScaleEntry | null) => void
}) {
  const { isDesktop } = useViewport()
  const navigateToSoittohetki = useNavigate()
  const selectedLevel = usePracticeStore((s) => s.selectedLevel)
  const practiceSet = usePracticeStore((s) => s.practiceSet)
  const active = usePracticeStore((s) => s.active)
  const sessionStartedAt = usePracticeStore((s) => s.sessionStartedAt)
  const setSelectedLevel = usePracticeStore((s) => s.setSelectedLevel)
  const generatePracticeSet = usePracticeStore((s) => s.generatePracticeSet)
  const toggleDone = usePracticeStore((s) => s.toggleDone)
  const resetProgress = usePracticeStore((s) => s.resetProgress)
  const reshuffleSet = usePracticeStore((s) => s.reshuffleSet)
  const clearSession = usePracticeStore((s) => s.clearSession)

  // Per-row challenge state (Task 26). Keyed by getScaleKey(scale) so it
  // survives reshuffle. Both maps are session-only — not persisted.
  const [variationByRow, setVariationByRow] = useState<Record<string, { id: string; text: string }>>({})
  const [hideByRow, setHideByRow] = useState<Record<string, HiddenNoteState>>({})

  const rollVariationFor = useCallback((scale: ScaleEntry) => {
    const k = getScaleKey(scale)
    setVariationByRow((prev) => {
      const next = rollVariation(prev[k]?.id ?? null)
      return { ...prev, [k]: { id: next.id, text: next.text } }
    })
  }, [])

  const toggleHideFor = useCallback((scale: ScaleEntry) => {
    const k = getScaleKey(scale)
    setHideByRow((prev) => {
      const current = prev[k]
      if (!current) {
        const rolled = rollHiddenNotes(getScale(scale.key, scale.mode))
        return rolled ? { ...prev, [k]: { notes: rolled, active: true } } : prev
      }
      if (current.active) {
        return { ...prev, [k]: { ...current, active: false } }
      }
      const rolled = rollHiddenNotes(getScale(scale.key, scale.mode))
      return rolled ? { ...prev, [k]: { notes: rolled, active: true } } : { ...prev, [k]: null }
    })
  }, [])

  const selectedHiddenNotes = selectedScale
    ? (() => {
        const state = hideByRow[getScaleKey(selectedScale)]
        return state && state.active ? state.notes : undefined
      })()
    : undefined

  const doneCount = practiceSet.filter((item) => item.done).length
  const totalCount = practiceSet.length
  const allDone = totalCount > 0 && doneCount === totalCount

  if (allDone) {
    return (
      <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
        <div className='text-5xl mb-4'>&#9835;</div>
        <h2 className='text-2xl font-bold text-[#5a2d0c] mb-2'>Onnittelut!</h2>
        <p className='text-base text-[#3a1a00] mb-6'>Kaikki {totalCount} asteikkoa harjoiteltu!</p>
        <div className='flex flex-col gap-3 w-full max-w-xs'>
          <button
            onClick={() => {
              resetProgress()
              onSelectScale(null)
            }}
            className='min-h-[44px] px-6 py-3 rounded-lg bg-[#8B2500] text-white font-semibold text-base'
          >
            Sama järjestys
          </button>
          <button
            onClick={() => {
              reshuffleSet()
              onSelectScale(null)
            }}
            className='min-h-[44px] px-6 py-3 rounded-lg bg-[#5a2d0c] text-white font-semibold text-base'
          >
            Arvo uusi järjestys
          </button>
        </div>
      </div>
    )
  }

  if (!active || totalCount === 0) {
    return (
      <div className='space-y-6'>
        <LevelSelector selectedLevel={selectedLevel} onSelect={setSelectedLevel} />
        <p className='text-sm leading-relaxed text-[#5a2d0c]'>
          Sovellus arpoo valitun taitotason asteikot satunnaiseen järjestykseen ja luo harjoituslistan, jonka voit käydä
          läpi omaan tahtiisi. Satunnainen järjestys pakottaa sinut harjoittelemaan myös vähemmän tuttuja sävellajeja
          eikä vain suosikkejasi. Käy lista läpi viikon tai parin aikana ja arvo sitten uusi järjestys — näin
          harjoittelu pysyy monipuolisena.
        </p>
        <button
          onClick={() => {
            generatePracticeSet()
            onSelectScale(null)
          }}
          className='min-h-[44px] w-full px-6 py-3 rounded-lg bg-[#8B2500] text-white font-bold text-base'
        >
          Aloita harjoittelu
        </button>
      </div>
    )
  }

  // The practice list (used in both single-column mobile and left-column desktop)
  const practiceList = (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <p className='text-base font-bold text-[#5a2d0c]'>
          {doneCount} / {totalCount} harjoiteltu
        </p>
        <button
          onClick={() => {
            clearSession()
            onSelectScale(null)
          }}
          className={`text-sm text-[#8B4513] underline px-2 ${isDesktop ? 'min-h-[44px]' : ''}`}
        >
          Uusi harjoitussessio
        </button>
      </div>

      {(() => {
        if (!sessionStartedAt) return null
        const start = new Date(sessionStartedAt)
        const today = new Date()
        const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        const dateStr = `${start.getDate()}.${start.getMonth() + 1}.${start.getFullYear()}`
        const dayLabel = daysDiff === 0 ? '1. päivä' : `${daysDiff + 1}. päivää`
        return (
          <div className='flex items-center justify-between bg-[#c9a96e] px-2 py-0.5 -mt-1'>
            <span className='text-sm text-[#f5e9d0]'>{dateStr}</span>
            <span className='text-sm text-[#f5e9d0]'>{dayLabel}</span>
          </div>
        )
      })()}
      <div className={isDesktop ? 'space-y-1' : 'border-t border-[#c9a96e]'}>
        {practiceSet.map((item, index) => {
          const rowKey = getScaleKey(item.scale)
          const hideState = hideByRow[rowKey]
          return (
            <PracticeListItem
              key={rowKey}
              item={item}
              index={index}
              selected={selectedScale === item.scale}
              isMobile={!isDesktop}
              variationText={variationByRow[rowKey]?.text ?? null}
              hideActive={!!hideState?.active}
              onToggleDone={toggleDone}
              onSelectInfo={() => onSelectScale(selectedScale === item.scale ? null : item.scale)}
              onPlay={() => {
                const params = new URLSearchParams({
                  root: item.scale.key,
                  mode: item.scale.mode,
                  octaves: String(item.scale.octaves),
                  anim: pickRandomAnimationVariant(),
                })
                navigateToSoittohetki(`/soittohetki?${params.toString()}`)
              }}
              onRollVariation={() => rollVariationFor(item.scale)}
              onToggleHide={() => toggleHideFor(item.scale)}
            />
          )
        })}
      </div>
    </div>
  )

  // Desktop: two-column layout with side panel
  if (isDesktop) {
    const detail = selectedScale ? getScaleDetail(selectedScale) : null
    return (
      <div className='flex gap-6'>
        <div className='flex-1 min-w-0'>{practiceList}</div>
        <div className='flex-1 min-w-0'>
          {detail ? (
            <div className='sticky top-4 bg-[#faf3d8] border border-[#c9a96e] rounded-xl p-4'>
              <h3 className='text-lg font-bold text-[#5a2d0c] mb-4 pb-2 border-b border-[#c9a96e]'>{detail.label}</h3>
              <ScaleDetailPanel detail={detail} hiddenNotes={selectedHiddenNotes} />
            </div>
          ) : (
            <div className='sticky top-4 bg-[#faf3d8] border border-[#c9a96e] rounded-xl p-4 text-center'>
              <p className='text-base text-[#8B4513] italic'>Valitse asteikko nähdäksesi tiedot</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Mobile: practice list + modal when scale is selected
  return (
    <>
      {practiceList}
      {selectedScale && (
        <ScaleDetailModal
          title={`${formatScaleLabel(selectedScale)} — ${formatPositions(selectedScale)} as.`}
          onClose={() => onSelectScale(null)}
        >
          <ScaleDetailPanel detail={getScaleDetail(selectedScale)} hiddenNotes={selectedHiddenNotes} />
        </ScaleDetailModal>
      )}
    </>
  )
}

const InfoIcon = (
  <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
    <circle cx='12' cy='12' r='10' stroke='white' strokeWidth='1.8' />
    <text x='12' y='17' textAnchor='middle' fill='white' fontSize='14' fontWeight='600' fontFamily='serif'>
      i
    </text>
  </svg>
)

/** Harjoittelu screen: interactive practice routine. Info content lives at /harjoittelu/tietoa. */
export function Harjoittelu() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const [selectedScale, setSelectedScale] = useState<ScaleEntry | null>(null)

  const handleSelectScale = useCallback((scale: ScaleEntry | null) => {
    setSelectedScale(() => scale)
  }, [])

  return (
    <div className='flex flex-col h-full bg-[#fffbe9]'>
      {!isDesktop && (
        <ScreenHeader
          title='Harjoittelu'
          color='red'
          onBack={() => navigate('/')}
          action={{
            icon: InfoIcon,
            label: 'Tietoa harjoittelusta',
            onClick: () => navigate('/harjoittelu/tietoa'),
          }}
        />
      )}

      {isDesktop && (
        <div className='w-full bg-[#a0563f] border-b border-[#3a1a00]'>
          <div className='max-w-[1200px] mx-auto px-8 flex justify-end'>
            <button
              onClick={() => navigate('/harjoittelu/tietoa')}
              className='inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold text-white hover:bg-[#b86a52] focus:outline focus:outline-2 focus:outline-[#fffbe9]'
              aria-label='Tietoa harjoittelusta'
            >
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='1.8' />
                <text x='12' y='17' textAnchor='middle' fill='currentColor' fontSize='14' fontWeight='600' fontFamily='serif'>
                  i
                </text>
              </svg>
              <span>Tietoa harjoittelusta</span>
            </button>
          </div>
        </div>
      )}
      <div className='flex-1 overflow-y-auto'>
        <div className={isDesktop ? 'max-w-[1200px] mx-auto px-8 py-6' : 'px-4 pt-3 pb-4'}>
          <PracticeBody selectedScale={selectedScale} onSelectScale={handleSelectScale} />
        </div>
      </div>
    </div>
  )
}
