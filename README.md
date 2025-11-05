# Musical Scale Generator

A web-based musical scale generator that displays scales in G clef notation on an HTML5 canvas.

## Features

- **Key Selection**: Choose from 7 different keys (C, D, E, F, G, A, B)
- **Mode Selection**: Select from all 7 musical modes:
  - Ionian (Major)
  - Dorian
  - Phrygian
  - Lydian
  - Mixolydian
  - Aeolian (Minor)
  - Locrian
- **Random Mode**: Generate a random mode for the selected key
- **Visual Notation**:
  - G clef staff with proper notation lines
  - Standard note symbols (filled note heads with stems)
  - Sharp (♯) and flat (♭) accidentals
  - Ledger lines for notes outside the staff
  - No bar lines for clean scale display

## How to Use

1. Open `index.html` in a web browser
2. Select a key using the key buttons
3. Choose a mode using the mode buttons, or click "Random Mode"
4. The canvas will display the selected scale in G clef notation

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `script.js` - JavaScript functionality and canvas drawing
- `README.md` - This documentation

## Technical Details

The application uses HTML5 Canvas for rendering musical notation, with precise positioning for notes, accidentals, and staff elements. The scale generation follows proper music theory with accurate interval patterns for each mode.
