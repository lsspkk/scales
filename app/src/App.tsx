import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MobileShell } from './components/ui/MobileShell'
import { DesktopNavBar } from './components/ui/DesktopNavBar'
import { useViewport } from './lib/useViewport'

const Home = lazy(() => import('./screens/Home').then((m) => ({ default: m.Home })))
const Kirkkosavellajit = lazy(() => import('./screens/Kirkkosavellajit').then((m) => ({ default: m.Kirkkosavellajit })))
const Harjoittelu = lazy(() => import('./screens/Harjoittelu').then((m) => ({ default: m.Harjoittelu })))
const HarjoitteluTietoa = lazy(() =>
  import('./screens/HarjoitteluTietoa').then((m) => ({ default: m.HarjoitteluTietoa })),
)
const Soittohetki = lazy(() => import('./screens/Soittohetki').then((m) => ({ default: m.Soittohetki })))
const Virittaminen = lazy(() => import('./screens/Virittaminen').then((m) => ({ default: m.Virittaminen })))
// DEBUG / TEST ROUTE — central entry for internal visual test pages.
// Keep a stable /test landing page so individual leaf test routes can change
// without needing a new "secret" URL to remember every time.
const TestMenu = lazy(() => import('./screens/TestMenu').then((m) => ({ default: m.TestMenu })))
// DEBUG / TEST ROUTE — preview-only screen for the timer animation (Task 21).
// Reach from #/test or directly via #/test/animation/timer.
const AnimationTest = lazy(() => import('./screens/AnimationTest').then((m) => ({ default: m.AnimationTest })))
// DEBUG / TEST ROUTE — preview-only screen for the celebration animation (Task 22).
// Reach from #/test or directly via #/test/animation/celebration.
const CelebrationAnimationTest = lazy(() =>
  import('./screens/CelebrationAnimationTest').then((m) => ({ default: m.CelebrationAnimationTest })),
)
// DEBUG / TEST ROUTE — polyphonic audio-engine test page (Task 24).
// Reach from #/test or directly via #/test/audio.
const AudioTest = lazy(() => import('./screens/AudioTest').then((m) => ({ default: m.AudioTest })))
// DEBUG / TEST ROUTE — live microphone tuner. Reach from #/test or directly via #/test/tuner.
const TunerTest = lazy(() => import('./screens/TunerTest').then((m) => ({ default: m.TunerTest })))
// DEBUG / TEST ROUTE — scale-playing tuner game. Reach from #/test or directly via #/test/scaletuner.
const ScaleTunerTest = lazy(() => import('./screens/ScaleTunerTest').then((m) => ({ default: m.ScaleTunerTest })))

function LoadingSpinner() {
  return (
    <div className='flex flex-1 items-center justify-center'>
      <span className='text-[#5a2d0c] text-lg'>Ladataan…</span>
    </div>
  )
}

export function App() {
  const { isDesktop } = useViewport()

  const content = (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/moodit' element={<Kirkkosavellajit />} />
        <Route path='/harjoittelu' element={<Harjoittelu />} />
        <Route path='/harjoittelu/tietoa' element={<HarjoitteluTietoa />} />
        <Route path='/soittohetki' element={<Soittohetki />} />
        <Route path='/virittaminen' element={<Virittaminen />} />
        {/* DEBUG / TEST ROUTES — grouped under /test so one stable route reveals the available previews. */}
        <Route path='/test' element={<TestMenu />} />
        <Route path='/test/animation/timer' element={<AnimationTest />} />
        <Route path='/test/animation/celebration' element={<CelebrationAnimationTest />} />
        <Route path='/test/audio' element={<AudioTest />} />
        <Route path='/test/tuner' element={<TunerTest />} />
        <Route path='/test/scaletuner' element={<ScaleTunerTest />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </Suspense>
  )

  if (isDesktop) {
    return (
      <div className='min-h-screen flex flex-col bg-[#fffbe9]'>
        <DesktopNavBar />
        <div className='flex-1 flex flex-col min-h-0'>{content}</div>
      </div>
    )
  }

  return <MobileShell>{content}</MobileShell>
}
