import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { AccordionSection } from '../components/ui/AccordionSection'
import { ScaleDetailPanel } from '../components/ui/ScaleDetailPanel'
import { ScaleDetailModal } from '../components/ui/ScaleDetailModal'
import { useViewport } from '../lib/useViewport'
import { usePracticeStore } from '../stores/practiceStore'
import { formatScaleLabel, formatPositions, getScaleDetail, getScaleKey, type ScaleEntry } from '../lib/practiceMethod'

// ── Scale data for the info page (unchanged from Task 10) ──

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

// ── Info page tables ──

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

// ── Info tab content ──

function InfoTab({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <AccordionSection title='Harjoitusmenetelmä' isMobile={isMobile} defaultOpen={true}>
        <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
          Tämä harjoitusohjelma perustuu <strong>Carl Fleschin</strong> kvinttiympyrämenetelmään, joka on viulistien asteikkoharjoittelun klassinen standardi.
          Avainsävelten järjestys noudattaa kvinttiympyrää: jokainen uusi sävel lisää yhden ylennyksen tai alennuksen edelliseen verrattuna, joten vasen käsi
          sopeutuu vähitellen.
        </p>
        <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
          Flesch (<em>Scale System</em>, 1926) ja Galamian (<em>Principles of Violin Playing and Teaching</em>, 1962) käyttävät molemmat kvinttiympyrää
          järjestyksen perustana. Tämä on parempi vaihtoehto kuin kromaattinen järjestys (C, Cis, D, Dis…), joka hyppää sormiasemasta toiseen ennakoimattomasti.
        </p>
        <p className='text-base leading-relaxed text-[#3a1a00]'>
          Harjoitusohjelma on jaettu kolmeen taitotasoon teknisen vaativuuden mukaan: ylennys- ja alennus­merkkien määrä, kielivaihdot sekä asemavaatimukset.
        </p>
      </AccordionSection>

      <AccordionSection title='Taso 1 – Ensimmäinen asema' isMobile={isMobile}>
        <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
          0–2 ylennystä tai alennusta. Kaikki asteikot soitetaan ensimmäisessä asemassa. Kaksi oktaavia aina kun ambitus sen sallii, muuten yksi oktaavi.
        </p>
        <ScaleTable1 scales={level1Scales} />
      </AccordionSection>

      <AccordionSection title='Taso 2 – Asemavaihdot (1.–3. asema)' isMobile={isMobile}>
        <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
          1–3 ylennystä tai alennusta. Asteikot soitetaan ensimmäisessä ja kolmannessa asemassa. Jokaisella asteikolla on nimetty siirtymispiste.
        </p>
        <ScaleTable23 scales={level2Scales} />
      </AccordionSection>

      <AccordionSection title='Taso 3 – Kolme asemaa' isMobile={isMobile}>
        <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
          Enintään 4–5 ylennystä tai alennusta. Asteikot käyttävät kaikkia kolmea asemaa (1., 2. ja 3.). Sisältää sekä 1.→2. että 2.→3. asemavaihdot.
        </p>
        <ScaleTable23 scales={level3Scales} />
      </AccordionSection>

      <AccordionSection title='Asemat' isMobile={isMobile}>
        <div className='space-y-4'>
          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>1. asema</h3>
            <p className='text-base leading-relaxed text-[#3a1a00]'>
              Perusasema. Kaikki neljä sormea ovat luonnollisessa etäisyydessään: 1. sormi kokosävelaskel avoimen kielen yläpuolella, 2. sormi joko korkealla
              (kokosävelaskel 1. sormesta) tai matalalla (puolisävelaskel 1. sormesta) sävellajin mukaan, 3. sormi kvartti avoimen kielen yläpuolella, 4. sormi
              seuraavan alempana olevan avoimen kielen oktaavissa.
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
              <strong>Galamianin harjoittelutapa:</strong> aloita asteikolla, jonka jo osaat 1. asemassa. Soita sama asteikko mutta aloita asemavaihto kolmen
              ensimmäisen nuotin jälkeen. Korva voi tarkistaa intonaation tunnetun 1. aseman version perusteella.
            </p>
            <p className='text-base leading-relaxed text-[#3a1a00] mt-2'>
              <strong>Harjoitus:</strong> soita G-duuriasteikko yhden oktaavin verran G-kielellä. Soita G–A–H 1. asemassa, siirry sitten 2. asemaan C:lle ja
              jatka C–D–E–F#–G. Laske sama järjestys alas.
            </p>
          </div>
          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>3. asema</h3>
            <p className='text-base leading-relaxed text-[#3a1a00]'>
              Käsi siirtyy ylöspäin niin, että 1. sormi on siellä, missä 3. sormi oli 1. asemassa (pieni tai suuri terssi avoimen kielen yläpuolella sävellajin
              mukaan).
            </p>
            <p className='text-base leading-relaxed text-[#3a1a00] mt-2'>
              <strong>Harjoittelun aloitus:</strong> useimmat oppikirjat (Suzuki vol. 4–5, Sassmannshaus vol. 3) esittelevät 3. aseman A-kielen kautta, jossa 1.
              sormi 3. asemassa soittaa Cis:n tai C:n — nuotteja, jotka voidaan helposti tarkistaa avointa A-kieltä vasten (terssi yläpuolella).
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
              <li>Opassormi-tekniikka: käden alla oleva sormi ohjaa siirtymisen; kohdenuotin sormi laskeutuu vasta perille päästyä.</li>
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
              Siirto 1. sormella: 2. sormi (Cis) ohjaa liukuman ylös D:lle (1. sormi 3. asemassa). Harjoittele siirtymisnotaatioparia Cis→D erikseen hitaalla
              glissandolla, integroi sitten koko asteikkoon.
            </p>
          </div>

          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Harjoitus 2: 1. → 2. asema (A-kieli)</h3>
            <p className='text-base font-mono bg-[#f5e9cc] rounded px-3 py-2 text-[#3a1a00] mb-2'>
              1. as.: A(avoin) – H(1) – [siirto] → 2. as.: Cis(2) – D(2) – E(3) – F#(4)
            </p>
            <p className='text-base text-[#3a1a00]'>
              Siirto 1. asemasta 2. asemaan 1. sormen opastuksella. 1. sormi liukuu H:sta ylös C:lle (tai Cis:lle). Pienempi siirto — vaatii tarkkaa intonaation
              hallintaa.
            </p>
          </div>

          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Harjoitus 3: 2. → 3. asema (E-kieli)</h3>
            <p className='text-base font-mono bg-[#f5e9cc] rounded px-3 py-2 text-[#3a1a00] mb-2'>
              2. as.: F#(1) – Gis(2) – [siirto] → 3. as.: A(1) – H(2) – Cis(3)
            </p>
            <p className='text-base text-[#3a1a00]'>Ohjaa 1. tai 2. sormella tilanteen mukaan. Tarkista saapumisnuotti avointa A-kieltä vasten.</p>
          </div>

          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Harjoitus 4: Laskevat siirrot (kaikki asemat)</h3>
            <p className='text-base text-[#3a1a00]'>
              Laskevat siirrot ovat vaikeampia, koska painovoima ja käsivarren paino vaikeuttavat liikettä. Harjoittele vapauttamalla sormienpaine ennen
              alaspäistä siirtoa, ylläpitä kyynärvarren tuki (kyynärpää ei romahda), ja käytä samaa hidas-glissando-lähestymistä tarkistaen intonaation
              avoimilla kielillä.
            </p>
          </div>

          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-2'>Siirtymisrutiini kullekin asteikolla</h3>
            <ol className='list-decimal list-inside space-y-1 text-base text-[#3a1a00]'>
              <li>Soita siirtymäpari (viimeinen nuotti ennen siirtoa + ensimmäinen nuotti sen jälkeen) 5 kertaa hitaasti kuuluvalla liukumalla.</li>
              <li>Soita siirtymäpari 5 kertaa tempossa minimaalisella liukumalla.</li>
              <li>Soita koko asteikko hitaasti, pysähdy hetkeksi siirtymäkohdassa.</li>
              <li>Soita koko asteikko tempossa.</li>
            </ol>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title='Arpeggiot' isMobile={isMobile}>
        <p className='text-base leading-relaxed text-[#3a1a00] mb-3'>
          Jokainen asteikko harjoitellaan yhdessä toonikan arpeggion (sävelkolmisoinnun murto) kanssa. Arpeggiot vahvistavat sävellajin tuntemusta ja
          harjoittelevat laajempia intervallejа.
        </p>

        <div className='space-y-3 mb-4'>
          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>Taso 1</h3>
            <p className='text-base text-[#3a1a00]'>Yhden oktaavin toonika-arpeggio 1. asemassa, neljäsosanuoteilla.</p>
          </div>
          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>Taso 2</h3>
            <p className='text-base text-[#3a1a00]'>Kahden oktaavin toonika-arpeggio, 1.–3. asemassa siirtymisen kanssa.</p>
          </div>
          <div>
            <h3 className='text-base font-bold text-[#5a2d0c] mb-1'>Taso 3</h3>
            <p className='text-base text-[#3a1a00]'>Kahden oktaavin toonika-arpeggio kaikissa kolmessa asemassa, kahdeksasosanuoteilla.</p>
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
            <strong>Flesch, Carl.</strong> <em>Scale System.</em> Carl Fischer, 1926 (uudistettu painos 1987). Standardi­viite systemaattiselle
            asteikko­harjoittelulle. Järjestää asteikot kvinttiympyrän mukaan progressiivisin teknisin vaatimuksin. Käytetty ensisijaisena lähteenä
            sävellajijärjestykselle.
          </li>
          <li>
            <strong>Galamian, Ivan.</strong> <em>Principles of Violin Playing and Teaching.</em>
            Prentice-Hall, 1962 (3. painos, Shar Products, 1985). Luku asemavaihdosta: opassormi-menetelmä, mentaalinen valmistautuminen, paineen vapauttaminen.
            Käytetty ensisijaisena lähteenä asemavaihto-periaatteille.
          </li>
          <li>
            <strong>Galamian, Ivan &amp; Neumann, Frederick.</strong> <em>Contemporary Violin Technique, Vol. 1: Scale and Arpeggio Exercises.</em> Galaxy
            Music, 1962. Täydentävä harjoituskirja. Tarjoaa spesifisiä asemavaihdos- ja arpeggioharjoituksia kaikissa asemissa.
          </li>
          <li>
            <strong>Sassmannshaus, Kurt.</strong> <em>Early Start on the Violin, Vols. 1–4.</em>
            Baerenreiter, 2008. Progressiivinen metodi asemien käyttöönottoon: 1. asema (osat 1–2), 3. asema (osa 3), 2. ja ylempiä asemia (osa 4).
          </li>
          <li>
            <strong>Suzuki, Shinichi.</strong> <em>Suzuki Violin School, Vols. 1–8.</em>
            Summy-Birchard / Alfred Music. 3. asema esitellään kirjoissa 4–5. Vaikka kyseessä on ensisijaisesti ohjelmistometodi, progressiivinen sävellajien
            esittely on linjassa tässä käytetyn kvinttiympyrä-lähestymistavan kanssa.
          </li>
          <li>
            <strong>Fischer, Simon.</strong> <em>Practice: 250 Step-by-Step Practice Methods for the Violin.</em>
            Edition Peters, 2004. Käytännön ohjeita asemavaihtojen, arpeggioiden ja asteikkorutiinien harjoitteluun. Suositeltu lisäharjoituslähteeksi.
          </li>
        </ol>
      </AccordionSection>
    </>
  )
}

