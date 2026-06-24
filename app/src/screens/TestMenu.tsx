import { Link, useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'

type TestMenuTone = 'brown' | 'red'

interface TestMenuItem {
  to: string
  title: string
  description: string
  tone: TestMenuTone
}

interface TestMenuLinkCardProps {
  item: TestMenuItem
}

const TEST_MENU_ITEMS: TestMenuItem[] = [
  {
    to: '/test/animation/timer',
    title: 'Ajastinanimaation testi',
    description: 'Pelikanin kävely- ja lentoversiot, kesto, tauko ja uudelleenkäynnistys.',
    tone: 'brown',
  },
  {
    to: '/test/animation/celebration',
    title: 'Valmis-animaation testi',
    description: 'Pelikanin juhla-animaation versiot, kesto ja toisto.',
    tone: 'red',
  },
  {
    to: '/test/audio',
    title: 'Äänimoottorin testi',
    description: 'Sample, pohjasävel ja sointu — moniääninen taustaääni.',
    tone: 'brown',
  },
  {
    to: '/test/tuner',
    title: 'Viritin',
    description: 'Mikrofonikuuntelu: sävelen nimi ja vireys neulamittarissa.',
    tone: 'brown',
  },
  {
    to: '/test/scaletuner',
    title: 'Asteikkoviritin',
    description: 'Soita asteikon sävelet vireeseen — tarkkuus, kesto ja satunnaisarvonta.',
    tone: 'red',
  },
  {
    to: '/test/starflight',
    title: 'Lentävä tähti',
    description: 'Vaaleanindigonvärinen tähti lentää reunalta, kiertää ja katoaa toiselle reunalle.',
    tone: 'brown',
  },
  {
    to: '/test/necklace',
    title: 'Kaulakorugrafiikka',
    description: 'Pyörivä jalokivikaulakoru: malmi, hionta ja kimallus — muoto-, kivi-, ketju- ja teemavaihtoehdot.',
    tone: 'red',
  },
  {
    to: '/test/jalokiviasteikko',
    title: 'Jalokiviasteikko (testitila)',
    description: 'Aseta jokaisen kiven laatu liukurilla tai näppäimistöllä, arvo satunnainen kaulakoru ja siirry ihailemaan.',
    tone: 'red',
  },
  {
    to: '/test/themes',
    title: 'Teemapaja',
    description: 'Selaa 30 kaulakorua, napauta parhaat, arvo värit (🎨) tai muodot (◆) uudelleen ja vie valitut teemat TypeScriptinä.',
    tone: 'red',
  },
]

function getTestMenuLinkToneClasses(tone: TestMenuTone): string {
  if (tone === 'red') {
    return 'border-[#a0563f] bg-[#a0563f] shadow-[0_4px_14px_rgba(160,86,63,0.2)]'
  }

  return 'border-[#5a2d0c] bg-[#5a2d0c] shadow-[0_4px_14px_rgba(90,45,12,0.2)]'
}

function TestMenuLinkCard({ item }: TestMenuLinkCardProps) {
  return (
    <Link
      to={item.to}
      className={`flex flex-col rounded border-2 p-1 text-white transition-transform active:scale-[0.99] ${getTestMenuLinkToneClasses(item.tone)}`}
    >
      <span className='text-sm font-bold'>{item.title}</span>
      <span className='mt-1 text-xs text-[#fffbe9]'>{item.description}</span>
    </Link>
  )
}

export function TestMenu() {
  const navigate = useNavigate()

  return (
    <div className='flex min-h-screen flex-col bg-[#fffbe9]'>
      <ScreenHeader title='Testisivut' onBack={() => navigate('/')} />

      <div className='flex-1 overflow-y-auto px-4 py-4'>
        <div className='mx-auto flex max-w-175 flex-col gap-2'>
          <nav aria-label='Testisivujen navigointi' className='flex flex-col gap-1'>
            {TEST_MENU_ITEMS.map((item) => (
              <TestMenuLinkCard key={item.to} item={item} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
