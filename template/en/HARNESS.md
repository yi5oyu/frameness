# HARNESS.md

Frameness makes a human approve **what changes and why** before an AI agent
touches the code, and records every plan, approval, verification, and decision
in a plan file — so that even when a session drops, the development process
stays **reproducible and traceable**.

## What problem, and how it was solved

### 1. The cost of adopting a harness

Bringing an existing harness into your own project costs time: you have to
understand it, analyze it, and rework its procedure to fit your project.

**A human has to be able to read it and maintain it.**

Using **"does this sentence change the agent's behavior?"** as the test, the
harness was built as a small structure — a short AGENTS.md and six skills —
so that it can be customized per project and kept in shape by a person.

### 2. State

With an AI agent, development revolves around conversation sessions. What
changed and why, the current progress, the context — all of it is easy to lose,
and hard to pick back up.

**State lives only in the plan file.**

Plans, approvals, verification results, and decisions all accumulate in one
file, so when a session drops or the model changes, that file alone is enough
to recover the context and carry the work on. The steps taken and the work done
also remain in a form a human can check — the goal is a document that stays
reproducible and traceable after the work is finished.

## Structure and pipeline

### Key files

```
root
├── AGENTS.md                    - core rules
├── CLAUDE.md                    - Claude Code entry point → AGENTS.md
├── HARNESS.md                   - this document, design rationale
├── .agents/
│   ├── rules/global.md          - Antigravity entry point → AGENTS.md
│   └── skills/                  - skills
│       └── ...
└── docs/plans/
    ├── ep-0000-template.md      - plan template
    └── active/  done/
```

### Flow

```
   plan                        tdd            debug
    │                           │               │
    ▼                           ▼               ▼
  [Plan] ──▶ [Approve] ──▶ [Implement] ──▶ [Verify] ──▶ [Close]
    └───────────────────── execute ──────────────────────┘
                 ▲                                    ▲
          human approval                       human approval
```

- `setup` runs once before the first plan — it settles the stack, so it sits
  outside this loop.
- `review` is optional and comes after **Verify**, in a fresh session.

## AGENTS.md design principles

Official AGENTS.md guide: [https://agents.md](https://agents.md/)

This file is always injected into the agent's context, so every sentence in it
has to earn its place: if a sentence does not change the agent's behavior, it
was treated as noise and deleted.

> The following are entry points for other AI agents. They carry no rules of
> their own — they only point to AGENTS.md.
> CLAUDE.md
> .agents/rules/global.md

### Nested AGENTS.md

Create a sub-AGENTS.md for each part of the project that has its own stack and
environment.

`folder layout`

```
root
├── AGENTS.md
├── .agents/skills/
├── docs/plans/
├── frontend
│   └── AGENTS.md
└── backend
    └── AGENTS.md
```

`example`

```
## Commands
- Build: `./gradlew build -x test`
- Test: `./gradlew test`
- Single test: `./gradlew test --tests "*TodoServiceTest*"`
- Run locally: `./gradlew bootRun`

## Structure
- Owns the todo domain and its REST API
- Domain logic: `src/main/java/**/domain/`
- Controllers: `**/api/`

## Forbidden
- No business logic in controllers
- No Lombok `@Setter` on entities
```

## Skills

Only the skills essential to the flow are defined. More can be added as the
project needs them.

An agent can invoke a skill on its own and step around the procedure, so the
skills meant to be called by a human are marked `disable-model-invocation: true`
to keep the model from calling them.

> `disable-model-invocation` may be ignored by tools other than Claude Code.
> `execute` stops when there is no plan, and `tdd` routes back to the procedure
> when approval has not been given yet.

`human-invoked`

- setup — settles the project's direction and stack through an interview and
  writes a per-folder AGENTS.md. No source is changed, so no ep is created.
  Once right after install; again when a new stack folder is added.
- plan — writes a plan file (ep) through an interview
- execute — implements the plan file
- review — compares the approved plan against the actual implementation.
  Advised when Risk exists or 4+ files changed; run it in a fresh session,
  ideally on a different model than the implementer.

`model-invoked`

- tdd — runs in execute's implementation step, only inside an approved plan;
  before approval it routes back to the procedure.
- debug — runs after a test failure when the cause is unclear. A bug found
  after the plan is closed gets a new plan file first, then a fix.

## The plan file (ep)

One plan file per goal, with every step of the run recorded in it, so that a
dropped session or a changed model does not stop the work — the file and the
code are enough to take it over. Once the work is done, the file remains as the
document that explains where this code came from and why it was built this way.

`template`

```
# ep-{YYYYMMDD}-{slug}: {task name}

**Status:** [Draft]
<!-- Draft → Approved → In Progress → Done.
     Always record the status before the change that produced it. -->

> You may be a stateless agent — do not rely on past conversation; write so
> the work can be completed from this file and the codebase alone.

## Purpose

<!-- Why this change is needed. What to look at afterwards to confirm it works. 1-3 lines. -->

## Decisions

<!-- At each fork: what was chosen, and what was rejected. The reason for
     rejecting is the point. Leave empty if none. Filled by plan during the
     interview, and by debug once the root cause is confirmed.

     - Sessions in Redis — stateless JWT cannot be revoked immediately
-->

## Affected Files

<!-- Repo-root-relative paths of source files to change, one per line.
     Whole directory: trailing / .
     Source files not listed here cannot be edited — add them and re-approve first.
     Test files for an approved source file count as approved — do not list them. -->
- src/example.ts

## Acceptance Criteria

<!-- Concrete, human-verifiable conditions. Once checked, leave the evidence
     on the same line.

     - [x] Wrong password on login returns 401 — `src/auth/login.test.ts:42`
     - [x] Install instructions added to README — manual: rendering checked
     - [ ] Social login
-->
- [ ] {decidable criterion 1}

## Risk

<!-- Filled by execute step 1, only when it meets a risk signal:
     global state · public API change · migration · auth/security -->

(none)

## Implementation Order

<!-- Filled by execute step 2.
     {n}. {path} {CREATE|MODIFY|DELETE} — {why, one line} -->

## Approval

<!-- Re-approval is a new entry; the last entry is the one in force.

     ### {ISO8601}
     - Approver input: "{verbatim human input}"
     - Approved files:
       - src/example.ts
     - Acceptance: {copy of the criteria in force}
-->

(none yet)

## Change Log

<!-- {ISO8601} {CREATE|MODIFY|DELETE} {path} — {why, one line} -->

## Review

<!-- Filled by the review skill. Optional.
     verdict: APPROVED | NEEDS_REVISION
     - BLOCKER|WARNING|NOTE {file:line} — {what} -->

(not run)

## Run History

<!-- {ISO8601} {procedure} {DONE|ABORTED|FAILED} — {one line}
     2026-07-28T14:22:00+09:00 execute DONE — 42 tests green, build ok -->
```
