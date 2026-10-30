---
name: review
description: Code review in a fresh session, independent of the implementation, from the ep and the diff alone. Verdict only — no fixing.
disable-model-invocation: true
---

# review — independent review (fresh session only)

## Contamination guard

If this session already contains the ep's implementation or planning
conversation, stop: "Run independent review in a clean, fresh session."
A reviewer who knows the implementation context grows lenient toward its
logic — that is why this skill is separate.

If the ep's Status is not `[In Review]`, stop — review looks at a verified ep
before close. A `[Done]` ep is never reviewed — a problem found after close is
fixed in a new ep via `debug`.

## Input (read only these)

- the ep's **Purpose · Acceptance Criteria · Affected Files**
- **the diff** — nothing is committed yet: `git diff HEAD`, plus new files
  shown as `??` in `git status --porcelain` (excluding `docs/plans/`)
- the root AGENTS.md rules, and `## Forbidden` of the nearest AGENTS.md of
  each changed file

Do **not** read the Change Log's why-notes or the implementing session's
self-assessment — judge from the claims (plan) and the raw material (diff) alone.

## Procedure

1. Check each change in the diff against the acceptance criteria — actually
   satisfied?
2. Scope check — does the diff contain changes outside Affected Files?
3. Check for rule violations and obvious defects.
4. Classify findings: **BLOCKER** (unmergeable defect) / **WARNING** (risk) /
   **NOTE** (fyi). Every finding carries `file:line` grounds.
5. Append a new entry to the ep's `## Review`: `### {ISO8601} — {model}` +
   `verdict: APPROVED | NEEDS_REVISION` (0 BLOCKERs = APPROVED) + findings.
   The time is when the review finished; the model is the exact name of the
   model running this review — if unknown, do not guess: `(unknown)`. Never
   edit past entries.
6. One ep `## Run History` line.

**No fixing.** Do not change Status or commit either — `## Review` ships in the
ep's close commit. On `NEEDS_REVISION`, the implementing side (`execute`) fixes
within the same ep and requests review again.

If the same finding keeps recurring, propose promoting it to the nearest
AGENTS.md's `## Forbidden`.

**Done when:** `## Review` exists in the ep · every finding has `file:line`
grounds · one Run History line.
