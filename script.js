class MusicScale {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d')
    this.currentKey = 'C'
    this.currentMode = 'ionian'
    this.currentAccidentalPreference = 'sharp' // 'sharp' or 'flat'

    // Staff gap between upper and lower staves (pixels)
    this.STAFF_GAP = 220

    // Scale patterns (intervals in semitones from root)
    this.modes = {
      ionian: [0, 2, 4, 5, 7, 9, 11], // Major
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      aeolian: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
      locrian: [0, 1, 3, 5, 6, 8, 10],
    }

    // Chromatic notes with sharps
    this.chromaticNotesSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

    // Chromatic notes with flats
    this.chromaticNotesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
  }

  getKeyList() {
    // All keys in order (sharp keys then flat keys)
    return ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db']
  }

  getModeList() {
    // Use the visible modes in the UI, matching the button order
    return ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian']
  }

  getModeDegree() {
    // Returns which scale degree of the major scale is used as the starting note
    const modeDegrees = {
      ionian: 1,
      dorian: 2,
      phrygian: 3,
      lydian: 4,
      mixolydian: 5,
      aeolian: 6,
      locrian: 7,
    }
    return modeDegrees[this.currentMode] || 1
  }

  updateSelectionSummary() {
    const summary = document.getElementById('currentSelection')
    if (!summary) return
    const formattedMode = this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1)
    summary.textContent = `${this.currentKey} • ${formattedMode}`

    // Update mode explanation (mobile summary and desktop versions)
    const degree = this.getModeDegree()
    const explanationText = `Alkusävel on duurin ${degree}. sävel`

    const explanationMobile = document.getElementById('modeExplanation')
    if (explanationMobile) {
      explanationMobile.textContent = explanationText
    }

    const explanationDesktop = document.getElementById('modeExplanationDesktop')
    if (explanationDesktop) {
      explanationDesktop.textContent = explanationText
    }
  }

  drawScale() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawStaff()
    this.drawTrebleClef()
    this.drawNotes()
  }

  drawStaff() {
    const startX = 80
    const endX = this.canvas.width - 30

    // Upper staff lines (increased spacing from 20 to 25 pixels)
    const upperStaffLines = [95, 120, 145, 170, 195].map((y) => y)
    // Lower staff lines (moved closer, increased spacing)
    const lowerStaffLines = upperStaffLines.map((y) => y + this.STAFF_GAP)

    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 1.5

    for (const y of upperStaffLines) {
      this.ctx.beginPath()
      this.ctx.moveTo(startX, y)
      this.ctx.lineTo(endX, y)
      this.ctx.stroke()
    }
    for (const y of lowerStaffLines) {
      this.ctx.beginPath()
      this.ctx.moveTo(startX, y)
      this.ctx.lineTo(endX, y)
      this.ctx.stroke()
    }
  }

  drawTrebleClef() {
    // Upper staff treble clef
    const x1 = 100
    const y1 = 163

    // Lower staff treble clef
    const x2 = 100
    const y2 = y1 + this.STAFF_GAP

    this.ctx.fillStyle = '#000'
    this.ctx.font = 'bold 105px serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('𝄞', x1, y1)
    this.ctx.fillText('𝄞', x2, y2)
  }

  drawNotes() {
    const scale = this.getScale()
    const startX = 190
    const noteSpacing = 100

    // Draw scale going up on upper staff
    let index = 0
    for (const note of scale) {
      const x = startX + index * noteSpacing
      this.drawNote(x, note, 'upper', index)
      index++
    }

    // Draw scale going down on lower staff (from octave to root)
    const reverseScale = [...scale].reverse()
    index = 0
    for (const note of reverseScale) {
      const x = startX + index * noteSpacing
      // Calculate the correct scale index for descending scale
      const descendingIndex = scale.length - 1 - index
      this.drawNote(x, note, 'lower', descendingIndex)
      index++
    }
  }

  drawNote(x, note, staff = 'upper', scaleIndex = 0) {
    const noteInfo = this.getNoteInfo(note)
    const y = this.getNoteY(noteInfo.noteName, noteInfo.octave, staff, scaleIndex)

    // Draw note head (wider, more elliptical, more rotated ccw)
    this.ctx.fillStyle = '#000'
    this.ctx.beginPath()
    // Bigger note heads
    this.ctx.ellipse(x, y, 13, 8.5, -Math.PI / 6 - 0.087, 0, 2 * Math.PI)
    this.ctx.fill()

    // Draw stem: if note is on/at/below B line, stem down and left; else, stem up and right
    // B line is y >= 155 (upper staff) or y >= 155 + STAFF_GAP (lower staff)
    const bLineY = staff === 'upper' ? 155 : 155 + this.STAFF_GAP
    if (y < bLineY) {
      this.ctx.beginPath()
      this.ctx.moveTo(x - 9, y)
      this.ctx.lineTo(x - 9, y + 70)
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    } else {
      this.ctx.beginPath()
      this.ctx.moveTo(x + 9, y)
      this.ctx.lineTo(x + 9, y - 70)
      this.ctx.lineWidth = 2
      this.ctx.stroke()
    }

    // Draw ledger lines if needed
    this.drawLedgerLines(x, y, staff)

    // Draw accidentals (made bigger)
    if (noteInfo.accidental) {
      this.drawAccidental(x - 32, y, noteInfo.accidental)
    }

    // DEBUG: Draw position number next to note head for debugging
    //   this.ctx.fillStyle = '#ff0000' // Red color for debugging
    //   this.ctx.font = '12px Arial'
    //   this.ctx.textAlign = 'left'
    //   this.ctx.fillText(y.toString(), x + 15, y + 4) // Position number to the right of note
    //
  }
  drawLedgerLines(x, y, staff = 'upper') {
    // Use formulaic staff line positions for ledger lines
    let staffLines
    if (staff === 'upper') {
      staffLines = [95, 120, 145, 170, 195].map((y) => y)
    } else {
      // Lower staff lines are offset from upper staff by STAFF_GAP
      staffLines = [95, 120, 145, 170, 195].map((y) => y + this.STAFF_GAP)
    }
    const staffTop = staffLines[0]
    const staffBottom = staffLines[4]
    const staffStep = staffLines[1] - staffLines[0]

    // Draw ledger lines below staff
    if (y > staffBottom + 2) {
      for (let ledgerY = staffBottom + staffStep; ledgerY <= y + 2; ledgerY += staffStep) {
        this.ctx.beginPath()
        this.ctx.moveTo(x - 20, ledgerY)
        this.ctx.lineTo(x + 20, ledgerY)
        this.ctx.lineWidth = 1.5
        this.ctx.stroke()
      }
    }
    // Draw ledger lines above staff
    if (y < staffTop - 2) {
      for (let ledgerY = staffTop - staffStep; ledgerY >= y - 2; ledgerY -= staffStep) {
        this.ctx.beginPath()
        this.ctx.moveTo(x - 20, ledgerY)
        this.ctx.lineTo(x + 20, ledgerY)
        this.ctx.lineWidth = 1.5
        this.ctx.stroke()
      }
    }
  }

  drawAccidental(x, y, accidental) {
    this.ctx.fillStyle = '#000'
    this.ctx.font = 'bold 48px serif' // Bigger accidental symbols
    this.ctx.textAlign = 'center'

    if (accidental === '#') {
      this.ctx.fillText('♯', x, y + 14)
    } else if (accidental === '##') {
      // Double sharp (𝄪); fallback to two sharps if glyph unavailable
      const glyph = '𝄪'
      if (this.ctx.measureText(glyph).width > 0) {
        this.ctx.fillText(glyph, x, y + 14)
      } else {
        this.ctx.fillText('♯', x - 8, y + 14)
        this.ctx.fillText('♯', x + 8, y + 14)
      }
    } else if (accidental === 'b') {
      this.ctx.fillText('♭', x, y + 10)
    } else if (accidental === 'bb') {
      // Double flat (𝄫); fallback to two flats if glyph unavailable
      const glyph = '𝄫'
      if (this.ctx.measureText(glyph).width > 0) {
        this.ctx.fillText(glyph, x, y + 10)
      } else {
        this.ctx.fillText('♭', x - 8, y + 10)
        this.ctx.fillText('♭', x + 8, y + 10)
      }
    }
  }

  getScale() {
    // Build the scale using mode intervals, then spell by letter with minimal accidentals
    // 1) Letter cycle and natural pitch classes
    const letterNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const basePC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

    // 2) Intervals for selected mode
    const intervals = this.modes[this.currentMode] || this.modes.ionian

    // 3) Helper to compute pitch class of a spelled note (e.g., Bb -> 10)
    const parsePC = (note) => {
      const letter = note.replace(/[#b].*$/, '')
      const acc = note.slice(letter.length)
      let pc = basePC[letter]
      for (const ch of acc) {
        if (ch === '#') pc = (pc + 1) % 12
        else if (ch === 'b') pc = (pc + 11) % 12
      }
      return pc
    }

    const rootPC = parsePC(this.currentKey)

    // 4) Expected letter sequence starting from tonic letter
    const rootLetter = this.currentKey.replace(/[#b].*$/, '')
    let startLetterIdx = letterNames.indexOf(rootLetter)
    if (startLetterIdx === -1) startLetterIdx = 0
    const scaleLetters = []
    for (let i = 0; i < 7; i++) scaleLetters.push(letterNames[(startLetterIdx + i) % 7])

    // 5) Spell each degree: choose accidental so that letter+accidental matches the target pitch class
    const scale = []
    for (let i = 0; i < 7; i++) {
      const targetPC = (rootPC + intervals[i]) % 12
      const letter = scaleLetters[i]
      const base = basePC[letter]
      const delta = (targetPC - base + 12) % 12

      // Use helper to get accidental string
      const accidentalStr = this.getAccidentalString(delta, letter)
      scale.push(letter + accidentalStr)
    }

    // 6) Add octave
    scale.push(scale[0])
    return scale
  }

  // Helper to map delta to accidental string, throws on unsupported
  getAccidentalString(delta, letter) {
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
    throw new Error(
      `Unsupported accidental delta (${delta}) for ${letter} in key ${this.currentKey}, mode ${this.currentMode}`
    )
  }
  // Returns a map of key -> { Letter: accidental }
  // Example: { Bb: { B: 'b', E: 'b' }, D: { F: '#', C: '#' } }
  getKeySignatureMap() {
    return {
      // Sharps
      C: {},
      G: { F: '#' },
      D: { F: '#', C: '#' },
      A: { F: '#', C: '#', G: '#' },
      E: { F: '#', C: '#', G: '#', D: '#' },
      B: { F: '#', C: '#', G: '#', D: '#', A: '#' },
      'F#': { F: '#', C: '#', G: '#', D: '#', A: '#', E: '#' },
      'C#': { F: '#', C: '#', G: '#', D: '#', A: '#', E: '#', B: '#' },
      // Flats
      F: { B: 'b' },
      Bb: { B: 'b', E: 'b' },
      Eb: { B: 'b', E: 'b', A: 'b' },
      Ab: { B: 'b', E: 'b', A: 'b', D: 'b' },
      Db: { B: 'b', E: 'b', A: 'b', D: 'b', G: 'b' },
      Gb: { B: 'b', E: 'b', A: 'b', D: 'b', G: 'b', C: 'b' },
      Cb: { B: 'b', E: 'b', A: 'b', D: 'b', G: 'b', C: 'b', F: 'b' },
    }
  }

  getNoteInfo(note) {
    // Parse letter and possible accidental (#, ##, b, bb)
    // Examples: 'Bb', 'C##', 'F', 'Gb'
    const m = note.match(/^([A-G])(bb|##|b|#)?$/)
    let noteName = note
    let accidental = null
    if (m) {
      noteName = m[1]
      accidental = m[2] || null
    }

    // Octave is handled by staff positioning, not needed here
    const octave = 5

    return { noteName, accidental, octave }
  }

  // Calculate staff steps: how many note positions from key letter to target note letter
  // Returns the diatonic distance (0-6), with special case scaleIndex=7 for octave
  calculateStaffSteps(keyLetter, noteLetter, scaleIndex) {
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const startIndex = noteNames.indexOf(keyLetter)
    const currentIndex = noteNames.indexOf(noteLetter)

    let staffSteps = 0
    if (scaleIndex === 7) {
      // Octave: exactly 7 staff positions (one full cycle)
      staffSteps = 7
    } else if (scaleIndex !== 0) {
      // Regular scale degree: count steps between key letter and note letter
      staffSteps = (currentIndex - startIndex + 7) % 7
      if (currentIndex < startIndex) {
        staffSteps = currentIndex + (7 - startIndex)
      }
    }
    return staffSteps
  }

  getNoteY(noteName, octave, staff = 'upper', scaleIndex = 0) {
    // Define note positions based on staff positions (not semitones)
    // Each position represents where the note sits on the musical staff
    const noteToStaffPosition = {
      C: 230, // Ledger line below staff
      D: 218, // Space below staff
      E: 205, // Bottom line (1st line)
      F: 193, // Space between 1st and 2nd line
      G: 180, // 2nd line
      A: 168, // Space between 2nd and 3rd line
      B: 155, // 3rd line (middle line)
    }

    // Extract base note letter (strip accidentals like # or b)
    let baseNoteName = noteName
    if (noteName.includes('#') || noteName.includes('b')) {
      baseNoteName = noteName[0]
    }

    // Get the key's root letter (e.g., 'G' from 'G#')
    const keyBaseLetter = this.currentKey.replace(/[#b].*$/, '')

    // Determine startY based on staff
    // Upper staff: direct lookup; Lower staff: add STAFF_GAP offset
    // The KEY INSIGHT: descendingIndex (used as scaleIndex for lower staff) preserves
    // scale degree info (7=octave, 0=root), so the same staffSteps calculation works
    const startY = noteToStaffPosition[keyBaseLetter] + (staff === 'upper' ? 0 : this.STAFF_GAP)

    // Calculate staff steps: how many note positions from key to current note
    // Each step is 12.5 pixels (lines and spaces are 25 pixels apart)
    const staffSteps = this.calculateStaffSteps(keyBaseLetter, baseNoteName, scaleIndex)

    // Calculate final Y: start position minus steps (moving upward on canvas)
    const baseY = startY - staffSteps * 12.5
    return baseY - 10
  }
}
