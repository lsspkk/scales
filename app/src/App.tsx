import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MobileShell } from './components/ui/MobileShell'
import { useViewport } from './lib/useViewport'

const Home = lazy(() => import('./screens/Home').then(m => ({ default: m.Home })))
const Kirkkosavellajit = lazy(() => import('./screens/Kirkkosavellajit').then(m => ({ default: m.Kirkkosavellajit })))
const Harjoittelu = lazy(() => import('./screens/Harjoittelu').then(m => ({ default: m.Harjoittelu })))
const HarjoitteluTietoa = lazy(() => import('./screens/HarjoitteluTietoa').then(m => ({ default: m.HarjoitteluTietoa })))
const Soittohetki = lazy(() => import('./screens/Soittohetki').then(m => ({ default: m.Soittohetki })))
// DEBUG / TEST ROUTE — preview-only screen for the timer animation (Task 21).
// Intentionally not linked from any UI; reach via #/dev/animation/timer.
const AnimationTest = lazy(() => import('./screens/AnimationTest').then(m => ({ default: m.AnimationTest })))
// DEBUG / TEST ROUTE — preview-only screen for the celebration animation (Task 22).
// Intentionally not linked from any UI; reach via #/dev/animation/celebration.
const CelebrationAnimationTest = lazy(() =>
  import('./screens/CelebrationAnimationTest').then(m => ({ default: m.CelebrationAnimationTest })),
)

function LoadingSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span className="text-[#5a2d0c] text-lg">Ladataan…</span>
    </div>
  )
}

export function App() {
  const { isDesktop } = useViewport()

  const content = (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/moodit" element={<Kirkkosavellajit />} />
        <Route path="/harjoittelu" element={<Harjoittelu />} />
        <Route path="/harjoittelu/tietoa" element={<HarjoitteluTietoa />} />
        <Route path="/soittohetki" element={<Soittohetki />} />
        {/* DEBUG / TEST ROUTE — see comment on lazy import above */}
        <Route path="/dev/animation/timer" element={<AnimationTest />} />
        {/* DEBUG / TEST ROUTE — see comment on lazy import above */}
        <Route path="/dev/animation/celebration" element={<CelebrationAnimationTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )

  if (isDesktop) {
    return <div className="min-h-screen bg-[#fffbe9]">{content}</div>
  }

  return <MobileShell>{content}</MobileShell>
}
