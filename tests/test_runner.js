/*
 * Test Runner: Vanilla Node.js (AI-friendly)
 *
 * Purpose
 * - This project does not use any Node test framework (no Jest/Mocha/etc.).
 * - Tests live in the `tests/` directory as plain `.js` files.
 * - This runner loads `scales.js` into the global scope and provides
 *   a minimal browser-like mock (DOM canvas + window) so code that
 *   expects `document.getElementById(...).getContext('2d')` works.
 *
 * Design Goals (for humans and AIs)
 * - Simple: tests are ordinary Node modules that execute when required,
 *   or export a `run` function that the runner will call.
 * - Predictable: the runner sets up `global.document` and `global.window`.
 * - AI-friendly: the comment below explains how to add tests and how
 *   an AI should generate new tests for this repo.
 *
 * How the runner works
 * 1. Create minimal mock classes: `MockCanvasContext` and `MockCanvas`.
 * 2. Install `global.document.getElementById(id)` returning a `MockCanvas`
 *    when `id === 'testCanvas'` (tests and `scales.js` use this ID).
 * 3. Set `global.window.innerWidth` so code that branches on viewport
 *    width behaves consistently.
 * 4. Load `scales.js` source into the global context. This makes the
 *    `MusicScale` class available as if the script had run in a browser.
 * 5. Require every `.js` file in `tests/` except this runner. If the
 *    required module exports a function (or `module.exports.run`), the
 *    runner will call it; otherwise the module can run assertions when
 *    required (both styles supported).
 *
 * How to add tests (for human developers and for AIs generating tests)
 * - Place new tests in `tests/` with a `.js` extension.
 * - Preferred patterns:
 *   a) Immediate-run style (simple): write assertions at the top level.
 *      Example:
 *        const assert = require('assert');
 *        // setup
 *        assert.strictEqual(1 + 1, 2);
 *   b) Exported function style (recommended): export a function named
 *      `run` or export the test function itself. The runner will call it.
 *      Example:
 *        module.exports = function run() {
 *          const assert = require('assert');
 *          // setup
 *          assert.strictEqual(1 + 1, 2);
 *        }
 *
 * - When an AI writes tests, prefer the exported `run` function style so
 *   the runner can call the test explicitly and report which test file
 *   ran. Keep tests deterministic and avoid network or filename-specific
 *   randomness.
 *
 * Test-writing tips for AI
 * - Import only `assert` from Node core for assertions.
 * - Avoid global state leakage: if a test modifies `global.window` or
 *   `global.document`, restore values at the end or isolate changes.
 * - Reuse the `testCanvas` element for canvas-dependent classes; it
 *   already has a `getContext` implementation.
 * - If verifying drawing operations, examine `mockCanvas.ctx.operations`.
 * - Make tests small and focused: one assertion block per concept.
 * - Prefer deterministic inputs (explicit keys/modes) and check exact
 *   outputs (arrays, primitive values).
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- Minimal Canvas + DOM mocks used by scales.js and tests ---
class MockCanvasContext {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 0;
    this.font = '';
    this.textAlign = '';
    this.operations = [];
  }
  clearRect(x, y, w, h) { this.operations.push({ type: 'clearRect', x, y, w, h }); }
  beginPath() { this.operations.push({ type: 'beginPath' }); }
  moveTo(x, y) { this.operations.push({ type: 'moveTo', x, y }); }
  lineTo(x, y) { this.operations.push({ type: 'lineTo', x, y }); }
  stroke() { this.operations.push({ type: 'stroke' }); }
  fill() { this.operations.push({ type: 'fill' }); }
  ellipse(x, y, rx, ry, rotation, sa, ea) { this.operations.push({ type: 'ellipse', x, y, rx, ry, rotation, sa, ea }); }
  fillText(text, x, y) { this.operations.push({ type: 'fillText', text, x, y }); }
  measureText(text) { return { width: text.length * 10 }; }
}

class MockCanvas {
  constructor() { this.width = 800; this.height = 600; this.ctx = new MockCanvasContext(); }
  getContext() { return this.ctx; }
}

// Provide global document and window
global.document = {
  getElementById: (id) => {
    if (id === 'testCanvas') return new MockCanvas();
    return { textContent: '' };
  }
};
global.window = { innerWidth: 1024 };

// --- Load scales.js into the global scope ---
const scalesPath = path.join(__dirname, '..', 'scales.js');
const scalesCode = fs.readFileSync(scalesPath, 'utf8');
vm.runInNewContext(scalesCode, global, { filename: 'scales.js' });

// --- Discover and run tests ---
const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js') && f !== path.basename(__filename));

console.log('Test runner: executing', files.length, 'test file(s) in `tests/`');
for (const f of files) {
  const full = path.join(__dirname, f);
  console.log('\n---', f, '---');
  try {
    const mod = require(full);
    // If module exports a function or an object with `run`, call it.
    if (typeof mod === 'function') {
      mod();
    } else if (mod && typeof mod.run === 'function') {
      mod.run();
    }
  } catch (err) {
    console.error('Error running', f);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

console.log('\nAll tests in `tests/` executed.');
