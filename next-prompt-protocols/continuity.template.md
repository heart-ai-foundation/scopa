# CONTINUITY — <Project / Scene> — <YYYY-MM-DD-slug>

> **Canonical resume prompt.** A fresh agent reads THIS first and must be able to continue
> EXACTLY where the last session stopped WITHOUT the founder re-telling anything. Every
> section below is REQUIRED — if a section is empty, say "n/a", never omit it (an omitted
> section is where re-telling leaks in). Keep it skimmable. Update it at the end of every
> session (or when the state materially changes), not just at handoff.
>
> Fill order when writing: do the work → commit → then write/refresh this from the final state.

## ★ RESUME PROMPT  (paste this to the new agent — nothing else needed)
A self-contained kickoff the founder can paste verbatim. It must stand ALONE — the founder
says nothing else. Summarize, do NOT over-explain: 3–6 sentences, imperative. Include exactly:
(a) point at this doc as the source of truth, (b) the one-line state, (c) the exact next action,
(d) the 1–2 hardest don'ts. No history, no rationale — the doc holds that. Write it in the
founder's voice so he can paste it as-is.

> Example shape (fill per session):
> "Resume the <project> work. Read `<path-to-this-doc>` FIRST — it's the exact state. TL;DR:
> <one line of where we are + last commit>. Next: <the literal next action>. Don't <#1 trap>
> and don't <#2 trap>. Everything you need is in that doc; ask only if it's genuinely missing."

## 0. READ-FIRST ORDER
The exact docs to load, in order, before doing anything (this file, then the deeper ones).
e.g. `1. this file  2. <project> role-context  3. <research/doctrine docs>  4. active protocol`.

## 1. TL;DR STATE  (one paragraph)
Where we are in ONE paragraph: what just shipped, what's proven, what's NOT done. Name the
last commit(s) and whether they're pushed. This is the "up to speed in 30 seconds" block.

## 2. EXACT NEXT ACTION
The literal next step — the command to run or the task to start, copy-pasteable. Not "continue
polishing" — "run X, verify Y, then do Z." If mid-task when the session ended, say precisely
where (e.g. "bake N running; on completion verify shot A then commit").

## 3. ENVIRONMENT / WHERE THINGS ARE
- Canonical repo + worktree path (and which checkout is source-of-truth vs a mirror).
- Branch, base commit, recent commit hashes, pushed/not-pushed status.
- Key file paths for the active work.

## 4. DEV SERVER / PREVIEW  (restart if down)
- The serving surface (e.g. Heart Dev Server / hub URL) and the EXACT restart command if dead.
- The preview/screenshot command(s) used to see the result.
- Any device profile / gotchas (e.g. mobile portrait, SwiftShader is valid).

## 5. VERIFICATION METHOD
- How a change is proven (preview shots, the hardened gate, on-screen diff — not "it builds").
- The regression commands to run before committing, and their PASS criteria.

## 6. BOUNDED / HEAVY-JOB RULES
Any resource/safety bounds for heavy local jobs (e.g. Blender bakes go through a bounded
`systemd --user` scope — paste the exact command + caps). This is a recurring re-tell; pin it.

## 7. TOOLS / SKILLS STATE
Installed tools/skills relevant to the work, their activation status (e.g. "skill X installed,
ACTIVATES on next Claude restart"), and how they change the approach. Reusable templates/modules.

## 8. DOCTRINE  (don't relitigate)
The locked decisions — the calls already made, so the next agent doesn't reopen them. One line each.

## 9. HARD-WON LESSONS  (don't relearn)
The traps already hit and the fix. One line each. This is what saves the next agent hours.

## 10. ASSETS / SECRETS SOURCING
Where assets/credentials live, how they're sourced, what must never be committed.

## 11. THE PROGRAM — BUILT vs NEXT
The roadmap: what's DONE, what's IN PROGRESS, what's QUEUED. The founder's stated priorities.

## 12. CONFIG LANDMARKS  (current tunable values)
The current values of the knobs that get tuned, and where they live — so the next agent knows
the baseline and what's adjustable.

---
*Canonical continuity-prompt format. Part of the next-prompt-protocols handoff system. If you
find yourself re-telling the founder something, it belongs in a section above — add the slot.*
