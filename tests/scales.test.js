// Vanilla Node.js test version of the previous scales.test.js
const assert = require('assert');

function run() {
  const results = { total: 0, passed: 0, failed: [] };

  function it(name, fn) {
    results.total++;
    try {
      fn();
      results.passed++;
      console.log('✓', name);
    } catch (err) {
      results.failed.push({ name, err });
      console.error('✗', name);
      console.error(err && err.message ? err.message : err);
    }
  }

  // Create instance (MusicScale is expected to be global from run_tests.js)
  const MusicScaleClass = global.MusicScale || typeof MusicScale !== 'undefined' && MusicScale;
  if (!MusicScaleClass) {
    console.error('MusicScale class not found in global scope. Make sure scales.js is loaded before tests.');
    process.exitCode = 1;
    return;
  }

  const musicScale = new MusicScaleClass('testCanvas');

  // constructor
  it('initializes with default values', () => {
    assert.strictEqual(musicScale.currentKey, 'C');
    assert.strictEqual(musicScale.currentMode, 'ionian (Duuri)');
    assert.strictEqual(musicScale.currentAccidentalPreference, 'sharp');
    assert.strictEqual(musicScale.STAFF_GAP, 220);
  });

  it('initializes modes correctly', () => {
    assert.deepStrictEqual(musicScale.modes.ionian, [0,2,4,5,7,9,11]);
    assert.deepStrictEqual(musicScale.modes.aeolian, [0,2,3,5,7,8,10]);
  });

  // getKeyList
  it('getKeyList returns correct keys', () => {
    const keys = musicScale.getKeyList();
    assert.deepStrictEqual(keys, ['C','G','D','A','E','B','F#','C#','F','Bb','Eb','Ab','Db']);
    assert.strictEqual(keys.length, 13);
  });

  // getModeList
  it('getModeList returns correct modes', () => {
    const modes = musicScale.getModeList();
    assert.deepStrictEqual(modes, ['ionian (Duuri)','dorian','phrygian','lydian','mixolydian','aeolian (Molli)','locrian']);
    assert.strictEqual(modes.length, 7);
  });

  // getModeDegree
  it('getModeDegree for ionian', () => {
    musicScale.currentMode = 'ionian (Duuri)';
    assert.strictEqual(musicScale.getModeDegree(), 1);
  });
  it('getModeDegree for dorian', () => {
    musicScale.currentMode = 'dorian';
    assert.strictEqual(musicScale.getModeDegree(), 2);
  });
  it('getModeDegree for aeolian', () => {
    musicScale.currentMode = 'aeolian (Molli)';
    assert.strictEqual(musicScale.getModeDegree(), 6);
  });
  it('getModeDegree for locrian', () => {
    musicScale.currentMode = 'locrian';
    assert.strictEqual(musicScale.getModeDegree(), 7);
  });
  it('getModeDegree default for unknown', () => {
    musicScale.currentMode = 'unknown';
    assert.strictEqual(musicScale.getModeDegree(), 1);
  });

  // getModeAlterations
  it('getModeAlterations null for ionian', () => {
    musicScale.currentMode = 'ionian (Duuri)';
    assert.strictEqual(musicScale.getModeAlterations(), null);
  });
  it('getModeAlterations dorian', () => {
    musicScale.currentMode = 'dorian';
    const alt = musicScale.getModeAlterations();
    assert.deepStrictEqual(alt.lowered, [3,7]);
    assert.deepStrictEqual(alt.raised, []);
  });
  it('getModeAlterations lydian', () => {
    musicScale.currentMode = 'lydian';
    const alt = musicScale.getModeAlterations();
    assert.deepStrictEqual(alt.raised, [4]);
    assert.deepStrictEqual(alt.lowered, []);
  });
  it('getModeAlterations mixolydian', () => {
    musicScale.currentMode = 'mixolydian';
    const alt = musicScale.getModeAlterations();
    assert.deepStrictEqual(alt.lowered, [7]);
    assert.deepStrictEqual(alt.raised, []);
  });

  // getScale
  it('getScale C ionian', () => {
    musicScale.currentKey = 'C';
    musicScale.currentMode = 'ionian (Duuri)';
    assert.deepStrictEqual(musicScale.getScale(), ['C','D','E','F','G','A','B','C']);
  });
  it('getScale G ionian', () => {
    musicScale.currentKey = 'G';
    musicScale.currentMode = 'ionian (Duuri)';
    assert.deepStrictEqual(musicScale.getScale(), ['G','A','B','C','D','E','F#','G']);
  });
  it('getScale D dorian', () => {
    musicScale.currentKey = 'D';
    musicScale.currentMode = 'dorian';
    assert.deepStrictEqual(musicScale.getScale(), ['D','E','F','G','A','B','C','D']);
  });
  it('getScale A aeolian', () => {
    musicScale.currentKey = 'A';
    musicScale.currentMode = 'aeolian (Molli)';
    assert.deepStrictEqual(musicScale.getScale(), ['A','B','C','D','E','F','G','A']);
  });

  // getAccidentalString
  it('getAccidentalString delta 0', () => { assert.strictEqual(musicScale.getAccidentalString(0,'C'), ''); });
  it('getAccidentalString delta 1', () => { assert.strictEqual(musicScale.getAccidentalString(1,'C'), '#'); });
  it('getAccidentalString delta 2', () => { assert.strictEqual(musicScale.getAccidentalString(2,'C'), '##'); });
  it('getAccidentalString delta 11', () => { assert.strictEqual(musicScale.getAccidentalString(11,'C'), 'b'); });
  it('getAccidentalString delta 10', () => { assert.strictEqual(musicScale.getAccidentalString(10,'C'), 'bb'); });
  it('getAccidentalString throw for unsupported', () => {
    assert.throws(() => musicScale.getAccidentalString(5,'C'));
  });

  // getNoteInfo
  it('getNoteInfo natural', () => {
    const info = musicScale.getNoteInfo('C');
    assert.strictEqual(info.noteName, 'C');
    assert.strictEqual(info.accidental, null);
    assert.strictEqual(info.octave, 5);
  });
  it('getNoteInfo sharp', () => { const info = musicScale.getNoteInfo('F#'); assert.strictEqual(info.noteName,'F'); assert.strictEqual(info.accidental,'#'); });
  it('getNoteInfo flat', () => { const info = musicScale.getNoteInfo('Bb'); assert.strictEqual(info.noteName,'B'); assert.strictEqual(info.accidental,'b'); });
  it('getNoteInfo double sharp', () => { const info = musicScale.getNoteInfo('C##'); assert.strictEqual(info.noteName,'C'); assert.strictEqual(info.accidental,'##'); });
  it('getNoteInfo double flat', () => { const info = musicScale.getNoteInfo('Dbb'); assert.strictEqual(info.noteName,'D'); assert.strictEqual(info.accidental,'bb'); });

  // calculateStaffSteps
  it('calculateStaffSteps root 0', () => { assert.strictEqual(musicScale.calculateStaffSteps('C','C',0), 0); });
  it('calculateStaffSteps ascending', () => { assert.strictEqual(musicScale.calculateStaffSteps('C','D',1),1); assert.strictEqual(musicScale.calculateStaffSteps('C','E',2),2); assert.strictEqual(musicScale.calculateStaffSteps('C','G',4),4); });
  it('calculateStaffSteps octave', () => { assert.strictEqual(musicScale.calculateStaffSteps('C','C',7),7); assert.strictEqual(musicScale.calculateStaffSteps('G','G',7),7); });
  it('calculateStaffSteps wrapping', () => { assert.strictEqual(musicScale.calculateStaffSteps('G','C',4),4); });

  // getKeySignatureMap
  it('getKeySignatureMap C', () => { const map = musicScale.getKeySignatureMap(); assert.deepStrictEqual(map.C, {}); });
  it('getKeySignatureMap G', () => { const map = musicScale.getKeySignatureMap(); assert.deepStrictEqual(map.G, { F: '#' }); });
  it('getKeySignatureMap F', () => { const map = musicScale.getKeySignatureMap(); assert.deepStrictEqual(map.F, { B: 'b' }); });
  it('getKeySignatureMap D', () => { const map = musicScale.getKeySignatureMap(); assert.deepStrictEqual(map.D, { F: '#', C: '#' }); });

  // getNoteY
  it('getNoteY C upper', () => { musicScale.currentKey = 'C'; const y = musicScale.getNoteY('C',5,'upper',0); assert.strictEqual(y, 220); });
  it('getNoteY G upper', () => { musicScale.currentKey = 'C'; const y = musicScale.getNoteY('G',5,'upper',4); assert.strictEqual(y, 170); });
  it('getNoteY lower vs upper', () => { musicScale.currentKey = 'C'; const yUpper = musicScale.getNoteY('C',5,'upper',0); const yLower = musicScale.getNoteY('C',5,'lower',0); assert.strictEqual(yLower, yUpper + musicScale.STAFF_GAP); });

  // Summary
  console.log(`\nResults: ${results.passed}/${results.total} passed, ${results.failed.length} failed.`);
  if (results.failed.length > 0) process.exitCode = 1;
}

run();
