# HARNESS.md — the philosophy of this harness

> **Harness:** the bridle that keeps an AI agent from running wild through a codebase.

```
┌─ Boundary ── where it may touch ──── source_dirs in .agents/settings.json
├─ Gate ────── when it may touch ───── human approval + status labels
└─ Evidence ── how it proves what ──── plan files (ep) + commit linkage
```

These three are the whole harness. Full rules: [AGENTS.md](./AGENTS.md)

## Why it exists

Existing harnesses and agent workflow tools (superpowers, GSD, BMAD,
Spec-Kit …) are excellent but share common problems:

| Problem | What goes wrong |
|---|---|
| **They are big** | dozens of skills, steps, and artifacts install up front |
| **Unused features ship** | they occupy context and attention, and you can't tell what actually contributes |
| **They own the process** | you bend the project to the tool's procedure, and its bugs are hard to fix |

This harness starts from the opposite end. **What you take into a new project
is only the minimal common structure — everything else grows only when the
project's domain actually demands it.**

## Two goals

**① A starter — the minimal common core.**
What every project needs at the start is exactly three things: boundary,
gate, evidence. They are prebuilt as a few files, copied into a new project,
and work immediately. Complete with zero skills.

**② Traceable development — the plan is the record.**
Every change starts and ends in one plan file (ep):

```
ep-{slug}.md    Purpose ──▶ Approval ──▶ Change Log ──▶ Run History
                (what/why)  (who approved) (what changed) (how it ended)
                     │
                     └──▶ the commit's ep trailer links it to git history
Completed eps pile up in done/ — an auditable chronicle of how the project grew
```

## Six principles

1. **The contract alone is complete.** The harness's core is the contract
   (AGENTS.md), not skills. Skills are accelerators; the 5-step core
   procedure handles all work without them.
2. **Files are the only state.** Conversation context and session memory are
   not state. The plan file's label is the single truth, so work survives
   session breaks and agent swaps.
3. **Humans decide, agents execute.** Only a human may transition
   `[Draft]→[Approved]`. An agent approving its own plan is an unrecoverable
   violation.
4. **Enforcement, not declaration.** Rules don't stop at prompt text — the
   pre-commit hook checks mechanically, rejecting unplanned source commits
   and commits with ambiguous evidence.
5. **Grow only on proven need; remove what loses its proof.** New skills and
   procedures are added only when a named pain actually appears, small and
   within a size budget. Never pre-built big; structures whose consumers
   disappear get removed.
6. **One canonical source.** Every rule, format, and state lives in exactly
   one place; everywhere else is a pointer. The moment the same content is
   written twice, one copy will eventually lie. The only exception is a
   deliberate coupling with machine-parsed formats — declared as "update
   together in the same commit."

## What it is not (non-goals)

- **Not a process framework.** It doesn't impose requirements→design→build
  methodology. What goes in a plan is the project's business; the harness
  enforces only approval and records.
- **Not a skills framework.** Five small skills (plan·execute·review·tdd·debug)
  are bundled, but the harness is complete without all of them. Beyond that,
  each project builds for its own domain.
- **Not CI/CD or deployment tooling.** Responsibility ends at the commit gate.

## Structure (all of it)

| File | Role |
|---|---|
| `AGENTS.md` | **contract** + core procedure + skill table — the only resident router |
| `CLAUDE.md` | Claude Code adapter — imports AGENTS.md (no rules of its own) |
| `HARNESS.md` | this document — design philosophy |
| `.agents/settings.json` | boundary (source_dirs) and paths — the only per-project edit |
| `.agents/rules/global.md` | Antigravity adapter — AGENTS.md pointer (always_on) |
| `.agents/hooks/pre-commit(.js)` | mechanical enforcement — rejects unplanned/ambiguous commits |
| `.agents/skills/` | 5 canonical skills — plan·execute·review (human-invoked) / tdd·debug (auto) |
| `docs/plans/active/` `done/` | plans (ep) = evidence = project chronicle |

This is everything. Any smaller and it is not a harness (nothing can be
enforced); any larger and the need has not yet been proven.
