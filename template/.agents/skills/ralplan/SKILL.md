---
name: ralplan
description: Consensus planning and architecture verification entrypoint that auto-gates and validates plans before any mutation
argument-hint: "[--interactive] [--deliberate] [--architect harness-code] [--critic harness-code] <task description>"
level: 4

source: "Tailored for local Agent Harness verification-centric workflow"
---

# Ralplan (Consensus Planning & Verification)

Ralplan is the consensus planning and architecture verification workflow. It triggers iterative planning and deep cross-examination using Planner, Architect, and Critic agents until an optimal design consensus is reached. It utilizes **RALPLAN-DR structured deliberation** to expose risks, evaluate tradeoffs, and ensure strict alignment with core design beliefs.

## Usage

```
/skill:ralplan "task description"
```

## Flags

- `--interactive`: Enables user checkpoints at key decision milestones (draft review in step 2 and final report delivery in step 6). Without this flag, the workflow runs fully automated — Planner → Architect → Critic loop — and saves the finalized verification report to disk.
- `--deliberate`: Forces deliberate mode for high-risk architectural changes. Adds pre-mortem simulations (3 scenarios) and expanded testing strategy specifications (unit/integration/e2e/observability). This mode auto-enables if the prompt signals high risk (auth/security, data migrations, public API breakages).
- `--architect harness-code`: Use specialized reasoning layers for the Architect pass when available. Otherwise, falls back to the default Harness Architect review.
- `--critic harness-code`: Use specialized reasoning layers for the Critic pass when available. Otherwise, falls back to the default Harness Critic review.

---

## Planning & Verification Boundary (Strict Rule)

Ralplan is strictly a planning, review, and verification module. It is designed to inspect context and output validated plan/spec/proposal artifacts, marking them as `pending approval`. 

**Under no circumstances shall this skill execute mutation-oriented shell commands, modify product source files, commit to git, push to branches, or initiate any autonomous code mutation or execution loops.**

All intermediate stage artifacts and feedback loops MUST be persisted directly to the user-facing documentation path for clear visibility. Every role agent or subagent that produces a durable stage artifact MUST write its content to the following designated path template:

```text
docs/exec-plans/active/verification/stage-<NN>-<stage>.md
```

Valid stage names include: `planner`, `architect`, `critic`, `revision`, or `adr`. Increment `<NN>` (padded with leading zeros, e.g., `01`, `02`) for each consensus-loop pass. Direct file writes or AST edits against product source code paths (e.g., `src/`) are strictly prohibited during this verification loop.

### RECEIPT-ONLY Guideline

Role agents (`planner`, `architect`, and `critic`) save their long-form evaluation bodies directly to their respective file paths under `docs/exec-plans/active/verification/` and return ONLY the metadata summary (including target file `path` and concise routing verdicts) back to the main coordinator. This prevents context bloat and preserves a clean audit trail.

---

## Consensus Workflow Steps

The core consensus workflow operates as a sequential quality gate:

0. **Init (blocking prerequisite)**: Read `.agents/settings.json` for `language` and read `.agents/rules/global.md` for the global anti-pattern/error-handling rules that apply to every role (Planner, Architect, Critic) in this session — relying on host auto-injection alone is not guaranteed, so this skill reads it explicitly. If either file is missing, proceed with default language `ko` and note the limitation in the final report.

1. **Planner (Drafting & Rationale)**: Creates the initial plan and a compact **RALPLAN-DR summary** containing:
* Core Principles (3 to 5)
* Top 3 Decision Drivers
* Viable Options (at least 2 distinct paths) with clear pros and cons
* Pre-mortem (3 risk scenarios) + Expanded test plan (only in deliberate mode)
*Persisted by writing directly to `docs/exec-plans/active/verification/stage-01-planner.md`.

2. **User Feedback Check** *(--interactive only)*: Presents the draft plan and the Principles/Drivers/Options summary to the user via the `ask` tool. The user can choose to proceed to architecture review, request direct adjustments, or skip review.

3. **Architect (Soundness Review)**: Conducts a rigorous architectural evaluation. The Architect MUST provide a strong steelman antithesis to the planner's assumptions, highlight at least one real tradeoff tension, and verify compliance with `ARCHITECTURE.md` and `docs/design-docs/core-beliefs.md`.
*Persisted to `docs/exec-plans/active/verification/stage-<NN>-architect.md*`. Returns a compact verdict: `CLEAR`, `WATCH`, or `BLOCK`.

4. **Critic (Quality & Verification Gate)**: Evaluates the plan against strict quality criteria after Step 3 completes. Ensures principle-option consistency, fair alternative mapping, testable acceptance criteria, and explicit validation metrics.
*Persisted to `docs/exec-plans/active/verification/stage-<NN>-critic.md*`. Returns a compact verdict: `OKAY`, `ITERATE`, or `REJECT`.

5. **Re-review Loop (Max 5 Iterations)**: If the Critic issues an `ITERATE` or `REJECT` verdict, the loop gathers the Architect + Critic feedback, resumes the same persistent Planner subagent to revise the plan, and routes it back through the Architect and Critic passes. If consensus is not reached within 5 iterations, the loop terminates and presents the best-scored version with a warning.
*Every revision pass writes to a new sequential stage file under `docs/exec-plans/active/verification/stage-<NN>-revision.md`.*

6. **Finalization & Guard Gate**: Upon consensus approval, the skill synthesizes the final **Architecture Decision Record (ADR)** including:
* Final Approved Design Path
* Alternatives Considered & Rejection Rationales
* Downstream Consequences & Architectural Follow-ups

**The finalized report overwrites/updates the dedicated plan at `docs/exec-plans/active/ep-{slug}.md` with a status label of `[Pending Approval]`.** The workflow then completely halts, presenting the full architecture feedback and verification report to the user, blocking any further automated actions or code file mutations.

**Log Output:** After presenting the finalization report, write `evals/logs/latest.json`. This write is unconditional — it must happen even if consensus was not reached within the iteration limit.

```json
{
  "skill": "ralplan",
  "run_id": "run-{unix_timestamp}",
  "started_at": "{ISO8601_UTC — start of ralplan invocation}",
  "finished_at": "{ISO8601_UTC_now}",
  "input_prompt": "/skill:ralplan {task_description_or_ep_path}",
  "model": "{현재 세션에 사용 중인 모델 ID. 확인 불가 시 null}",
  "token_usage": "{세션이 노출하는 input_tokens/output_tokens/total_tokens. 확인 불가 시 null}",
  "output_result": {
    "exec_plan_path": "docs/exec-plans/active/ep-{slug}.md",
    "validation_passed": "{true if Critic issued OKAY | false if iteration limit hit or REJECT}",
    "iterations": "{integer — number of consensus loop iterations completed}",
    "mutation_attempted": false
  },
  "eval_score": null
}
```

---

## Pre-Execution Gate (Redirect Path)

### Why the Gate Exists

Requests that lack explicit architectural scoping often waste development cycles or introduce structural regressions. The gate intercepts underspecified prompts and safely routes them into this verification workflow first to establish a solid PRD and consensus framework before any implementation is considered.

### Gate Trigger Mechanics

The gate triggers and routes requests into `ralplan` if the prompt is vague, short (less than or equal to 15 effective words), and contains no concrete technical anchors.

* **Redirects to Ralplan (Vague)**: "improve performance", "add user authentication", "fix the app".
* **Passes Directly (Specific)**: Prompts containing explicit file paths (e.g., `src/path/to/file.ts`), specific CamelCase/PascalCase symbols (`UserModel`, `processKeywordDetector`), numbered deliverables, or an explicit override prefix (`force:` or `!`).