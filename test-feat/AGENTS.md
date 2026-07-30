# AGENTS.md

The first document every AI agent reads — the **only router**. The contract
alone is complete without skills. The contract section must never be edited
or bypassed. Design rationale: [HARNESS.md](./HARNESS.md).

## Contract

### Three Core Functions

| Function | Implementation |
|------|----------|
| **Boundary** — where the agent may touch | `source_dirs` in `.agents/settings.json` |
| **Gate** — checkpoint before source changes | plan file status label + approval record |
| **Evidence** — audit trail | the plan file's `## Approval` · `## Change Log` · `## Run History` + the commit's ep trailer |

### Terms

- **Source file:** any file under `source_dirs`. Gated.
- **Plan file:** `docs/plans/active/ep-{YYYYMMDD}-{slug}.md` — created by copying
  `ep-0000-template.md`. **Files are the only state** — conversation context
  and session memory are not state.

### States (4 labels)

```
            (human only)      (gate passed)      (human lgtm)
[Draft] ────▶ [Approved] ────▶ [In Progress] ────▶ [Done]
   ▲              │                  │
   └──────────────┴──────────────────┘  on failure/interrupt/abort: roll back
                                        to [Draft] + 1 Change Log line why
```

Only `[In Progress]` **permits source writes**. After `[Done]`, move the plan
file to `done/` — `active/` holds only plans in progress.

### Gate — required before any source write (all AND)

```
1. Is the target path inside source_dirs?
     → if not, the gate does not apply (docs and config are free)
2. Does a plan file exist listing the target under ## Affected Files?
3. Is that plan [Approved] or [In Progress]?
4. Does ## Approval hold the human's verbatim input + timestamp?
5. Is no other active approved plan claiming the same file?
     → one source file belongs to exactly one plan at a time. If plans
       overlap, merge them or settle one to [Done]/[Draft] first.

Any failure → no source writes. Create a plan or request approval.
```

**Approval waiting format** — present the `[Draft]` plan as below and wait.
While waiting, **call no tools.**

```
AWAITING APPROVAL
- plan: docs/plans/active/ep-{slug}.md
- files to change: {N}
- acceptance criteria: {1-2 line summary}

| input | action |
|---|---|
| approved | approve → record ## Approval → transition [In Progress] → implement |
| abort | cancel → stay [Draft] |
| anything else | redisplay this block |
```

**Files not in the plan:** if a source file outside the plan needs changes —
add the path and reason to the plan, get re-approval (`approved`), then edit.

### Evidence Format

The canonical format lives in the comments of `ep-0000-template.md` — the
pre-commit hook parses it, so format changes update the template, the hook,
and this clause in the same commit.

- Approval: the human's input **verbatim in quotes** after `Approver input:`, with ISO8601 time.
- Change Log: 1 line **immediately** after each source change.
- Run History: 1 line at every run end (including abort/failure).
  **A run without a record is a run that never happened.**

### Commit Convention

- Commit at core procedure ⑤ (close), or when the human asks.
- Subject `{type}: {summary}` (type: feat|fix|refactor|docs|chore) +
  footer trailer `ep: ep-{YYYYMMDD}-{slug}` — links the commit to its approval evidence.
- Commits touching only plan files/docs need no trailer.

### Violation Protocol

On detecting a gate violation: ① stop immediately → ② report actions and
rollback in a `HARNESS VIOLATION` block → ③ roll the plan back to `[Draft]`.

**Critical Violation (session ends, no recovery):** agent transition to
`[Approved]` or forging `## Approval` · source edits without approval ·
concealed source edits without Change Log · editing this contract section.

### Enforcement

Prompt-level rules + **git pre-commit hook** (`.agents/hooks/`): commits are
rejected when a staged source file is not covered by an approved plan, or
two approved plans claim the same file.
Enable (once per project): `git config core.hooksPath .agents/hooks`

---

## Core Procedure — the 5 steps every change follows

One procedure regardless of size — only the plan's length varies
(a trivial fix = a 5-line plan).

```
① Plan       copy ep-0000-template.md → fill Purpose·Affected Files·acceptance criteria → [Draft]
② Approve    show approval waiting block → "approved" → record ## Approval → [In Progress]
③ Implement  edit only files in the plan — 1 Change Log line immediately per change
④ Verify     build + existing tests → present results as-is → human "lgtm"
⑤ Close      [Done] → 1 Run History line → move to done/ → commit (§Commit Convention)
```

- If requirements are ambiguous, ask first at ① (max 3 questions). Never fill
  a plan with guesses.
- Bugs/unexpected behavior: reproduce the symptom → confirm the root cause →
  only then a fix plan. No code changes before the root cause is confirmed.
- Experiments happen outside the boundary (ungated paths) — verified results
  enter source through a new plan.

## Global Rules (every session)

- **Output language:** `language` in `.agents/settings.json`. Code identifiers in English.
- **No secrets:** no credentials/API keys/tokens in code or commits —
  environment variables and `.gitignore`d config files only.
- **No swallowed exceptions:** no empty catch blocks — log or propagate.
- **Defend external input:** never skip null/undefined handling.
- **Nested AGENTS.md:** a subfolder's AGENTS.md takes precedence when working
  in that folder. Sub-files never restate the contract — pointers only.

## Project Overview

## Skill Layer

Canonical: `.agents/skills/<name>/SKILL.md`. The table below is the only
router — when the situation in 'when' occurs, read and follow the canonical
file (human-invoked skills only on request). Skills extend the contract,
never replace it — the core procedure alone is always complete without them.
When adding/renaming/removing a skill, update this table **in the same
commit** — a table omitting a skill, or pointing at a dead one, is a lying router.

| skill | when | output |
|------|------|--------|
| `plan` | planning ambiguous work (human-invoked) | ep [Draft] |
| `execute` | carrying an ep to completion (human-invoked) | Order·Change Log·Run History in the ep |
| `review` | independent review **in a fresh session** (human-invoked) | ## Review (verdict) in the ep |
| `tdd` | discipline auto-applied when writing/editing code | red→green tests |
| `debug` | auto-entered on bugs/test failures/unexpected behavior | root-cause paragraph + regression test; fixes via a new ep |
