// Comprehensive test of all scales after fix
const modes = {
  ionian: [0, 2, 4, 5, 7, 9, 11], // Major
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
  locrian: [0, 1, 3, 5, 6, 8, 10],
}

const modeList = ['ionian (Duuri)', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian (Molli)', 'locrian']
const testKeys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab']

const letterNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const basePC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

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

function getScale(currentKey, currentMode) {
  // FIXED: Extract base mode name first
  const baseModeName = currentMode.split(' ')[0].toLowerCase()
  const intervals = modes[baseModeName] || modes.ionian
  
  const rootPC = parsePC(currentKey)
  
  const rootLetter = currentKey.replace(/[#b].*$/, '')
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
  
  scale.push(scale[0])
  return scale
}

// Expected results for verification
const expectedResults = {
  'C': {
    'ionian (Duuri)': 'C D E F G A B C',
    'aeolian (Molli)': 'C D Eb F G Ab Bb C',
    'dorian': 'C D Eb F G A Bb C',
    'phrygian': 'C Db Eb F G Ab Bb C',
    'lydian': 'C D E F# G A B C',
    'mixolydian': 'C D E F G A Bb C',
    'locrian': 'C Db Eb F Gb Ab Bb C',
  },
  'A': {
    'ionian (Duuri)': 'A B C# D E F# G# A',
    'aeolian (Molli)': 'A B C D E F G A',
  },
  'G': {
    'ionian (Duuri)': 'G A B C D E F# G',
    'aeolian (Molli)': 'G A Bb C D Eb F G',
  },
}

console.log('=== COMPREHENSIVE SCALE TEST ===\n')

let totalTests = 0
let passedTests = 0
let failedTests = []

// Test specific known cases
console.log('Testing known cases:')
for (const [key, modes] of Object.entries(expectedResults)) {
  for (const [mode, expected] of Object.entries(modes)) {
    totalTests++
    const result = getScale(key, mode).join(' ')
    if (result === expected) {
      passedTests++
      console.log(`✓ ${key} ${mode}: ${result}`)
    } else {
      failedTests.push({ key, mode, expected, got: result })
      console.log(`✗ ${key} ${mode}:`)
      console.log(`  Expected: ${expected}`)
      console.log(`  Got:      ${result}`)
    }
  }
}

console.log('\n=== Testing all modes with C ===')
for (const mode of modeList) {
  const result = getScale('C', mode)
  console.log(`${mode.padEnd(20)}: ${result.join(' ')}`)
}

console.log('\n=== Testing all modes with A ===')
for (const mode of modeList) {
  const result = getScale('A', mode)
  console.log(`${mode.padEnd(20)}: ${result.join(' ')}`)
}

console.log('\n=== Testing all modes with G ===')
for (const mode of modeList) {
  const result = getScale('G', mode)
  console.log(`${mode.padEnd(20)}: ${result.join(' ')}`)
}

console.log('\n=== Summary ===')
console.log(`Total tests: ${totalTests}`)
console.log(`Passed: ${passedTests}`)
console.log(`Failed: ${failedTests.length}`)
if (failedTests.length > 0) {
  console.log('\nFailed tests:')
  failedTests.forEach(t => {
    console.log(`  ${t.key} ${t.mode}`)
    console.log(`    Expected: ${t.expected}`)
    console.log(`    Got:      ${t.got}`)
  })
} else {
  console.log('\n✓ All tests passed!')
}
