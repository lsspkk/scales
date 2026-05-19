#!/usr/bin/env node
/**
 * Detect the fundamental pitch of an audio file from the command line.
 *
 *   node scripts/detect-pitch.mjs path/to/sample.mp3
 *   node scripts/detect-pitch.mjs --json path/to/sample.mp3
 *
 * Decoding is done by piping the file through system `ffmpeg` to raw
 * 32-bit float mono PCM, then the pure-TS `detectPitch` from
 * app/src/lib/audio/pitchDetect.ts is run against the resulting buffer.
 *
 * The core detector is environment-agnostic; this CLI is the file-I/O
 * wrapper. The same `detectPitch` will later be reused by an in-app
 * tuner fed by an AnalyserNode / AudioWorklet.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function loadDetector() {
  // Lazy-import the TS source via tsx-style runtime. Node 22+ supports type
  // stripping for plain .ts files when --experimental-strip-types is on.
  // To keep things portable we transpile manually here: read the TS as text,
  // strip the `import type` lines and run it through a minimal sucrase-less
  // path... Actually, simpler: spawn the algorithm as JS by re-exporting it
  // from a small JS shim. We keep ONE source of truth by translating on the
  // fly using `--experimental-strip-types`. If that's unavailable, fall back.
  const tsPath = resolve(__dirname, '../app/src/lib/audio/pitchDetect.ts')
  const tuningPath = resolve(__dirname, '../app/src/lib/audio/tuning.ts')
  if (!existsSync(tsPath) || !existsSync(tuningPath)) {
    throw new Error(`Missing TS source files at ${tsPath} / ${tuningPath}`)
  }
  // Use Node's built-in type stripping (Node ≥ 22.6 with --experimental-strip-types).
  const url = pathToFileURL(tsPath).href
  const mod = await import(url)
  return mod
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
  const fileArgs = args.filter((a) => !a.startsWith('--'))
  if (fileArgs.length === 0) {
    process.stderr.write('Usage: detect-pitch.mjs [--json] <file> [<file>...]\n')
    process.exit(1)
  }

  const { detectPitch } = await loadDetector()

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
      const result = detectPitch(samples, sampleRate)
      results.push({ file, ...result })
      if (!wantJson) {
        const { hz, midi, noteName, cents, confidence } = result
        if (hz == null) {
          process.stdout.write(`${file}: no confident pitch (confidence ${confidence.toFixed(2)})\n`)
        } else {
          const sign = cents >= 0 ? '+' : ''
          process.stdout.write(
            `${file}: ${noteName} (${hz.toFixed(2)} Hz, MIDI ${midi}, ${sign}${cents} cents) confidence ${confidence.toFixed(2)}\n`,
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
