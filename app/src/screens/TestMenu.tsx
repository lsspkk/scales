import { Link, useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'

export function TestMenu() {
  const navigate = useNavigate()

  return (
    <div className='flex min-h-screen flex-col bg-[#fffbe9]'>
      <ScreenHeader title='Testisivut' onBack={() => navigate('/')} />

      <div className='flex-1 overflow-y-auto px-4 py-4'>
        <div className='mx-auto flex max-w-175 flex-col gap-4'>
          <div className='rounded-2xl border-2 border-[#8B4513] bg-[#fffbe9] p-4 text-[#5a2d0c] shadow-[0_4px_14px_rgba(90,45,12,0.12)]'>
            <h1 className='text-lg font-bold'>Sisäiset animaatiotestit</h1>
            <p className='mt-2 text-sm leading-6'>Tämä valikko kokoaa sisäiset esikatselusivut yhden reitin alle.</p>
            {/* Keep a single stable entry route for internal preview pages so only /test needs to be remembered, even if individual test routes change later. */}
            <p className='mt-2 text-sm leading-6'>
              Näin testisivut löytyvät aina reitistä <span className='font-bold'>/test</span>, vaikka yksittäisiä
              testireittejä muutettaisiin myöhemmin.
            </p>
          </div>

          <nav aria-label='Testisivujen navigointi' className='flex flex-col gap-3'>
            <Link
              to='/test/animation/timer'
              className='flex min-h-11 flex-col rounded-2xl border-2 border-[#5a2d0c] bg-[#5a2d0c] px-4 py-4 text-white shadow-[0_4px_14px_rgba(90,45,12,0.2)] transition-transform active:scale-[0.99]'
            >
              <span className='text-base font-bold'>Ajastinanimaation testi</span>
              <span className='mt-1 text-sm text-[#fffbe9]'>
                Pelikanin kävely- ja lentoversiot, kesto, tauko ja uudelleenkäynnistys.
              </span>
            </Link>

            <Link
              to='/test/animation/celebration'
              className='flex min-h-11 flex-col rounded-2xl border-2 border-[#a0563f] bg-[#a0563f] px-4 py-4 text-white shadow-[0_4px_14px_rgba(160,86,63,0.2)] transition-transform active:scale-[0.99]'
            >
              <span className='text-base font-bold'>Valmis-animaation testi</span>
              <span className='mt-1 text-sm text-[#fffbe9]'>Pelikanin juhla-animaation versiot, kesto ja toisto.</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}
