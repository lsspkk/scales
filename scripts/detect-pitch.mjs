#!/usr/bin/env node
/**
 * Detect the fundamental pitch of an audio file from the command line.
 *
 *   node scripts/detect-pitch.mjs path/to/sample.mp3
 *   node scripts/detect-pitch.mjs --json path/to/sample.mp3
 *   node scripts/detect-pitch.mjs --pitchy path/to/sample.mp3
 *
 * Decoding is done by piping the file through system `ffmpeg` to raw
 * 32-bit float mono PCM, then a pure-TS detector is run against the buffer.
 *
 * Two detectors are available, both environment-agnostic:
 *   - default: YIN (`detectPitch` from app/src/lib/audio/pitchDetect.ts).
 *   - `--pitchy`: the MPM detector used by the live tuner
 *     (`detectPitchMPM` from app/src/lib/audio/tuner.ts). This is the cheap
 *     offline aid for confirming the live algorithm returns the right note +
 *     high clarity without a mic (Task 27).
 *
 * This CLI is just the file-I/O wrapper; the same detectors run in-browser.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function loadDetector(usePitchy) {
  // Lazy-import the TS source. Node ≥ 22.6 strips types from plain .ts files
  // when --experimental-strip-types is on (the npm `detect-pitch` script sets
  // it). Importing the TS via its file URL keeps ONE source of truth: the same
  // detector code that ships in the browser. For --pitchy this imports
  // tuner.ts, whose `import 'pitchy'` resolves from app/node_modules because
  // the module lives under app/src.
  const rel = usePitchy ? '../app/src/lib/audio/tuner.ts' : '../app/src/lib/audio/pitchDetect.ts'
  const tsPath = resolve(__dirname, rel)
  const tuningPath = resolve(__dirname, '../app/src/lib/audio/tuning.ts')
  if (!existsSync(tsPath) || !existsSync(tuningPath)) {
    throw new Error(`Missing TS source files at ${tsPath} / ${tuningPath}`)
  }
  const mod = await import(pathToFileURL(tsPath).href)
  return usePitchy ? mod.detectPitchMPM : mod.detectPitch
}

function decodeToFloat32(filePath) {
  return new Promise((resolveDecode, rejectDecode) => {
    const args = ['-v', 'error', '-i', filePath, '-f', 'f32le', '-ac', '1', '-ar', '48000', 'pipe:1']
    const proc = spawn('ffmpeg', args)
    const chunks = []
    proc.stdout.on('data', (chunk) => chunks.push(chunk))
    let stderr = ''
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    proc.on('error', rejectDecode)
    proc.on('close', (code) => {
      if (code !== 0) {
        rejectDecode(new Error(`ffmpeg exited with code ${code}: ${stderr}`))
        return
      }
      const merged = Buffer.concat(chunks)
      const samples = new Float32Array(merged.buffer, merged.byteOffset, merged.byteLength / 4)
      resolveDecode({ samples: samples.slice(), sampleRate: 48000 })
    })
  })
}

async function main() {
  const args = process.argv.slice(2)
  const wantJson = args.includes('--json')
  const usePitchy = args.includes('--pitchy')
  const fileArgs = args.filter((a) => !a.startsWith('--'))
  if (fileArgs.length === 0) {
    process.stderr.write('Usage: detect-pitch.mjs [--json] [--pitchy] <file> [<file>...]\n')
    process.exit(1)
  }

  const detect = await loadDetector(usePitchy)
  const metric = usePitchy ? 'clarity' : 'confidence'

  const results = []
  for (const file of fileArgs) {
    const abs = resolve(file)
    if (!existsSync(abs)) {
      process.stderr.write(`Not found: ${abs}\n`)
      process.exitCode = 2
      continue
    }
    try {
      const { samples, sampleRate } = await decodeToFloat32(abs)
      const result = detect(samples, sampleRate)
      results.push({ file, ...result })
      if (!wantJson) {
        const { hz, midi, noteName, cents } = result
        const score = (usePitchy ? result.clarity : result.confidence) ?? 0
        if (hz == null) {
          process.stdout.write(`${file}: no confident pitch (${metric} ${score.toFixed(2)})\n`)
        } else {
          const sign = cents >= 0 ? '+' : ''
          process.stdout.write(
            `${file}: ${noteName} (${hz.toFixed(2)} Hz, MIDI ${midi}, ${sign}${cents} cents) ${metric} ${score.toFixed(2)}\n`,
          )
        }
      }
    } catch (err) {
      process.stderr.write(`${file}: ${err.message}\n`)
      process.exitCode = 3
    }
  }

  if (wantJson) {
    process.stdout.write(JSON.stringify(results.length === 1 ? results[0] : results, null, 2) + '\n')
  }
}

main().catch((err) => {
  process.stderr.write(`Error: ${err.stack || err.message}\n`)
  process.exit(1)
})
