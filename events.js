// Event handlers and UI interactions for the Musical Scale Generator

function setupEventListeners(musicScale) {
  const selectionMenu = document.getElementById('selectionMenu')
  const menuToggle = document.getElementById('menuToggle')

  // Menu toggle button
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
      musicScale.currentKey = e.target.dataset.key
      musicScale.currentAccidentalPreference = e.target.dataset.accidental || 'sharp'
      musicScale.drawScale()
      musicScale.updateSelectionSummary()
      // Close menu on mobile after selection
      if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
    })
  }

  // Mode buttons
  for (const btn of document.querySelectorAll('.mode-btn')) {
    btn.addEventListener('click', (e) => {
      for (const b of document.querySelectorAll('.mode-btn')) b.classList.remove('active')
      e.target.classList.add('active')
      musicScale.currentMode = e.target.dataset.mode
      musicScale.drawScale()
      musicScale.updateSelectionSummary()
      if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
    })
  }

  // RandomMode button (randomizes mode only)
  document.getElementById('randomBtn').addEventListener('click', () => {
    const modes = musicScale.getModeList()
    const randomMode = modes[Math.floor(Math.random() * modes.length)]
    for (const b of document.querySelectorAll('.mode-btn')) b.classList.remove('active')
    const modeBtn = document.querySelector(`[data-mode="${randomMode}"]`)
    if (modeBtn) modeBtn.classList.add('active')
    musicScale.currentMode = randomMode
    musicScale.drawScale()
    musicScale.updateSelectionSummary()
    if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
  })

  // RandomSävel button (randomizes note only)
  document.getElementById('randomNoteBtn').addEventListener('click', () => {
    const keys = musicScale.getKeyList()
    const randomKey = keys[Math.floor(Math.random() * keys.length)]
    const btn = document.querySelector(`.key-btn[data-key="${randomKey}"]`)
    if (btn) {
      for (const b of document.querySelectorAll('.key-btn')) b.classList.remove('active')
      btn.classList.add('active')
      musicScale.currentKey = randomKey
      musicScale.currentAccidentalPreference = btn.dataset.accidental || 'sharp'
    }
    musicScale.drawScale()
    musicScale.updateSelectionSummary()
    if (selectionMenu?.classList.contains('open')) selectionMenu.classList.remove('open')
  })

  // Previous/Next note buttons
  const prevNoteBtn = document.getElementById('prevNoteBtn')
  const nextNoteBtn = document.getElementById('nextNoteBtn')
  if (prevNoteBtn && nextNoteBtn) {
    // Down arrow (prevNoteBtn) = go to previous note in the list
    prevNoteBtn.addEventListener('click', () => {
      const keys = musicScale.getKeyList()
      let idx = keys.indexOf(musicScale.currentKey)
      idx = (idx + 1) % keys.length
      musicScale.currentKey = keys[idx]
      // Update accidental preference based on the new key
      const btn = document.querySelector(`.key-btn[data-key="${musicScale.currentKey}"]`)
      if (btn) {
        musicScale.currentAccidentalPreference = btn.dataset.accidental || 'sharp'
        for (const b of document.querySelectorAll('.key-btn')) b.classList.remove('active')
        btn.classList.add('active')
      }
      musicScale.drawScale()
      musicScale.updateSelectionSummary()
    })
    // Up arrow (nextNoteBtn) = go to next note in the list
    nextNoteBtn.addEventListener('click', () => {
      const keys = musicScale.getKeyList()
      let idx = keys.indexOf(musicScale.currentKey)
      idx = (idx - 1 + keys.length) % keys.length
      musicScale.currentKey = keys[idx]
      // Update accidental preference based on the new key
      const btn = document.querySelector(`.key-btn[data-key="${musicScale.currentKey}"]`)
      if (btn) {
        musicScale.currentAccidentalPreference = btn.dataset.accidental || 'sharp'
        for (const b of document.querySelectorAll('.key-btn')) b.classList.remove('active')
        btn.classList.add('active')
      }
      musicScale.drawScale()
      musicScale.updateSelectionSummary()
    })
  }

  // Previous/Next mode buttons
  const prevModeBtn = document.getElementById('prevModeBtn')
  const nextModeBtn = document.getElementById('nextModeBtn')
  if (prevModeBtn && nextModeBtn) {
    prevModeBtn.addEventListener('click', () => {
      const modes = musicScale.getModeList()
      let idx = modes.indexOf(musicScale.currentMode)
      idx = (idx - 1 + modes.length) % modes.length
      musicScale.currentMode = modes[idx]
      for (const b of document.querySelectorAll('.mode-btn')) b.classList.remove('active')
      const btn = document.querySelector(`.mode-btn[data-mode="${musicScale.currentMode}"]`)
      if (btn) btn.classList.add('active')
      musicScale.drawScale()
      musicScale.updateSelectionSummary()
    })
    nextModeBtn.addEventListener('click', () => {
      const modes = musicScale.getModeList()
      let idx = modes.indexOf(musicScale.currentMode)
      idx = (idx + 1) % modes.length
      musicScale.currentMode = modes[idx]
      for (const b of document.querySelectorAll('.mode-btn')) b.classList.remove('active')
      const btn = document.querySelector(`.mode-btn[data-mode="${musicScale.currentMode}"]`)
      if (btn) btn.classList.add('active')
      musicScale.drawScale()
      musicScale.updateSelectionSummary()
    })
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const musicScale = new MusicScale('musicCanvas')
  setupEventListeners(musicScale)

  // Ensure the C major scale is displayed immediately
  window.addEventListener('load', () => {
    musicScale.drawScale()
    musicScale.updateSelectionSummary()
  })
})

