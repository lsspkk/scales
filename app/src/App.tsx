import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MobileShell } from './components/ui/MobileShell'
import { useViewport } from './lib/useViewport'

const Home = lazy(() => import('./screens/Home').then(m => ({ default: m.Home })))
const Kirkkosavellajit = lazy(() => import('./screens/Kirkkosavellajit').then(m => ({ default: m.Kirkkosavellajit })))
const Harjoittelu = lazy(() => import('./screens/Harjoittelu').then(m => ({ default: m.Harjoittelu })))
const Soittohetki = lazy(() => import('./screens/Soittohetki').then(m => ({ default: m.Soittohetki })))

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
        <Route path="/soittohetki" element={<Soittohetki />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )

  if (isDesktop) {
    return <div className="min-h-screen bg-[#fffbe9]">{content}</div>
  }

  return <MobileShell>{content}</MobileShell>
}
