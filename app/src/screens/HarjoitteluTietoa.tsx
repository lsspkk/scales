import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { AccordionSection } from '../components/ui/AccordionSection'
import { useViewport } from '../lib/useViewport'

const level1Scales = [
  { key: 'G', mode: 'Duuri', pos: '1.', oct: 2, note: 'Avoin G-kieli lähtökohtana' },
  { key: 'D', mode: 'Duuri', pos: '1.', oct: 2, note: 'Avoin D-kieli lähtökohtana' },
  { key: 'A', mode: 'Duuri', pos: '1.', oct: 2, note: 'Avoin A-kieli lähtökohtana' },
  { key: 'F', mode: 'Duuri', pos: '1.', oct: 2, note: '1 b — Bb A- ja E-kielillä' },
  { key: 'Bb', mode: 'Duuri', pos: '1.', oct: 1, note: '2 b' },
  { key: 'C', mode: 'Duuri', pos: '1.', oct: 2, note: 'Ei ylennyksiä eikä alennuksia' },
  { key: 'D', mode: 'Molli', pos: '1.', oct: 2, note: 'F-duurin rinnakkaismolli' },
  { key: 'G', mode: 'Molli', pos: '1.', oct: 2, note: 'Bb-duurin rinnakkaismolli' },
  { key: 'A', mode: 'Molli', pos: '1.', oct: 2, note: 'C-duurin rinnakkaismolli' },
  { key: 'E', mode: 'Molli', pos: '1.', oct: 1, note: 'G-duurin rinnakkaismolli' },
]

const level2Scales = [
  { key: 'G', mode: 'Duuri', pos: '1.–3.', oct: 2, shift: 'Siirto ylös B:llä (2. sormi, A-kieli)' },
  { key: 'D', mode: 'Duuri', pos: '1.–3.', oct: 2, shift: 'Siirto ylös F#:lla (2. sormi, E-kieli)' },
  { key: 'A', mode: 'Duuri', pos: '1.–3.', oct: 2, shift: 'Siirto ylös C#:lla (2. sormi, A-kieli)' },
  { key: 'E', mode: 'Duuri', pos: '1.–3.', oct: 2, shift: 'Siirto ylös G#:lla (2. sormi, E-kieli)' },
  { key: 'F', mode: 'Duuri', pos: '1.–3.', oct: 2, shift: 'Siirto ylös A:lla (1. sormi, E-kieli)' },
  { key: 'Bb', mode: 'Duuri', pos: '1.–3.', oct: 2, shift: 'Siirto ylös D:llä (1. sormi, A-kieli)' },
  { key: 'Eb', mode: 'Duuri', pos: '1.–3.', oct: 2, shift: 'Siirto ylös G:llä (1. sormi, D-kieli)' },
  { key: 'E', mode: 'Molli', pos: '1.–3.', oct: 2, shift: 'Siirto ylös G:llä (2. sormi, E-kieli)' },
  { key: 'B', mode: 'Molli', pos: '1.–3.', oct: 2, shift: 'Siirto ylös D:llä (1. sormi, A-kieli)' },
  { key: 'D', mode: 'Molli', pos: '1.–3.', oct: 2, shift: 'Siirto ylös F:llä (1. sormi, E-kieli)' },
  { key: 'G', mode: 'Molli', pos: '1.–3.', oct: 2, shift: 'Siirto ylös Bb:llä (1. sormi, A-kieli)' },
  { key: 'C', mode: 'Molli', pos: '1.–3.', oct: 2, shift: 'Siirto ylös Eb:llä (1. sormi, D-kieli)' },
]

