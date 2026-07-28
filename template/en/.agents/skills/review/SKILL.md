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

## Input (read only these)

- the ep's **Purpose · Acceptance Criteria · Affected Files**
- **the diff** — if already committed, find the commit by its `ep: {slug}`
  trailer and read that diff; otherwise `git diff`
- the root AGENTS.md rules, and `## Forbidden` of every folder the change spans

Do **not** read the Change Log's why-notes or the implementing session's
self-assessment — judge from the claims (plan) and the raw material (diff) alone.

## Procedure

1. Check each change in the diff against the acceptance criteria — actually
   satisfied?
2. Scope check — does the diff contain changes outside Affected Files?
3. Check for rule violations and obvious defects.
4. Classify findings: **BLOCKER** (unmergeable defect) / **WARNING** (risk) /
   **NOTE** (fyi). Every finding carries `file:line` grounds.
5. Append `## Review` to the ep:
   `verdict: APPROVED | NEEDS_REVISION` (0 BLOCKERs = APPROVED) + findings.
6. One ep `## Run History` line.

**No fixing.** On `NEEDS_REVISION`, the fix goes into a **new ep** — the original
stays `[Done]` with `## Review` as the grounds.

If the same finding keeps recurring, propose promoting it to that folder's
AGENTS.md `## Forbidden`.

**Done when:** `## Review` exists in the ep · every finding has `file:line`
grounds · one Run History line.
