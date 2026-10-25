# HARNESS.md

Frameness makes a human approve **what changes and why** before an AI agent modifies the code, and records every plan, approval, verification, and decision in a plan file — aiming for a development process that stays **reproducible and traceable** even when a session drops.

## What problem, and how it was solved

### 1. The problem with existing harnesses

Applying a harness to your own project takes time: you have to understand the process, analyze it, and rework its procedure to fit your project.

**A human has to be able to read it and maintain it.**

Using **"does this sentence change the agent's behavior?"** as the test, the harness was designed as a small structure — a short AGENTS.md and six skills — so it can be customized per project and maintained by a person.

### 2. State management

With an AI agent, development revolves around conversation sessions, so what changed and why, the current progress, and the context are easy to lose and hard to pick back up.

**State lives only in the plan file.**

Plans, approvals, verification results, and decisions all accumulate in one file, so whether a session drops or the model changes, that file alone is enough to recover the context and carry the work on. The steps taken and the work done also remain in a form a human can check — the goal is a document that stays reproducible and traceable after the work is finished.

## Harness structure and pipeline

### Key files

```
root
├── AGENTS.md                    - core rules
├── .agents/skills/              - skills
│   └── ...
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
               └──────────────── execute ─────────────────┘
               ▲                                          ▲
        human approval                             human approval
```

## AGENTS.md design principles

Official AGENTS.md guide: [https://agents.md](https://agents.md/)

This file is always injected into the agent's context, so if a sentence in AGENTS.md does not change the agent's behavior, it was treated as unnecessary and deleted.

> CLAUDE.md and .agents/rules/global.md are tool-specific entry points, set up to point to AGENTS.md, which holds the core rules.

### Nested AGENTS.md

If you choose "per-folder AGENTS.md" at install, a sub-AGENTS.md is created for each part of the project that has its own stack and environment. The default is to record everything in a single root AGENTS.md.

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

Only the skills essential to the flow are defined. More can be added as the project needs them.

An agent can run a skill on its own and step around the procedure, so the skills meant to be called by a human are set to `disable-model-invocation: true` to keep the model from calling them.

> `disable-model-invocation` may be ignored by tools other than Claude Code.
> `execute` stops when there is no plan, and `tdd` routes back to the procedure before approval.

`human-invoked`

- setup — plans the project's domain on first run. Records facts (commands, structure) per the chosen layout
- plan — writes a plan file (ep) through an interview
- execute — implements the plan file
- review — after `execute`, compares the approved plan against the actual implementation (a fresh session is advised)

`model-invoked`

- tdd — runs in `execute`'s implementation step, only inside an approved plan; before approval it routes back to the procedure.
- debug — runs after a test failure when the cause is unclear. A bug found after the plan is closed gets a new plan file first, then a fix

## The plan file (ep)

One plan file per goal, with every step of the run recorded in it. Whether a session drops or the model changes, the file and the code are enough to take the work over, and once the work is done the file remains as the document that explains where this code came from and why it was built this way.

| Section | Holds | Filled by |
| --- | --- | --- |
| Status | `[Draft]` → `[Approved]` → `[In Progress]` → `[Done]` | each step |
| Purpose | why the change, and what to look at to confirm it works | plan |
| Decisions | the choice, the rejected option, and why it was rejected | plan, debug |
| Affected Files | files to change | plan, execute |
| Context Files | files not changed but needed | plan, execute, debug |
| Acceptance Criteria | decidable completion criteria and their evidence | plan, execute |
| Risk | risk signals such as global state · public API · migration · auth | execute |
| Implementation Order | work order per file | execute |
| Approval | a copy of the approved files and criteria | execute |
| Change Log | one line per change | execute |
| Review | the independent review's verdict and findings | review |
| Run History | one line at every run end (done, aborted, or failed) | plan, execute, debug, review |

`Approval`·`Change Log`·`Run History` are append-only — past lines are never edited to match reality. Every other section is updated in place.

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

## Context Files

<!-- Files not changed but needed for this work. Not subject to approval — add
     each one as soon as it is found. Trace from Affected Files: 1-hop imports ·
     tests · callers of the public functions and types being changed. Only files
     opened and judged necessary, each with a one-line reason. Paths are hints —
     search again only when one no longer matches.
     Keep in step with Affected Files — trace a new file the same way and add
     what it needs; a file that turns out to need changes moves to Affected Files
     (re-approval).

     - src/auth/session.ts — session creation called by login; check its return shape
-->

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
