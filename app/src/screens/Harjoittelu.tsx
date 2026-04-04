import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'

export function Harjoittelu() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-[#fffbe9]">
      <ScreenHeader title="Harjoittelu" color="red" onBack={() => navigate('/')} />
      <div className="flex flex-1 items-center justify-center text-[#a0563f] text-center px-8">
        <p className="text-lg font-medium">Tulossa pian…</p>
      </div>
    </div>
  )
}
