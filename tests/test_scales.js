// Test script to verify all scales are working correctly
// Run this in Node.js or browser console

// Copy the relevant parts from scales.js
const modes = {
  ionian: [0, 2, 4, 5, 7, 9, 11], // Major
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
  locrian: [0, 1, 3, 5, 6, 8, 10],
}

const chromaticNotesSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const basePC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const letterNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

function parsePC(note) {
  const letter = note.replace(/[#b].*$/, '')
  const acc = note.slice(letter.length)
  let pc = basePC[letter]
  for (const ch of acc) {
    if (ch === '#') pc = (pc + 1) % 12
    else if (ch === 'b') pc = (pc + 11) % 12
  }
  return pc
}

function getAccidentalString(delta, letter) {
  const accidentalMap = {
    0: '',
    1: '#',
    2: '##',
    11: 'b',
    10: 'bb',
  }
  if (delta in accidentalMap) {
    return accidentalMap[delta]
  }
  throw new Error(`Unsupported accidental delta (${delta}) for ${letter}`)
}

function getScale(key, modeName) {
  // Simulate the getScale logic
  const baseModeName = modeName.split(' ')[0].toLowerCase()
  const intervals = modes[baseModeName] || modes.ionian
  
  console.log(`\n=== Testing ${key} ${modeName} ===`)
  console.log(`Base mode name: "${baseModeName}"`)
  console.log(`Intervals: [${intervals.join(', ')}]`)
  
  const rootPC = parsePC(key)
  const rootLetter = key.replace(/[#b].*$/, '')
  let startLetterIdx = letterNames.indexOf(rootLetter)
  if (startLetterIdx === -1) startLetterIdx = 0
  const scaleLetters = []
  for (let i = 0; i < 7; i++) scaleLetters.push(letterNames[(startLetterIdx + i) % 7])

  const scale = []
  for (let i = 0; i < 7; i++) {
    const targetPC = (rootPC + intervals[i]) % 12
    const letter = scaleLetters[i]
    const base = basePC[letter]
    const delta = (targetPC - base + 12) % 12
    const accidentalStr = getAccidentalString(delta, letter)
    scale.push(letter + accidentalStr)
  }
  scale.push(scale[0]) // Add octave
  return scale
}

// Test all modes with C
console.log('='.repeat(50))
console.log('TESTING ALL MODES WITH KEY C')
console.log('='.repeat(50))

const testModes = [
  'ionian',
  'ionian (Duuri)',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'aeolian',
  'aeolian (Molli)',
  'locrian'
]

for (const mode of testModes) {
  const scale = getScale('C', mode)
  console.log(`Scale: ${scale.join(' ')}`)
}

// Specifically test C major vs C minor
console.log('\n' + '='.repeat(50))
console.log('COMPARISON: C MAJOR vs C MINOR')
console.log('='.repeat(50))
const cMajor = getScale('C', 'ionian')
const cMinor1 = getScale('C', 'aeolian')
const cMinor2 = getScale('C', 'aeolian (Molli)')

console.log(`C Major (ionian):        ${cMajor.join(' ')}`)
console.log(`C Minor (aeolian):       ${cMinor1.join(' ')}`)
console.log(`C Minor (aeolian (Molli)): ${cMinor2.join(' ')}`)

if (cMajor.join(' ') === cMinor1.join(' ')) {
  console.log('\n❌ ERROR: C Major and C Minor (aeolian) are the same!')
} else {
  console.log('\n✅ C Major and C Minor are different (correct)')
}

if (cMajor.join(' ') === cMinor2.join(' ')) {
  console.log('❌ ERROR: C Major and C Minor (aeolian (Molli)) are the same!')
} else {
  console.log('✅ C Major and C Minor (aeolian (Molli)) are different (correct)')
}

// Expected: C major = C D E F G A B C
// Expected: C minor = C D Eb F G Ab Bb C
console.log('\nExpected C Major: C D E F G A B C')
console.log('Expected C Minor: C D Eb F G Ab Bb C')
