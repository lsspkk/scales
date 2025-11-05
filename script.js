class MusicScale {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId)
    this.ctx = this.canvas.getContext('2d')
    this.currentKey = 'C'
    this.currentMode = 'ionian'

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

    // Chromatic notes
    this.chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

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
    // Use the visible keys in the UI, matching the button order
    return ['C', 'D', 'E', 'F', 'G', 'A', 'B']
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
    document.querySelectorAll('.key-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.key-btn').forEach((b) => b.classList.remove('active'))
        e.target.classList.add('active')
        this.currentKey = e.target.dataset.key
        this.drawScale()
        this.updateSelectionSummary()
        // Close menu on mobile after selection
        if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
      })
    })

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'))
        e.target.classList.add('active')
        this.currentMode = e.target.dataset.mode
        this.drawScale()
        this.updateSelectionSummary()
        if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
      })
    })

    // Random button
    document.getElementById('randomBtn').addEventListener('click', () => {
      const modes = Object.keys(this.modes)
      const randomMode = modes[Math.floor(Math.random() * modes.length)]

      document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'))
      document.querySelector(`[data-mode="${randomMode}"]`).classList.add('active')

      this.currentMode = randomMode
      this.drawScale()
      this.updateSelectionSummary()
      if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
    })

    // Previous/Next note buttons
    const prevNoteBtn = document.getElementById('prevNoteBtn')
    const nextNoteBtn = document.getElementById('nextNoteBtn')
    if (prevNoteBtn && nextNoteBtn) {
      prevNoteBtn.addEventListener('click', () => {
        const keys = this.getKeyList()
        let idx = keys.indexOf(this.currentKey)
        idx = (idx - 1 + keys.length) % keys.length
        this.currentKey = keys[idx]
        document.querySelectorAll('.key-btn').forEach((b) => b.classList.remove('active'))
        const btn = document.querySelector(`.key-btn[data-key="${this.currentKey}"]`)
        if (btn) btn.classList.add('active')
        this.drawScale()
        this.updateSelectionSummary()
      })
      nextNoteBtn.addEventListener('click', () => {
        const keys = this.getKeyList()
        let idx = keys.indexOf(this.currentKey)
        idx = (idx + 1) % keys.length
        this.currentKey = keys[idx]
        document.querySelectorAll('.key-btn').forEach((b) => b.classList.remove('active'))
        const btn = document.querySelector(`.key-btn[data-key="${this.currentKey}"]`)
        if (btn) btn.classList.add('active')
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
        document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'))
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
        document.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('active'))
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
    this.drawNotes()
  }

  drawStaff() {
    const startX = 150
    const endX = this.canvas.width - 50

    // Upper staff lines
    const upperStaffLines = [135, 155, 175, 195, 215] // E, G, B, D, F lines

    // Lower staff lines (150px below upper staff)
    const lowerStaffLines = [285, 305, 325, 345, 365] // E, G, B, D, F lines

    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 1

    // Draw upper staff lines
    upperStaffLines.forEach((y) => {
      this.ctx.beginPath()
      this.ctx.moveTo(startX, y)
      this.ctx.lineTo(endX, y)
      this.ctx.stroke()
    })

    // Draw lower staff lines
    lowerStaffLines.forEach((y) => {
      this.ctx.beginPath()
      this.ctx.moveTo(startX, y)
      this.ctx.lineTo(endX, y)
      this.ctx.stroke()
    })
  }

  drawTrebleClef() {
    // Upper staff treble clef
    const x1 = 160
    const y1 = 175

    // Lower staff treble clef
    const x2 = 160
    const y2 = 325

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
    scale.forEach((note, index) => {
      const x = startX + index * noteSpacing
      this.drawNote(x, note, 'upper', index)
    })

    // Draw scale going down on lower staff (from octave to root)
    const reverseScale = [...scale].reverse()
    reverseScale.forEach((note, index) => {
      const x = startX + index * noteSpacing
      // Calculate the correct scale index for descending scale
      const descendingIndex = scale.length - 1 - index
      this.drawNote(x, note, 'lower', descendingIndex)
    })
  }

  drawNote(x, note, staff = 'upper', scaleIndex = 0) {
    const noteInfo = this.getNoteInfo(note)
    const y = this.getNoteY(noteInfo.noteName, noteInfo.octave, staff, scaleIndex)

    // Draw note head (made bigger)
    this.ctx.fillStyle = '#000'
    this.ctx.beginPath()
    this.ctx.ellipse(x, y, 10, 8, -Math.PI / 6, 0, 2 * Math.PI) // Increased from 8,6 to 10,8
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
    if (staff === 'upper') {
      // C6 (middle C) ledger line at y=155
      if (Math.abs(y - 155) < 2) {
        this.ctx.beginPath()
        this.ctx.moveTo(x - 15, 155)
        this.ctx.lineTo(x + 15, 155)
        this.ctx.lineWidth = 1
        this.ctx.stroke()
      }

      // Additional ledger lines above upper staff
      if (y < 135) {
        for (let ledgerY = 115; ledgerY >= y - 5; ledgerY -= 20) {
          this.ctx.beginPath()
          this.ctx.moveTo(x - 15, ledgerY)
          this.ctx.lineTo(x + 15, ledgerY)
          this.ctx.stroke()
        }
      }

      // Additional ledger lines below upper staff
      if (y > 215) {
        for (let ledgerY = 235; ledgerY <= y + 5; ledgerY += 20) {
          this.ctx.beginPath()
          this.ctx.moveTo(x - 15, ledgerY)
          this.ctx.lineTo(x + 15, ledgerY)
          this.ctx.stroke()
        }
      }
    } else {
      // Lower staff ledger lines
      if (y < 285) {
        for (let ledgerY = 265; ledgerY >= y - 5; ledgerY -= 20) {
          this.ctx.beginPath()
          this.ctx.moveTo(x - 15, ledgerY)
          this.ctx.lineTo(x + 15, ledgerY)
          this.ctx.stroke()
        }
      }

      if (y > 365) {
        for (let ledgerY = 385; ledgerY <= y + 5; ledgerY += 20) {
          this.ctx.beginPath()
          this.ctx.moveTo(x - 15, ledgerY)
          this.ctx.lineTo(x + 15, ledgerY)
          this.ctx.stroke()
        }
      }
    }
  }

  drawAccidental(x, y, accidental) {
    this.ctx.fillStyle = '#000'
    this.ctx.font = 'bold 30px serif' // Increased from 20px to 30px
    this.ctx.textAlign = 'center'

    if (accidental === '#') {
      this.ctx.fillText('♯', x, y + 5)
    } else if (accidental === 'b') {
      this.ctx.fillText('♭', x, y + 5)
    }
  }

  getScale() {
    const rootIndex = this.chromaticNotes.indexOf(this.currentKey)
    const intervals = this.modes[this.currentMode]

    // Create scale starting from the selected note (7 scale degrees)
    const scale = intervals.map((interval) => {
      const noteIndex = (rootIndex + interval) % 12
      return this.chromaticNotes[noteIndex]
    })

    // Add the octave note (8th note - same as root but one octave higher)
    scale.push(this.currentKey)

    return scale
  }

  getNoteInfo(note) {
    let noteName, accidental

    if (note.includes('#')) {
      noteName = note[0]
      accidental = '#'
    } else if (note.includes('b')) {
      noteName = note[0]
      accidental = 'b'
    } else {
      noteName = note
      accidental = null
    }

    // Octave is handled by staff positioning, not needed here
    const octave = 5

    return { noteName, accidental, octave }
  }

  getNoteY(noteName, octave, staff = 'upper', scaleIndex = 0) {
    // Define note positions based on staff positions (not semitones)
    // Each position represents where the note sits on the musical staff
    const noteToStaffPosition = {
      C: 235, // Ledger line below staff
      D: 225, // Space below staff
      E: 215, // Bottom line (1st line)
      F: 205, // Space between 1st and 2nd line
      G: 195, // 2nd line
      A: 185, // Space between 2nd and 3rd line
      B: 175, // 3rd line (middle line)
    }

    const lowerNoteToStaffPosition = {
      C: 385, // Ledger line below lower staff
      D: 375, // Space below lower staff
      E: 365, // Bottom line of lower staff
      F: 355, // Space between 1st and 2nd line
      G: 345, // 2nd line of lower staff
      A: 335, // Space between 2nd and 3rd line
      B: 325, // 3rd line of lower staff
    }

    if (staff === 'upper') {
      // Get the base note name (without sharps/flats for staff position)
      let baseNoteName = noteName
      if (noteName.includes('#') || noteName.includes('b')) {
        baseNoteName = noteName[0]
      }

      // Get the starting staff position
      const startY = noteToStaffPosition[this.currentKey] || 235

      // Calculate staff position steps from the starting note
      const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const startIndex = noteNames.indexOf(this.currentKey)
      const currentIndex = noteNames.indexOf(baseNoteName)

      // Calculate how many staff positions to move
      let staffSteps = 0
      if (scaleIndex === 0) {
        staffSteps = 0 // Starting note
      } else if (scaleIndex === 7) {
        staffSteps = 7 // Octave - exactly 7 staff positions higher
      } else {
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

      const startY = lowerNoteToStaffPosition[this.currentKey] || 385
      const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
      const startIndex = noteNames.indexOf(this.currentKey)
      const currentIndex = noteNames.indexOf(baseNoteName)

      let staffSteps = 0
      if (scaleIndex === 0) {
        staffSteps = 0
      } else if (scaleIndex === 7) {
        staffSteps = 7
      } else {
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