const level3Scales = [
  { key: 'G', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. A-kielellä, 2.→3. E-kielellä' },
  { key: 'D', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. A-kielellä, 2.→3. E-kielellä' },
  { key: 'A', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. D-kielellä, 2.→3. A-kielellä' },
  { key: 'E', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. A-kielellä, 2.→3. E-kielellä' },
  { key: 'B', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. E-kielellä, 2.→3. E-kielellä' },
  { key: 'F', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. D-kielellä, 2.→3. A-kielellä' },
  { key: 'Bb', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. G-kielellä, 2.→3. D-kielellä' },
  { key: 'Eb', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. G-kielellä, 2.→3. D-kielellä' },
  { key: 'Ab', mode: 'Duuri', pos: '1.–2.–3.', oct: 2, shift: '1.→2. D-kielellä, 2.→3. A-kielellä' },
  { key: 'E', mode: 'Molli', pos: '1.–2.–3.', oct: 2, shift: '1.→2. A-kielellä, 2.→3. E-kielellä' },
  { key: 'B', mode: 'Molli', pos: '1.–2.–3.', oct: 2, shift: '1.→2. E-kielellä, 2.→3. E-kielellä' },
  { key: 'F#', mode: 'Molli', pos: '1.–2.–3.', oct: 2, shift: '1.→2. A-kielellä, 2.→3. E-kielellä' },
  { key: 'C', mode: 'Molli', pos: '1.–2.–3.', oct: 2, shift: '1.→2. G-kielellä, 2.→3. D-kielellä' },
  { key: 'D', mode: 'Molli', pos: '1.–2.–3.', oct: 2, shift: '1.→2. D-kielellä, 2.→3. A-kielellä' },
]

function ScaleTable1({ scales }: { scales: typeof level1Scales }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-base text-left border-collapse'>
        <thead>
          <tr className='bg-[#f0dbb8] text-[#5a2d0c]'>
            <th className='px-2 py-2 font-bold'>#</th>
            <th className='px-2 py-2 font-bold'>Sävel</th>
            <th className='px-2 py-2 font-bold'>Moodi</th>
            <th className='px-2 py-2 font-bold'>Asema</th>
            <th className='px-2 py-2 font-bold'>Okt.</th>
            <th className='px-2 py-2 font-bold'>Huomio</th>
          </tr>
        </thead>
        <tbody>
          {scales.map((s, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-[#fffbe9]' : 'bg-[#faf3d8]'}>
              <td className='px-2 py-2 text-[#8B4513]'>{i + 1}</td>
              <td className='px-2 py-2 font-semibold text-[#5a2d0c]'>{s.key}</td>
              <td className='px-2 py-2 text-[#5a2d0c]'>{s.mode}</td>
              <td className='px-2 py-2 text-[#5a2d0c]'>{s.pos}</td>
              <td className='px-2 py-2 text-[#5a2d0c]'>{s.oct}</td>
              <td className='px-2 py-2 text-sm text-[#8B4513]'>{s.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ScaleTable23({ scales }: { scales: typeof level2Scales }) {
  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-base text-left border-collapse'>
        <thead>
          <tr className='bg-[#f0dbb8] text-[#5a2d0c]'>
            <th className='px-2 py-2 font-bold'>#</th>
            <th className='px-2 py-2 font-bold'>Sävel</th>
            <th className='px-2 py-2 font-bold'>Moodi</th>
            <th className='px-2 py-2 font-bold'>Asemat</th>
            <th className='px-2 py-2 font-bold'>Okt.</th>
            <th className='px-2 py-2 font-bold'>Siirtyminen</th>
          </tr>
        </thead>
        <tbody>
          {scales.map((s, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-[#fffbe9]' : 'bg-[#faf3d8]'}>
              <td className='px-2 py-2 text-[#8B4513]'>{i + 1}</td>
              <td className='px-2 py-2 font-semibold text-[#5a2d0c]'>{s.key}</td>
              <td className='px-2 py-2 text-[#5a2d0c]'>{s.mode}</td>
              <td className='px-2 py-2 text-[#5a2d0c]'>{s.pos}</td>
              <td className='px-2 py-2 text-[#5a2d0c]'>{s.oct}</td>
              <td className='px-2 py-2 text-sm text-[#8B4513]'>{s.shift}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Info screen explaining the practice method, levels, positions, shifts, arpeggios, and sources. */
export function HarjoitteluTietoa() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const isMobile = !isDesktop

  return (
    <div className='flex flex-col h-full bg-[#fffbe9]'>
      {!isDesktop && (
        <ScreenHeader title='Tietoa harjoittelusta' color='red' onBack={() => navigate('/harjoittelu')} />
      )}

      {isDesktop && (
        <div className='w-full bg-[#a0563f] border-b border-[#3a1a00]'>
          <div className='max-w-[1200px] mx-auto px-8 flex justify-end'>
            <button
              onClick={() => navigate('/harjoittelu')}
              className='inline-flex items-center gap-2 px-3 py-1 rounded text-sm font-semibold text-white hover:bg-[#b86a52] focus:outline focus:outline-2 focus:outline-[#fffbe9]'
              aria-label='Takaisin'
            >
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <polyline points='15 18 9 12 15 6' />
              </svg>
              <span>Takaisin</span>
            </button>
          </div>
        </div>
      )}

      <div className='flex-1 overflow-y-auto'>
        <div className={isDesktop ? 'max-w-[700px] mx-auto px-8 py-6' : 'px-4 pt-3 pb-4'}>
          {isDesktop && (
            <h1 className='font-medieval text-3xl text-[#5a2d0c] mb-4'>Tietoa harjoittelusta</h1>
          )}
          <AccordionSection title='Harjoitusmenetelmä' isMobile={isMobile} defaultOpen={true}>
            <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
              Tämä harjoitusohjelma perustuu <strong>Carl Fleschin</strong> kvinttiympyrämenetelmään, joka on viulistien
              asteikkoharjoittelun klassinen standardi. Avainsävelten järjestys noudattaa kvinttiympyrää: jokainen uusi
              sävel lisää yhden ylennyksen tai alennuksen edelliseen verrattuna, joten vasen käsi sopeutuu vähitellen.
            </p>
            <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
              Flesch (<em>Scale System</em>, 1926) ja Galamian (<em>Principles of Violin Playing and Teaching</em>, 1962)
              käyttävät molemmat kvinttiympyrää järjestyksen perustana. Tämä on parempi vaihtoehto kuin kromaattinen
              järjestys (C, Cis, D, Dis…), joka hyppää sormiasemasta toiseen ennakoimattomasti.
            </p>
            <p className='text-base leading-relaxed text-[#3a1a00]'>
              Harjoitusohjelma on jaettu kolmeen taitotasoon teknisen vaativuuden mukaan: ylennys- ja alennus­merkkien
              määrä, kielivaihdot sekä asemavaatimukset.
            </p>
          </AccordionSection>

          <AccordionSection title='Taso 1 – Ensimmäinen asema' isMobile={isMobile}>
            <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
              0–2 ylennystä tai alennusta. Kaikki asteikot soitetaan ensimmäisessä asemassa. Kaksi oktaavia aina kun ambitus
              sen sallii, muuten yksi oktaavi.
            </p>
            <ScaleTable1 scales={level1Scales} />
          </AccordionSection>

          <AccordionSection title='Taso 2 – Asemavaihdot (1.–3. asema)' isMobile={isMobile}>
            <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
              1–3 ylennystä tai alennusta. Asteikot soitetaan ensimmäisessä ja kolmannessa asemassa. Jokaisella asteikolla
              on nimetty siirtymispiste.
            </p>
            <ScaleTable23 scales={level2Scales} />
          </AccordionSection>

          <AccordionSection title='Taso 3 – Kolme asemaa' isMobile={isMobile}>
            <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
              Enintään 4–5 ylennystä tai alennusta. Asteikot käyttävät kaikkia kolmea asemaa (1., 2. ja 3.). Sisältää sekä
              1.→2. että 2.→3. asemavaihdot.
            </p>
            <ScaleTable23 scales={level3Scales} />
          </AccordionSection>

          <AccordionSection title='Asemat' isMobile={isMobile}>
            <div className='space-y-4'>
              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>1. asema</h3>
                <p className='text-base leading-relaxed text-[#3a1a00]'>
                  Perusasema. Kaikki neljä sormea ovat luonnollisessa etäisyydessään: 1. sormi kokosävelaskel avoimen kielen
                  yläpuolella, 2. sormi joko korkealla (kokosävelaskel 1. sormesta) tai matalalla (puolisävelaskel 1.
                  sormesta) sävellajin mukaan, 3. sormi kvartti avoimen kielen yläpuolella, 4. sormi seuraavan alempana
                  olevan avoimen kielen oktaavissa.
                </p>
                <p className='text-sm text-[#8B4513] mt-1 italic'>
                  Hallittu kun: soittaja pystyy soittamaan kaikki tason 1 asteikot puhtaasti tasaisella äänenlaaulla.
                </p>
              </div>
              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>2. asema</h3>
                <p className='text-base leading-relaxed text-[#3a1a00]'>
                  Käsi siirtyy askeleen ylöspäin niin, että 1. sormi on siellä, missä 2. sormi oli 1. asemassa.
                </p>
                <p className='text-base leading-relaxed text-[#3a1a00] mt-2'>
                  <strong>Galamianin harjoittelutapa:</strong> aloita asteikolla, jonka jo osaat 1. asemassa. Soita sama
                  asteikko mutta aloita asemavaihto kolmen ensimmäisen nuotin jälkeen. Korva voi tarkistaa intonaation
                  tunnetun 1. aseman version perusteella.
                </p>
                <p className='text-base leading-relaxed text-[#3a1a00] mt-2'>
                  <strong>Harjoitus:</strong> soita G-duuriasteikko yhden oktaavin verran G-kielellä. Soita G–A–H 1.
                  asemassa, siirry sitten 2. asemaan C:lle ja jatka C–D–E–F#–G. Laske sama järjestys alas.
                </p>
              </div>
              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>3. asema</h3>
                <p className='text-base leading-relaxed text-[#3a1a00]'>
                  Käsi siirtyy ylöspäin niin, että 1. sormi on siellä, missä 3. sormi oli 1. asemassa (pieni tai suuri
                  terssi avoimen kielen yläpuolella sävellajin mukaan).
                </p>
                <p className='text-base leading-relaxed text-[#3a1a00] mt-2'>
                  <strong>Harjoittelun aloitus:</strong> useimmat oppikirjat (Suzuki vol. 4–5, Sassmannshaus vol. 3)
                  esittelevät 3. aseman A-kielen kautta, jossa 1. sormi 3. asemassa soittaa Cis:n tai C:n — nuotteja, jotka
                  voidaan helposti tarkistaa avointa A-kieltä vasten (terssi yläpuolella).
                </p>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title='Siirtymisharjoitukset' isMobile={isMobile}>
            <div className='space-y-4'>
              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Yleiset periaatteet (Galamian)</h3>
                <ol className='list-decimal list-inside space-y-1 text-base text-[#3a1a00]'>
                  <li>Kuule kohdenuotti mielessäsi ennen siirtymistä.</li>
                  <li>Vapauta sormienpaine siirtymisen aikana — käsi liukuu, ei hyppää.</li>
                  <li>
                    Opassormi-tekniikka: käden alla oleva sormi ohjaa siirtymisen; kohdenuotin sormi laskeutuu vasta perille
                    päästyä.
                  </li>
                  <li>Harjoittele ensin hitaasti kuuluvan liukuman kanssa, vähennä sitten liukumaa asteittain.</li>
                  <li>Tarkista intonaatio soittamalla kohdenuotti flageolettina tai avointa kieltä vasten.</li>
                </ol>
              </div>

              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Harjoitus 1: 1. → 3. asema (A-kieli)</h3>
                <p className='text-base font-mono bg-[#f5e9cc] rounded px-3 py-2 text-[#3a1a00] mb-2'>
                  1. as.: A(avoin) – H(1) – Cis(2) – [siirto] → 3. as.: D(1) – E(2) – F#(3) – Gis(4)
                </p>
                <p className='text-base text-[#3a1a00]'>
                  Siirto 1. sormella: 2. sormi (Cis) ohjaa liukuman ylös D:lle (1. sormi 3. asemassa). Harjoittele
                  siirtymisnotaatioparia Cis→D erikseen hitaalla glissandolla, integroi sitten koko asteikkoon.
                </p>
              </div>

              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Harjoitus 2: 1. → 2. asema (A-kieli)</h3>
                <p className='text-base font-mono bg-[#f5e9cc] rounded px-3 py-2 text-[#3a1a00] mb-2'>
                  1. as.: A(avoin) – H(1) – [siirto] → 2. as.: Cis(2) – D(2) – E(3) – F#(4)
                </p>
                <p className='text-base text-[#3a1a00]'>
                  Siirto 1. asemasta 2. asemaan 1. sormen opastuksella. 1. sormi liukuu H:sta ylös C:lle (tai Cis:lle).
                  Pienempi siirto — vaatii tarkkaa intonaation hallintaa.
                </p>
              </div>

              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Harjoitus 3: 2. → 3. asema (E-kieli)</h3>
                <p className='text-base font-mono bg-[#f5e9cc] rounded px-3 py-2 text-[#3a1a00] mb-2'>
                  2. as.: F#(1) – Gis(2) – [siirto] → 3. as.: A(1) – H(2) – Cis(3)
                </p>
                <p className='text-base text-[#3a1a00]'>
                  Ohjaa 1. tai 2. sormella tilanteen mukaan. Tarkista saapumisnuotti avointa A-kieltä vasten.
                </p>
              </div>

              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Harjoitus 4: Laskevat siirrot (kaikki asemat)</h3>
                <p className='text-base text-[#3a1a00]'>
                  Laskevat siirrot ovat vaikeampia, koska painovoima ja käsivarren paino vaikeuttavat liikettä. Harjoittele
                  vapauttamalla sormienpaine ennen alaspäistä siirtoa, ylläpitä kyynärvarren tuki (kyynärpää ei romahda), ja
                  käytä samaa hidas-glissando-lähestymistä tarkistaen intonaation avoimilla kielillä.
                </p>
              </div>

              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Siirtymisrutiini kullekin asteikolla</h3>
                <ol className='list-decimal list-inside space-y-1 text-base text-[#3a1a00]'>
                  <li>
                    Soita siirtymäpari (viimeinen nuotti ennen siirtoa + ensimmäinen nuotti sen jälkeen) 5 kertaa hitaasti
                    kuuluvalla liukumalla.
                  </li>
                  <li>Soita siirtymäpari 5 kertaa tempossa minimaalisella liukumalla.</li>
                  <li>Soita koko asteikko hitaasti, pysähdy hetkeksi siirtymäkohdassa.</li>
                  <li>Soita koko asteikko tempossa.</li>
                </ol>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title='Arpeggiot' isMobile={isMobile}>
            <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
              Jokainen asteikko harjoitellaan yhdessä toonikan arpeggion (sävelkolmisoinnun murto) kanssa. Arpeggiot
              vahvistavat sävellajin tuntemusta ja harjoittelevat laajempia intervallejа.
            </p>

            <div className='space-y-3 mb-4'>
              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>Taso 1</h3>
                <p className='text-base text-[#3a1a00]'>Yhden oktaavin toonika-arpeggio 1. asemassa, neljäsosanuoteilla.</p>
              </div>
              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>Taso 2</h3>
                <p className='text-base text-[#3a1a00]'>
                  Kahden oktaavin toonika-arpeggio, 1.–3. asemassa siirtymisen kanssa.
                </p>
              </div>
              <div>
                <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>Taso 3</h3>
                <p className='text-base text-[#3a1a00]'>
                  Kahden oktaavin toonika-arpeggio kaikissa kolmessa asemassa, kahdeksasosanuoteilla.
                </p>
              </div>
            </div>

            <div className='bg-[#f5e9cc] rounded-lg px-4 py-3'>
              <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Esimerkki: G-duuriarpeggio</h3>
              <p className='text-base font-mono text-[#3a1a00] leading-relaxed'>
                Taso 1 (1. as.): G – H – D – G<br />
                Taso 2 (1.→3.): G – H – D – G – H – D – G<br />
                Taso 3 (1.→2.→3.): samat nuotit, siirto H:lla (1.→2.) ja G:llä (2.→3.)
              </p>
            </div>
          </AccordionSection>

          <AccordionSection title='Lähteet' isMobile={isMobile}>
            <ol className='list-decimal list-inside space-y-3 text-base text-[#3a1a00]'>
              <li>
                <strong>Flesch, Carl.</strong> <em>Scale System.</em> Carl Fischer, 1926 (uudistettu painos 1987).
                Standardi­viite systemaattiselle asteikko­harjoittelulle. Järjestää asteikot kvinttiympyrän mukaan
                progressiivisin teknisin vaatimuksin. Käytetty ensisijaisena lähteenä sävellajijärjestykselle.
              </li>
              <li>
                <strong>Galamian, Ivan.</strong> <em>Principles of Violin Playing and Teaching.</em>
                Prentice-Hall, 1962 (3. painos, Shar Products, 1985). Luku asemavaihdosta: opassormi-menetelmä, mentaalinen
                valmistautuminen, paineen vapauttaminen. Käytetty ensisijaisena lähteenä asemavaihto-periaatteille.
              </li>
              <li>
                <strong>Galamian, Ivan &amp; Neumann, Frederick.</strong>{' '}
                <em>Contemporary Violin Technique, Vol. 1: Scale and Arpeggio Exercises.</em> Galaxy Music, 1962. Täydentävä
                harjoituskirja. Tarjoaa spesifisiä asemavaihdos- ja arpeggioharjoituksia kaikissa asemissa.
              </li>
              <li>
                <strong>Sassmannshaus, Kurt.</strong> <em>Early Start on the Violin, Vols. 1–4.</em>
                Baerenreiter, 2008. Progressiivinen metodi asemien käyttöönottoon: 1. asema (osat 1–2), 3. asema (osa 3), 2.
                ja ylempiä asemia (osa 4).
              </li>
              <li>
                <strong>Suzuki, Shinichi.</strong> <em>Suzuki Violin School, Vols. 1–8.</em>
                Summy-Birchard / Alfred Music. 3. asema esitellään kirjoissa 4–5. Vaikka kyseessä on ensisijaisesti
                ohjelmistometodi, progressiivinen sävellajien esittely on linjassa tässä käytetyn
                kvinttiympyrä-lähestymistavan kanssa.
              </li>
              <li>
                <strong>Fischer, Simon.</strong> <em>Practice: 250 Step-by-Step Practice Methods for the Violin.</em>
                Edition Peters, 2004. Käytännön ohjeita asemavaihtojen, arpeggioiden ja asteikkorutiinien harjoitteluun.
                Suositeltu lisäharjoituslähteeksi.
              </li>
            </ol>
          </AccordionSection>
        </div>
      </div>
    </div>
  )
}
