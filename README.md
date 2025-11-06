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

## Development: Hot Reload (Live Preview)

For a fast workflow with automatic browser refresh on file changes and minimal disk usage, use npx to run live-server (no install needed):

```sh
npx live-server
```

This will open your site in the browser and reload automatically when you edit HTML, CSS, or JS files. No global or local install required; npx downloads and runs it temporarily.

---

## How to Use

1. Open `index.html` in a web browser, or use one of the hot reload options above for live development.
2. Select a key using the key buttons
3. Choose a mode using the mode buttons, or click "Random Mode"
4. The canvas will display the selected scale in G clef notation

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and layout
- `script.js` - MusicScale class with canvas drawing and music theory logic
- `events.js` - Event handlers and user interaction listeners
- `README.md` - This documentation
- `LICENSE` - MIT License

## Technical Details

The application uses HTML5 Canvas for rendering musical notation, with precise positioning for notes, accidentals, and staff elements. The scale generation follows proper music theory with accurate interval patterns for each mode.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Created by **lsspkk** using AI agents in [Vibe Coding](https://cursor.com/) fashion.

This project demonstrates modern AI-assisted development, where developers collaborate with AI coding agents to rapidly build full-featured applications. The entire codebase, from music theory algorithms to responsive UI, was created through natural language conversations with AI.
