scale web research dump

created: 2026-06-12
purpose: raw collection of website fetches used while auditing scale shift-pattern tables

---

URL: https://en.wikipedia.org/wiki/Carl_Flesch
query: Scale System circle of fifths violin scales
result type: partial content extracted
notes:

- page confirms Carl Flesch is known for Scale System and violin pedagogy significance.
- fetched output was mostly biography/reference blocks and not technical fingering content.
- no concrete per-key shift fingering table found in extracted text.

raw fragments from fetch:

- "Carl Flesch ... compendium Scale System is a staple of violin pedagogy"
- biographical sections and references were returned.

---

URL: https://www.violinonline.com/scales.htm
query: two octave major scales fingering third position shift
result type: partial content extracted
notes:

- page is an index with links to one-octave/two-octave major/minor scales.
- no direct detailed shift wording extracted from this index fetch.
- strong indicator this site hosts practical scale fingering materials (image/audio based).

raw fragments from fetch:

- "VIOLIN SCALE STUDIES"
- links: one octave major/minor, two octave major/minor, chromatic.
- many unrelated nav/footer blocks and consent text.

---

URL: https://violinspiration.com/violin-shifting-exercises/
query: guide finger shifting release pressure audible slide
result type: large partial content extracted
notes:

- this fetch returned substantial shift-practice descriptions.
- confirms common pedagogy principles used in our docs: guide finger, smooth shift, intonation checking, progressive patterns.
- examples include shifting in G major with alternate approaches.

raw fragments from fetch:

- "First Finger Basic Exercises" section: B to D style first-position to third-position movement.
- "Scale-Like Exercise": open string + first notes, shift smoothly with first finger.
- "Scales and Arpeggios for Learning to Shift": multiple possible shifting methods within one scale.
- reminders about thumb placement, intonation, minimizing slide noise.
- includes references to Whistler and Sevcik shift studies.

---

URL: https://www.violinonline.com/twooctavemajorscales.html
query: G major D major A major two octave fingering first position shift
result type: partial content extracted
notes:

- extraction returned page shell with links/images/audio for each key (C, G, D, A, E, B, F, Bb, Eb, Ab, Db, Gb).
- did not extract readable fingering text from the embedded notation images.
- still useful to confirm practical two-octave scale progression by key.

raw fragments from fetch:

- "Two Octave Major Scales"
- entries for G major, D major, A major, etc., with image and mp3 links.

---

URL: https://www.rcmusic.com/learning/examinations/strings-syllabus
query: violin scales and arpeggios fingering may vary editions teacher choice
result type: fetch failed
error:

- Failed to extract meaningful content from the web page

---

URL: https://www.abrsm.org/en-gb/instruments/strings/violin-exams
query: scales and arpeggios requirements fingering flexibility
result type: fetch failed
error:

- Failed to extract meaningful content from the web page

---

URL: https://www.fiddlerman.com/blogs/fiddlerblog/third-position-on-the-violin
query: third position shifting first finger guide examples
result type: fetch failed
error:

- HTTP error 403

---

URL: https://stringpedagogy.com/members/volumes/references/referencesx.html
query: Galamian shift guide finger release pressure
result type: fetch failed
error:

- HTTP error 404

---

URL: https://www.violinlab.com/blog/how-to-practice-violin-shifts/
query: guide finger shifting exercises first to third position
result type: fetch failed
error:

- HTTP error 404

---

quick interpretation of web fetch quality:

- successful: 4 URLs (2 mostly index/shell pages, 1 biography page, 1 useful shifting article)
- failed/blocked: 5 URLs
- high-confidence pedagogical support from fetches: shifting is practiced with multiple valid pathways, not one universal shift point per key.
- low-confidence from fetches: exact canonical per-key shift note/finger for every Level 2/3 row (not obtainable from returned content alone).

---

additional pass: galamian + flesch fingering (requested follow-up)

URL: https://html.duckduckgo.com/html/?q=Galamian+scale+fingering+two+octave+violin
query: top results links
result type: successful search-result extraction
notes:

- returned candidate links for Galamian-related fingering materials, including:
  - discoverviolin PDF (galamian stand-alone octaves)
  - archive.org PDF copy of Contemporary Violin Technique material
  - SW Strings product page for The Galamian Scale System (Vol I-II)
  - YouTube item labeled G major two-octave Galamian pattern
- confirms web discoverability of Galamian-labeled fingering resources, but not all targets were machine-extractable.

URL: https://html.duckduckgo.com/html/?q=Flesch+scale+system+violin+fingering+two+octave
query: top results links
result type: successful search-result extraction
notes:

