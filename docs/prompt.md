# Implementation Prompt

Use this prompt to instruct Claude Code to implement one task from `todo.md`.

---

## Prompt

Read `docs/todo.md` and find the first task whose **Status** is `pending` and whose **Blocked by** dependencies (if any) all have **Status: done**.

Implement that task fully:
1. Read all relevant existing files before making changes — never modify code you haven't read.
2. Follow the task requirements exactly. Do not add features beyond what is listed.
3. Keep the implementation simple: minimum viable code that satisfies the requirements.
4. **Documentation:** after implementation, create or update a doc file in `docs/` that describes what was built (architecture, usage, key decisions). If a relevant doc already exists, update it. If it is a new topic, create a new file. Then update `CLAUDE.md` — add or update the reference to that doc in the reference table with a one-line description.
5. After completing the work, update `docs/todo.md` — change the task's `**Status:**` from `pending` to `done`.
6. Record the work in the log by running (do **not** open or edit `docs/log.md`):
   ```
   node scripts/log-task.mjs "Task N" "<one-line summary of what shipped + key file>"
   ```
   The script stamps the date and guarantees a single line — keep the summary to one sentence; the deep detail belongs in the doc from step 4.

Do not start on the next task. Stop after completing and logging one task.
