#!/usr/bin/env bash
# ralph.sh — Ralph Wiggum mode: runs Claude Code in a loop,
# picking off one pending task per iteration.

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
MAX_LOOPS=3
MODEL="opus"         # opus, sonnet, haiku
# ───────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TODO_FILE="$SCRIPT_DIR/docs/todo.md"

PROMPT='Read docs/todo.md and find the first task whose **Status** is pending and whose **Blocked by** dependencies (if any) all have **Status: done**.

Implement that task fully:
1. Read all relevant existing files before making changes — never modify code you have not read.
2. Follow the task requirements exactly. Do not add features beyond what is listed.
3. Keep the implementation simple: minimum viable code that satisfies the requirements.
4. Run the basic tests (npm test) and fix any failures.
5. **Documentation:** after implementation, create or update a doc file in docs/ that describes what was built (architecture, usage, key decisions). If a relevant doc already exists, update it. If it is a new topic, create a new file. Then update CLAUDE.md — add or update the reference to that doc in the reference table with a one-line description.
6. After completing the work, update docs/todo.md — change the task **Status** from pending to done.
7. Append one entry to docs/log.md using the format defined in that file.

STRICT RULES — follow these without exception:
- Do ONLY what the task description says. No extra features, no refactoring, no "improvements", no cleanup of surrounding code.
- Do NOT improvise. If the task is unclear or ambiguous, STOP and say what is unclear. Do not guess or fill in gaps on your own.
- Do NOT add comments, docstrings, type annotations, or error handling beyond what the task requires.
- If you think something extra would be valuable, write a short suggestion at the end of your output — but do NOT implement it.
- Your job is: implement the task, run tests, update docs. Nothing else.

Do not start on the next task. Stop after completing and logging one task.'

count_pending() {
  grep -ci '^\*\*status:\*\* pending' "$TODO_FILE" || true
}

echo "╔══════════════════════════════════════════╗"
echo "║  ralph.sh — I'm helping!                 ║"
echo "║  Model: $MODEL                           ║"
echo "║  Max loops: $MAX_LOOPS                   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

for (( i=1; i<=MAX_LOOPS; i++ )); do
  pending=$(count_pending)

  if [[ "$pending" -eq 0 ]]; then
    echo "════════════════════════════════════════════"
    echo "  ALL TASKS DONE — nothing left to do!"
    echo "════════════════════════════════════════════"
    exit 0
  fi

  echo "────────────────────────────────────────────"
  echo "  Loop $i/$MAX_LOOPS — $pending task(s) pending"
  echo "────────────────────────────────────────────"

  claude --model "$MODEL" --print "$PROMPT"

  echo ""
done

pending=$(count_pending)

echo ""
echo "╔══════════════════════════════════════════╗"
if [[ "$pending" -eq 0 ]]; then
  echo "║  ALL TASKS DONE!                         ║"
else
  echo "║  TASKS REMAINING: $pending pending            ║"
  echo "║  Reached max loops ($MAX_LOOPS).                  ║"
  echo "║  Run ralph.sh again to continue.         ║"
fi
echo "╚══════════════════════════════════════════╝"
