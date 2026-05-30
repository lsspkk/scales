import { useNavigate } from 'react-router-dom'
import { HomeCard } from '../components/ui/HomeCard'
import { useViewport } from '../lib/useViewport'

const BookMusicIcon = (
  <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
    {/* Material Design Icons — mdi:book-music — Apache 2.0 */}
    <path
      fill='rgba(255,251,233,0.9)'
      d='M13 20.5c0 .53.09 1.03.26 1.5H6c-1.11 0-2-.89-2-2V4a2 2 0 0 1 2-2h1v7l2.5-1.5L12 9V2h6a2 2 0 0 1 2 2v7h-3.5v5.11c-2 .46-3.5 2.25-3.5 4.39m7-7.5h-1.5v5.21a2.5 2.5 0 1 0-1 4.79a2.5 2.5 0 0 0 2.5-2.5V15h2v-2z'
    />
  </svg>
)

const ViolinIcon = (
  <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
    {/* Material Design Icons — mdi:violin — Apache 2.0 */}
    <g transform='rotate(-20 12 12)'>
      <path
        fill='rgba(255,251,233,0.9)'
        d='M11 2a1 1 0 0 0-1 1v6a.5.5 0 0 0 .5.5H12a.5.5 0 0 1 .5.5a.5.5 0 0 1-.5.5h-1.5C9.73 10.5 9 9.77 9 9V5.16C7.27 5.6 6 7.13 6 9v1.5A2.5 2.5 0 0 1 8.5 13A2.5 2.5 0 0 1 6 15.5V17c0 2.77 2.23 5 5 5h2c2.77 0 5-2.23 5-5v-1.5a2.5 2.5 0 0 1-2.5-2.5a2.5 2.5 0 0 1 2.5-2.5V9c0-2.22-1.78-4-4-4V3a1 1 0 0 0-1-1m-2.35 14.8h2.5l-.5 3.5h-1.5z'
      />
    </g>
  </svg>
)

const TunerGaugeIcon = (
  <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
    {/* Boxicons v3.0.8 — gauge — https://docs.boxicons.com/free */}
    <g fill='rgba(255,251,233,0.9)'>
      <path d='M10.94 15.5c.71.46 1.65.27 2.12-.44l3.96-6.04v-.03c0-.02-.03-.02-.04-.01l-6.04 3.96c-.71.46-.91 1.41-.44 2.12.12.18.27.33.44.44' />
      <path d='M5.08 20h13.85c.71 0 1.37-.37 1.72-.97a9.98 9.98 0 0 0 1.29-6.2c-.52-4.58-4.23-8.26-8.81-8.77-2.84-.31-5.69.6-7.8 2.49C3.22 8.45 2 11.16 2 14c0 1.77.47 3.51 1.36 5.03.35.6 1.01.97 1.72.97M6.66 8.04A7.93 7.93 0 0 1 11.99 6c.3 0 .61.02.92.05 3.66.4 6.62 3.35 7.04 7.01.2 1.74-.15 3.45-1.02 4.95s-13.84.02-13.84.02a8 8 0 0 1-1.08-4.02c0-2.27.97-4.44 2.66-5.96Z' />
    </g>
  </svg>
)

export function Home() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()

  return (
    <div className={`flex flex-col h-full bg-[#fffbe9] px-6 pt-10 ${isDesktop ? 'items-center justify-center' : ''}`}>
      {!isDesktop && (
        <h1 className='font-medieval text-center text-[#5a2d0c] text-3xl mb-10 leading-tight'>Sävellajit</h1>
      )}
      <div className={`flex gap-5 ${isDesktop ? 'flex-row justify-center' : 'flex-col flex-1'}`}>
        <HomeCard icon={BookMusicIcon} label='Moodit' subtitle='Kirkkosävellajien perusteet' color='brown' onClick={() => navigate('/moodit')} />
        <HomeCard icon={ViolinIcon} label='Harjoittelu' subtitle='Sävellajit viululla' color='red' onClick={() => navigate('/harjoittelu')} />
        <HomeCard icon={TunerGaugeIcon} label='Virittäminen' subtitle='Viritä viulu' onClick={() => navigate('/virittaminen')} />
      </div>
    </div>
  )
}
