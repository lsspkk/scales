#!/usr/bin/env node
/**
 * Normalize the loudness of drone/pad audio samples to EBU R128 (-14 LUFS).
 *
 * Uses a two-pass ffmpeg loudnorm approach:
 *   Pass 1 — measure actual loudness stats of each file
 *   Pass 2 — apply linear loudness normalization with the measured stats
 *
 * Normalized files are written to <samples-dir>/normalized/ (originals untouched).
 *
 * Usage:
 *   node scripts/normalize-samples.mjs
 *   node scripts/normalize-samples.mjs app/public/samples/major-pad-G4.mp3
 *   node scripts/normalize-samples.mjs --target -23 app/public/samples/*.mp3
 *
 * Or via npm:
 *   npm --prefix app run normalize-samples
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DEFAULT_TARGET_LUFS = -14
const DEFAULT_TRUE_PEAK_DBTP = -1
const DEFAULT_LRA_LU = 11

const SAMPLES_DIR = resolve(__dirname, '../app/public/samples')
const DEFAULT_SAMPLES = [
  'major-pad-G4.mp3',
  'major-space-A3.mp3',
  'minor-space-F2.mp3',
].map(f => resolve(SAMPLES_DIR, f))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function runProcess(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', chunk => { stdout += chunk })
    proc.stderr.on('data', chunk => { stderr += chunk })
    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`${cmd} exited with code ${code}\n${stderr.slice(-2000)}`))
      } else {
        resolve({ stdout, stderr })
      }
    })
    proc.on('error', err => reject(new Error(`Failed to start ${cmd}: ${err.message}`)))
  })
}

/**
 * Pass 1: analyse the file and return ffmpeg's loudnorm JSON stats.
 */
async function measureLoudness(inputPath, targetI, targetTP, targetLRA) {
  const filter = `loudnorm=I=${targetI}:TP=${targetTP}:LRA=${targetLRA}:print_format=json`
  // ffmpeg writes loudnorm JSON to stderr; stdout is irrelevant (-f null -)
  const { stderr } = await runProcess('ffmpeg', [
    '-i', inputPath,
    '-af', filter,
    '-f', 'null', '-',
    '-y',
  ])
  const match = stderr.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error(`No loudnorm JSON in ffmpeg output for ${basename(inputPath)}`)
  }
  return JSON.parse(match[0])
}

/**
 * Pass 2: apply loudnorm using the measured stats from pass 1.
 * Uses linear=true so the gain adjustment is a single linear multiplier
 * (lossless up to floating-point precision, no non-linear compression).
 */
async function normalizeFile(inputPath, outputPath, targetI, targetTP, targetLRA, measured) {
  const filter = [
    `loudnorm=I=${targetI}:TP=${targetTP}:LRA=${targetLRA}`,
    `measured_I=${measured.input_i}`,
    `measured_TP=${measured.input_tp}`,
    `measured_LRA=${measured.input_lra}`,
    `measured_thresh=${measured.input_thresh}`,
    `offset=${measured.target_offset}`,
    `linear=true`,
    `print_format=summary`,
  ].join(':')

  await runProcess('ffmpeg', [
    '-i', inputPath,
    '-af', filter,
    '-ar', '44100',
    '-c:a', 'libmp3lame',
    '-b:a', '192k',
    outputPath,
    '-y',
  ])
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)

  // --target <lufs>
  let targetLUFS = DEFAULT_TARGET_LUFS
  const targetIdx = args.indexOf('--target')
  if (targetIdx !== -1) {
    targetLUFS = parseFloat(args[targetIdx + 1])
    args.splice(targetIdx, 2)
    if (isNaN(targetLUFS)) {
      console.error('Error: --target requires a numeric LUFS value (e.g. --target -14)')
      process.exit(1)
    }
  }

  // Remaining positional args are input files
  const inputs = args.length > 0
    ? args.map(a => resolve(process.cwd(), a))
    : DEFAULT_SAMPLES

  // Verify ffmpeg is on PATH
  try {
    await runProcess('ffmpeg', ['-version'])
  } catch {
    console.error('Error: ffmpeg not found on PATH. Install it (e.g. apt install ffmpeg) and retry.')
    process.exit(1)
  }

  for (const p of inputs) {
    if (!existsSync(p)) {
      console.error(`File not found: ${p}`)
      process.exit(1)
    }
  }

  // Write normalized files into a subdirectory next to the first input
  const outDir = resolve(dirname(inputs[0]), 'normalized')
  mkdirSync(outDir, { recursive: true })

  console.log(`Target: ${targetLUFS} LUFS  |  True peak: ${DEFAULT_TRUE_PEAK_DBTP} dBTP  |  LRA: ${DEFAULT_LRA_LU} LU`)
  console.log(`Output: ${outDir}\n`)

  for (const inputPath of inputs) {
    const filename = basename(inputPath)
    const outputPath = resolve(outDir, filename)

    console.log(`  ${filename}`)
    process.stdout.write(`    Pass 1 — measuring... `)

    let measured
    try {
      measured = await measureLoudness(inputPath, targetLUFS, DEFAULT_TRUE_PEAK_DBTP, DEFAULT_LRA_LU)
    } catch (err) {
      console.error(`\n    Measurement failed: ${err.message}`)
      process.exit(1)
    }

    process.stdout.write(`input_i = ${Number(measured.input_i).toFixed(1)} LUFS\n`)
    process.stdout.write(`    Pass 2 — normalizing... `)

    try {
      await normalizeFile(inputPath, outputPath, targetLUFS, DEFAULT_TRUE_PEAK_DBTP, DEFAULT_LRA_LU, measured)
    } catch (err) {
      console.error(`\n    Normalization failed: ${err.message}`)
      process.exit(1)
    }

    console.log('done')
  }

  console.log(`\nAll files normalized → ${outDir}`)
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