- returned candidate links for Flesch materials, including:
  - IMSLP Das Skalensystem (Flesch, Carl)
  - fiddlerman-hosted PDF copy
  - phidler summary PDF mentioning "uniformity of fingerings"
  - discussion and pedagogy articles referencing Flesch fingering usage

URL: https://imslp.org/wiki/Das_Skalensystem_(Flesch,_Carl)
query: flesch scale system publication entries
result type: successful extraction
notes:

- high-value source confirmation for Flesch primary material.
- page includes complete score links and key-specific files (examples visible in fetch: G major, A major, B-flat major).
- metadata confirms work title, 1926 publication, violin scale study context.

URL: https://www.swstrings.com/product/the-galamian-scale-system-volumes-i-ii-for-violin/
query: description of contents scales fingerings
result type: successful extraction
notes:

- confirms title mapping: Contemporary Violin Technique Volumes I-II == The Galamian Scale System.
- extracted subtitle text:
  - Volume I: Scale and Arpeggio Exercises with Bowing and Rhythm Patterns
  - Volume II: Double and Multiple Stops in Scale and Arpeggio Exercises
- confirms publication-level scope, not per-key fingering details in extracted text.

URL: https://www.discoverviolin.org/wp-content/uploads/2020/07/Galamian-scales-stand-alone-and-through-played.pdf
query: two octave scale shifts where to shift Galamian
result type: fetch failed
error:

- Failed to extract meaningful content from the web page (PDF extraction failure)

URL: https://ia802909.us.archive.org/30/items/escalasgalamian/escalas%20galamian_text.pdf
query: galamian contemporary violin technique scales fingering
result type: fetch failed
error:

- Failed to extract meaningful content from the web page (PDF extraction failure)

URL: https://www.fiddlerman.com/wp-content/uploads/2011/03/Carl_Flesch_scale_system_for_violin_compressed.pdf
query: flesch fingering scale system content
result type: fetch failed
error:

- HTTP error 403

follow-up interpretation for galamian/flesch request:

- confirmed strongly:
  - Flesch primary source is reachable via IMSLP with downloadable score files, including individual major-key extracts and complete score.
  - Galamian scale system identity and volume scope are confirmed from product metadata.
- not confirmed from extractable text alone:
  - a clean machine-readable Galamian two-octave fingering table.
  - a machine-extracted canonical row-by-row mapping that can be copied directly into our Level 2/3 schema.

---

second research pass: Galamian scale PRACTICE method (the turn, acceleration, fingering up/down)
date: 2026-06-12
purpose: find how the Galamian method actually practises scales (rhythm/turn/fingering), to
enrich scale-practice-method-v2.md and scale-practice-notes.md. Text below is reproduced as
returned by search/fetch (lightly trimmed of nav/boilerplate), not re-summarised.

---

SEARCH: "Galamian scale system method acceleration rhythm turn fingering shifting violin"
result type: successful search-result extraction
top links:
- https://www.violinist.com/blog/laurie/20103/11075/  — "Galamian scales work wonders, and here's why"
- https://discoverviolin.org/teacher-videos/galamian-scales/  — "Galamian 3-Octave Scales - Kaleidoscopes for Violin"
- https://lessonsinyourhome.net/blog/scale-systems-for-the-violin/
- https://www.meghanfaw.com/advanced-violin-lessons/scale-acceleration
- https://audreyduncan.net/music/music-resources/violin-viola/violin-viola-skills/galamian-acceleration-scales/
- https://www.swstrings.com/product/the-galamian-scale-system-volumes-i-ii-for-violin/
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4636401/  — biomechanics of shifting (academic)

extracted text:

"The Galamian scale pattern and acceleration is considered an essential scale training for
advanced violinists."

"The Galamian system begins with scales in one position and with one finger, working on
shifting and fingerboard geography, and also includes an acceleration sequence, working on
speed and accuracy. Mastering scales this way allows the left fingers to learn spacing for
every possible position on the violin."

"This exercise is accredited to Ivan Galamian ... typically used to practice three-octave
scales, although it can be done with four-octave scales as well. In this exercise, the scale
will be played 6-7 times in a row, increasing the speed and the number of notes per bow each
time, which helps the player work on speed, shifting, intonation, and smooth sound during
long slurs."

"The Turn: In order for this exercise to work, you must be playing a 'turn' at the beginning
and end of each scale, where the turn is the tonic, 3rd, and then 2nd note of the scale."