// ── Practice tab content ──

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

function PracticeTab({ selectedScale, onSelectScale }: { selectedScale: ScaleEntry | null; onSelectScale: (scale: ScaleEntry | null) => void }) {
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
          Sovellus arpoo valitun taitotason asteikot satunnaiseen järjestykseen ja luo harjoituslistan, jonka voit käydä läpi omaan tahtiisi. Satunnainen
          järjestys pakottaa sinut harjoittelemaan myös vähemmän tuttuja sävellajeja eikä vain suosikkejasi. Käy lista läpi viikon tai parin aikana ja arvo
          sitten uusi järjestys — näin harjoittelu pysyy monipuolisena.
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
          className='text-sm text-[#8B4513] underline min-h-[44px] px-2'
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
      <div className='space-y-1'>
        {practiceSet.map((item, index) => (
          <div
            key={getScaleKey(item.scale)}
            className={`w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              item.done ? 'bg-[#f0dbb8] opacity-60' : 'bg-[#fffbe9] border border-[#c9a96e]'
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleDone(index)}
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

            {/* Scale label */}
            <div className='flex-1 min-w-0'>
              <span className={`text-base font-semibold ${item.done ? 'line-through text-[#8B4513]' : 'text-[#5a2d0c]'}`}>{formatScaleLabel(item.scale)}</span>
              <span className='text-sm text-[#8B4513] ml-2'>{formatPositions(item.scale)} as.</span>
              {item.scale.shiftPattern && <div className={`text-xs mt-0.5 ${item.done ? 'text-[#8B4513]' : 'text-[#8B4513]'}`}>{item.scale.shiftPattern}</div>}
            </div>

            {/* Info button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelectScale(selectedScale === item.scale ? null : item.scale)
              }}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                selectedScale === item.scale ? 'bg-[#8B2500] text-white' : 'text-[#8B4513] hover:bg-[#f0dbb8]'
              }`}
              aria-label='Näytä tiedot'
            >
              <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <circle cx='10' cy='10' r='9' stroke='currentColor' strokeWidth='1.5' />
                <text x='10' y='14.5' textAnchor='middle' fill='currentColor' fontSize='12' fontWeight='600' fontFamily='serif'>
                  i
                </text>
              </svg>
            </button>

            {/* Soittohetki button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                const params = new URLSearchParams({
                  root: item.scale.key,
                  mode: item.scale.mode,
                  octaves: String(item.scale.octaves),
                })
                navigateToSoittohetki(`/soittohetki?${params.toString()}`)
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
        ))}
      </div>
    </div>
  )

  // Desktop: two-column layout with side panel
  if (isDesktop) {
    const detail = selectedScale ? getScaleDetail(selectedScale) : null
    return (
      <div className='flex gap-6'>
        <div className='flex-1 min-w-0'>{practiceList}</div>
        <div className='w-[300px] shrink-0'>
          {detail ? (
            <div className='sticky top-4 bg-[#faf3d8] border border-[#c9a96e] rounded-xl p-4'>
              <h3 className='text-lg font-bold text-[#5a2d0c] mb-4 pb-2 border-b border-[#c9a96e]'>{detail.label}</h3>
              <ScaleDetailPanel detail={detail} />
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
        <ScaleDetailModal title={`${formatScaleLabel(selectedScale)} — ${formatPositions(selectedScale)} as.`} onClose={() => onSelectScale(null)}>
          <ScaleDetailPanel detail={getScaleDetail(selectedScale)} />
        </ScaleDetailModal>
      )}
    </>
  )
}

// ── Main component ──

/** Harjoittelu screen with info and practice tabs. */
export function Harjoittelu() {
  const navigate = useNavigate()
  const { isDesktop } = useViewport()
  const isMobile = !isDesktop
  const [tab, setTab] = useState<'info' | 'practice'>('practice')
  const [selectedScale, setSelectedScale] = useState<ScaleEntry | null>(null)

  const handleSelectScale = useCallback((scale: ScaleEntry | null) => {
    setSelectedScale(scale)
  }, [])

  // Widen container on desktop when practice tab is active (two-column layout needs more space)
  const desktopMaxWidth = tab === 'practice' ? 'max-w-[900px]' : 'max-w-[700px]'

  const tabBar = (
    <div className='flex border-b border-[#c9a96e]'>
      <button
        onClick={() => {
          setTab('info')
          setSelectedScale(null)
        }}
        className={`flex-1 min-h-[44px] py-2 text-base font-semibold transition-colors ${
          tab === 'info' ? 'text-[#8B2500] border-b-2 border-[#8B2500] bg-[#fffbe9]' : 'text-[#8B4513] bg-[#f5e9cc]'
        }`}
      >
        Tietoa
      </button>
      <button
        onClick={() => setTab('practice')}
        className={`flex-1 min-h-[44px] py-2 text-base font-semibold transition-colors ${
          tab === 'practice' ? 'text-[#8B2500] border-b-2 border-[#8B2500] bg-[#fffbe9]' : 'text-[#8B4513] bg-[#f5e9cc]'
        }`}
      >
        Harjoittele
      </button>
    </div>
  )

  return (
    <div className='flex flex-col h-full bg-[#fffbe9]'>
      <ScreenHeader title='Harjoittelu' color='red' onBack={() => navigate('/')} />

      {isMobile && tabBar}

      <div className='flex-1 overflow-y-auto'>
        <div className={isDesktop ? `${desktopMaxWidth} mx-auto px-8 py-8` : 'px-4 py-4'}>
          {isDesktop && tabBar}
          {tab === 'info' ? <InfoTab isMobile={isMobile} /> : <PracticeTab selectedScale={selectedScale} onSelectScale={handleSelectScale} />}
        </div>
      </div>
    </div>
  )
}
