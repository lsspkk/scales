import { useNavigate } from 'react-router-dom'
import { HomeCard } from '../components/ui/HomeCard'
import { useViewport } from '../lib/useViewport'

const BookMusicIcon = (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
    <rect x="8" y="10" width="44" height="58" rx="4" fill="rgba(255,251,233,0.25)" stroke="rgba(255,251,233,0.9)" strokeWidth="3"/>
    <line x1="16" y1="26" x2="44" y2="26" stroke="rgba(255,251,233,0.7)" strokeWidth="2"/>
    <line x1="16" y1="34" x2="36" y2="34" stroke="rgba(255,251,233,0.7)" strokeWidth="2"/>
    <line x1="16" y1="42" x2="40" y2="42" stroke="rgba(255,251,233,0.7)" strokeWidth="2"/>
    <circle cx="56" cy="56" r="7" fill="rgba(255,251,233,0.9)"/>
    <line x1="63" y1="56" x2="63" y2="30" stroke="rgba(255,251,233,0.9)" strokeWidth="3" strokeLinecap="round"/>
    <line x1="63" y1="30" x2="70" y2="34" stroke="rgba(255,251,233,0.9)" strokeWidth="3" strokeLinecap="round"/>
  </svg>
)

const ViolinIcon = (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
    <ellipse cx="40" cy="58" rx="13" ry="15" fill="rgba(255,251,233,0.25)" stroke="rgba(255,251,233,0.9)" strokeWidth="3"/>
    <ellipse cx="40" cy="22" rx="10" ry="12" fill="rgba(255,251,233,0.25)" stroke="rgba(255,251,233,0.9)" strokeWidth="3"/>
    <line x1="40" y1="34" x2="40" y2="43" stroke="rgba(255,251,233,0.9)" strokeWidth="3"/>
    <line x1="27" y1="40" x2="53" y2="40" stroke="rgba(255,251,233,0.9)" strokeWidth="2.5"/>
    <line x1="37" y1="10" x2="43" y2="10" stroke="rgba(255,251,233,0.9)" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="40" y1="10" x2="40" y2="16" stroke="rgba(255,251,233,0.9)" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="34" y1="58" x2="46" y2="58" stroke="rgba(255,251,233,0.6)" strokeWidth="1.5"/>
  </svg>
)

export function Home() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()

  return (
    <div className={`flex flex-col h-full bg-[#fffbe9] px-6 pt-10 ${isDesktop ? 'items-center justify-center' : ''}`}>
      <h1 className="font-medieval text-center text-[#5a2d0c] text-3xl mb-10 leading-tight">
        Kirkkosävellajit
      </h1>
      <div className={`flex gap-5 ${isDesktop ? 'flex-row justify-center' : 'flex-col flex-1'}`}>
        <HomeCard
          icon={BookMusicIcon}
          label="Moodit"
          subtitle="Kirkkosävellajien perusteet"
          color="brown"
          onClick={() => navigate('/moodit')}
        />
        <HomeCard
          icon={ViolinIcon}
          label="Harjoittelu"
          subtitle="Harjoittele soittamista"
          color="red"
          onClick={() => navigate('/harjoittelu')}
        />
      </div>
    </div>
  )
}
