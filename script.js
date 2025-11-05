class MusicScale {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d')
    this.currentKey = 'C'
    this.currentMode = 'ionian'
    this.currentAccidentalPreference = 'sharp' // 'sharp' or 'flat'

    // Note positions on treble clef (pixels from top)
    // First staff (upper)
    this.notePositions = {
      C8: 15,
      B7: 25,
      A7: 35,
      G7: 45,
      F7: 55,
      E7: 65,
      D7: 75,
      C7: 85,
      B6: 95,
      A6: 105,
      G6: 115,
      F6: 125,
      E6: 135,
      D6: 145,
      C6: 155,
      B5: 165,
      A5: 175,
      G5: 185,
      F5: 195,
      E5: 205,
      D5: 215,
      C5: 225,
      B4: 235,
      A4: 245,
      G4: 255,
    }

    // Second staff (lower) - offset by 150 pixels
    this.notePositionsLower = {
      C6: 305,
      B5: 315,
      A5: 325,
      G5: 335,
      F5: 345,
      E5: 355,
      D5: 365,
      C5: 375,
      B4: 385,
      A4: 395,
      G4: 405,
      F4: 415,
      E4: 425,
      D4: 435,
      C4: 445,
      B3: 455,
      A3: 465,
      G3: 475,
      F3: 485,
      E3: 495,
    }

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

    this.init()
  }

  init() {
    this.setupEventListeners()
    // Ensure canvas is ready and draw the initial scale
    setTimeout(() => {
      this.drawScale()
      this.updateSelectionSummary()
    }, 100)
  }

  getKeyList() {
    // All keys in order (sharp keys then flat keys)
    return ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'F', 'Bb', 'Eb', 'Ab', 'Db']
  }

  getModeList() {
    // Use the visible modes in the UI, matching the button order
    return ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian']
  }

  setupEventListeners() {
    const selectionMenu = document.getElementById('selectionMenu')
    const menuToggle = document.getElementById('menuToggle')

    if (menuToggle && selectionMenu) {
      menuToggle.addEventListener('click', () => {
        const isOpen = selectionMenu.classList.toggle('open')
        menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
      })
    }

    // Key buttons
    for (const btn of document.querySelectorAll('.key-btn')) {
      btn.addEventListener('click', (e) => {
        for (const b of document.querySelectorAll('.key-btn')) b.classList.remove('active')
        e.target.classList.add('active')
        this.currentKey = e.target.dataset.key
        this.currentAccidentalPreference = e.target.dataset.accidental || 'sharp'
        this.drawScale()
        this.updateSelectionSummary()
        // Close menu on mobile after selection
        if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
      })
    }

    // Mode buttons
    for (const btn of document.querySelectorAll('.mode-btn')) {
      btn.addEventListener('click', (e) => {
        for (const b of document.querySelectorAll('.mode-btn')) b.classList.remove('active')
        e.target.classList.add('active')
        this.currentMode = e.target.dataset.mode
        this.drawScale()
        this.updateSelectionSummary()
        if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
      })
    }

    // RandomMode button (randomizes mode only)
    document.getElementById('randomBtn').addEventListener('click', () => {
      const modes = this.getModeList()
      const randomMode = modes[Math.floor(Math.random() * modes.length)]
      for (const b of document.querySelectorAll('.mode-btn')) b.classList.remove('active')
      const modeBtn = document.querySelector(`[data-mode="${randomMode}"]`)
      if (modeBtn) modeBtn.classList.add('active')
      this.currentMode = randomMode
      this.drawScale()
      this.updateSelectionSummary()
      if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
    })

    // RandomSävel button (randomizes note only)
    document.getElementById('randomNoteBtn').addEventListener('click', () => {
      const keys = this.getKeyList()
      const randomKey = keys[Math.floor(Math.random() * keys.length)]
      const btn = document.querySelector(`.key-btn[data-key="${randomKey}"]`)
      if (btn) {
        for (const b of document.querySelectorAll('.key-btn')) b.classList.remove('active')
        btn.classList.add('active')
        this.currentKey = randomKey
        this.currentAccidentalPreference = btn.dataset.accidental || 'sharp'
      }
      this.drawScale()
      this.updateSelectionSummary()
      if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
    })

    // Previous/Next note buttons
    const prevNoteBtn = document.getElementById('prevNoteBtn')
    const nextNoteBtn = document.getElementById('nextNoteBtn')
    if (prevNoteBtn && nextNoteBtn) {
      // Down arrow (prevNoteBtn) = go to previous note in the list
      prevNoteBtn.addEventListener('click', () => {
        const keys = this.getKeyList()
        let idx = keys.indexOf(this.currentKey)
        idx = (idx + 1) % keys.length
        this.currentKey = keys[idx]
        // Update accidental preference based on the new key
        const btn = document.querySelector(`.key-btn[data-key="${this.currentKey}"]`)
        if (btn) {
          this.currentAccidentalPreference = btn.dataset.accidental || 'sharp'
          for (const b of document.querySelectorAll('.key-btn')) b.classList.remove('active')
          btn.classList.add('active')
        }
        this.drawScale()
        this.updateSelectionSummary()
      })
      // Up arrow (nextNoteBtn) = go to next note in the list
      nextNoteBtn.addEventListener('click', () => {
        const keys = this.getKeyList()
        let idx = keys.indexOf(this.currentKey)
        idx = (idx - 1 + keys.length) % keys.length
        this.currentKey = keys[idx]
        // Update accidental preference based on the new key
        const btn = document.querySelector(`.key-btn[data-key="${this.currentKey}"]`)
        if (btn) {
          this.currentAccidentalPreference = btn.dataset.accidental || 'sharp'
          for (const b of document.querySelectorAll('.key-btn')) b.classList.remove('active')
          btn.classList.add('active')
        }
        this.drawScale()
        this.updateSelectionSummary()
      })
    }

    // Previous/Next mode buttons
    const prevModeBtn = document.getElementById('prevModeBtn')
    const nextModeBtn = document.getElementById('nextModeBtn')
    if (prevModeBtn && nextModeBtn) {
      prevModeBtn.addEventListener('click', () => {
        const modes = this.getModeList()
        let idx = modes.indexOf(this.currentMode)
        idx = (idx - 1 + modes.length) % modes.length
        this.currentMode = modes[idx]
        for (const b of document.querySelectorAll('.mode-btn')) b.classList.remove('active')
        const btn = document.querySelector(`.mode-btn[data-mode="${this.currentMode}"]`)
        if (btn) btn.classList.add('active')
        this.drawScale()
        this.updateSelectionSummary()
      })
      nextModeBtn.addEventListener('click', () => {
        const modes = this.getModeList()
        let idx = modes.indexOf(this.currentMode)
        idx = (idx + 1) % modes.length
        this.currentMode = modes[idx]
        for (const b of document.querySelectorAll('.mode-btn')) b.classList.remove('active')
        const btn = document.querySelector(`.mode-btn[data-mode="${this.currentMode}"]`)
        if (btn) btn.classList.add('active')
        this.drawScale()
        this.updateSelectionSummary()
      })
    }
  }

  updateSelectionSummary() {
    const summary = document.getElementById('currentSelection')
    if (!summary) return
    const formattedMode = this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1)
    summary.textContent = `${this.currentKey} • ${formattedMode}`
  }

  drawScale() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.drawStaff()
    this.drawTrebleClef()
    // Draw key signature accidentals next to the clef
    //this.drawKeySignature()
    this.drawNotes()
  }

  drawStaff() {
    const startX = 150
    const endX = this.canvas.width - 50
    const upperYOffset = -5
    const lowerYOffset = 5

    // Upper staff lines
    const upperStaffLines = [135, 155, 175, 195, 215].map((y) => y + upperYOffset)
    // Lower staff lines
    const lowerStaffLines = [285, 305, 325, 345, 365].map((y) => y + lowerYOffset)

    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 1

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
    // Store offsets for use in notes/clefs
    this.upperYOffset = upperYOffset
    this.lowerYOffset = lowerYOffset
  }

  drawTrebleClef() {
    // Upper staff treble clef
    const x1 = 160
    const y1 = 175 + (this.upperYOffset || 0)

    // Lower staff treble clef
    const x2 = 160
    const y2 = 325 + (this.lowerYOffset || 0)

    this.ctx.fillStyle = '#000'
    this.ctx.font = 'bold 80px serif'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('𝄞', x1, y1)
    this.ctx.fillText('𝄞', x2, y2)
  }

  drawNotes() {
    const scale = this.getScale()
    const startX = 250
    const noteSpacing = 80

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
    // Make height moderately narrow (6.5 instead of 8 or 5)
    this.ctx.ellipse(x, y, 10, 6.5, -Math.PI / 6 - 0.087, 0, 2 * Math.PI)
    this.ctx.fill()

    // Draw stem (made taller)
    this.ctx.beginPath()
    this.ctx.moveTo(x + 7, y)
    this.ctx.lineTo(x + 7, y - 50) // Increased from 30 to 50
    this.ctx.lineWidth = 1.5
    this.ctx.stroke()

    // Draw ledger lines if needed
    this.drawLedgerLines(x, y, staff)

    // Draw accidentals (made bigger)
    if (noteInfo.accidental) {
      this.drawAccidental(x - 25, y, noteInfo.accidental)
    }

    // DEBUG: Draw position number next to note head for debugging
    //   this.ctx.fillStyle = '#ff0000' // Red color for debugging
    //   this.ctx.font = '12px Arial'
    //   this.ctx.textAlign = 'left'
    //   this.ctx.fillText(y.toString(), x + 15, y + 4) // Position number to the right of note
    //
  }
  drawLedgerLines(x, y, staff = 'upper') {
    // Dynamic staff boundaries and spacing
    let staffLines, staffTop, staffBottom, staffStep
    if (staff === 'upper') {
      staffLines = [135, 155, 175, 195, 215].map((y) => y + (this.upperYOffset || 0))
    } else {
      staffLines = [285, 305, 325, 345, 365].map((y) => y + (this.lowerYOffset || 0))
    }
    staffTop = staffLines[0]
    staffBottom = staffLines[4]
    staffStep = staffLines[1] - staffLines[0] // should be 20

    // Draw ledger lines below staff
    if (y > staffBottom + 2) {
      // Draw for every line/space below staff that the note sits on
      for (let ledgerY = staffBottom + staffStep; ledgerY <= y + 2; ledgerY += staffStep) {
        this.ctx.beginPath()
        this.ctx.moveTo(x - 15, ledgerY)
        this.ctx.lineTo(x + 15, ledgerY)
        this.ctx.lineWidth = 1
        this.ctx.stroke()
      }
    }
    // Draw ledger lines above staff
    if (y < staffTop - 2) {
      for (let ledgerY = staffTop - staffStep; ledgerY >= y - 2; ledgerY -= staffStep) {
        this.ctx.beginPath()
        this.ctx.moveTo(x - 15, ledgerY)
        this.ctx.lineTo(x + 15, ledgerY)
        this.ctx.lineWidth = 1
        this.ctx.stroke()
      }
    }
  }

  drawAccidental(x, y, accidental) {
    this.ctx.fillStyle = '#000'
    this.ctx.font = 'bold 38px serif' // Bigger accidental symbols
    this.ctx.textAlign = 'center'

    if (accidental === '#') {
      this.ctx.fillText('♯', x, y + 11)
    } else if (accidental === '##') {
      // Double sharp (𝄪); fallback to two sharps if glyph unavailable
      const glyph = '𝄪'
      if (this.ctx.measureText(glyph).width > 0) {
        this.ctx.fillText(glyph, x, y + 11)
      } else {
        this.ctx.fillText('♯', x - 6, y + 11)
        this.ctx.fillText('♯', x + 6, y + 11)
      }
    } else if (accidental === 'b') {
      this.ctx.fillText('♭', x, y + 8)
    } else if (accidental === 'bb') {
      // Double flat (𝄫); fallback to two flats if glyph unavailable
      const glyph = '𝄫'
      if (this.ctx.measureText(glyph).width > 0) {
        this.ctx.fillText(glyph, x, y + 8)
      } else {
        this.ctx.fillText('♭', x - 6, y + 8)
        this.ctx.fillText('♭', x + 6, y + 8)
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

      // Map delta to accidental string. Supported: natural(0), #(+1), ##(+2), b(-1=11), bb(-2=10)
      let accidentalStr
      switch (delta) {
        case 0:
          accidentalStr = ''
          break
        case 1:
          accidentalStr = '#'
          break
        case 2:
          accidentalStr = '##'
          break
        case 11:
          accidentalStr = 'b'
          break
        case 10:
          accidentalStr = 'bb'
          break
        default: {
          // Fallback: use chromatic spelling for the target pitch class according to preference
          const chroma =
            this.currentAccidentalPreference === 'flat' ? this.chromaticNotesFlat : this.chromaticNotesSharp
          scale.push(chroma[targetPC])
          continue
        }
      }
      scale.push(letter + accidentalStr)
    }

    // 6) Add octave
    scale.push(scale[0])
    return scale
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

  // Draw the key signature (accidentals next to the clef) for the current key on the upper staff
  drawKeySignature() {
    const keySig = this.getKeySignatureMap()[this.currentKey]
    if (!keySig) return

    // Determine if sharps or flats and the order in which to draw
    const flatOrder = ['B', 'E', 'A', 'D', 'G', 'C', 'F']
    const sharpOrder = ['F', 'C', 'G', 'D', 'A', 'E', 'B']

    const isFlatKey = Object.values(keySig).includes('b')
    const order = isFlatKey ? flatOrder : sharpOrder

    // Build the list of letters to draw in order
    const lettersToDraw = []
    for (const letter of order) {
      if (keySig[letter]) lettersToDraw.push(letter)
    }
    if (lettersToDraw.length === 0) return

    // Staff positions (reuse mapping from getNoteY for upper staff)
    const upperYOffset = this.upperYOffset || 0
    const noteToStaffPosition = {
      C: 235 + upperYOffset,
      D: 225 + upperYOffset,
      E: 215 + upperYOffset,
      F: 205 + upperYOffset,
      G: 195 + upperYOffset,
      A: 185 + upperYOffset,
      B: 175 + upperYOffset,
    }

    // Start drawing just to the right of the treble clef
    let x = 200
    for (const letter of lettersToDraw) {
      const accidental = keySig[letter]
      const y = noteToStaffPosition[letter] || 195
      if (accidental === '#') {
        this.drawAccidental(x, y, '#')
      } else if (accidental === 'b') {
        this.drawAccidental(x, y, 'b')
      }
      x += 16 // spacing between accidentals
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

  getNoteY(noteName, octave, staff = 'upper', scaleIndex = 0) {
    // Define note positions based on staff positions (not semitones)
    // Each position represents where the note sits on the musical staff
    const upperYOffset = this.upperYOffset || 0
    const lowerYOffset = this.lowerYOffset || 0
    const noteToStaffPosition = {
      C: 235 + upperYOffset, // Ledger line below staff
      D: 225 + upperYOffset, // Space below staff
      E: 215 + upperYOffset, // Bottom line (1st line)
      F: 205 + upperYOffset, // Space between 1st and 2nd line
      G: 195 + upperYOffset, // 2nd line
      A: 185 + upperYOffset, // Space between 2nd and 3rd line
      B: 175 + upperYOffset, // 3rd line (middle line)
    }

    const lowerNoteToStaffPosition = {
      C: 385 + lowerYOffset, // Ledger line below lower staff
      D: 375 + lowerYOffset, // Space below lower staff
      E: 365 + lowerYOffset, // Bottom line of lower staff
      F: 355 + lowerYOffset, // Space between 1st and 2nd line
      G: 345 + lowerYOffset, // 2nd line of lower staff
      A: 335 + lowerYOffset, // Space between 2nd and 3rd line
      B: 325 + lowerYOffset, // 3rd line of lower staff
    }

    if (staff === 'upper') {
      // Get the base note name (without sharps/flats for staff position)
      let baseNoteName = noteName
      if (noteName.includes('#') || noteName.includes('b')) {
        baseNoteName = noteName[0]
      }

      // Get the starting staff position based on the base letter of current key
      const keyBaseLetter = this.currentKey.replace(/[#b].*$/, '')
      const startY = noteToStaffPosition[keyBaseLetter] || 235 + upperYOffset

      // Calculate staff position steps from the starting note
      const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const startIndex = noteNames.indexOf(keyBaseLetter)
      const currentIndex = noteNames.indexOf(baseNoteName)

      // Calculate how many staff positions to move
      let staffSteps = 0
      if (scaleIndex === 7) {
        staffSteps = 7 // Octave - exactly 7 staff positions higher
      } else if (scaleIndex !== 0) {
        // For scale degrees, calculate based on note name positions
        staffSteps = (currentIndex - startIndex + 7) % 7
        if (currentIndex < startIndex) {
          staffSteps = currentIndex + (7 - startIndex)
        }
      }

      // Each staff position is 10 pixels apart
      const baseY = startY - staffSteps * 10
      return baseY
    } else {
      // Lower staff - same logic
      let baseNoteName = noteName
      if (noteName.includes('#') || noteName.includes('b')) {
        baseNoteName = noteName[0]
      }

      const keyBaseLetterLower = this.currentKey.replace(/[#b].*$/, '')
      const startY = lowerNoteToStaffPosition[keyBaseLetterLower] || 385 + lowerYOffset
      const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const startIndex = noteNames.indexOf(keyBaseLetterLower)
      const currentIndex = noteNames.indexOf(baseNoteName)

      let staffSteps = 0
      if (scaleIndex === 7) {
        staffSteps = 7
      } else if (scaleIndex !== 0) {
        staffSteps = (currentIndex - startIndex + 7) % 7
        if (currentIndex < startIndex) {
          staffSteps = currentIndex + (7 - startIndex)
        }
      }

      const baseY = startY - staffSteps * 10
      return baseY
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const musicScale = new MusicScale('musicCanvas')

  // Ensure the C major scale is displayed immediately
  window.addEventListener('load', () => {
    musicScale.drawScale()
  })
})
