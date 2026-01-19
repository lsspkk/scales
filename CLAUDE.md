# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Kirkkosävellajit** (Musical Scale Generator) is a web-based application that displays musical scales in G clef notation on an HTML5 canvas. It allows users to select different keys and musical modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian) and visualizes the scale with proper accidentals, ledger lines, and staff notation.

## Quick Start: Development

For fast development with automatic browser refresh:

```sh
npx live-server
```

This opens the site in your browser and reloads automatically when HTML, CSS, or JS files change. No installation required.

## Architecture Overview

### Core Components

1. **`script.js` - MusicScale Class**
   - Main application logic for music theory and canvas rendering
   - Key responsibilities:
     - Scale generation using interval patterns (modes) from the root note
     - Canvas rendering: staff lines, treble clef, note heads, stems, accidentals, ledger lines
     - Note positioning on the staff using pitch class arithmetic
     - Accidental preference management (sharps vs. flats)
   - Key data structures:
     - `modes`: Interval patterns for each of the 7 modes (e.g., `ionian: [0, 2, 4, 5, 7, 9, 11]`)
     - `currentKey`: Root note (e.g., 'C', 'G#', 'Bb')
     - `currentMode`: Selected mode name with optional display suffix (e.g., 'ionian (Duuri)')
     - `currentAccidentalPreference`: 'sharp' or 'flat' for enharmonic spellings

2. **`events.js` - Event Handlers**
   - User interaction layer: button clicks, menu toggles
   - Updates MusicScale state and triggers redraws
   - Manages button active states and UI synchronization
   - Handles responsive mobile dropdown menu toggle

3. **`index.html` - Structure**
   - Responsive layout with two control sections:
     - Desktop: `selectionMenuDesktop` (always visible, buttons in rows)
     - Mobile: `selectionMenuMobile` (dropdown triggered by `menuToggle` button)
   - Canvas element (`musicCanvas`) for notation display
   - Quick navigation: Previous/Next buttons for notes and modes
   - Selection summary and mode explanation text elements

4. **`styles.css` - Styling**
   - Responsive design with breakpoint at 768px
   - Medieval parchment aesthetic (warm colors, MedievalSharp font for title)
   - Color-coded buttons: brown tones for note selection, red tones for mode selection
   - Canvas viewport scaling for mobile (width: 110%, negative margin trick to trim edges)

### Music Theory Implementation

**Scale Generation (`getScale()` method):**
1. Takes mode intervals (e.g., Dorian: `[0, 2, 3, 5, 7, 9, 10]`)
2. Applies intervals to the root note pitch class
3. Spells each note using the correct letter sequence (C-D-E-F-G-A-B pattern)
4. Resolves accidentals (natural, sharp, flat, double-sharp, double-flat) to match the target pitch class with minimal accidentals
5. Returns 7 notes + octave (8 total)

**Note Positioning:**
- Each note letter has a fixed staff position relative to the root note letter
- `getNoteY()` calculates Y-coordinate based on staff position offset and ledger line logic
- Upper staff (notes ascending) and lower staff (notes descending) are displayed with visual separation

**Accidentals:**
- Sizes adapt to screen width (mobile: larger for visibility)
- Double accidentals handled with Unicode glyphs or fallback to two symbols
- Positioned 32 pixels left of the note head

### Data Flow

```
User clicks button (events.js)
  ↓
Updates musicScale.currentKey/currentMode/etc
  ↓
Calls musicScale.drawScale() → redraws canvas
  ↓
Calls musicScale.updateSelectionSummary() → updates UI text
```

## File Structure

```
.
├── index.html           # Main HTML structure
├── script.js            # MusicScale class (music theory + canvas rendering)
├── events.js            # Event listeners and user interaction
├── styles.css           # Responsive design and theming
├── README.md            # User-facing documentation
├── LICENSE              # MIT License
├── CLAUDE.md            # This file
└── .github/workflows/
    └── deploy-to-azure.yml  # CI/CD: uploads files to Azure Storage on push to main
```

## Key Methods in MusicScale Class

| Method | Purpose |
|--------|---------|
| `getScale()` | Generate 8-note scale (7 + octave) with correct spelling |
| `drawScale()` | Redraw entire canvas (calls drawStaff, drawTrebleClef, drawNotes) |
| `drawNotes()` | Iterate scale and position notes on upper/lower staves |
| `drawNote(x, note, staff, scaleIndex)` | Draw single note with head, stem, accidental, ledger lines |
| `getNoteY(noteName, octave, staff, scaleIndex)` | Calculate Y-coordinate for note on staff |
| `drawAccidental(x, y, accidental)` | Render sharp/flat symbols |
| `getModeAlterations()` | Return raised/lowered scale degrees vs. Ionian (for UI display) |
| `updateSelectionSummary()` | Update mode explanation and alteration text in UI |

## Development Notes

### Canvas Dimensions and Positioning

- Canvas: 1000×500 pixels
- Two staves separated by `STAFF_GAP` (220 pixels)
- Staff lines: 5 per staff at 25-pixel intervals
- Treble clef: 105px serif font, positioned at x=100
- Notes start at x=190 with 100-pixel spacing

### Responsive Design Considerations

- **Desktop** (>768px): All buttons visible, inline mode explanation
- **Mobile** (≤768px): Compact header with dropdown menu, quick navigation arrows, larger accidental symbols
- Canvas scales to 110% width on mobile with negative margin (trims 5% from each side)

### Mode Naming

- Mode names in button data attributes are lowercase, no spaces: `ionian`, `dorian`, etc.
- Display names sometimes include translations: `'ionian (Duuri)'`, `'aeolian (Molli)'`
- `getModeList()` returns display names; internal code splits on space to get base mode

### Key Signature Handling

`getKeySignatureMap()` returns all major scale key signatures (sharps and flats). Not currently used in rendering, but available for future enhancements like displaying key signatures on the staff.

## Deployment

Deployment to Azure is automated via GitHub Actions (`.github/workflows/deploy-to-azure.yml`):
- Triggers on push to `main` branch
- Uploads HTML, CSS, and JS files to Azure Storage with appropriate MIME types
- Secrets required: `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_ACCOUNT_KEY`

## Common Development Tasks

### Add a New Mode
1. Add interval pattern to `script.js` `modes` object (e.g., `newmode: [0, 2, 3, ...]`)
2. Add button to both desktop and mobile menu sections in `index.html` with `data-mode="newmode"`
3. Mode explanation updates automatically via `getModeAlterations()`

### Modify Canvas Layout
- Adjust staff positions: `STAFF_GAP`, staff line Y-coordinates in `drawStaff()`
- Adjust note spacing: `noteSpacing` in `drawNotes()`, `startX` position
- Adjust note head size: `ellipse()` call in `drawNote()`

### Update Styling
- Button colors, hover states: search `styles.css` for color values (e.g., `#5a2d0c` brown, `#a0563f` red)
- Mobile breakpoint: 768px (change affects both CSS and canvas viewport scaling)
- Font: MedievalSharp (title), Arial (UI)
