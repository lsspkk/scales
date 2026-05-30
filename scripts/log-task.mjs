#!/usr/bin/env node
// Append one line to docs/log.md. Agents call this instead of editing the file,
// so they never read/rewrite the log (saves context) and the format stays a
// single dated line. Usage:
//   node scripts/log-task.mjs "<task>" "<one-line summary>"
// Example:
//   node scripts/log-task.mjs "Task 29" "Shipped Virittaminen tuner screen + 5-step calmness slider"

import { appendFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const [, , task, summary] = process.argv

if (!task || !summary) {
  console.error('Usage: node scripts/log-task.mjs "<task>" "<one-line summary>"')
  process.exit(1)
}

const here = dirname(fileURLToPath(import.meta.url))
const logPath = resolve(here, '..', 'docs', 'log.md')

if (!existsSync(logPath)) {
  console.error(`Log file not found: ${logPath}`)
  process.exit(1)
}

const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
// Collapse any stray newlines so the entry is guaranteed to be a single line.
const line = `${date} | ${task} | ${summary.replace(/\s+/g, ' ').trim()}\n`

appendFileSync(logPath, line)
console.log(`Logged: ${line.trim()}`)
