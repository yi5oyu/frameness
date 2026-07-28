---
name: execute
description: Take an ep from investigation through ordering, approval, implementation, and close in one session. Every artifact is recorded in the ep.
disable-model-invocation: true
---

# execute — from plan to implementation

Input: one `docs/plans/active/ep-*.md`.

## Guard

- No ep: point to procedure step 1 or the `plan` skill, then stop.
- Label check: `[Draft]` → proceed (approval required) · `[Approved]` → proceed ·
  `[In Progress]` → a previous session was interrupted. Roll back to `[Draft]`
  with one Change Log line saying why, then restart ·
  `[Done]` → completed plans are never re-run; stop.
- Read the AGENTS.md of every folder the Affected Files span. If the file is
  missing or `## Commands` is empty, **do not guess and run** — ask for `setup`,
  or confirm with the human and record it in that folder's AGENTS.md first.

## 1. Investigate (read-only)

For each Affected File: read it → check 1-hop import dependencies → find its
tests. On risk signals (global state · public API change · migration ·
auth/security), append `## Risk` to the ep with reasons. If a file missing from
the plan turns out to be needed, add it to Affected Files with the reason —
approval is collected once at the next step.

## 2. Order

Append `## Implementation Order` to the ep — per item:
`{n}. {path} {CREATE|MODIFY|DELETE} — {why, one line}`.
Cross-check against the acceptance criteria for missing files.

## 3. Approval

Present the plan path, the files, and the criteria per AGENTS.md `Procedure`
step 2, then wait — no tool calls while waiting. Include Risk in the summary if
present. On approval, append the agreed files and criteria to `## Approval` and
set Status to `[Approved]`.

## 4. Implement

In Implementation Order, per item:

- **under the tdd discipline** (RED→GREEN — `.agents/skills/tdd/SKILL.md`)
- set Status to `[In Progress]` right before the first source change
- one ep `## Change Log` line **immediately** per change (procedure step 3)
- approved files only — never compensate for a failure with a file outside the
  plan. If another file is needed, add it and re-approve first.

If the commands were `(unverified)`, the first RED run is the verification —
if it runs properly, drop the marker from that folder's AGENTS.md; if it does
not, stop and confirm with the human.

## 5. Verify

Run build and tests via `## Commands` for every folder the change spans, and
read the results as-is.

If red:

- cause is clear → fix within the same ep (one Change Log line) → re-run
- cause is unknown → confirm the root cause with the `debug` loop, then fix
  within the same ep
- three failed attempts at the same failure → stop and report to the human,
  red as-is, with the hypothesis log

**Approved criteria and existing tests are never edited to make things green.
If they must change, that is a re-approval.**

If green, record the evidence on each criterion line in `## Acceptance Criteria`
and tick it — a test path, or `manual: {how}`.

If Risk exists or 4+ files changed, advise an independent review — **in a fresh
session, ideally a different model than the implementer** — `review ep-{slug}`.

## 6. Close

Human `lgtm` → procedure step 5 (one Run History line → Status `[Done]` → move
to `done/` → commit). Include the verification result in the Run History line.

**Done when:** every step's artifact exists in the ep and — including
abort/failure — a Run History line exists. A run without a record is a run that
never happened.