"Rhythm and Bowing: In the first volume, Galamian scales focus more on rhythm and bowing
patterns."

---

SEARCH: "violin scale fingering ascending descending guide finger shift on half step Galamian"
result type: successful search-result extraction
top links:
- https://www.deviolines.com/wp-content/uploads/2013/septiembre/FinalDocElectronic050211.pdf  (OU graduate dissertation)
- https://www.violinist.com/blog/laurie/20103/11075/
- https://www.violinist.com/discussion/archive/16595/  — "Very Practical but Unused Scale Fingering"
- https://violinspiration.com/violin-d-major-scale/
- https://violinspiration.com/a-minor-scale-violin/

extracted text:

"For advanced scales, the Galamian fingering system was developed by Ivan Galamian. The
scales are written out in Galamian's books, Contemporary Violin Technique, Volumes 1 and 2."

"It is a good idea to practice using the 4th finger as you descend a scale, and use open
strings as you ascend the scales, which is a common practice for violinists and an excellent
habit to develop. Minor scales also use the 4th finger when descending, which is a general
principle of violin playing."

"Galamian employed a half-step shift from g2 to f-sharp2 in certain passages. Additionally,
if you start on 2nd finger you always change strings on the semi-tone."

"The three-octave scales each begin and end with a turn (for example, G major begins with
G-B-A-G before ascending, and it ends the same way), which serves to set the left hand with
fingers over the fingerboard so that you are simply dropping fingers."

---

FETCH: https://www.meghanfaw.com/advanced-violin-lessons/scale-acceleration
result type: successful
extracted text (the acceleration steps, reproduced):

"Creator & Purpose: This exercise, credited to Ivan Galamian, involves playing a scale 6-7
times consecutively while progressively increasing speed and notes per bow stroke."

"The Turn: The turn is the tonic, 3rd, and then 2nd note of the scale. For example, in a G
major scale, the turn would be G, B, A."

"Seven Steps:
1. One note per bow, 2 clicks per note (half notes)
2. Two notes slurred, 1 note per click (quarter notes)
3. Four notes slurred, 2 notes per click (eighth notes)
4. Six notes slurred, 3 notes per click (triplets)
5. Eight notes slurred, 4 notes per click (sixteenth notes)
6. Twelve notes slurred, 6 notes per click (sextuplets)
7. Twenty-four notes slurred, 8 notes per click (32nd notes)"

"Key Benefits: The exercise develops speed, efficient shifting, confidence in high registers,
and mental mapping of the instrument's positions."

---

FETCH: https://audreyduncan.net/.../galamian-acceleration-scales/
result type: successful (thin)
extracted text:

"Galamian Acceleration Scales [are] simple yet dense with skill mastery [and] can be varied
by octaves and tempo based on skill level."

quoted colleague: "The immediate improvement in ear training, facility and technique in both
right and left hand technique, tone production, and the understanding of key signatures and
its relationship to music theory is undeniable."

"[The exercises improve] fingerings, facility, subdivision, bow pressure and placement
management, intonation, intervallic ear training and dynamic control."

---

FETCH: https://discoverviolin.org/teacher-videos/galamian-scales/
result type: successful (landing page)
extracted text:

"The Galamian scale pattern and acceleration is considered an essential scale training for
advanced violinists."

"Part I [covers] an overview of the scale system, as well as how to extract the most value
from your scales practice."

"Part II [addresses] preliminary steps for learning the fingering, as well as the
acceleration pattern used to attain virtuoso speed."

"[A] concise one-page handout of the 3-octave scale fingerings ... allows students to focus
on learning the shifting patterns."

---

FETCHES THAT FAILED THIS PASS:
- https://www.violinist.com/blog/laurie/20103/11075/  — HTTP 403 Forbidden
- https://lessonsinyourhome.net/blog/scale-systems-for-the-violin/  — HTTP 403 Forbidden

interpretation for our project (2-octave, 1st–3rd position):

- The Galamian *practice* method (turn + acceleration + rhythm/bowing) is fully transferable
  to our 2-octave scales; only the octave count differs.
- Two concrete, well-supported fingering principles to add to our docs:
  (a) ascending favours open strings, descending uses the 4th finger (incl. minor scales);
  (b) shift on the half-step / change strings on the semitone — gives "different shift
      options" per scale rather than one fixed shift.
- The full per-key 3-octave Galamian fingering charts remain behind paid editions / a video
  handout and were not machine-extractable; our note-by-note charts in scale-practice-notes.md
  are derived from position geometry, which is consistent with these principles.
